import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";
import path from "path";
import fs from "fs";
import handlebars from "handlebars";
import config from "../config/config";
import * as emailConstants from "../utils/constants/email.constants";
import { createUrl } from "../utils/utils";

const publicDir: string = path.join(__dirname, "../public/emailTemplates");
const resend = config.email.resendApiKey ? new Resend(config.email.resendApiKey) : null;

console.log(`[EMAIL] Initializing Hybrid Service. Mode: ${resend ? "Resend API + SMTP" : "SMTP Only"}`);

const transport: Transporter = nodemailer.createTransport({
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

    // 1. Try Resend API (HTTP) - Bypasses Render Firewall
    if (resend) {
      try {
        console.log(`[EMAIL] Trying Resend API for ${request.email}...`);
        const { data, error } = await resend.emails.send({
          from: "SmartSignDeck <onboarding@resend.dev>",
          to: [request.email],
          subject: request.subject,
          html: htmlToSend,
        });

        if (error) {
          console.warn("[EMAIL Resend API warning]", error.message);
          // If it's a 403 (unverified recipient), we log it specifically
          if (error.name === "validation_error" && error.message.includes("verify a domain")) {
            console.error("[EMAIL ERROR] Resend restricted: Only verified emails can receive messages.");
          }
          throw new Error(error.message);
        }

        console.log("[EMAIL SUCCESS] Sent via Resend API:", data?.id);
        return;
      } catch (apiErr: any) {
        console.warn("[EMAIL] Resend API failed, trying SMTP fallback:", apiErr.message);
      }
    }

    // 2. Fallback to SMTP (Likely to fail on Render, but works locally)
    console.log(`[EMAIL] Trying SMTP for ${request.email}...`);
    const mailOptions = {
      from: `"${config.email.from}" <${config.email.user}>`,
      to: request.email,
      subject: request.subject,
      html: htmlToSend,
    };

    const info = await transport.sendMail(mailOptions);
    console.log("[EMAIL SUCCESS] Sent via SMTP:", info.messageId);
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
