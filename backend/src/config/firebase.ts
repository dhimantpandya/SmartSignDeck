import admin from "firebase-admin";
import config from "./config";
import fs from "fs";
import path from "path";

let firebaseApp: admin.app.App | undefined;

try {
  if (config.firebase.serviceAccountPath) {
    const serviceAccountPath = path.resolve(config.firebase.serviceAccountPath);

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, "utf8"),
      );

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin initialized successfully");
    } else {
      console.warn(
        `Firebase service account file not found at: ${serviceAccountPath}`,
      );
    }
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT_PATH not provided in .env");
  }
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
}

export default firebaseApp;
export { admin };
