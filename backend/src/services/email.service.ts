import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import nodemailer, { type Transporter } from "nodemailer";
import config from "../config/config";
import * as constants from "../utils/constants/email.constants";
import * as utils from "../utils/utils";

const publicDir: string = path.join(__dirname, "../public/emailTemplates");

console.log(`[EMAIL] Initializing manual SMTP for ${config.email.user} on ${config.email.host}:${config.email.port}...`);

// TCP Port Probe
import net from "net";
const probePorts = [465, 587];
probePorts.forEach(port => {
  const socket = new net.Socket();
  socket.setTimeout(5000);
  console.log(`[EMAIL PROBE] Testing TCP connection to ${config.email.host}:${port}...`);
  socket.connect(port, config.email.host, () => {
    console.log(`[EMAIL PROBE SUCCESS] Port ${port} is OPEN at TCP level.`);
    socket.destroy();
  });
  socket.on("error", (err) => {
    console.log(`[EMAIL PROBE FAIL] Port ${port} is CLOSED or BLOCKED: ${err.message}`);
    socket.destroy();
  });
  socket.on("timeout", () => {
    console.log(`[EMAIL PROBE TIMEOUT] Port ${port} timed out.`);
    socket.destroy();
  });
});

const transport: Transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465, // MUST be true for port 465
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
  tls: { rejectUnauthorized: false },
  debug: true,  // Raw protocol logging
  logger: true, // Output to console
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
} as any);

// Startup DNS Check
import dns from "dns";
dns.lookup(config.email.host, (err, address) => {
  if (err) console.error(`[EMAIL DNS ERROR] Could not resolve ${config.email.host}:`, err.message);
  else console.log(`[EMAIL DNS SUCCESS] ${config.email.host} resolved to ${address}`);
});

// Verify connection configuration
if (config.env !== "test" && process.env.DISABLE_EMAIL !== "true") {
  console.log("[EMAIL] Verifying SMTP connection...");
  transport.verify((error) => {
    if (error) {
      console.warn("[EMAIL ERROR] Connection failed:", error.message);
    } else {
      console.log("[EMAIL SUCCESS] Connected to email server and ready to send");
    }
  });
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

  const html = await new Promise<string>((resolve, reject) => {
    readHTMLFile(templateFile, (err, html) => {
      if (err) reject(err);
      else if (html) resolve(html);
    });
  });

  const template = handlebars.compile(html);

  const from = config.email.from.includes("resend.dev")
    ? `SmartSignDeck <${config.email.user}>`
    : config.email.from;

  const mailOptions = {
    from,
    to: request.email,
    subject: request.subject ?? "",
    html: template({
      user_name: request.name ?? "",
      url: request.url ?? "",
      email_verification_link: request.email_verification_link ?? "",
      reset_password_link: request.reset_password_link ?? "",
      email: request.email,
      password: request.password,
      otp: request.otp ?? "",
    }),
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log(`[EMAIL SUCCESS] Type: ${path.basename(templateFile)} sent to ${request.email}. MessageId: ${info.messageId}`);
    if (request.otp) {
      console.log(`[EMERGENCY DEBUG] OTP for ${request.email} is: ${request.otp}`);
    }
  } catch (error: any) {
    console.error(`[EMAIL ERROR] Failed to send to ${request.email}:`, error.message);
    throw error;
  }
};

async function sendMail(type: string, request: Record<string, string>) {
  if (process.env.DISABLE_EMAIL === "true") {
    console.log(`[EMAIL DISABLED] Skipping ${type} to ${request.email}`);
    return;
  }

  try {
    switch (type) {
      case constants.USER_EMAIL_VERIFICATION_TEMPLATE:
        request.subject = constants.USER_EMAIL_VERIFICATION_SUBJECT;
        request.email_verification_link = utils.createUrl({
          type: "otp",
          query: `email=${request.email}`,
        });
        await getHTMLandSendEmail(`${publicDir}/email-verification.html`, request);
        break;

      case constants.USER_FORGOT_PASSWORD_TEMPLATE:
        request.subject = constants.USER_FORGOT_PASSWORD_SUBJECT;
        request.reset_password_link = utils.createUrl({
          type: "forgot-password",
          query: `email=${request.email}&step=2`,
        });
        await getHTMLandSendEmail(`${publicDir}/forgot-password.html`, request);
        break;

      case constants.USER_REGISTERED_TEMPLATE:
        request.subject = constants.USER_REGISTERED_SUBJECT;
        await getHTMLandSendEmail(`${publicDir}/welcome.html`, request);
        break;

      case constants.USER_EMAIL_VERIFIED_TEMPLATE:
        request.subject = constants.USER_EMAIL_VERIFIED_SUBJECT;
        await getHTMLandSendEmail(`${publicDir}/email-verification-success.html`, request);
        break;

      case constants.USER_RESET_PASSWORD_TEMPLATE:
        request.subject = constants.USER_RESET_PASSWORD_SUBJECT;
        await getHTMLandSendEmail(`${publicDir}/reset-password-success.html`, request);
        break;

      case constants.USER_WITH_CREDENTIALS_TEMPLATE:
        request.subject = constants.USER_WITH_CREDENTIALS_SUBJECT;
        await getHTMLandSendEmail(`${publicDir}/user-with-credentials.html`, request);
        break;

      default:
        console.warn(`[EMAIL WARNING] Unknown email type: ${type}`);
        break;
    }
  } catch (err: any) {
    console.error(`[EMAIL FATAL ERROR] ${err.message}`);
    throw err;
  }
}

export { sendMail, transport };
