// src/context/DeviceContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface Device {
  id?: string;
  name: string;
  type: string;
  icon: string;
  brand?: string;
  model?: string;
  voltage?: number;
  capacity?: number;
  chemistry: string;
  dischargeRate: number;
  cycles?: number;
  health: number;
  status: 'healthy' | 'warning' | 'critical' | 'dead';
  currentCharge: number;
  lastCharged: string;
  storageLocation?: string;
  photoUrl?: string;
  notes?: string;
  reminderFrequency: number;
  createdAt?: any;
  updatedAt?: any;
}

interface DeviceContextType {
  devices: Device[];
  loading: boolean;
  addDevice: (device: Omit<Device, 'id'>) => Promise<void>;
  updateDevice: (id: string, updates: Partial<Device>) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  checkBatteryHealth: (device: Device) => number;
  getDaysUntilDanger: (device: Device) => number;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function useDevices() {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevices must be used within a DeviceProvider');
  }
  return context;
}

interface DeviceProviderProps {
  children: ReactNode;
}

export function DeviceProvider({ children }: DeviceProviderProps) {
  const { currentUser } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to devices
  useEffect(() => {
    if (!currentUser) {
      setDevices([]);
      setLoading(false);
      return;
    }

    const devicesQuery = query(
      collection(db, 'users', currentUser.uid, 'devices'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(devicesQuery, (snapshot) => {
      const devicesList: Device[] = [];
      snapshot.forEach((doc) => {
        devicesList.push({ id: doc.id, ...doc.data() } as Device);
      });
      setDevices(devicesList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Add device
  async function addDevice(deviceData: Omit<Device, 'id'>) {
    if (!currentUser) {
      toast.error('Please sign in to add devices');
      return;
    }

    try {
      const newDevice = {
        ...deviceData,
        health: 100,
        status: 'healthy' as const,
        currentCharge: 100,
        lastCharged: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(
        collection(db, 'users', currentUser.uid, 'devices'),
        newDevice
      );

      toast.success(`${deviceData.name} added successfully! 🦊`);
    } catch (error) {
      console.error('Error adding device:', error);
      toast.error('Failed to add device');
      throw error;
    }
  }

  // Update device
  async function updateDevice(id: string, updates: Partial<Device>) {
    if (!currentUser) return;

    try {
      await updateDoc(
        doc(db, 'users', currentUser.uid, 'devices', id),
        {
          ...updates,
          updatedAt: serverTimestamp()
        }
      );

      toast.success('Device updated!');
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error('Failed to update device');
      throw error;
    }
  }

  // Delete device
  async function deleteDevice(id: string) {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'devices', id));
      toast.success('Device removed');
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error('Failed to delete device');
      throw error;
    }
  }

  // Check battery health
  function checkBatteryHealth(device: Device): number {
    let health = 100;

    // Age factor
    const deviceAge = device.createdAt ? 
      (Date.now() - device.createdAt.toDate()) / (1000 * 60 * 60 * 24 * 365) : 0;
    health -= deviceAge * 10;

    // Cycles factor
    if (device.cycles) {
      const maxCycles = device.chemistry === 'lipo' ? 300 : 500;
      health -= (device.cycles / maxCycles) * 50;
    }

    // Current charge factor
    if (device.currentCharge < 20) {
      health -= 20;
    }

    return Math.max(0, Math.min(100, Math.round(health)));
  }

  // Get days until danger
  function getDaysUntilDanger(device: Device): number {
    const lastCharged = new Date(device.lastCharged);
    const daysSinceCharge = (Date.now() - lastCharged.getTime()) / (1000 * 60 * 60 * 24);
    const currentCharge = Math.max(0, device.currentCharge - (daysSinceCharge * device.dischargeRate));
    
    const daysRemaining = currentCharge / device.dischargeRate;
    return Math.max(0, Math.round(daysRemaining));
  }

  const value = {
    devices,
    loading,
    addDevice,
    updateDevice,
    deleteDevice,
    checkBatteryHealth,
    getDaysUntilDanger
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}