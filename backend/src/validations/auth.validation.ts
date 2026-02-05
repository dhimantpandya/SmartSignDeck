import Joi, { type ObjectSchema } from "joi";
import { password, toLowerCase } from "./custom.validation";

interface RegisterBody {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  companyName?: string;
  companyId?: string;
  confirmPassword: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface LogoutBody {
  refreshToken: string;
}

interface RefreshTokensBody {
  refreshToken: string;
}

interface ForgotPasswordBody {
  email: string;
}

interface ResetPasswordQuery {
  token: string;
  otp: string;
}

interface VerifyForgetPasswordOtp {
  email: string;
  otp: string;
}

interface ResetPasswordBody {
  password: string;
}

interface VerifyEmailQuery {
  token: string;
}

interface ChangePasswordBody {
  oldPassword: string;
  newPassword: string;
}
interface VerifyOtpBody {
  email: string;
  otp: string;
}

interface ResendOtpBody {
  email: string;
}

const resendOtp: { body: ObjectSchema<ResendOtpBody> } = {
  body: Joi.object<ResendOtpBody>().keys({
    email: Joi.string()
      .trim()
      .required()
      .email()
      .label("Email")
      .custom(toLowerCase),
  }),
};

const verifyOtp: { body: ObjectSchema<VerifyOtpBody> } = {
  body: Joi.object<VerifyOtpBody>().keys({
    email: Joi.string()
      .trim()
      .required()
      .email()
      .label("Email")
      .custom(toLowerCase),
    otp: Joi.string().trim().required().label("OTP"),
  }),
};

const register: { body: ObjectSchema<RegisterBody & { companyId?: string }> } = {
  body: Joi.object<RegisterBody & { companyId?: string }>().keys({
    email: Joi.string()
      .trim()
      .required()
      .email()
      .label("Email")
      .custom(toLowerCase),
    password: Joi.string()
      .trim()
      .required()
      .min(8)
      .max(32)
      .custom(password)
      .label("Password"),
    first_name: Joi.string()
      .trim()
      .required()
      .min(2)
      .max(50)
      .label("First name"),
    last_name: Joi.string().trim().required().min(2).max(50).label("Last name"),
    companyName: Joi.string().trim().allow("", null).label("Company Name"),
    companyId: Joi.string().trim().allow("", null).label("Company ID"),
    confirmPassword: Joi.string()
      .required()
      .valid(Joi.ref("password"))
      .label("Confirm Password")
      .messages({ "any.only": "Passwords must match" }),
  }),
};

const login: {
  body: ObjectSchema<
    LoginBody & { idToken?: string; mode?: "login" | "register" }
  >;
} = {
  body: Joi.object<
    LoginBody & { idToken?: string; mode?: "login" | "register" }
  >()
    .keys({
      email: Joi.string().trim().label("Email").custom(toLowerCase),
      password: Joi.string().trim().label("Password"),
      idToken: Joi.string(),
      mode: Joi.string().valid("login", "register").default("login"), // Intent flag
    })
    .xor("email", "idToken"),
};

const logout: { body: ObjectSchema<LogoutBody> } = {
  body: Joi.object<LogoutBody>().keys({
    refreshToken: Joi.string().trim().required().label("Token"),
  }),
};

const refreshTokens: { body: ObjectSchema<RefreshTokensBody> } = {
  body: Joi.object<RefreshTokensBody>().keys({
    refreshToken: Joi.string().trim().required().label("Token"),
  }),
};

const forgotPassword: { body: ObjectSchema<ForgotPasswordBody> } = {
  body: Joi.object<ForgotPasswordBody>().keys({
    email: Joi.string()
      .trim()
      .required()
      .email()
      .label("Email")
      .custom(toLowerCase),
  }),
};

const resetPassword: {
  body: ObjectSchema<ResetPasswordBody & { token: string }>;
} = {
  body: Joi.object<ResetPasswordBody & { token: string }>().keys({
    token: Joi.string().trim().required().label("Token"),
    password: Joi.string().trim().required().custom(password).label("Password"),
  }),
};

const verifyEmail: { query: ObjectSchema<VerifyEmailQuery> } = {
  query: Joi.object<VerifyEmailQuery>().keys({
    token: Joi.string().trim().required().label("Token"),
  }),
};

const changePassword: {
  body: ObjectSchema<ChangePasswordBody & { confirmPassword: string }>;
} = {
  body: Joi.object<ChangePasswordBody & { confirmPassword: string }>().keys({
    oldPassword: Joi.string()
      .trim()
      .required()
      .custom(password)
      .label("Old password"),
    newPassword: Joi.string()
      .trim()
      .required()
      .custom(password)
      .label("New password"),
    confirmPassword: Joi.string()
      .required()
      .valid(Joi.ref("newPassword"))
      .label("Confirm Password"),
  }),
};

const verifyResetPasswordOtp: { body: ObjectSchema<VerifyForgetPasswordOtp> } =
{
  body: Joi.object<VerifyForgetPasswordOtp>().keys({
    email: Joi.string()
      .trim()
      .required()
      .email()
      .label("Email")
      .custom(toLowerCase),
    otp: Joi.string().trim().required().label("OTP"),
  }),
};

const updateProfile: { body: ObjectSchema } = {
  body: Joi.object()
    .keys({
      first_name: Joi.string().trim().min(2).max(50).label("First name"),
      last_name: Joi.string().trim().min(2).max(50).label("Last name"),
      email: Joi.string().trim().email().label("Email"),
      avatar: Joi.string().uri().allow("", null).label("Avatar"),
      gender: Joi.string().valid("male", "female", "other").label("Gender"),
      dob: Joi.string().isoDate().allow("", null).label("Date of birth"),
      language: Joi.string()
        .valid("english", "french", "germen")
        .label("Language"),
    })
    .min(1),
};

export {
  changePassword,
  forgotPassword,
  login,
  logout,
  refreshTokens,
  register,
  resetPassword,
  verifyEmail,
  verifyResetPasswordOtp,
  verifyOtp,
  resendOtp,
  updateProfile,
};
