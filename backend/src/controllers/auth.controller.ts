import httpStatus from "http-status";
import { type Request, type Response } from "express";
import successResponse from "../helpers/responses/successResponse";
import * as authService from "../services/auth.service";
import * as tokenService from "../services/token.service";
import * as userService from "../services/user.service";
import * as emailService from "../services/email.service";
import * as constants from "../utils/constants/email.constants";
import * as pendingSignupService from "../services/pendingSignup.service";
import config from "../config/config";
import {
  clearLoginAttempts,
  clearOtpAttempts,
} from "../middleware/rateLimiter";
import ApiError from "../utils/ApiError";
import Company from "../models/company.model";
import notificationService from "../services/notification.service";
import User from "../models/user.model";

// ===== REGISTER =====
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name, companyName, companyId } = req.body;
    console.log(`[AuthDebug] Registration attempt for email: "${email}"`);

    // Check if user already exists in DB
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: "fail",
        message: "Email already registered",
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store pending signup
    await pendingSignupService.savePendingSignup({
      email,
      password,
      first_name,
      last_name,
      companyName: companyName || "My Workspace",
      authProvider: "local",
      otp,
      otpExpires,
      createdAt: new Date(),
    } as any);

    // Send OTP email (Blocking with 15s safety timeout)
    console.log(`[AuthDebug] Attempting to send verification email to: ${email}`);
    try {
      const emailPromise = emailService.sendMail(constants.USER_EMAIL_VERIFICATION_TEMPLATE, {
        email,
        name: `${first_name} ${last_name}`,
        otp,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Mail server timeout (15s exceeded)")), 15000)
      );

      await Promise.race([emailPromise, timeoutPromise]);
      console.log(`[AuthDebug] Verification email successfully handed off to SMTP for: ${email}`);
    } catch (emailErr: any) {
      console.error("[AuthError] FAILED to send verification email:", emailErr.message);

      const isResendRestriction = emailErr.message.includes("verify a domain") || emailErr.message.includes("unverified");
      const helpMessage = isResendRestriction
        ? "Email delivery restricted by Resend Sandbox. Please check server logs or verify your domain."
        : `Email delivery failed: ${emailErr.message}`;

      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: `Account registered but OTP email failed. ${helpMessage}. You can try to login or resend OTP later.`,
      });
    }

    return res.status(httpStatus.CREATED).json({
      status: "success",
      message: "Registration initiated. Please verify your email with the OTP sent.",
      data: { email },
    });
  } catch (err: any) {
    console.error("[Register Error]", err);
    res.status(err.statusCode || httpStatus.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: err.message || "Server error",
    });
  }
};

