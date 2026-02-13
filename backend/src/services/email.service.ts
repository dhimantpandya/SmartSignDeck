import nodemailer, { type Transporter } from "nodemailer";
import axios from "axios";
import { Resend } from "resend";
import path from "path";
import fs from "fs";
import handlebars from "handlebars";
import config from "../config/config";
import * as emailConstants from "../utils/constants/email.constants";
import { createUrl } from "../utils/utils";

const publicDir: string = path.join(__dirname, "../public/emailTemplates");
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// Initialize Resend if API key is present
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

console.log(`[EMAIL] Initializing Service. Resend Key Present: ${!!resend}, Brevo Key Present: ${!!config.email.brevoApiKey}`);

const getTransporter = (): Transporter => {
  // Use OAuth2 if GMAIL credentials are present
  if (config.email.gmailClientId && config.email.gmailClientSecret && config.email.gmailRefreshToken) {
    console.log("[EMAIL] Using Gmail OAuth2 Transporter");
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: config.email.user,
        clientId: config.email.gmailClientId,
        clientSecret: config.email.gmailClientSecret,
        refreshToken: config.email.gmailRefreshToken,
      },
      tls: { rejectUnauthorized: false },
    } as any);
  }

  // Fallback to standard SMTP
  console.log("[EMAIL] Using Standard SMTP Transporter");
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  } as any);
};

/**
 * Read HTML file
 */
const readHTMLFile = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding: "utf-8" }, (err, html) => {
      if (err) reject(err);
      else resolve(html);
    });
  });
};

/**
 * Core Sending Logic
 */
export const getHTMLandSendEmail = async (
  templateFile: string,
  request: Record<string, string>,
) => {
  try {
    const templatePath = path.join(publicDir, templateFile);
    const html = await readHTMLFile(templatePath);
    const template = handlebars.compile(html);
    const htmlToSend = template(request);

    console.log(`[EMAIL] Attempting to send email to ${request.email}...`);
    const transport = getTransporter();

    const mailOptions = {
      from: `"${config.email.from}" <${config.email.user}>`,
      to: request.email,
      subject: request.subject,
      html: htmlToSend,
    };

    const info = await transport.sendMail(mailOptions);
    console.log("[EMAIL SUCCESS] Sent successfully. MessageId:", info.messageId);
  } catch (err: any) {
    console.error("[EMAIL FATAL ERROR]", err.message);
    throw err;
  }
};

/**
 * Main Interface used by Controllers
 */
export const sendMail = async (type: string, request: Record<string, string>) => {
  if (process.env.DISABLE_EMAIL === "true") {
    console.log(`[EMAIL DISABLED] Skipping ${type} to ${request.email}`);
    return;
  }

  try {
    switch (type) {
      case emailConstants.USER_EMAIL_VERIFICATION_TEMPLATE:
        request.subject = emailConstants.USER_EMAIL_VERIFICATION_SUBJECT;
        request.email_verification_link = createUrl({
          type: "verify-otp",
          query: `email=${request.email}`,
        });
        await getHTMLandSendEmail("email-verification.html", request);
        break;

      case emailConstants.USER_FORGOT_PASSWORD_TEMPLATE:
        request.subject = emailConstants.USER_FORGOT_PASSWORD_SUBJECT;
        await getHTMLandSendEmail("forgot-password.html", request);
        break;

      case emailConstants.USER_REGISTERED_TEMPLATE:
        request.subject = emailConstants.USER_REGISTERED_SUBJECT;
        await getHTMLandSendEmail("user-registered.html", request);
        break;

      case emailConstants.USER_RESET_PASSWORD_TEMPLATE:
        request.subject = emailConstants.USER_RESET_PASSWORD_SUBJECT;
        await getHTMLandSendEmail("reset-password-success.html", request);
        break;

      default:
        console.warn(`[EMAIL] Unknown template type: ${type}`);
    }
  } catch (err: any) {
    console.error(`[EMAIL FATAL] Failed to send ${type}:`, err.message);
    throw err;
  }
};
