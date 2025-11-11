// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  auth, 
  db,
  googleProvider,
  appleProvider 
} from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  User
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import toast from 'react-hot-toast';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'business';
  createdAt: any;
  updatedAt: any;
  settings: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
  };
  stats: {
    devicesCount: number;
    totalAlerts: number;
    lastActive: any;
  };
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<User>;
  signInWithApple: () => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Create user profile in Firestore
  async function createUserProfile(user: User, additionalData: any = {}) {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      const { email, displayName, photoURL, uid } = user;
      
      try {
        await setDoc(userRef, {
          uid,
          email,
          displayName: displayName || additionalData.displayName || '',
          photoURL: photoURL || '',
          plan: 'free',
          role: 'user',
          settings: {
            notifications: true,
            darkMode: false,
            language: 'de'
          },
          stats: {
            devicesCount: 0,
            totalAlerts: 0,
            lastActive: serverTimestamp()
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...additionalData
        });

        // Create welcome device
        await setDoc(
          doc(db, 'users', uid, 'devices', 'welcome'),
          {
            name: 'Example: DJI Mavic Pro',
            type: 'drone',
            icon: '🚁',
            voltage: 11.1,
            capacity: 3830,
            chemistry: 'lipo',
            dischargeRate: 0.5,
            health: 100,
            status: 'healthy',
            isExample: true,
            createdAt: serverTimestamp()
          }
        );
      } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
      }
    }

    const userDoc = await getDoc(userRef);
    return userDoc.data() as UserProfile;
  }

  // Sign up with email/password
  async function signup(email: string, password: string, displayName: string) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(result.user, { displayName });
      await createUserProfile(result.user, { displayName });
      await sendEmailVerification(result.user);
      
      toast.success('Account created! Please verify your email.');
      return result.user;
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    }
  }

  // Sign in with email/password
  async function login(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Check if user is blocked
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.isBlocked) {
          await signOut(auth);
          toast.error('🚫 Dein Account wurde gesperrt. Kontaktiere den Support.');
          throw new Error('Account blocked');
        }
      }

      await updateDoc(doc(db, 'users', result.user.uid), {
        'stats.lastActive': serverTimestamp()
      });

      toast.success('Welcome back! 🦊');
      return result.user;
    } catch (error: any) {
      if (error.message === 'Account blocked') {
        throw error;
      }
      handleAuthError(error);
      throw error;
    }
  }

  // Sign in with Google
  async function signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createUserProfile(result.user);
      
      toast.success('Welcome to VoltFox! 🦊');
      return result.user;
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    }
  }

  // Sign in with Apple
  async function signInWithApple() {
    try {
      const result = await signInWithPopup(auth, appleProvider);
      await createUserProfile(result.user);
      
      toast.success('Welcome to VoltFox! 🦊');
      return result.user;
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    }
  }

  // Logout
  async function logout() {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setIsAdmin(false);
      toast.success('See you later! 🦊');
    } catch (error) {
      toast.error('Error signing out');
      throw error;
    }
  }

  // Reset password
  async function resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    }
  }

  // Update user profile
  async function updateUserProfile(updates: Partial<UserProfile>) {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      setUserProfile(prev => ({ ...prev!, ...updates }));
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
      throw error;
    }
  }

  // Error handler
  function handleAuthError(error: any) {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'Email is already registered',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/invalid-email': 'Invalid email address',
      'auth/too-many-requests': 'Too many attempts. Please try again later.'
    };

    const message = errorMessages[error.code] || 'An error occurred';
    toast.error(message);
  }

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setUserProfile(profile);
            setIsAdmin(profile.role === 'admin');
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
          // Continue without profile data
          setUserProfile(null);
          setIsAdmin(false);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    isAdmin,
    signup,
    login,
    logout,
    signInWithGoogle,
    signInWithApple,
    resetPassword,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}