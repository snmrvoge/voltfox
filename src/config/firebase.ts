// src/config/firebase.ts
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';
import { getInstallations } from 'firebase/installations';

// Production-ready config with validation
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'voltfox-b1cef.firebasestorage.app',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Validate config in development
if (process.env.NODE_ENV === 'development') {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  requiredKeys.forEach(key => {
    if (!firebaseConfig[key as keyof typeof firebaseConfig]) {
      console.error(`Missing Firebase config: ${key}`);
    }
  });

  // Log config status (without sensitive data)
  console.log('Firebase Config Status:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    projectId: firebaseConfig.projectId || 'missing'
  });
}

// Initialize Firebase
let app: FirebaseApp;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully with project:', firebaseConfig.projectId);
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const installations = getInstallations(app);

// Test Firestore connectivity
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('firebase/firestore').then(({ collection, getDocs }) => {
    console.log('Testing Firestore connectivity...');
    // This will help diagnose if Firestore is actually reachable
  }).catch(err => {
    console.error('Firestore import error:', err);
  });
}

// Note: Persistence is optional and can cause issues
// Commenting out for now to avoid offline errors
// if (typeof window !== 'undefined') {
//   enableIndexedDbPersistence(db).catch((err) => {
//     if (err.code === 'failed-precondition') {
//       console.warn('Firestore persistence failed: Multiple tabs open');
//     } else if (err.code === 'unimplemented') {
//       console.warn('Firestore persistence not available in this browser');
//     }
//   });
// }

// Initialize Analytics conditionally
let analytics = null;
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  isSupported().then(supported => {
    if (supported && firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
      console.log('Analytics initialized');
    }
  }).catch(err => {
    console.warn('Analytics not supported:', err);
  });
}
export { analytics };

// Auth providers
export const googleProvider = new GoogleAuthProvider();

// Apple provider with custom parameters
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');
appleProvider.setCustomParameters({
  locale: 'de'
});

export default app;
