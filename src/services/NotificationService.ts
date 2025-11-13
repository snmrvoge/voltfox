// src/services/NotificationService.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import app, { db } from '../config/firebase';

export class NotificationService {
  private static hasPermission = false;
  private static fcmToken: string | null = null;
  private static messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

  // Request notification permission and get FCM token
  static async requestPermission(userId?: string): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      await this.getFCMToken(userId);
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';

      if (this.hasPermission) {
        await this.getFCMToken(userId);
      }

      return this.hasPermission;
    }

    return false;
  }

  // Get Firebase Cloud Messaging token
  static async getFCMToken(userId?: string): Promise<string | null> {
    if (!this.messaging) {
      console.log('Firebase Messaging not available');
      return null;
    }

    try {
      const token = await getToken(this.messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
      });

      if (token) {
        console.log('FCM Token:', token);
        this.fcmToken = token;

        // Store token in Firestore for the current user
        if (userId) {
          await this.saveTokenToFirestore(userId, token);
        }

        return token;
      } else {
        console.log('No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Save FCM token to Firestore user document
  private static async saveTokenToFirestore(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);

      // Check if user document exists
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        // Add token to fcmTokens array (arrayUnion prevents duplicates)
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token)
        });
        console.log('FCM token saved to Firestore');
      } else {
        console.error('User document does not exist');
      }
    } catch (error) {
      console.error('Error saving FCM token to Firestore:', error);
    }
  }

  // Initialize foreground message listener
  static initializeForegroundListener() {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('Foreground message received:', payload);

      // Show notification when app is in foreground
      if (payload.notification) {
        this.send(
          payload.notification.title || 'VoltFox Benachrichtigung',
          {
            body: payload.notification.body,
            icon: payload.notification.icon || '/logo192.png',
            data: payload.data
          }
        );
      }
    });
  }

  // Get stored FCM token
  static getToken(): string | null {
    return this.fcmToken;
  }

  // Check if notifications are enabled
  static isEnabled(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  // Send a notification
  static send(title: string, options?: NotificationOptions) {
    if (!this.isEnabled()) {
      console.log('Notifications are not enabled');
      return;
    }

    const notification = new Notification(title, {
      icon: '/voltfox-icon.png',
      badge: '/voltfox-badge.png',
      ...options
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  // Send critical battery alert
  static sendCriticalBatteryAlert(deviceName: string, charge: number) {
    this.send('🚨 VoltFox Alert', {
      body: `${deviceName} has critical battery level: ${charge}%`,
      tag: 'critical-battery',
      requireInteraction: true,
      vibrate: [200, 100, 200]
    });
  }

  // Send low battery warning
  static sendLowBatteryWarning(deviceName: string, charge: number) {
    this.send('⚠️ VoltFox Warning', {
      body: `${deviceName} battery is low: ${charge}%`,
      tag: 'low-battery',
      vibrate: [200]
    });
  }

  // Send low health warning
  static sendLowHealthWarning(deviceName: string, health: number) {
    this.send('⚠️ VoltFox Health Alert', {
      body: `${deviceName} battery health is low: ${health}%`,
      tag: 'low-health',
      vibrate: [200]
    });
  }

  // Send device dead alert
  static sendDeviceDeadAlert(deviceName: string) {
    this.send('💀 VoltFox Critical', {
      body: `${deviceName} battery is completely dead!`,
      tag: 'device-dead',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200]
    });
  }
}
