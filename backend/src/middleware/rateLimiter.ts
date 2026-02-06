import { type Request, type Response, type NextFunction } from "express";
import httpStatus from "http-status";
import rateLimit, { type Options } from "express-rate-limit";

const authLimiterOptions: Partial<Options> = {
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
};

const authLimiter = rateLimit(authLimiterOptions);

type RateLimitStore = Record<
  string,
  {
    count: number;
    resetTime: number;
    lockedUntil?: number;
  }
>;

const otpAttempts: RateLimitStore = {};
const loginAttempts: RateLimitStore = {};
const resendOtpAttempts: RateLimitStore = {};

// Clean up old entries every 10 minutes
const cleanupInterval = setInterval(
  () => {
    const now = Date.now();
    Object.keys(otpAttempts).forEach((key) => {
      if (otpAttempts[key].resetTime < now && !otpAttempts[key].lockedUntil) {
        delete otpAttempts[key];
      }
    });
    Object.keys(loginAttempts).forEach((key) => {
      if (
        loginAttempts[key].resetTime < now &&
        !loginAttempts[key].lockedUntil
      ) {
        delete loginAttempts[key];
      }
    });
    Object.keys(resendOtpAttempts).forEach((key) => {
      if (resendOtpAttempts[key].resetTime < now) {
        delete resendOtpAttempts[key];
      }
    });
  },
  10 * 60 * 1000,
);

// Use unref() to prevent the timer from keeping the process alive
if (typeof cleanupInterval.unref === "function") {
  cleanupInterval.unref();
}

/**
 * Rate limiter for OTP verification attempts
 * Max 5 attempts per 15 minutes
 * Lock account for 15 minutes after 5 failed attempts
 */
export const otpRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email } = req.body;
  if (!email) {
    next();
    return;
  }

  const key = `otp:${email.toLowerCase()}`;
  const now = Date.now();
  const maxAttempts = 5;
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const lockDurationMs = 15 * 60 * 1000; // 15 minutes

  if (!otpAttempts[key]) {
    otpAttempts[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    next();
    return;
  }

  // Check if account is locked
  if (otpAttempts[key].lockedUntil && otpAttempts[key].lockedUntil > now) {
    const remainingMinutes = Math.ceil(
      (otpAttempts[key].lockedUntil - now) / 60000,
    );
    return res.status(httpStatus.TOO_MANY_REQUESTS).json({
      status: "fail",
      message: `Too many failed attempts. Account locked for ${remainingMinutes} more minute(s).`,
    });
  }

  // Reset if window expired
  if (otpAttempts[key].resetTime < now) {
    otpAttempts[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    next();
    return;
  }

  // Increment attempt count
  otpAttempts[key].count++;

  if (otpAttempts[key].count > maxAttempts) {
    otpAttempts[key].lockedUntil = now + lockDurationMs;
    return res.status(httpStatus.TOO_MANY_REQUESTS).json({
      status: "fail",
      message: `Too many failed OTP attempts. Account locked for 15 minutes.`,
    });
  }

  next();
};

/**
 * Clear OTP attempts on successful verification
 */
export const clearOtpAttempts = (email: string) => {
  const key = `otp:${email.toLowerCase()}`;
  delete otpAttempts[key];
};

/**
 * Rate limiter for login attempts
 * Max 5 attempts per hour
 * Lock account for 30 minutes after 5 failed attempts
 */
export const loginRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email } = req.body;
  if (!email) {
    next();
    return;
  }

  const key = `login:${email.toLowerCase()}`;
  const now = Date.now();
  const maxAttempts = 20;
  const windowMs = 60 * 60 * 1000; // 1 hour
  const lockDurationMs = 30 * 60 * 1000; // 30 minutes

  if (!loginAttempts[key]) {
    loginAttempts[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    next();
    return;
  }

  // Check if account is locked
  if (loginAttempts[key].lockedUntil && loginAttempts[key].lockedUntil > now) {
    const remainingMinutes = Math.ceil(
      (loginAttempts[key].lockedUntil - now) / 60000,
    );
    return res.status(httpStatus.TOO_MANY_REQUESTS).json({
      status: "fail",
      message: `Too many failed login attempts. Account locked for ${remainingMinutes} more minute(s).`,
    });
  }

  // Reset if window expired
  if (loginAttempts[key].resetTime < now) {
    loginAttempts[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    next();
    return;
  }

  // Increment attempt count
  loginAttempts[key].count++;

  if (loginAttempts[key].count > maxAttempts) {
    loginAttempts[key].lockedUntil = now + lockDurationMs;
    return res.status(httpStatus.TOO_MANY_REQUESTS).json({
      status: "fail",
      message: `Too many failed login attempts. Account locked for 30 minutes.`,
    });
  }

  next();
};

/**
 * Clear login attempts on successful login
 */
export const clearLoginAttempts = (email: string) => {
  const key = `login:${email.toLowerCase()}`;
  delete loginAttempts[key];
};

/**
 * Rate limiter for resend OTP requests
 * Max 3 requests per 15 minutes
 */
export const resendOtpRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email } = req.body;
  if (!email) {
    next();
    return;
  }

  const key = `resend:${email.toLowerCase()}`;
  const now = Date.now();
  const maxAttempts = 5;
  const windowMs = 5 * 60 * 1000; // 5 minutes instead of 15

  if (!resendOtpAttempts[key]) {
    resendOtpAttempts[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    next();
    return;
  }

  // Reset if window expired
  if (resendOtpAttempts[key].resetTime < now) {
    resendOtpAttempts[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    next();
    return;
  }

  // Check if limit exceeded
  if (resendOtpAttempts[key].count >= maxAttempts) {
    const remainingMinutes = Math.ceil(
      (resendOtpAttempts[key].resetTime - now) / 60000,
    );
    return res.status(httpStatus.TOO_MANY_REQUESTS).json({
      status: "fail",
      message: `Too many resend requests. Please try again in ${remainingMinutes} minute(s).`,
    });
  }

  // Increment attempt count
  resendOtpAttempts[key].count++;
  next();
};

export { authLimiter };