// ===== GOOGLE AUTH =====
// ===== FIREBASE LOGIN =====
export const firebaseLogin = async (req: Request, res: Response) => {
  try {
    console.log(`[AuthDebug] Received Firebase login request at ${new Date().toISOString()}`);
    const { idToken, mode } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    console.log(`[AuthDebug] Firebase login attempt from IP: ${clientIp}, Mode: "${mode}"`);

    // Import admin dynamically or check if initialized
    const firebaseModule = await import("../config/firebase");
    const admin = firebaseModule.admin;
    const firebaseApp = firebaseModule.default;

    let decodedToken: any;

    if (!admin || !firebaseApp) {
      // DEVELOPMENT BYPASS: Allow login without service-account.json in dev mode
      if (config.env === "development") {
        console.warn("[Auth] Firebase Admin not initialized. Bypassing verification for DEVELOPMENT mode.");
        try {
          const parts = idToken.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            decodedToken = {
              email: payload.email,
              name: payload.name,
              picture: payload.picture,
              uid: payload.sub,
              displayName: payload.name,
              ...payload
            };
          }
        } catch (e) {
          console.error("Failed to manual decode token in dev bypass", e);
        }
      }

      if (!decodedToken) {
        return res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ status: "error", message: "Google Authentication is not configured on this server. Please contact the administrator." });
      }
    } else {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    }

    const { email } = decodedToken;

    if (!email) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ status: "fail", message: "Email not found in Firebase token" });
    }

    // Use importing from MODELS directly to avoid circular dependency via index
    const { default: User } = await import("../models/user.model");

    if (!User) {
      console.error('[AuthContoller] User model is undefined!');
      throw new Error("Internal server error: User model not found");
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    console.log(`[AuthDebug] Firebase login for email: "${email}", mode: "${mode}", userFound: ${!!user}`);

    if (!user) {
      if (mode === "register") {
        // Create new user for Google registration
        const { displayName, name, picture, given_name, family_name } = decodedToken as any;

        // Better name parsing logic
        let firstName = given_name || "";
        let lastName = family_name || "";

        // Try standard name field if given_name is missing
        if (!firstName && (name || displayName)) {
          const fullName = name || displayName;
          const parts = fullName.trim().split(" ");
          if (parts.length > 0) {
            firstName = parts[0];
            if (parts.length > 1) {
              lastName = parts.slice(1).join(" ");
            }
          }
        }

        // Final fallback to email prefix if name is still missing or generic
        if (!firstName || firstName.toLowerCase() === "user") {
          firstName = email.split("@")[0].split(".")[0];
          firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
        }

        // Store pending Google signup
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        console.log(`[AuthDebug] Storing pending Google signup for: ${email}, Name: ${firstName} ${lastName}`);

        await pendingSignupService.savePendingSignup({
          email,
          first_name: firstName,
          last_name: lastName,
          password: "", // No password for Google users
          companyName: undefined, // Google users need to create workspace later
          authProvider: "google",
          googleId: decodedToken.uid || decodedToken.sub,
          otp,
          otpExpires,
          createdAt: new Date(),
        } as any);

        // Send OTP email (Blocking with timeout)
        try {
          const emailPromise = emailService.sendMail(constants.USER_EMAIL_VERIFICATION_TEMPLATE, {
            email: email,
            name: `${firstName} ${lastName}`,
            otp,
          });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Mail timeout")), 15000)
          );
          await Promise.race([emailPromise, timeoutPromise]);
        } catch (emailErr: any) {
          console.error("[Firebase AuthError] FAILED to send email:", emailErr.message);
        }

        return res.status(httpStatus.OK).json({
          status: "success",
          message: "Google registration successful. Please verify your email with the OTP sent.",
          data: {
            isNewUser: true,
            email: email,
            redirect: "otp-verification"
          }
        });
      }

      // User not found. Frontend should catch this 404 and redirect to registration page.
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ status: "fail", message: "User not found" });
    }

    // If user exists and mode is 'register', that's an error for new registration
    if (mode === "register") {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ status: "fail", message: "Email already registered" });
    }

    // Check auth provider - prevent Google login for email/password users
    if (user.authProvider === "local") {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({
          status: "fail",
          message: "This account was created with email/password. Please sign in using email and password.",
          authProvider: "local"
        });
    }

    // Auto-correct generic name for existing users if it's still "User"
    let userUpdated = false;
    if (!user.first_name || user.first_name.toLowerCase() === "user") {
      const { displayName, name, given_name, family_name } = decodedToken as any;

      let firstName = given_name || "";
      let lastName = family_name || user.last_name || "";

      if (!firstName && (name || displayName)) {
        const fullName = name || displayName;
        const parts = fullName.trim().split(" ");
        if (parts.length > 0) {
          firstName = parts[0];
          if (parts.length > 1 && !lastName) {
            lastName = parts.slice(1).join(" ");
          }
        }
      }

      if (!firstName || firstName.toLowerCase() === "user") {
        firstName = email.split("@")[0].split(".")[0];
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
      }

      user.first_name = firstName;
      if (lastName) user.last_name = lastName;
      userUpdated = true;
      console.log(`[AuthDebug] Auto-corrected name for existing user ${email} to ${firstName} ${lastName}`);
    }

    if (!user.is_email_verified) {
      user.is_email_verified = true;
      userUpdated = true;
    }

    if (userUpdated) {
      await user.save();
    }

    const tokens = await tokenService.generateAuthTokens(user);

    // Clear login attempts
    clearLoginAttempts(email);

    successResponse(res, "Login successful", httpStatus.OK, { user, tokens });
  } catch (err: any) {
    console.error("Firebase Login Detailed Error:", err);
    if (err.stack) console.error(err.stack);

    res
      .status(httpStatus.UNAUTHORIZED)
      .json({
        status: "error",
        message: `Firebase authentication failed: ${err.message}`,
        stack: config.env === 'development' ? err.stack : undefined
      });
  }
};

