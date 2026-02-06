import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Debug log to confirm environment variables are present in production
if (import.meta.env.PROD) {
    console.log('Firebase Init Check:', {
        hasApiKey: !!firebaseConfig.apiKey,
        apiKeyLength: firebaseConfig.apiKey?.length,
        authDomain: firebaseConfig.authDomain
    });
}

let app;
let auth: any;
let googleProvider: any;

try {
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
    // Provide a mock auth object to prevent the entire app from crashing on import
    auth = {
        currentUser: null,
        onAuthStateChanged: () => () => { },
        signOut: async () => { },
    };
    googleProvider = {
        setCustomParameters: () => { }
    };
}

export { auth, googleProvider };
