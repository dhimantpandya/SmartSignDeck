import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load from absolute path to be sure
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
    console.log(`Loading .env from: ${envPath}`);
    dotenv.config({ path: envPath });
} else {
    console.log(`ERROR: .env not found at ${envPath}`);
}

async function verify() {
    console.log("--- SMTP Diagnostic Start ---");

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS?.replace(/\s/g, "");
    const from = process.env.EMAIL_FROM;
    const host = "smtp.gmail.com";
    const port = 587;

    console.log(`- EMAIL_USER: ${user || "MISSING"}`);
    console.log(`- EMAIL_PASS: ${pass ? "**** (length: " + pass.length + ")" : "MISSING"}`);
    console.log(`- EMAIL_FROM: ${from || "MISSING"}`);
    console.log(`- HOST: ${host}:${port}`);

    if (!user || !pass) {
        console.error("❌ ERROR: Missing credentials in .env file!");
        return;
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: false,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        debug: true,
        logger: true,
    });

    try {
        console.log("Verifying connection...");
        await transporter.verify();
        console.log("✅ Connection SUCCESSFUL!");

        console.log("Sending TEST email...");
        const info = await transporter.sendMail({
            from,
            to: user, // send to self
            subject: "SmartSignDeck SMTP Test",
            text: "If you received this, your SMTP settings are CORRECT.",
            html: "<b>If you received this, your SMTP settings are CORRECT.</b>"
        });
        console.log("✅ Mail Sent SUCCESSFUL!");
        console.log("Message ID:", info.messageId);
    } catch (err: any) {
        console.error("❌ Diagnostic FAILED!");
        console.error("Error Name:", err.name);
        console.error("Error Message:", err.message);
        console.error("Error Code:", err.code);
    }
}

verify();
