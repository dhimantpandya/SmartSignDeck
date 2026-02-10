import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";
import config from "../config/config";
import logger from "../config/logger";
import * as constants from "../utils/constants/email.constants";
import * as utils from "../utils/utils";

const publicDir: string = path.join(__dirname, "../public/emailTemplates");
const resend = config.email.resendApiKey ? new Resend(config.email.resendApiKey) : null;

if (resend) {
  console.log("[EmailService] Resend API initialized for production emails");
}

const transport: Transporter = nodemailer.createTransport({
  service: config.email.host === "smtp.gmail.com" ? "gmail" : undefined,
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465, // dynamic secure
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 25000, // 25 seconds
  greetingTimeout: 25000,
  socketTimeout: 30000,
});

if (resend) {
  console.log("[EmailService] Using Resend as primary email provider");
} else {
  console.log(`[EmailService] Transporter initialized for ${config.email.host}:${config.email.port}`);
}

// Verify transporter connection
if (config.env !== "test" && process.env.DISABLE_EMAIL !== "true") {
  transport
    .verify()
    .then(() => logger.info("Connected to email server"))
    .catch(() =>
      logger.warn(
        "Unable to connect to email server. Make sure EMAIL_USER and EMAIL_PASS are correct",
      ),
    );
}

const readHTMLFile = (
  filepath: string,
  callback: (err: Error | null, html?: string) => void,
) => {
  fs.readFile(filepath, { encoding: "utf-8" }, (err, html) => {
    if (err) callback(err);
    else callback(null, html);
  });
};

const getHTMLandSendEmail = async (
  templateFile: string,
  request: Record<string, string>,
) => {
  if (!fs.existsSync(templateFile)) {
    const errorMsg = `[EMAIL ERROR] Template file not found: ${templateFile}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const mailOptions = {
    from: config.email.from,
    to: request.email,
    subject: "",
    html: "",
  };

  const html = await new Promise<string>((resolve, reject) => {
    readHTMLFile(templateFile, (err, html) => {
      if (err) reject(err);
      else if (html) resolve(html);
    });
  });

  const template = handlebars.compile(html);
  const {
    name,
    url,
    email_verification_link,
    reset_password_link,
    email,
    password,
    otp,
  } = request;

  mailOptions.html = template({
    user_name: name ?? "",
    url: url ?? "",
    email_verification_link: email_verification_link ?? "",
    reset_password_link: reset_password_link ?? "",
    email,
    password,
    otp: otp ?? "",
  });

  mailOptions.subject = request.subject ?? "";

  console.log(
    `[EMAIL DEBUG] Sending email of type ${request.type} to ${request.email}`,
  );

  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: config.email.from,
        to: request.email,
        subject: request.subject ?? "",
        html: mailOptions.html,
      });

      if (error) {
        throw new Error(`Resend API Error: ${error.message} (Code: ${error.name})`);
      }

      console.log(`[RESEND SUCCESS] Email sent via API. ID: ${data?.id}`);
    } catch (resendErr: any) {
      console.error("[RESEND ERROR] API delivery failed, trying SMTP fallback...", resendErr.message);
      try {
        await transport.sendMail(mailOptions);
        console.log(`[SMTP FALLBACK SUCCESS] Email sent to ${request.email} via SMTP`);
      } catch (smtpErr: any) {
        console.error("[SMTP FALLBACK FAILED] SMTP also failed:", smtpErr.message);
        throw smtpErr; // Re-throw to inform controller
      }
    }
  } else {
    await transport.sendMail(mailOptions);
  }

  console.log(
    `[EMAIL SUCCESS] Email of type ${request.type} sent to ${request.email}`,
  );
  if (otp) {
    console.log(`[EMERGENCY DEBUG] OTP for ${request.email} is: ${otp}`);
  }
};

async function sendMail(type: string, request: Record<string, string>) {
  if (process.env.DISABLE_EMAIL === "true") {
    console.log(
      `[EMAIL DISABLED] Skipping sending email of type: ${type} to ${request.email}`,
    );
    return;
  }

  try {
    if (!config.email.host) {
      throw new Error(`SMTP Host is not configured. (Detected for user: ${request.email})`);
    }

    switch (type) {
      case constants.USER_EMAIL_VERIFICATION_TEMPLATE:
        request.subject = constants.USER_EMAIL_VERIFICATION_SUBJECT;
        // Link added for "Verify Now" button
        request.email_verification_link = utils.createUrl({
          type: "otp",
          query: `email=${request.email}`,
        });
        request.otp = request.otp ?? "";
        await getHTMLandSendEmail(
          `${publicDir}/email-verification.html`,
          request,
        );
        break;

      case constants.USER_FORGOT_PASSWORD_TEMPLATE:
        request.subject = constants.USER_FORGOT_PASSWORD_SUBJECT;
        // Updated link to point to forgot-password with step=2 and email
        request.reset_password_link = utils.createUrl({
          type: "forgot-password",
          query: `email=${request.email}&step=2`,
        });
        request.otp = request.otp ?? "";
        await getHTMLandSendEmail(`${publicDir}/forgot-password.html`, request);
        break;

      case constants.USER_REGISTERED_TEMPLATE:
        request.subject = constants.USER_REGISTERED_SUBJECT;
        await getHTMLandSendEmail(`${publicDir}/welcome.html`, request);
        break;

      case constants.USER_EMAIL_VERIFIED_TEMPLATE:
        request.subject = constants.USER_EMAIL_VERIFIED_SUBJECT;
        await getHTMLandSendEmail(
          `${publicDir}/email-verification-success.html`,
          request,
        );
        break;

      case constants.USER_RESET_PASSWORD_TEMPLATE:
        request.subject = constants.USER_RESET_PASSWORD_SUBJECT;
        await getHTMLandSendEmail(
          `${publicDir}/reset-password-success.html`,
          request,
        );
        break;

      case constants.USER_WITH_CREDENTIALS_TEMPLATE:
        request.subject = constants.USER_WITH_CREDENTIALS_SUBJECT;
        await getHTMLandSendEmail(
          `${publicDir}/user-with-credentials.html`,
          request,
        );
        break;

      default:
        console.warn(`[EMAIL WARNING] Unknown email type: ${type}`);
        break;
    }
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[EMAIL ERROR] Failed to send email of type ${type} to ${request.email}:`, errorMsg);
    throw err; // RE-THROW so controller knows it failed
  }
}

export { sendMail, transport };
