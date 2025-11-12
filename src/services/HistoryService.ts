// src/services/HistoryService.ts
import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';

export interface DeviceSnapshot {
  timestamp: Date;
  currentCharge: number;
  health: number;
  voltage?: number;
  temperature?: number;
  status: 'healthy' | 'warning' | 'critical' | 'dead';
}

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  currentCharge: number;
  health: number;
  voltage?: number;
  temperature?: number;
  status: string;
}

export type DeviceEventType =
  | 'charged_without_use'  // Device was charged but not used
  | 'marked_defective';    // Device was marked as defective/deep discharged

export interface DeviceEvent {
  id?: string;
  type: DeviceEventType;
  timestamp: Date;
  notes?: string;
}

export class HistoryService {
  /**
   * Record a snapshot of the device's current state
   */
  static async recordSnapshot(
    userId: string,
    deviceId: string,
    snapshot: Omit<DeviceSnapshot, 'timestamp'>
  ): Promise<void> {
    try {
      const historyRef = collection(db, 'users', userId, 'devices', deviceId, 'history');

      await addDoc(historyRef, {
        ...snapshot,
        timestamp: Timestamp.now()
      });

      console.log(`Snapshot recorded for device ${deviceId}`);
    } catch (error) {
      console.error('Error recording snapshot:', error);
      throw error;
    }
  }

  /**
   * Record a device event (usage, defect, etc.)
   */
  static async recordEvent(
    userId: string,
    deviceId: string,
    eventType: DeviceEventType,
    notes?: string
  ): Promise<void> {
    try {
      const eventsRef = collection(db, 'users', userId, 'devices', deviceId, 'events');

      await addDoc(eventsRef, {
        type: eventType,
        timestamp: Timestamp.now(),
        notes: notes || ''
      });

      console.log(`Event recorded for device ${deviceId}: ${eventType}`);
    } catch (error) {
      console.error('Error recording event:', error);
      throw error;
    }
  }

  /**
   * Get events for a device
   */
  static async getEvents(
    userId: string,
    deviceId: string,
    eventType?: DeviceEventType
  ): Promise<DeviceEvent[]> {
    try {
      const eventsRef = collection(db, 'users', userId, 'devices', deviceId, 'events');

      let q;
      if (eventType) {
        q = query(
          eventsRef,
          where('type', '==', eventType),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      } else {
        q = query(
          eventsRef,
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      }

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        type: doc.data().type as DeviceEventType,
        timestamp: doc.data().timestamp.toDate(),
        notes: doc.data().notes
      }));
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  /**
   * Get history for a device within a date range
   */
  static async getHistory(
    userId: string,
    deviceId: string,
    daysBack: number = 7
  ): Promise<HistoryEntry[]> {
    try {
      const historyRef = collection(db, 'users', userId, 'devices', deviceId, 'history');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const q = query(
        historyRef,
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        orderBy('timestamp', 'desc'),
        limit(1000) // Limit to prevent too much data
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        timestamp: doc.data().timestamp.toDate(),
        currentCharge: doc.data().currentCharge,
        health: doc.data().health,
        voltage: doc.data().voltage,
        temperature: doc.data().temperature,
        status: doc.data().status
      }));
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }

  /**
   * Clean up old history entries based on subscription plan
   */
  static async cleanupOldHistory(
    userId: string,
    deviceId: string,
    retentionDays: number
  ): Promise<void> {
    try {
      const historyRef = collection(db, 'users', userId, 'devices', deviceId, 'history');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const q = query(
        historyRef,
        where('timestamp', '<', Timestamp.fromDate(cutoffDate))
      );

      const snapshot = await getDocs(q);

      const deletePromises = snapshot.docs.map(docSnapshot =>
        deleteDoc(doc(db, 'users', userId, 'devices', deviceId, 'history', docSnapshot.id))
      );

      await Promise.all(deletePromises);

      console.log(`Cleaned up ${deletePromises.length} old entries for device ${deviceId}`);
    } catch (error) {
      console.error('Error cleaning up history:', error);
    }
  }

  /**
   * Get retention days based on subscription plan
   */
  static getRetentionDays(plan: 'free' | 'pro' | 'business'): number {
    switch (plan) {
      case 'free':
        return 7; // 7 days for free plan
      case 'pro':
      case 'business':
        return 365 * 10; // Effectively unlimited (10 years)
      default:
        return 7;
    }
  }

  /**
   * Record snapshots for all user devices
   */
  static async recordAllDeviceSnapshots(userId: string): Promise<void> {
    try {
      const devicesRef = collection(db, 'users', userId, 'devices');
      const devicesSnapshot = await getDocs(devicesRef);

      const recordPromises = devicesSnapshot.docs.map(async (deviceDoc) => {
        const deviceData = deviceDoc.data();

        // Don't record history for example devices
        if (deviceData.isExample) return;

        await this.recordSnapshot(userId, deviceDoc.id, {
          currentCharge: deviceData.currentCharge || 0,
          health: deviceData.health || 100,
          voltage: deviceData.voltage,
          temperature: deviceData.temperature,
          status: deviceData.status || 'healthy'
        });
      });

      await Promise.all(recordPromises);
      console.log(`Recorded snapshots for ${recordPromises.length} devices`);
    } catch (error) {
      console.error('Error recording device snapshots:', error);
    }
  }

  /**
   * Generate dummy data for development/testing
   * Creates realistic battery discharge patterns over the last 7 days
   */
  static async generateDummyData(
    userId: string,
    deviceId: string,
    numDataPoints: number = 30
  ): Promise<void> {
    try {
      const historyRef = collection(db, 'users', userId, 'devices', deviceId, 'history');

      // Starting values
      let currentCharge = 100;
      let health = 100;

      const now = new Date();
      const promises: Promise<any>[] = [];

      for (let i = numDataPoints - 1; i >= 0; i--) {
        // Calculate timestamp (evenly distributed over last 7 days)
        const timestamp = new Date(now.getTime() - (i * (7 * 24 * 60 * 60 * 1000) / numDataPoints));

        // Simulate realistic battery discharge
        // Sometimes charge increases (charging), mostly decreases (usage)
        const chargeChange = Math.random() > 0.7
          ? Math.random() * 30  // Charging: +0 to +30%
          : -Math.random() * 15; // Discharging: -0 to -15%

        currentCharge = Math.max(10, Math.min(100, currentCharge + chargeChange));

        // Simulate very slow health degradation
        health = Math.max(85, health - Math.random() * 0.5);

        // Determine status based on charge
        let status: 'healthy' | 'warning' | 'critical' | 'dead';
        if (currentCharge > 50) {
          status = 'healthy';
        } else if (currentCharge > 20) {
          status = 'warning';
        } else if (currentCharge > 5) {
          status = 'critical';
        } else {
          status = 'dead';
        }

        // Add some randomness to voltage and temperature
        const voltage = 3.7 + (Math.random() * 0.5 - 0.25); // 3.45V - 3.95V
        const temperature = 20 + Math.random() * 15; // 20°C - 35°C

        promises.push(
          addDoc(historyRef, {
            timestamp: Timestamp.fromDate(timestamp),
            currentCharge: Math.round(currentCharge * 10) / 10,
            health: Math.round(health * 10) / 10,
            voltage: Math.round(voltage * 100) / 100,
            temperature: Math.round(temperature * 10) / 10,
            status
          })
        );
      }

      await Promise.all(promises);
      console.log(`Generated ${numDataPoints} dummy data points for device ${deviceId}`);
    } catch (error) {
      console.error('Error generating dummy data:', error);
      throw error;
    }
  }
}
