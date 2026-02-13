import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

const verify = async () => {
    const clean = (val?: string) => val?.trim().replace(/^["']|["']$/g, "").replace(/[^\x20-\x7E]/g, "") || "";

    const clientId = clean(process.env.GMAIL_CLIENT_ID);
    const clientSecret = clean(process.env.GMAIL_CLIENT_SECRET);
    const refreshToken = clean(process.env.GMAIL_REFRESH_TOKEN);
    const user = clean(process.env.EMAIL_USER);

    console.log("--- Gmail Credential Verification (v2.1) ---");
    console.log(`Client ID: ${clientId.substring(0, 5)}...${clientId.slice(-5)} (Length: ${clientId.length})`);
    console.log(`Client Secret: ${clientSecret.substring(0, 3)}...${clientSecret.slice(-3)} (Length: ${clientSecret.length})`);
    console.log(`Refresh Token: ${refreshToken.substring(0, 5)}...${refreshToken.slice(-5)} (Length: ${refreshToken.length})`);
    console.log(`User: ${user}`);

    if (!clientId || !clientSecret || !refreshToken || !user) {
        console.error("❌ Error: Missing required credentials in .env file.");
        return;
    }

    const oAuth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        "https://developers.google.com/oauthplayground"
    );

    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    try {
        console.log("\n1. Testing Token Refresh...");
        const { credentials } = await oAuth2Client.refreshAccessToken();
        console.log("✅ Success! Refresh token is valid. New Access Token obtained.");

        oAuth2Client.setCredentials(credentials);

        const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
        console.log("Attempting to fetch profile...");
        const profile = await gmail.users.getProfile({ userId: "me" });
        console.log(`✅ Success! Connected to: ${profile.data.emailAddress}`);

        if (profile.data.emailAddress?.toLowerCase() !== user.toLowerCase()) {
            console.warn(`⚠️ Warning: Credentials match ${profile.data.emailAddress}, but EMAIL_USER is ${user}.`);
        } else {
            console.log("🚀 Everything looks perfect!");
        }
    } catch (error: any) {
        console.error("\n❌ Verification Failed!");
        if (error.response?.data) {
            console.error("Error Detail:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error Message:", error.message);
        }

        if (error.message?.includes("invalid_client")) {
            console.error("\n💡 TIP: 'invalid_client' (The OAuth client was not found) almost always means the Client ID is wrong.");
            console.error("Check for extra spaces, or if you're using a Client ID from a different project.");
        }
    }
};

verify();