// ===== LOGIN =====
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    console.log(`[AuthDebug] Login attempt from IP: ${clientIp}, Email: "${email}"`);
    const user = await authService.loginUserWithEmailAndPassword(
      email,
      password,
    );
    const tokens = await tokenService.generateAuthTokens(user);

    // Clear login attempts on successful login
    clearLoginAttempts(email);

    successResponse(res, "Login successful", httpStatus.OK, { user, tokens });
  } catch (err: any) {
    const status = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = err.message || "Server error";
    res.status(status).json({ status: "error", message });
  }
};

// ===== LOGOUT =====
export const logout = async (req: Request, res: Response) => {
  try {
    await authService.logout(req.body.refreshToken);
    res.status(httpStatus.NO_CONTENT).send();
  } catch (err: unknown) {
    console.error(err);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ status: "error", message: "Server error" });
  }
};

// ===== REFRESH TOKENS =====
export const refreshTokens = async (req: Request, res: Response) => {
  try {
    const tokens = await authService.refreshAuth(req.body.refreshToken);
    successResponse(res, "Tokens refreshed successfully", httpStatus.OK, {
      tokens,
    });
  } catch (err: any) {
    console.error(err);
    const status = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = err.message || "Server error";
    res.status(status).json({ status: "error", message });
  }
};

// ===== VERIFY EMAIL =====
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    await authService.verifyEmail(token as string);
    successResponse(res, "Email verified successfully", httpStatus.OK);
  } catch (err: any) {
    console.error(err);
    const status = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = err.message || "Email verification failed";
    res.status(status).json({ status: "error", message });
  }
};

// ===== VERIFY OTP =====
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    // 1. Check if it's a pending signup
    const pendingSignup = await pendingSignupService.getPendingSignup(email);

    if (pendingSignup) {
      // Verify OTP for pending signup
      if (pendingSignup.otp !== otp) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid OTP");
      }

      if (new Date() > pendingSignup.otpExpires) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "OTP has expired. Please request a new one.");
      }

      // Create the user in database
      const user = await userService.createUser({
        email: pendingSignup.email,
        password: pendingSignup.password,
        first_name: pendingSignup.first_name,
        last_name: pendingSignup.last_name,
        companyName: pendingSignup.companyName,
        authProvider: pendingSignup.authProvider,
        googleId: pendingSignup.googleId,
        role: "user",
        is_email_verified: true,
        onboardingCompleted: !!pendingSignup.companyName, // Completed only if company was provided
      });

      // Handle Company generation/linking
      if (pendingSignup.companyName) {
        const company = await Company.create({
          name: pendingSignup.companyName,
          ownerId: user._id,
        });

        // Update user with companyId
        const { default: User } = await import("../models/user.model");
        if (User) {
          await User.findByIdAndUpdate(user._id, { companyId: company._id });
          (user as any).companyId = company._id;
        }
      }

      // Cleanup
      await pendingSignupService.deletePendingSignup(email);
      clearOtpAttempts(email);

      // 🔔 NOTIFY: New User Registered
      try {
        const adminEmail = "smartsigndeck@gmail.com";
        const systemAdmin = await User.findOne({ email: adminEmail });

        // 1. Notify System Admin
        if (systemAdmin && systemAdmin._id.toString() !== user._id.toString()) {
          await notificationService.createNotification(
            systemAdmin._id.toString(),
            "system_alert",
            "New User Registration",
            `${user.first_name} ${user.last_name} (${user.email}) has joined the platform.`
          );
        }

        // 2. Notify Company Owner if joining existing company
        if (user.companyId) {
          const company = await Company.findById(user.companyId);
          if (company && company.ownerId.toString() !== user._id.toString()) {
            await notificationService.createNotification(
              company.ownerId.toString(),
              "system_alert",
              "New Team Member",
              `${user.first_name} ${user.last_name} has joined your workspace.`
            );
          }
        }
      } catch (notifErr) {
        console.error("[Auth] Failed to send registration notification:", notifErr);
      }

      const tokens = await tokenService.generateAuthTokens(user);

      return successResponse(res, "Email verified and account created successfully", httpStatus.CREATED, {
        user,
        tokens,
      });
    }

    // 2. Fallback to existing user verification (e.g. for already created users or other flows)
    const user = await authService.verifyEmailOtp(email, otp);

    // Auto-correct generic name for existing users if it's still "User"
    if (!user.first_name || user.first_name.toLowerCase() === "user") {
      let firstName = email.split("@")[0].split(".")[0];
      firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
      user.first_name = firstName;
      await user.save();
      console.log(`[AuthDebug] Auto-corrected name for existing user ${email} during fallback verification`);
    }

    const tokens = await tokenService.generateAuthTokens(user);

    // Clear OTP attempts on successful verification
    clearOtpAttempts(email);

    successResponse(res, "Email verified successfully", httpStatus.OK, {
      user,
      tokens,
    });
  } catch (err: any) {
    const status = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = err.message || "OTP verification failed";
    res.status(status).json({ status: "error", message });
  }
};

