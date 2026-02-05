import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import moment from "moment";
import config from "../config/config";
import { tokenTypes } from "../config/tokens";
import Token from "../models/token.model";
import { type IUser } from "../models/user.model";
import ApiError from "../utils/ApiError";
import * as emailConstants from "../utils/constants/email.constants";
import * as emailService from "./email.service";
import * as tokenService from "./token.service";
import * as userService from "./user.service";

/* ================= LOGIN ================= */

export const loginUserWithEmailAndPassword = async (
  email: string,
  password: string,
): Promise<IUser> => {
  const user = await userService.getUserByEmail(email);

  if (!user) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Email is not registered, please sign up first",
    );
  }

  // Check auth provider - prevent email/password login for Google users
  if (user.authProvider === "google") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This account was created with Google. Please sign in using Google.",
    );
  }

  // Check if user has a password (Google users don't have passwords)
  if (!user.password) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This account was created with Google. Please sign in using Google.",
    );
  }

  if (!(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect password");
  }

  // 🔒 HARD BLOCK: email must be verified
  if (!user.is_email_verified) {
    throw new ApiError(httpStatus.FORBIDDEN, "Email not verified");
  }

  return user;
};

/* ================= LOGOUT ================= */

export const logout = async (refreshToken: string): Promise<void> => {
  try {
    const payload = jwt.verify(refreshToken, config.jwt.secret) as {
      jti: string;
    };

    const refreshTokenDoc = await Token.findOne({
      jti: payload.jti,
      type: tokenTypes.REFRESH,
      blacklisted: false,
    });

    if (!refreshTokenDoc) return;

    await Token.deleteOne({
      jti: payload.jti,
      type: tokenTypes.REFRESH,
      blacklisted: false,
    });

    await tokenService.removeTokens(
      refreshTokenDoc.user.toString(),
      tokenTypes.ACCESS,
    );
  } catch (err) {
    console.error("Logout failed:", err);
  }
};

/* ================= REFRESH TOKENS ================= */

export const refreshAuth = async (refreshToken: string) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(
      refreshToken,
      tokenTypes.REFRESH,
    );

    const user = await userService.getUserById(refreshTokenDoc.user.toString());
    if (!user) throw new Error();

    const payload = jwt.verify(refreshToken, config.jwt.secret) as {
      jti: string;
    };

    await Token.deleteOne({
      jti: payload.jti,
      type: tokenTypes.REFRESH,
    });

    return await tokenService.generateAuthTokens(user);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }
};

/* ================= RESET PASSWORD ================= */

export const resetPassword = async (
  resetPasswordToken: string,
  newPassword: string,
): Promise<IUser> => {
  try {
    const resetPasswordTokenDoc = await tokenService.verifyToken(
      resetPasswordToken,
      tokenTypes.RESET_PASSWORD,
    );

    const user = await userService.getUserById(
      resetPasswordTokenDoc.user.toString(),
    );
    if (!user) throw new Error();

    await userService.updateUserById(user.id, { password: newPassword });

    try {
      await emailService.sendMail(emailConstants.USER_RESET_PASSWORD_TEMPLATE, {
        email: user.email,
      });
    } catch (err) {
      console.error("Email sending failed (ignored):", err);
    }

    await Token.deleteMany({
      user: user.id,
      type: tokenTypes.RESET_PASSWORD,
    });

    return user;
  } catch (err: unknown) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Password reset failed");
  }
};

/* ================= CHANGE PASSWORD ================= */

export const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<IUser> => {
  const user = await userService.getUserById(userId);

  if (!user || !(await user.isPasswordMatch(oldPassword))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect password");
  }

  return await userService.updateUserById(user.id, { password: newPassword });
};

/* ================= VERIFY EMAIL (TOKEN LINK) ================= */

