import dotenv from "dotenv";
import Joi from "joi";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

interface EnvVars {
  NODE_ENV: "production" | "development" | "test";
  PORT: number;
  MONGO_DB_URL: string;
  MONGO_DB_NAME: string;
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRATION_MINUTES: number;
  JWT_REFRESH_EXPIRATION_DAYS: number;
  JWT_RESET_PASSWORD_EXPIRATION_MINUTES: number;
  JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: number;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  EMAIL_FROM: string;
  EMAIL_HOST?: string;
  EMAIL_PORT?: number;
  RESEND_API_KEY: string;
  WEB_APP_URL: string;
  API_DOC_USER_NAME: string;
  API_DOC_PASSWORD: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_BUCKET_NAME: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  FIREBASE_SERVICE_ACCOUNT_PATH: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  ALLOWED_ORIGINS?: string;
}

const envVarsSchema = Joi.object<EnvVars>()
  .keys({
    NODE_ENV: Joi.string()
      .valid("production", "development", "test")
      .required(),
    PORT: Joi.number().default(3000),
    MONGO_DB_URL: Joi.string().required(),
    MONGO_DB_NAME: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number().default(10),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number().default(10),
    EMAIL_USER: Joi.string().required(),
    EMAIL_PASS: Joi.string().required(),
    EMAIL_FROM: Joi.string().required(),
    EMAIL_PORT: Joi.number().optional(),
    WEB_APP_URL: Joi.string().default("http://localhost:5173"),
    API_DOC_USER_NAME: Joi.string().required(),
    API_DOC_PASSWORD: Joi.string().required(),
    AWS_ACCESS_KEY_ID: Joi.string().allow("").optional(),
    AWS_SECRET_ACCESS_KEY: Joi.string().allow("").optional(),
    AWS_REGION: Joi.string().allow("").optional(),
    AWS_BUCKET_NAME: Joi.string().allow("").optional(),
    GOOGLE_CLIENT_ID: Joi.string().default("placeholder_id"),
    GOOGLE_CLIENT_SECRET: Joi.string().default("placeholder_secret"),
    GOOGLE_CALLBACK_URL: Joi.string().default(
      "http://localhost:5000/v1/auth/google/callback",
    ),
    FIREBASE_SERVICE_ACCOUNT_PATH: Joi.string().optional(),
    FIREBASE_PROJECT_ID: Joi.string().optional(),
    FIREBASE_PRIVATE_KEY: Joi.string().optional(),
    FIREBASE_CLIENT_EMAIL: Joi.string().optional(),
    CLOUDINARY_CLOUD_NAME: Joi.string().required(),
    CLOUDINARY_API_KEY: Joi.string().required(),
    CLOUDINARY_API_SECRET: Joi.string().required(),
    ALLOWED_ORIGINS: Joi.string().optional(),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) throw new Error(`Config validation error: ${error.message}`);
if (!envVars)
  throw new Error("Config validation error: envVars is null or undefined");

const getSMTPConfig = (email: string, host?: string, port?: number) => {
  if (host) return { host, port: port || 465 };

  const domain = email.split("@")[1]?.toLowerCase();
  if (domain === "gmail.com") return { host: "smtp.gmail.com", port: 587 };
  if (["outlook.com", "hotmail.com", "live.com", "msn.com"].includes(domain))
    return { host: "smtp-mail.outlook.com", port: 587 };
  if (domain === "yahoo.com") return { host: "smtp.mail.yahoo.com", port: 465 };
  if (domain === "zoho.com") return { host: "smtp.zoho.com", port: 465 };
  if (domain === "icloud.com") return { host: "smtp.mail.me.com", port: 587 };

  return { host: "", port: 465 };
};

const smtpConfig = getSMTPConfig(
  envVars.EMAIL_USER,
  envVars.EMAIL_HOST,
  envVars.EMAIL_PORT,
);

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  httpsPort: envVars.PORT,
  mongoose: {
    url: envVars.MONGO_DB_URL, // just host:port
    dbName: envVars.MONGO_DB_NAME, // exact database name you created
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes:
      envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  email: {
    service: envVars.EMAIL_USER.includes("@gmail.com") ? "gmail" : undefined,
    host: envVars.EMAIL_USER.includes("@gmail.com") ? "smtp.gmail.com" : (smtpConfig.host || ""),
    port: envVars.EMAIL_USER.includes("@gmail.com") ? 465 : (smtpConfig.port || 465),
    user: envVars.EMAIL_USER,
    pass: envVars.EMAIL_PASS.replace(/\s/g, ""), // Remove all spaces from app password
    from: envVars.EMAIL_FROM,
  },
  apiDoc: {
    userName: envVars.API_DOC_USER_NAME,
    password: envVars.API_DOC_PASSWORD,
  },
  aws: {
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    region: envVars.AWS_REGION,
    putURLExpires: 60,
    getURLExpires: 60,
    bucketName: envVars.AWS_BUCKET_NAME,
  },
  google: {
    clientID: envVars.GOOGLE_CLIENT_ID,
    clientSecret: envVars.GOOGLE_CLIENT_SECRET,
    callbackURL: envVars.GOOGLE_CALLBACK_URL,
  },
  firebase: {
    serviceAccountPath: envVars.FIREBASE_SERVICE_ACCOUNT_PATH,
    projectId: envVars.FIREBASE_PROJECT_ID,
    privateKey: envVars.FIREBASE_PRIVATE_KEY
      ? envVars.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined,
    clientEmail: envVars.FIREBASE_CLIENT_EMAIL,
  },
  cloudinary: {
    cloudName: envVars.CLOUDINARY_CLOUD_NAME,
    apiKey: envVars.CLOUDINARY_API_KEY,
    apiSecret: envVars.CLOUDINARY_API_SECRET,
  },
  cors: {
    origin: envVars.ALLOWED_ORIGINS
      ? envVars.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
      : ["http://localhost:5173", "https://smart-sign-deck.vercel.app"],
  },
  appUrl: envVars.WEB_APP_URL,
};

console.log(`[Config] SMTP Provider: ${config.email.host || "NOT CONFIGURED"} (Port: ${config.email.port})`);

export default config;
