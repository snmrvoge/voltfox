// @ts-nocheck
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyASKFkICjgic90MsskJtPz8OjxznbLpbwQ",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "voltfox-b1cef.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "voltfox-b1cef",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "voltfox-b1cef.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "746607802051",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:746607802051:web:30bedee04d459690989476",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-HPSM7GSXY3"
};

console.log('Initializing Firebase with project:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = null;
export const appleProvider = null;

export default app;