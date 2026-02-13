import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

/**
 * FINAL VERIFICATION SCRIPT 🚀
 * This script will try to:
 * 1. Clean your credentials
 * 2. Get a new Access Token from Google
 * 3. Send a REAL test email to yourself
 */
async function testFinalSender() {
    console.log("--- FINAL EMAIL VERIFICATION ---");

    const clientID = process.env.GMAIL_CLIENT_ID?.replace(/[^a-zA-Z0-9.\-_/]/g, "");
    const clientSecret = process.env.GMAIL_CLIENT_SECRET?.replace(/[^a-zA-Z0-9.\-_/]/g, "");
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.replace(/[^a-zA-Z0-9.\-_/]/g, "");
    const myEmail = process.env.EMAIL_USER;

    console.log(`Using Sender: ${myEmail}`);
    console.log(`Using Client ID: ${clientID?.substring(0, 10)}... (Length: ${clientID?.length})`);

    if (!clientID || !clientSecret || !refreshToken || !myEmail) {
        console.error("❌ Missing credentials in .env!");
        return;
    }

    try {
        // 1. REFRESH TOKEN
        console.log("\n1. Refreshing Access Token...");
        const refreshRes = await axios.post("https://oauth2.googleapis.com/token", {
            client_id: clientID,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        });

        const accessToken = refreshRes.data.access_token;
        console.log("✅ Token Refreshed Successfully!");

        // 2. SEND EMAIL
        console.log("\n2. Sending Test Email...");
        const subject = "🚀 SmartSignDeck - Final Test Success!";
        const html = `<h1>Project Complete!</h1><p>If you see this, your Gmail API is 100% working.</p>`;

        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
        const messageParts = [
            `From: "SmartSignDeck" <${myEmail}>`,
            `To: ${myEmail}`,
            `Content-Type: text/html; charset=utf-8`,
            `MIME-Version: 1.0`,
            `Subject: ${utf8Subject}`,
            ``,
            html,
        ];
        const message = messageParts.join("\n");
        const encodedMessage = Buffer.from(message)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        await axios.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            { raw: encodedMessage },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        console.log("✅ EMAIL SENT SUCCESSFULLY! Check your inbox.");
        console.log("\n--- RESULT ---");
        console.log("Your credentials are PERFECT. We just need Railway to sync.");

    } catch (error: any) {
        console.error("\n❌ FAILED!");
        const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        console.error("Error Detail:", detail);

        if (detail.includes("invalid_grant")) {
            console.log("\n💡 TIP: Google is still rejecting the Refresh Token. Try generating it ONE more time in the Playground and paste it carefully.");
        }
    }
}

testFinalSender();
