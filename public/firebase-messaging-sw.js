// firebase-messaging-sw.js
// Service Worker for Firebase Cloud Messaging

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase configuration (must match your config)
// Note: This is safe to expose in a service worker
const firebaseConfig = {
  apiKey: "AIzaSyASKFkICjgic90MsskJtPz8OjxznbLpbwQ",
  authDomain: "voltfox-b1cef.firebaseapp.com",
  projectId: "voltfox-b1cef",
  storageBucket: "voltfox-b1cef.firebasestorage.app",
  messagingSenderId: "746607802051",
  appId: "1:746607802051:web:30bedee04d459690989476"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize notification here
  const notificationTitle = payload.notification?.title || 'VoltFox Benachrichtigung';
  const notificationOptions = {
    body: payload.notification?.body || 'Du hast eine neue Nachricht',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: payload.data?.deviceId || 'voltfox-notification',
    data: payload.data,
    requireInteraction: payload.data?.priority === 'high',
    actions: [
      {
        action: 'open',
        title: 'Öffnen'
      },
      {
        action: 'dismiss',
        title: 'Schließen'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/dashboard');
      }
    })
  );
});

// Service Worker lifecycle events
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activating.');
  event.waitUntil(clients.claim());
});
