import admin from "firebase-admin";
import config from "./config";
import fs from "fs";
import path from "path";

let firebaseApp: admin.app.App | null | undefined;

try {
  if (
    config.firebase.projectId &&
    config.firebase.privateKey &&
    config.firebase.clientEmail
  ) {
    if (admin.apps.length === 0) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          privateKey: config.firebase.privateKey,
          clientEmail: config.firebase.clientEmail,
        }),
      });
      console.log("Firebase Admin initialized via environment variables");
    } else {
      firebaseApp = admin.apps[0];
    }
  } else if (config.firebase.serviceAccountPath) {
    const serviceAccountPath = path.resolve(config.firebase.serviceAccountPath);

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, "utf8"),
      );

      if (admin.apps.length === 0) {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log("Firebase Admin initialized via service account file");
      } else {
        firebaseApp = admin.apps[0];
      }
    } else {
      console.warn(
        `Firebase service account file not found at: ${serviceAccountPath}. Firebase features (auth, notifications) will not work.`,
      );
    }
  } else {
    console.warn(
      "FIREBASE credentials not provided in .env (path or env vars). Firebase features will not work.",
    );
  }
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
}

export default firebaseApp;
export { admin };
