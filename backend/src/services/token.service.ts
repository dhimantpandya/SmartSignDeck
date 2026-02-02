import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import config from "../config/config";
import { tokenTypes } from "../config/tokens";
import { Token } from "../models";
import { type IToken } from "../models/token.model";
import { type IUser } from "../models/user.model";
import ApiError from "../utils/ApiError";
import * as userService from "./user.service";
import { generateOTP } from "../utils/otpGenerator";

interface DeleteResult {
  n?: number; // The number of documents matched
  ok?: number; // 1 if the operation was successful
  deletedCount?: number; // The number of documents deleted
}

const generateToken = (
  userId: string,
  expires: moment.Moment,
  tokenIdentifier: string,
  type: string,
  secret: string = config.jwt.secret,
): string => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
    jti: tokenIdentifier,
  };
  return jwt.sign(payload, secret);
};

const saveToken = async (
  jti: string,
  userId: string,
  expires: moment.Moment,
  type: string,
  blacklisted: boolean = false,
  otp: string | null = null,
): Promise<IToken> => {
  return await Token.create({
    jti,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
    otp,
  });
};

const verifyToken = async (token: string, type: string): Promise<IToken> => {
  const payload = jwt.verify(token, config.jwt.secret) as {
    jti: string;
    sub: string;
  };
  const tokenDoc = await Token.findOne({
    jti: payload.jti,
    type,
    user: payload.sub,
    blacklisted: false,
  });
  if (tokenDoc == null) {
    throw new Error("Token not found");
  }
  return tokenDoc;
};

const removeTokens = async (
  userId: string,
  type: string,
): Promise<DeleteResult> => {
  return await Token.deleteMany({
    user: userId,
    type,
  });
};

const generateAuthTokens = async (
  user: IUser,
): Promise<{
  access: { token: string; expires: Date };
  refresh: { token: string; expires: Date };
}> => {
  const accessTokenExpires = moment().add(
    config.jwt.accessExpirationMinutes,
    "minutes",
  );
  let jti = uuidv4();
  const accessToken = generateToken(
    user._id,
    accessTokenExpires,
    jti,
    tokenTypes.ACCESS,
  );

  const refreshTokenExpires = moment().add(
    config.jwt.refreshExpirationDays,
    "days",
  );
  jti = uuidv4();
  const refreshToken = generateToken(
    user._id,
    refreshTokenExpires,
    jti,
    tokenTypes.REFRESH,
  );
  await saveToken(jti, user._id, refreshTokenExpires, tokenTypes.REFRESH);
  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

const generateResetPasswordToken = async (
  email: string,
): Promise<{ resetPasswordToken: string; user: IUser; otp: string }> => {
  const user = await userService.getUserByEmail(email);
  if (user == null) {
    throw new ApiError(httpStatus.NOT_FOUND, "Email does not exist");
  }
  // Remove existing tokens
  await removeTokens(user._id, tokenTypes.RESET_PASSWORD);

  const expires = moment().add(
    config.jwt.resetPasswordExpirationMinutes,
    "minutes",
  );
  const jti = uuidv4();
  const otp = generateOTP();
  const resetPasswordToken = generateToken(
    user._id,
    expires,
    jti,
    tokenTypes.RESET_PASSWORD,
  );
  await saveToken(
    jti,
    user._id,
    expires,
    tokenTypes.RESET_PASSWORD,
    false,
    otp,
  );
  return { resetPasswordToken, user, otp };
};

const generateVerifyEmailToken = async (user: IUser): Promise<string> => {
  // Remove existing tokens
  await removeTokens(user._id, tokenTypes.VERIFY_EMAIL);

  const expires = moment().add(
    config.jwt.verifyEmailExpirationMinutes,
    "minutes",
  );
  const jti = uuidv4();
  const verifyEmailToken = generateToken(
    user._id,
    expires,
    jti,
    tokenTypes.VERIFY_EMAIL,
  );
  await saveToken(jti, user._id, expires, tokenTypes.VERIFY_EMAIL);
  return verifyEmailToken;
};

const generateVerifyEmailOtp = async (
  user: IUser,
): Promise<{ verifyEmailToken: string; otp: string }> => {
  // Remove existing tokens
  await removeTokens(user._id, tokenTypes.VERIFY_EMAIL);

  const expires = moment().add(
    config.jwt.verifyEmailExpirationMinutes,
    "minutes",
  );
  const jti = uuidv4();
  const otp = generateOTP();
  const verifyEmailToken = generateToken(
    user._id,
    expires,
    jti,
    tokenTypes.VERIFY_EMAIL,
  );
  await saveToken(jti, user._id, expires, tokenTypes.VERIFY_EMAIL, false, otp);
  return { verifyEmailToken, otp };
};

export {
  generateAuthTokens,
  generateResetPasswordToken,
  generateToken,
  generateVerifyEmailToken,
  generateVerifyEmailOtp,
  removeTokens,
  saveToken,
  verifyToken,
};