// ===== RESEND OTP =====
export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // 1. Check pending signup service first
    const pendingSignup = await pendingSignupService.getPendingSignup(email);

    if (pendingSignup) {
      // Generate new OTP for pending signup
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      pendingSignup.otp = otp;
      pendingSignup.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await pendingSignupService.savePendingSignup(pendingSignup);

      // Send OTP email (Blocking with timeout)
      try {
        const emailPromise = emailService.sendMail(constants.USER_EMAIL_VERIFICATION_TEMPLATE, {
          email: pendingSignup.email,
          name: `${pendingSignup.first_name} ${pendingSignup.last_name}`,
          otp,
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Mail timeout")), 15000)
        );
        await Promise.race([emailPromise, timeoutPromise]);
      } catch (emailErr: any) {
        console.error("[ResendOtp Error] FAILED to send email:", emailErr.message);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
          status: "error",
          message: `Failed to send email: ${emailErr.message}`,
        });
      }

      return successResponse(res, "OTP resent successfully", httpStatus.OK);
    }

    // 2. Fallback to existing user (e.g. for forgot password or other verification flows)
    const user = await userService.getUserByEmail(email);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    // Generate new OTP for email verification using existing tokenService logic
    try {
      const { otp } = await tokenService.generateVerifyEmailOtp(user);
      // Send OTP email (Non-blocking)
      emailService.sendMail(constants.USER_EMAIL_VERIFICATION_TEMPLATE, {
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        otp,
      }).catch((emailErr) => {
        console.error("[ResendOtp Existing Background Error]", emailErr.message);
      });
    } catch (tokenErr: any) {
      console.error("[ResendOtp Token Generation Error]", tokenErr);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to generate new OTP");
    }

    successResponse(res, "OTP resent successfully", httpStatus.OK);
  } catch (err: any) {
    console.error("[ResendOtp Error]", err);
    const status = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = err.message || "Failed to resend OTP";
    res.status(status).json({ status: "error", message });
  }
};

// ===== FORGOT PASSWORD =====
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const { resetPasswordToken, user, otp } =
      await tokenService.generateResetPasswordToken(email);

    await emailService.sendMail(constants.USER_FORGOT_PASSWORD_TEMPLATE, {
      email: user.email,
      token: resetPasswordToken,
      otp,
    });

    successResponse(res, "OTP sent to your email", httpStatus.OK);
  } catch (err: any) {
    if (err.statusCode === httpStatus.NO_CONTENT) {
      // Security: Don't reveal if user exists or not, just say success
      return successResponse(res, "OTP sent to your email", httpStatus.OK);
    }
    console.error(err);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ status: "error", message: "Failed to process request" });
  }
};

