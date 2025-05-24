
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// IMPORTANT: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDAkdLiX4WxISZqubYf-WNoA-5_zXWJ4Bo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "spendwise-9d68a.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "spendwise-9d68a",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "spendwise-9d68a.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "245396871702",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:245396871702:web:40850a524f1fe49d7b7337",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

// Connect to emulators if running in development
// Ensure you have the Firebase Emulator Suite running (firebase emulators:start)
// if (process.env.NODE_ENV === 'development') {
//   try {
//     connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
//     connectFirestoreEmulator(db, "localhost", 8080);
//     console.log("Firebase emulators connected.");
//   } catch (error) {
//     console.warn("Error connecting to Firebase emulators. Ensure they are running.", error);
//   }
// }
// Note: For App Prototyper, direct emulator connection logic might be tricky.
// It's generally better to rely on environment variables or a separate config for emulators.
// For now, this setup defaults to production Firebase unless emulators are explicitly configured and running.

export { app, auth, db };
