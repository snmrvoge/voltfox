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
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { NotificationService } from '../services/NotificationService';
import { HistoryService } from '../services/HistoryService';

interface Device {
  id?: string;
  name: string;
  type: string;
  icon: string;
  imageUrl?: string;  // Custom uploaded image
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
  temperature?: number;
  // Insurance-related fields
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  serialNumber?: string;
  warrantyUntil?: string;
  receiptUrls?: string[];
  // Usage and defect tracking
  lastUsed?: string;
  isDefective?: boolean;
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
  calculateDeviceStatus: (device: Device) => 'healthy' | 'warning' | 'critical' | 'dead';
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

    try {
      const devicesQuery = query(
        collection(db, 'users', currentUser.uid, 'devices'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        devicesQuery,
        async (snapshot) => {
          const devicesList: Device[] = [];
          snapshot.forEach((doc) => {
            devicesList.push({ id: doc.id, ...doc.data() } as Device);
          });

          // Auto-update device status if needed
          for (const device of devicesList) {
            const calculatedStatus = calculateDeviceStatus(device);
            const previousStatus = device.status;

            if (previousStatus !== calculatedStatus) {
              // Update status in Firestore
              try {
                await updateDoc(
                  doc(db, 'users', currentUser.uid, 'devices', device.id!),
                  { status: calculatedStatus }
                );
                device.status = calculatedStatus;

                // Send notifications based on new status
                if (NotificationService.isEnabled()) {
                  if (calculatedStatus === 'dead') {
                    NotificationService.sendDeviceDeadAlert(device.name);
                  } else if (calculatedStatus === 'critical' && previousStatus !== 'critical') {
                    if (device.currentCharge < 20) {
                      NotificationService.sendCriticalBatteryAlert(device.name, device.currentCharge);
                    } else if (device.health < 40) {
                      NotificationService.sendLowHealthWarning(device.name, device.health);
                    }
                  } else if (calculatedStatus === 'warning' && previousStatus === 'healthy') {
                    if (device.currentCharge < 50) {
                      NotificationService.sendLowBatteryWarning(device.name, device.currentCharge);
                    } else if (device.health < 70) {
                      NotificationService.sendLowHealthWarning(device.name, device.health);
                    }
                  }
                }
              } catch (error) {
                console.error('Error updating device status:', error);
              }
            }
          }

          setDevices(devicesList);
          setLoading(false);
        },
        (error) => {
          console.error('Firestore error:', error);
          // Set loading to false and use empty devices array
          setDevices([]);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Failed to setup Firestore listener:', error);
      setDevices([]);
      setLoading(false);
    }
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
      // Get the current device data to calculate status
      const device = devices.find(d => d.id === id);

      // Calculate the new status based on updated values
      let newStatus = updates.status;
      if (device && (updates.currentCharge !== undefined || updates.health !== undefined)) {
        const updatedDevice = {
          ...device,
          ...updates
        } as Device;
        newStatus = calculateDeviceStatus(updatedDevice);
        updates.status = newStatus;
      }

      await updateDoc(
        doc(db, 'users', currentUser.uid, 'devices', id),
        {
          ...updates,
          updatedAt: serverTimestamp()
        }
      );

      // Always record snapshot for history tracking when charge or health changes
      if (updates.currentCharge !== undefined || updates.health !== undefined) {
        try {
          if (device) {
            const snapshotData: any = {
              currentCharge: updates.currentCharge ?? device.currentCharge,
              health: updates.health ?? device.health,
              status: newStatus ?? device.status
            };

            // Only add optional fields if they are defined
            const voltage = updates.voltage ?? device.voltage;
            if (voltage !== undefined) {
              snapshotData.voltage = voltage;
            }

            const temperature = device.temperature;
            if (temperature !== undefined) {
              snapshotData.temperature = temperature;
            }

            console.log('Recording history snapshot:', snapshotData);

            await HistoryService.recordSnapshot(currentUser.uid, id, snapshotData);

            console.log('History snapshot recorded successfully');
          }
        } catch (historyError) {
          console.error('Error recording history snapshot:', historyError);
          // Don't fail the update if history recording fails
        }
      }

      // Don't show toast here - let the calling component handle it
    } catch (error) {
      console.error('Error updating device:', error);
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

  // Calculate device status based on charge and health
  function calculateDeviceStatus(device: Device): 'healthy' | 'warning' | 'critical' | 'dead' {
    const charge = device.currentCharge;
    const health = device.health;

    // Dead: no charge or no health
    if (charge === 0 || health === 0) {
      return 'dead';
    }

    // Critical: very low charge or very low health
    if (charge < 20 || health < 40) {
      return 'critical';
    }

    // Warning: medium charge or medium health
    if (charge < 50 || health < 70) {
      return 'warning';
    }

    // Healthy: good charge and health
    return 'healthy';
  }

  const value = {
    devices,
    loading,
    addDevice,
    updateDevice,
    deleteDevice,
    checkBatteryHealth,
    getDaysUntilDanger,
    calculateDeviceStatus
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}