// ===== VERIFY RESET OTP =====
export const verifyResetPasswordOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const resetToken = await authService.verifyResetPasswordOtp(email, otp);

    // Return the reset token to the client so they can use it to reset password
    successResponse(res, "OTP verified successfully", httpStatus.OK, {
      token: resetToken,
    });
  } catch (err: any) {
    const status = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = err.message || "OTP verification failed";
    res.status(status).json({ status: "error", message });
  }
};

// ===== RESET PASSWORD =====
export const resetPassword = async (req: Request, res: Response) => {
  try {
    // Expect token in query or body. Let's support both or pick one.
    // The validation checks 'query', but usually for SPA it's easier in body.
    // checking validation... it checks query.token.
    // I will convert to use BODY for token if provided, to be flexible.

    const token = (req.query.token as string) || req.body.token;
    const { password } = req.body;

    if (!token) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ status: "fail", message: "Token is required" });
    }

    const user = await authService.resetPassword(token, password);
    const tokens = await tokenService.generateAuthTokens(user);
    successResponse(res, "Password reset successfully", httpStatus.OK, {
      user,
      tokens,
    });
  } catch (err: any) {
    const status = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = err.message || "Password reset failed";
    res.status(status).json({ status: "error", message });
  }
};

// ===== GET PROFILE =====
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    // Populate companyId to get company name
    await user.populate('companyId');

    // Use toJSON to get the proper serialized object
    const userObj = user.toJSON ? user.toJSON() : user;

    // Extract company name if companyId is populated
    const companyName = userObj.companyId?.name || userObj.companyName || null;
    const companyId = userObj.companyId?.id || userObj.companyId || null;

    const result = {
      ...userObj,
      companyName,
      companyId,
    };

    successResponse(res, "Profile retrieved successfully", httpStatus.OK, {
      user: result,
    });
  } catch (err: any) {
    console.error(err);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ status: "error", message: "Server error" });
  }
};

// ===== UPDATE PROFILE =====
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const updateBody = { ...req.body };

    // If they provide a company name, consider onboarding completed
    if (updateBody.companyName) {
      updateBody.onboardingCompleted = true;
    }

    const updatedUser = await userService.updateUserById(user.id, updateBody);

    // Populate for response consistency
    await updatedUser.populate('companyId');
    const userObj = updatedUser.toJSON ? updatedUser.toJSON() : updatedUser;

    const result = {
      ...userObj,
      companyName: userObj.companyId?.name || userObj.companyName || null,
      companyId: userObj.companyId?.id || userObj.companyId || null,
    };

    successResponse(
      res,
      "Profile updated successfully",
      httpStatus.OK,
      result,
    );
  } catch (err: any) {
    console.error(err);
    const status = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = err.message || "Failed to update profile";
    res.status(status).json({ status: "error", message });
  }
};

// ===== CHANGE PASSWORD =====
export const changePassword = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { oldPassword, newPassword } = req.body;
    const updatedUser = await authService.changePassword(
      user.id,
      oldPassword,
      newPassword,
    );
    const tokens = await tokenService.generateAuthTokens(updatedUser);
    successResponse(res, "Password changed successfully", httpStatus.OK, {
      tokens,
    });
  } catch (err: any) {
    console.error(err);
    const status = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = err.message || "Failed to change password";
    res.status(status).json({ status: "error", message });
  }
};

// ===== DELETE ACCOUNT (SELF-SERVICE) =====
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as any;

    if (!currentUser?.id && !currentUser?._id) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ status: "error", message: "Unauthorized" });
    }

    const userId = currentUser.id || currentUser._id.toString();

    await userService.deleteUserById(userId);

    // Optionally, additional cleanup (tokens, related data) can be done here.

    return res.status(httpStatus.NO_CONTENT).send();
  } catch (err: any) {
    console.error("[DeleteAccount Error]", err);
    const status = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = err.message || "Failed to delete account";
    res.status(status).json({ status: "error", message });
  }
};
