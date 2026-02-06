import httpStatus from "http-status";
import { type Request, type Response } from "express";
import successResponse from "../helpers/responses/successResponse";
import * as authService from "../services/auth.service";
import * as tokenService from "../services/token.service";
import * as userService from "../services/user.service";
import * as emailService from "../services/email.service";
import * as constants from "../utils/constants/email.constants";
import config from "../config/config";
import {
  clearLoginAttempts,
  clearOtpAttempts,
} from "../middleware/rateLimiter";
import ApiError from "../utils/ApiError";

// ===== REGISTER =====
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name, companyName, companyId } = req.body;
    console.log(`[AuthDebug] Registration attempt for email: "${email}"`);
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      if (!existingUser.is_email_verified) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: "fail",
          message: "Email already registered but not verified",
        });
      }
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ status: "fail", message: "Email already registered" });
    }

    const user = await userService.createUser({
      email,
      password,
      first_name,
      last_name,
      companyName,
      companyId: companyId || undefined,
      is_email_verified: false,
      authProvider: "local",
      onboardingCompleted: true, // Manual registration includes companyName
    });

    // Generate OTP/Email verification token
    const { otp } = await tokenService.generateVerifyEmailOtp(user);
    await emailService.sendMail(constants.USER_EMAIL_VERIFICATION_TEMPLATE, {
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      otp,
    });

    successResponse(
      res,
      "User registered successfully. OTP sent to email.",
      httpStatus.CREATED,
    );
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
    const { idToken, mode } = req.body;

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
        const { displayName, picture, given_name, family_name } = decodedToken as any;
        const [nameFirst, ...rest] = (displayName || "").split(" ");
        const parsedLast = rest.join(" ");

        const firstName = given_name || nameFirst || "";
        const lastName = family_name || parsedLast || "";

        console.log(`[AuthDebug] Creating new user via Google: ${email}`);
        const newUser = await User.create({
          email,
          first_name: firstName,
          last_name: lastName,
          role: "user",
          is_email_verified: true, // Google accounts are verified by Firebase
          avatar: picture,
          googleId: decodedToken.uid || decodedToken.sub,
          authProvider: "google", // Set auth provider for Google registration
        });

        const tokens = await tokenService.generateAuthTokens(newUser);
        clearLoginAttempts(email);
        return successResponse(res, "Registration successful", httpStatus.CREATED, {
          user: newUser,
          tokens,
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

    // Optional: Update user info if needed, e.g. verify email if not verified
    if (!user.is_email_verified) {
      user.is_email_verified = true;
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
    console.log(`[AuthDebug] Login attempt for email: "${email}"`);
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

    // Verify OTP
    const user = await authService.verifyEmailOtp(email, otp);
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
    const user = await userService.getUserByEmail(email);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    // Generate new OTP for email verification
    const { otp } = await tokenService.generateVerifyEmailOtp(user);
    await emailService.sendMail(constants.USER_EMAIL_VERIFICATION_TEMPLATE, {
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      otp,
    });

    successResponse(res, "OTP resent successfully", httpStatus.OK);
  } catch (err: any) {
    console.error(err);
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
