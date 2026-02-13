import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

/**
 * DOCTOR'S ORDERS: 🩺
 * This script bypasses all libraries and checks your token directly with Google.
 */
async function diagnoseGmail() {
    console.log("--- GMAIL TOKEN DOCTOR ---");

    const clientID = process.env.GMAIL_CLIENT_ID?.replace(/[^a-zA-Z0-9.\-_/]/g, "");
    const clientSecret = process.env.GMAIL_CLIENT_SECRET?.replace(/[^a-zA-Z0-9.\-_/]/g, "");
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.replace(/[^a-zA-Z0-9.\-_/]/g, "");

    console.log(`Checking Client ID: ${clientID?.substring(0, 10)}... (Clean Length: ${clientID?.length})`);
    console.log(`Checking Secret: ${clientSecret?.substring(0, 5)}... (Clean Length: ${clientSecret?.length})`);
    console.log(`Checking Refresh Token: ${refreshToken?.substring(0, 5)}... (Clean Length: ${refreshToken?.length})`);

    if (!clientID || !clientSecret || !refreshToken) {
        console.error("❌ Missing credentials in .env!");
        return;
    }

    try {
        console.log("\nAsking Google for an access token...");
        const response = await axios.post("https://oauth2.googleapis.com/token", {
            client_id: clientID,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        });

        console.log("✅ SUCCESS! Google accepted your token.");
        console.log("Access Token starts with:", response.data.access_token.substring(0, 10));
        console.log("\n--- CONCLUSION ---");
        console.log("Your credentials are VALID. The issue is likely hidden characters in the Railway variable UI.");
    } catch (error: any) {
        console.error("❌ GOOGLE REJECTED THE TOKEN!");
        console.error("Response Detail:", JSON.stringify(error.response?.data || error.message));
        console.log("\n--- CONCLUSION ---");
        console.log("You must go back to OAuth2 Playground and generate a NEW token.");
        console.log("MAKE SURE you use your OWN Client ID/Secret in the Playground Settings ⚙️.");
    }
}

diagnoseGmail();
