import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCYh-vsDOQBx7-bnldlU1hE3ZDosJFJ6Rs",
  authDomain: "aplikasikasir-2a2b0.firebaseapp.com",
  projectId: "aplikasikasir-2a2b0",
  storageBucket: "aplikasikasir-2a2b0.firebasestorage.app",
  messagingSenderId: "803586511436",
  appId: "1:803586511436:web:4c970546ab58fac313dae9",
  measurementId: "G-8395V3QBT3"
};

// Initialize Firebase (SSR safe)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
