import nodemailer, { type Transporter } from "nodemailer";
import { google } from "googleapis";
import axios from "axios";
import path from "path";
import fs from "fs";
import handlebars from "handlebars";
import config from "../config/config";
import * as emailConstants from "../utils/constants/email.constants";
import { createUrl } from "../utils/utils";

const publicDir: string = path.join(__dirname, "../public/emailTemplates");

/**
 * Send email via Gmail REST API (HTTP) - Bypasses Railway SMTP port blocks
 */
const sendViaGmailAPI = async (to: string, subject: string, html: string) => {
  if (!config.email.gmailClientId || !config.email.gmailClientSecret || !config.email.gmailRefreshToken) {
    throw new Error("Gmail OAuth2 credentials missing");
  }

  console.log(`[EMAIL DEBUG] Using Client ID: ${config.email.gmailClientId?.substring(0, 5)}...${config.email.gmailClientId?.slice(-5)} (Length: ${config.email.gmailClientId?.length})`);
  console.log(`[EMAIL DEBUG] Using Client Secret: ${config.email.gmailClientSecret?.substring(0, 3)}...${config.email.gmailClientSecret?.slice(-3)} (Length: ${config.email.gmailClientSecret?.length})`);
  console.log(`[EMAIL DEBUG] Using Refresh Token: ${config.email.gmailRefreshToken?.substring(0, 5)}...${config.email.gmailRefreshToken?.slice(-5)} (Length: ${config.email.gmailRefreshToken?.length})`);
  console.log(`[EMAIL DEBUG] Using Redirect URI: https://developers.google.com/oauthplayground`);

  const oAuth2Client = new google.auth.OAuth2(
    config.email.gmailClientId,
    config.email.gmailClientSecret,
    "https://developers.google.com/oauthplayground"
  );

  oAuth2Client.setCredentials({ refresh_token: config.email.gmailRefreshToken });

  // Explicitly refresh to get a detailed error if it fails
  try {
    console.log("[EMAIL DEBUG] Requesting new access token via direct HTTPS request...");
    const refreshRes = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: config.email.gmailClientId,
      client_secret: config.email.gmailClientSecret,
      refresh_token: config.email.gmailRefreshToken,
      grant_type: "refresh_token",
    });

    if (refreshRes.data && refreshRes.data.access_token) {
      console.log("[EMAIL DEBUG] Successfully obtained new access token via axios.");
      oAuth2Client.setCredentials({
        access_token: refreshRes.data.access_token,
        refresh_token: config.email.gmailRefreshToken
      });
    } else {
      throw new Error("No access_token in Google response");
    }
  } catch (refreshErr: any) {
    const errorBody = refreshErr.response?.data;
    console.error("[EMAIL DEBUG] Token refresh FAILED:", refreshErr.message);
    if (errorBody) {
      console.error("[EMAIL DEBUG] Raw Google Error Response:", JSON.stringify(errorBody));
    }
    throw refreshErr;
  }

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  // Create the email content in RFC 822 format
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const messageParts = [
    `From: "${config.email.from}" <${config.email.user}>`,
    `To: ${to}`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    `Subject: ${utf8Subject}`,
    ``,
    html,
  ];
  const message = messageParts.join("\n");

  // The body needs to be base64url encoded
  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
    },
  });


  return res.data;
};

/**
 * Standard SMTP Fallback (Likely to fail on Railway, works locally)
 */
const sendViaSMTP = async (to: string, subject: string, html: string) => {
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

  const mailOptions = {
    from: `"${config.email.from}" <${config.email.user}>`,
    to,
    subject,
    html,
  };

  const info = await transport.sendMail(mailOptions);
  return info;
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

    // 1. Try Gmail REST API (HTTP) - This is the best way for Railway
    if (config.email.gmailClientId && config.email.gmailClientSecret && config.email.gmailRefreshToken) {
      try {
        console.log(`[EMAIL] Attempting via Gmail API (HTTP) to ${request.email}...`);
        const result = await sendViaGmailAPI(request.email, request.subject, htmlToSend);
        console.log("[EMAIL SUCCESS] Sent via Gmail API. ID:", result.id);
        return;
      } catch (gmailErr: any) {
        const errorData = gmailErr.response?.data || gmailErr.message || gmailErr;
        console.error("[EMAIL] Gmail API failed with detail:", typeof errorData === 'object' ? JSON.stringify(errorData) : errorData);
        // Fallthrough if it fails
      }
    }

    // 2. Fallback to Standard SMTP
    console.log(`[EMAIL] Attempting via SMTP to ${request.email}...`);
    const info = await sendViaSMTP(request.email, request.subject, htmlToSend);
    console.log("[EMAIL SUCCESS] Sent via SMTP. ID:", info.messageId);
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
          type: "otp",
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
