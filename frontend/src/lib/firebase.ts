import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

// Debug log to confirm environment variables are present in production
if (import.meta.env.PROD) {
    console.log('Firebase Init Check:', {
        hasApiKey: !!firebaseConfig.apiKey,
        apiKeyLength: firebaseConfig.apiKey?.length,
        authDomain: firebaseConfig.authDomain
    });
}

try {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
        throw new Error('Firebase API Key is missing or invalid');
    }
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Configure Google Provider to show account picker
    googleProvider = new GoogleAuthProvider();

    // Force account selection screen (shows all logged-in Google accounts)
    googleProvider.setCustomParameters({
        prompt: 'select_account'
    });
} catch (error) {
    console.error('Firebase initialization failed:', error);
    // Setting to null allows the UI to check for existence before calling methods
    auth = null;
    googleProvider = null;
}

export const isFirebaseConfigured = () => !!auth && !!googleProvider;

export { auth, googleProvider };
