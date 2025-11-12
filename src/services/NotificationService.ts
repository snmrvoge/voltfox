// src/services/NotificationService.ts
export class NotificationService {
  private static hasPermission = false;

  // Request notification permission
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    }

    return false;
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
