import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function testResend() {
    console.log("--- Resend API Test ---");
    console.log("API Key length:", RESEND_API_KEY?.length);

    if (!RESEND_API_KEY) {
        console.error("❌ MISSING RESEND_API_KEY in .env");
        return;
    }

    try {
        console.log("Attempting to send test email via HTTP API...");
        const response = await axios.post(
            "https://api.resend.com/emails",
            {
                from: "SmartSignDeck <onboarding@resend.dev>",
                to: "smartsigndeck@gmail.com",
                subject: "Resend API Test - SmartSignDeck",
                html: "<strong>If you see this, Resend API is WORKING!</strong>",
            },
            {
                headers: {
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );
        console.log("✅ Success! Response:", response.data);
    } catch (err: any) {
        console.error("❌ Resend API FAILED!");
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", err.response.data);
        } else {
            console.error("Error:", err.message);
        }
    }
}

testResend();
