import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const verify = async () => {
    const clientId = process.env.GMAIL_CLIENT_ID?.trim();
    const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim();
    const user = process.env.EMAIL_USER?.trim();

    console.log("--- Gmail Credential Verification ---");
    console.log(`Client ID: ${clientId ? clientId.substring(0, 5) + "..." + clientId.slice(-5) : "MISSING"}`);
    console.log(`Client Secret: ${clientSecret ? clientSecret.substring(0, 3) + "..." + clientSecret.slice(-3) : "MISSING"}`);
    console.log(`Refresh Token: ${refreshToken ? refreshToken.substring(0, 5) + "..." + refreshToken.slice(-5) : "MISSING"}`);
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
        console.log("\nAttempting to get Access Token...");
        const tokenResponse = await oAuth2Client.getAccessToken();
        console.log("✅ Success! Access Token obtained.");

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
