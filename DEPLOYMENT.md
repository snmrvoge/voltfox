# VoltFox Deployment Guide 🚀

## 📋 Übersicht

VoltFox nutzt **Firebase Cloud Functions** für sichere OpenAI API Calls. Der API Key liegt sicher auf dem Server und wird nie im Frontend-Code exposed.

## 🛠️ Setup & Deployment

### 1. Firebase CLI installieren (falls noch nicht vorhanden)

```bash
npm install -g firebase-tools
```

### 2. Firebase Login

```bash
firebase login
```

### 3. Firebase Projekt verknüpfen

```bash
firebase use voltfox-b1cef
```

### 4. OpenAI API Secret setzen

**Wichtig:** Der API Key wird als Secret gespeichert, nicht in Code!

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

Wenn aufgefordert, gebe deinen OpenAI API Key ein.

### 5. Functions Dependencies installieren

```bash
cd functions
npm install
cd ..
```

### 6. Frontend Build erstellen

```bash
npm run build
```

### 7. Deployment

**Option A: Alles deployen (Functions + Hosting)**
```bash
firebase deploy
```

**Option B: Nur Functions deployen**
```bash
firebase deploy --only functions
```

**Option C: Nur Hosting deployen**
```bash
firebase deploy --only hosting
```

## 🔒 Sicherheit

### ✅ Was ist sicher:
- OpenAI API Key liegt als **Secret** auf Firebase Servern
- API Calls erfolgen über **Cloud Functions** (Backend)
- User Authentication wird geprüft
- Kein API Key im Frontend-Code

### ⚠️ .env.local (nur für lokale Entwicklung):
Die `.env.local` Datei wird **NICHT** zu GitHub gepusht (ist in `.gitignore`).

Für **lokale Entwicklung ohne Cloud Functions**:
- Setze in `src/utils/aiService.ts` Zeile 24: `const useCloudFunction = false;`
- API Key in `.env.local` ist nur für lokales Testen

Für **Production**:
- Setze in `src/utils/aiService.ts` Zeile 24: `const useCloudFunction = true;`
- API Key liegt sicher in Firebase Secrets

## 🌐 Nach dem Deployment

Deine App ist verfügbar unter:
- **Hosting URL**: https://voltfox-b1cef.web.app
- **Custom Domain** (optional): https://voltfox.com (wenn konfiguriert)

## 📊 Logs & Monitoring

**Functions Logs ansehen:**
```bash
firebase functions:log
```

**Realtime Logs:**
```bash
firebase functions:log --follow
```

**Firebase Console:**
https://console.firebase.google.com/project/voltfox-b1cef

## 🔧 Troubleshooting

### Error: "functions/unauthenticated"
→ User ist nicht angemeldet. Firebase Auth Check fehlgeschlagen.

### Error: "functions/resource-exhausted"
→ OpenAI API Quota überschritten. Billing bei OpenAI prüfen.

### Functions deployen nicht?
```bash
# Prüfe Firebase Projekt
firebase projects:list

# Nutze richtiges Projekt
firebase use voltfox-b1cef

# Deploy mit --debug für mehr Info
firebase deploy --only functions --debug
```

### Secret nicht gefunden?
```bash
# Liste alle Secrets
firebase functions:secrets:access OPENAI_API_KEY

# Secret neu setzen
firebase functions:secrets:set OPENAI_API_KEY
```

## 💰 Kosten

### Firebase:
- **Spark Plan (Free)**: 125K invocations/month
- **Blaze Plan (Pay-as-you-go)**: $0.40 per million invocations

### OpenAI:
- **GPT-4o Vision**: ~$0.005 pro Bild-Analyse
- **100 Analysen** ≈ $0.50
- **1000 Analysen** ≈ $5.00

**Tipp:** Setze Limits bei OpenAI: https://platform.openai.com/account/limits

## 📝 Updates deployen

1. Code ändern
2. Zu GitHub pushen:
   ```bash
   git add .
   git commit -m "Update XYZ"
   git push
   ```
3. Deployment:
   ```bash
   npm run build
   firebase deploy
   ```

## 🎯 Quick Commands

```bash
# Build + Deploy alles
npm run build && firebase deploy

# Nur Functions deployen
firebase deploy --only functions

# Nur Hosting deployen
npm run build && firebase deploy --only hosting

# Logs ansehen
firebase functions:log --follow
```

---

**Support & Docs:**
- Firebase Docs: https://firebase.google.com/docs/functions
- OpenAI Docs: https://platform.openai.com/docs
- GitHub Repo: https://github.com/snmrvoge/voltfox