export const verifyEmail = async (verifyEmailToken: string): Promise<void> => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(
      verifyEmailToken,
      tokenTypes.VERIFY_EMAIL,
    );

    const user = await userService.getUserById(
      verifyEmailTokenDoc.user.toString(),
    );
    if (!user) throw new Error();

    try {
      await emailService.sendMail(emailConstants.USER_REGISTERED_TEMPLATE, {
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
      });
    } catch (err) {
      console.error("Email sending failed (ignored):", err);
    }

    await Promise.all([
      Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL }),
      userService.updateUserById(user.id, { is_email_verified: true }),
    ]);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Email verification failed");
  }
};

/* ================= VERIFY EMAIL OTP ================= */

export const verifyEmailOtp = async (
  email: string,
  otp: string,
): Promise<IUser> => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    // Log failed attempt
    console.warn(`[Security] OTP verification failed: User not found for email ${email}`);
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not found");
  }

  if (!otp) {
    console.warn(`[Security] OTP verification failed: No OTP provided for user ${user.email}`);
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid OTP");
  }

  const verifyEmailTokenDoc = await Token.findOne({
    user: user._id,
    type: tokenTypes.VERIFY_EMAIL,
    otp,
    blacklisted: false,
  });

  if (!verifyEmailTokenDoc || otp !== verifyEmailTokenDoc.otp) {
    console.warn(`[Security] OTP verification failed: Invalid OTP for user ${user.email}`);
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid OTP");
  }

  // Explicit expiry check
  if (moment().isAfter(moment(verifyEmailTokenDoc.expires))) {
    console.warn(`[Security] OTP verification failed: Expired OTP for user ${user.email}`);
    throw new ApiError(httpStatus.UNAUTHORIZED, "OTP has expired. Please request a new one.");
  }

  // Handle Company generation/linking
  let updateBody: any = { is_email_verified: true };
  if (!user.companyId && user.companyName) {
    // Create new company if they registered with a name but no ID (new organization)
    const { Company } = await import("../models");
    const company = await Company.create({
      name: user.companyName,
      ownerId: user._id
    });
    updateBody.companyId = company._id;
    updateBody.role = 'admin'; // First user in a new company is the Admin
    updateBody.companyName = undefined; // Clear the temporary field
  }

  await Token.deleteMany({ user: user._id, type: tokenTypes.VERIFY_EMAIL });
  const updatedUser = await userService.updateUserById(user.id, updateBody);

  // Log successful account activation
  console.info(`[Security] Account activated and company linked for user ${user.email}`);

  return updatedUser;
};

/* ================= VERIFY OTP ================= */

export const verifyResetPasswordOtp = async (
  email: string,
  otp: string,
): Promise<string> => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    console.warn(`[Security] Reset password OTP verification failed: User not found for email ${email}`);
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not found");
  }

  const resetPasswordTokenDoc = await Token.findOne({
    user: user._id,
    otp,
    type: tokenTypes.RESET_PASSWORD,
    blacklisted: false,
  });

  if (!resetPasswordTokenDoc || otp !== resetPasswordTokenDoc.otp) {
    console.warn(`[Security] Reset password OTP verification failed: Invalid OTP for user ${user.email}`);
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid OTP");
  }

  // Explicit expiry check
  if (moment().isAfter(moment(resetPasswordTokenDoc.expires))) {
    console.warn(`[Security] Reset password OTP verification failed: Expired OTP for user ${user.email}`);
    throw new ApiError(httpStatus.UNAUTHORIZED, "OTP has expired. Please request a new one.");
  }

  // Log successful verification
  console.info(`[Security] Reset password OTP verified successfully for user ${user.email}`);

  return tokenService.generateToken(
    user._id,
    moment(resetPasswordTokenDoc.expires),
    resetPasswordTokenDoc.jti,
    tokenTypes.RESET_PASSWORD,
  );
};

/* ================= EXPORT ================= */

export default {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
  verifyEmailOtp,
  verifyResetPasswordOtp,
  changePassword,
};
