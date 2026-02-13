import { Router } from "express";
import * as authController from "../../controllers/auth.controller";
import validate from "../../middleware/validate";
import passport from "passport";
import {
  login,
  register,
  verifyOtp,
  resendOtp,
  logout,
  refreshTokens,
  forgotPassword,
  verifyResetPasswordOtp,
  resetPassword,
  updateProfile,
  changePassword,
} from "../../validations/auth.validation";
import {
  otpRateLimiter,
  loginRateLimiter,
  resendOtpRateLimiter,
} from "../../middleware/rateLimiter";
import auth from "../../middleware/auth";

const router = Router();

// ===== REGISTER =====
router.post("/register", validate(register), authController.register);

// ===== LOGIN =====
router.post("/login", loginRateLimiter, validate(login), authController.login);

// ===== VERIFY OTP =====
router.post(
  "/verify-otp",
  otpRateLimiter,
  validate(verifyOtp),
  authController.verifyOtp,
);

// ===== RESEND OTP =====
router.post(
  "/resend-otp",
  resendOtpRateLimiter,
  validate(resendOtp),
  authController.resendOtp,
);

// ===== REFRESH TOKENS =====
router.post(
  "/refresh-tokens",
  validate(refreshTokens),
  authController.refreshTokens,
);

// ===== FORGOT PASSWORD =====
router.post(
  "/forgot-password",
  loginRateLimiter,
  validate(forgotPassword),
  authController.forgotPassword,
);
router.post(
  "/verify-reset-otp",
  loginRateLimiter,
  validate(verifyResetPasswordOtp),
  authController.verifyResetPasswordOtp,
);
router.post(
  "/reset-password",
  loginRateLimiter,
  validate(resetPassword),
  authController.resetPassword,
);

// ===== GET PROFILE =====
router.get("/profile", auth(), authController.getUserProfile);
router.patch(
  "/profile",
  auth(),
  validate(updateProfile),
  authController.updateProfile,
);
router.post(
  "/change-password",
  auth(),
  validate(changePassword),
  authController.changePassword,
);

// ===== GOOGLE OAUTH =====
// ===== FIREBASE AUTH =====
router.post("/firebase", authController.firebaseLogin);

// ===== DELETE ACCOUNT =====
router.delete("/account", auth(), authController.deleteAccount);

// ===== LOGOUT =====
router.post("/logout", validate(logout), authController.logout);

export default router;
