import crypto from "crypto";

/**
 * Generates a 6-digit random OTP.
 * @returns {string} The generated 6-digit OTP.
 */
export const generateOTP = (): string => {
  const otpLength = 6;
  let otp = "";

  for (let i = 0; i < otpLength; i++) {
    const randomDigit = crypto.randomInt(0, 10);
    otp += randomDigit.toString();
  }

  return otp;
};
