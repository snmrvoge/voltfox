# VoltFox PWA Setup

VoltFox ist jetzt als Progressive Web App (PWA) konfiguriert! 🦊📱

## Was wurde implementiert?

### 1. PWA Manifest (`public/manifest.json`)
- ✅ VoltFox Branding (Name, Icons, Farben)
- ✅ Standalone Display Mode
- ✅ App Shortcuts (Dashboard, Gerät hinzufügen)
- ✅ Installierbar auf iOS & Android

### 2. Firebase Cloud Messaging
- ✅ Service Worker für Push-Benachrichtigungen
- ✅ Foreground & Background Message Handling
- ✅ FCM Token Management

### 3. PWA Install Prompt
- ✅ Automatischer Install-Banner
- ✅ iOS-spezifische Installationsanleitung
- ✅ Smart Timing (nach 5 Sekunden, nicht bei jedem Besuch)

## Nächste Schritte für vollständige Funktionalität

### 1. Firebase Cloud Messaging konfigurieren

#### a) VAPID Key generieren
```bash
cd ~/Downloads/voltfox
firebase login
firebase projects:list  # Finde deine Project ID
```

In der Firebase Console:
1. Gehe zu **Project Settings** → **Cloud Messaging**
2. Unter **Web Push certificates** → Klicke **Generate key pair**
3. Kopiere den VAPID Key

#### b) Environment Variable setzen
Füge in `.env` hinzu:
```bash
REACT_APP_FIREBASE_VAPID_KEY=dein_vapid_key_hier
```

#### c) Service Worker Config aktualisieren
Öffne `public/firebase-messaging-sw.js` und ersetze die Platzhalter:
```javascript
const firebaseConfig = {
  apiKey: "DEIN_API_KEY",
  authDomain: "voltfox-xxx.firebaseapp.com",
  projectId: "voltfox-xxx",
  storageBucket: "voltfox-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 2. PWA lokal testen

#### a) Build erstellen
```bash
npm run build
```

#### b) Lokalen Server starten
```bash
npx serve -s build
```

#### c) Über HTTPS testen
PWAs benötigen HTTPS! Optionen:
- **ngrok**: `ngrok http 3000`
- **Firebase Hosting**: `firebase deploy`
- **Localhost**: Chrome erlaubt PWA-Features auf localhost

### 3. PWA auf dem Handy testen

#### Android:
1. Öffne die App im Chrome Browser
2. Nach ~5 Sekunden erscheint der Install-Banner
3. Klicke **"Jetzt installieren"**
4. App erscheint auf dem Homescreen

#### iOS (Safari):
1. Öffne die App in Safari
2. Tippe auf das **Teilen-Symbol** (□↑)
3. Wähle **"Zum Home-Bildschirm"**
4. Tippe **"Hinzufügen"**

### 4. Push-Benachrichtigungen testen

#### Im Browser:
```javascript
// In der Browser Console:
await Notification.requestPermission();
NotificationService.getFCMToken();  // Gibt den Token aus
```

#### Push-Nachricht senden (Test):
```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "FCM_TOKEN_HIER",
    "notification": {
      "title": "VoltFox Test",
      "body": "Deine Batterie ist fast leer!",
      "icon": "/logo192.png"
    }
  }'
```

Server Key findest du in: Firebase Console → Project Settings → Cloud Messaging → Server key

## Features der PWA

### ✅ Offline-Fähigkeit
- Service Worker cached wichtige Assets
- App funktioniert auch ohne Internet

### ✅ Installierbar
- Wie eine native App
- Eigenes Icon auf dem Homescreen
- Fullscreen-Modus ohne Browser-UI

### ✅ Push-Benachrichtigungen
- **Android**: Volle Unterstützung, auch wenn App geschlossen
- **iOS 16.4+**: Nur wenn App installiert wurde

### ✅ App-Shortcuts
- **Dashboard**: Direkt zum Dashboard springen
- **Gerät hinzufügen**: Schnell neues Gerät hinzufügen

## Bekannte Einschränkungen

### iOS:
- ⚠️ Push-Notifications nur wenn als PWA installiert
- ⚠️ Kein automatischer Install-Banner (manuell über Teilen-Menü)
- ⚠️ Service Worker wird nach 2 Wochen Inaktivität deaktiviert

### Beide Plattformen:
- ⚠️ Kein Zugriff auf native APIs wie Bluetooth, NFC
- ⚠️ Eingeschränkter Zugriff auf Dateisystem
- ⚠️ Keine App Store Distribution (nur Web-Install)

## Alternative: Capacitor für native Apps

Wenn du später native Features brauchst oder im App Store sein willst:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
npx cap sync
```

Capacitor wickelt die React-App in eine native Shell - 100% Code-Wiederverwendung!

## Hilfreiche Befehle

```bash
# PWA lokal testen
npm run build && npx serve -s build

# Firebase Deploy
firebase deploy

# Service Worker debugging
chrome://serviceworker-internals

# PWA Manifest validieren
npm install -g pwa-asset-generator
pwa-asset-generator logo.svg ./public/icons
```

## Debugging

### Chrome DevTools:
1. **Application Tab** → **Manifest**: PWA Konfiguration prüfen
2. **Application Tab** → **Service Workers**: Worker Status
3. **Console**: FCM Token und Errors

### iOS Safari:
1. **Einstellungen** → **Safari** → **Erweitert** → **Web Inspector**
2. Mac Safari → **Entwickler** → Dein iPhone

## Support

Bei Fragen oder Problemen:
- GitHub Issues: https://github.com/snmrvoge/voltfox/issues
- Email: support@voltfox.app

---

**Created with ❤️ by Mr. Vision**
