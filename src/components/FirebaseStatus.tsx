// src/components/FirebaseStatus.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface FirebaseStatusProps {
  children: React.ReactNode;
}

export const FirebaseStatus: React.FC<FirebaseStatusProps> = ({ children }) => {
  const [firestoreOnline, setFirestoreOnline] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkFirestore = async () => {
      try {
        // Try to query a collection to see if Firestore is accessible
        await getDocs(collection(db, '_test_connection'));
        setFirestoreOnline(true);
        setChecking(false);
      } catch (error: any) {
        console.error('Firestore connectivity check failed:', error);

        if (error.code === 'unavailable' || error.message?.includes('offline')) {
          setFirestoreOnline(false);
        } else {
          // Other errors (like permission denied) mean Firestore IS online
          setFirestoreOnline(true);
        }
        setChecking(false);
      }
    };

    // Check after a brief delay to allow Firebase to initialize
    const timer = setTimeout(checkFirestore, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (checking) {
    return <>{children}</>;
  }

  if (firestoreOnline === false) {
    return (
      <div style={{
        padding: '2rem',
        maxWidth: '600px',
        margin: '2rem auto',
        background: '#FEF3C7',
        border: '2px solid #F59E0B',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#92400E', marginBottom: '1rem' }}>
          ⚠️ Firestore Setup Required
        </h2>
        <p style={{ color: '#78350F', marginBottom: '1.5rem' }}>
          Your Firebase project needs Firestore to be enabled. Please follow these steps:
        </p>
        <ol style={{
          textAlign: 'left',
          color: '#78350F',
          marginBottom: '1.5rem',
          paddingLeft: '2rem'
        }}>
          <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#FF6B35' }}>Firebase Console</a></li>
          <li>Select project: <strong>voltfox-b1cef</strong></li>
          <li>Click "Firestore Database" in the left menu</li>
          <li>Click "Create Database"</li>
          <li>Choose "Start in test mode" for development</li>
          <li>Select your region and click "Enable"</li>
          <li>Refresh this page</li>
        </ol>
        <p style={{ fontSize: '0.875rem', color: '#92400E' }}>
          Note: The app will continue to work, but data won't be saved until Firestore is enabled.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
