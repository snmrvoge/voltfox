# VoltFox E-Mail-Benachrichtigungen Setup

## Übersicht
VoltFox verwendet **Resend** für E-Mail-Benachrichtigungen. Resend bietet 3.000 kostenlose E-Mails pro Monat.

## Setup-Schritte

### 1. Resend Account erstellen
1. Gehe zu [resend.com](https://resend.com)
2. Erstelle einen kostenlosen Account
3. Verifiziere deine E-Mail-Adresse

### 2. Domain einrichten (Empfohlen für Production)
Für Production solltest du deine eigene Domain verwenden:

1. Gehe zu **Domains** in Resend Dashboard
2. Klicke auf **Add Domain**
3. Füge deine Domain hinzu (z.B. `voltfox.app`)
4. Folge den DNS-Anweisungen, um deine Domain zu verifizieren
5. Warte auf die Verifizierung (kann einige Minuten dauern)

**Für Entwicklung/Testing:**
- Du kannst auch die Resend Test-Domain verwenden: `onboarding@resend.dev`
- Diese funktioniert sofort, hat aber ein Resend-Branding

### 3. API Key erstellen
1. Gehe zu **API Keys** im Resend Dashboard
2. Klicke auf **Create API Key**
3. Gib einen Namen ein (z.B. "VoltFox Production")
4. Wähle **Sending access**
5. Klicke auf **Add**
6. **WICHTIG:** Kopiere den API Key sofort - er wird nur einmal angezeigt!

### 4. Firebase Secret setzen
Setze den Resend API Key als Firebase Secret:

```bash
cd functions
firebase functions:secrets:set RESEND_API_KEY
```

Wenn du nach dem Wert gefragt wirst, füge deinen Resend API Key ein.

### 5. Functions deployen
```bash
npm run deploy
```

Oder deploy nur die E-Mail-Funktion:
```bash
firebase deploy --only functions:sendDeviceStatusEmail
```

## E-Mail-Templates Anpassen

Die E-Mail-Templates befinden sich in `functions/index.js` in der `sendDeviceStatusEmail` Funktion.

### Absender-Adresse ändern
Passe die `from`-Adresse an (Zeile 246):

```javascript
from: 'VoltFox <notifications@deine-domain.com>',
```

**Wichtig:** Die Domain muss in Resend verifiziert sein!

### E-Mail-Design anpassen
Die HTML-Templates befinden sich in der `resend.emails.send()` Funktion.

## Testing

### Lokales Testing
```bash
cd functions
npm run serve
```

Dies startet die Firebase Emulators. E-Mails werden nicht wirklich versendet, aber du siehst die Logs.

### Production Testing
1. Erstelle ein Test-Gerät in VoltFox
2. Setze die Ladung auf unter 20% (Critical)
3. Prüfe deine E-Mails

## Troubleshooting

### "API Key not found"
- Stelle sicher, dass du `firebase functions:secrets:set RESEND_API_KEY` ausgeführt hast
- Deploy die Functions erneut

### "Domain not verified"
- Warte einige Minuten nach dem DNS-Setup
- Prüfe die DNS-Einträge mit `dig` oder einem Online-Tool
- Verwende temporär `onboarding@resend.dev` für Tests

### "No emails received"
- Prüfe den Spam-Ordner
- Prüfe die Firebase Functions Logs: `firebase functions:log`
- Stelle sicher, dass E-Mail-Benachrichtigungen in den User-Einstellungen aktiviert sind

## Kosten

Resend Free Tier:
- 3.000 E-Mails / Monat: **Kostenlos**
- Darüber hinaus: $0.001 / E-Mail ($1 per 1.000 E-Mails)

Bei 1.000 Nutzern und durchschnittlich 5 E-Mails/Monat pro Nutzer = 5.000 E-Mails
- Kosten: $2/Monat

## Weitere Informationen

- [Resend Documentation](https://resend.com/docs)
- [Firebase Functions Secrets](https://firebase.google.com/docs/functions/config-env#secret-manager)
- [Resend Node.js SDK](https://github.com/resend/resend-node)
