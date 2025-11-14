# Wizard Rewrite Plan - Nächste Session

## Ziel
Kompletter Neuschrieb des DeviceWizard mit besserem UX-Flow und Struktur.

## Aktueller Stand (v1.0.4)
- Wizard funktioniert grundsätzlich
- Aber: Flow ist verwirrend, zu viele Infos auf einmal
- Voltage/Capacity sollte unter "Advanced"
- Health braucht Tooltip mit Erklärung

## Neuer Flow (v1.1.0)

### Schritt 1: Choose Method
- ✅ Bereits gut
- Community (Grün) - "Schnellste"
- Kamera/KI (Blau) - "Smart"
- Manuell (Orange) - "Flexibel"

### Schritt 2: Minimal Info
- ✅ Name + Icon + Typ
- Text ändern: "Im nächsten Schritt kannst du speichern oder Details hinzufügen"

### Schritt 3: Save or Continue
- ✅ Bereits gut
- Icon-Vorschau mit Name
- 2 Buttons: "Jetzt speichern" vs "Details hinzufügen"
- Option: "Speichern & weiteres Gerät"

### **NEUE STRUKTUR AB HIER:**

### Schritt 4: Current Status (NEU)
**Titel:** "📊 Aktueller Status"
**Text:** "Wie ist der Zustand deines Akkus?"

**Felder:**
- Aktueller Ladestand (%) - Default: 100
- Akku-Gesundheit (%) - Default: 100
  - Mit ℹ️ Button/Tooltip:
    ```
    Akku-Gesundheit

    Die Gesundheit zeigt die maximale Kapazität
    im Vergleich zum Neuzustand.

    100% = Wie neu
    80-99% = Gut
    60-79% = Mittel
    <60% = Ersatz empfohlen

    Bei neuem Akku: 100%
    Nach 1-2 Jahren: ~85-95%
    Nach 3-4 Jahren: ~70-85%
    ```

**Buttons:**
- Zurück
- Weiter (zu Multiple Batteries)
- Speichern (direkt fertig)

### Schritt 5: Multiple Batteries (NEU)
**Titel:** "🔋 Weitere Akkus?"
**Text:** "Hat dieses Gerät mehrere Akkus oder Komponenten?"

**Optionen (Cards zum Anklicken):**
1. ❌ Nein, nur ein Akku
2. ✅ Ja, mehrere baugleiche Akkus (+ Anzahl eingeben)
3. 🚁 Ja, Drohne + Fernsteuerung (separate Erfassung)
4. 📷 Ja, verschiedene Akkus (z.B. Kamera + Griff)

**Wenn Drohne + Controller:**
- Flow splitten:
  - Aktuelles Gerät als Drohne speichern
  - Fragen: "Fernsteuerung auch erfassen?" → Ja → Neuer Wizard für Controller

**Buttons:**
- Zurück
- Weiter (zu Advanced)
- Speichern (fertig)

### Schritt 6: Advanced Specs (NEU)
**Titel:** "⚙️ Technische Daten (Optional)"
**Text:** "Für Experten und präzise Überwachung"

**Toggle:** "Ich kenne die technischen Daten"

**Wenn aktiviert:**
- Voltage (V) - Placeholder: "11.1"
- Capacity (mAh) - Placeholder: "3830"
- Chemie - Dropdown: LiPo, Li-Ion, NiMH, Lead-Acid

**Info-Box:**
```
💡 Diese Daten findest du oft auf dem Akku selbst
oder im Handbuch des Geräts.
```

**Buttons:**
- Zurück
- Weiter (zu Insurance)
- Speichern (fertig)

### Schritt 7: Insurance & Purchase (NEU)
**Titel:** "🛡️ Versicherung & Garantie (Optional)"
**Text:** "Schütze dein Gerät"

**Vorteile-Box (prominent):**
```
✅ Versicherungsschutz aktivieren
✅ Automatische Wertermittlung
✅ Garantie-Ablauf-Benachrichtigung
✅ Wiederbeschaffungswert-Tracking
```

**Toggle:** "Kaufdaten erfassen"

**Wenn aktiviert:**
- Kaufpreis (CHF/EUR) - für Versicherung
- Kaufdatum - für Garantie
- Garantie bis - Datum-Picker

**Info-Box:**
```
💡 Diese Daten helfen dir bei:
- Versicherungsansprüchen
- Garantie-Checks
- Wiederverkaufswert
```

**Buttons:**
- Zurück
- Speichern & Fertig 🎉

---

## KI/Photo Capture Enhancement

### Nach AI-Analyse:
**Dialog:** "Als Übersichtsbild verwenden?"

```
+------------------------+
|                        |
|    [Foto-Preview]      |
|                        |
+------------------------+

Möchtest du dieses Foto als
Übersichtsbild verwenden?

[Ja, verwenden]  [Nein, danke]
```

Wenn Ja → `imageUrl` setzen
Wenn Nein → Kein Preview-Bild, nur Daten übernehmen

---

## Technische Änderungen

### State Management
```typescript
// Current Status
const [currentCharge, setCurrentCharge] = useState('100');
const [health, setHealth] = useState('100');
const [showHealthInfo, setShowHealthInfo] = useState(false);

// Multiple Batteries
const [batteryOption, setBatteryOption] = useState<'single' | 'multiple' | 'drone-controller' | 'mixed'>('single');
const [batteryCount, setBatteryCount] = useState(1);

// Advanced Specs
const [wantsAdvanced, setWantsAdvanced] = useState(false);
const [voltage, setVoltage] = useState('');
const [capacity, setCapacity] = useState('');
const [chemistry, setChemistry] = useState('LiPo');

// Insurance
const [wantsInsurance, setWantsInsurance] = useState(false);
const [purchasePrice, setPurchasePrice] = useState('');
const [purchaseDate, setPurchaseDate] = useState('');
const [warrantyUntil, setWarrantyUntil] = useState('');
```

### Progress Steps
```typescript
const getStepNumber = () => {
  const steps = {
    'choose-method': 1,
    'minimal-info': 2,
    'save-or-continue': 3,
    'current-status': 4,
    'multiple-batteries': 5,
    'advanced-specs': 6,
    'insurance': 7
  };
  return steps[currentStep] || 1;
};
```

### Progress Indicator
- Zeige max 3-4 Schritte sichtbar
- Bei längeren Flows: "Schritt 4 von 7"

---

## Design-Anforderungen

### Health Tooltip
- Info-Icon (ℹ️) neben "Akku-Gesundheit"
- Onclick → Popup/Tooltip mit Erklärung
- Klick außerhalb → schließt sich

### Cards für Multiple Batteries
- Große klickbare Cards (wie bei Method Selection)
- Selected State mit Border & Background
- Icons für jede Option

### Info-Boxes
- Gelber Hintergrund (#FFF8F3)
- Border: #FFD23F
- Icon: 💡
- Auffällig aber nicht störend

### Buttons
- Gradient für Primary Actions
- Grau für Back
- Ghost für "Speichern & weiteres Gerät"

---

## Deployment Plan

### Version: 1.1.0
**Commit Message:**
```
Complete wizard rewrite - better UX (v1.1.0)

New flow:
1. Choose method
2. Name + Icon (minimal)
3. Save or continue decision
4. Current status (charge & health with tooltip)
5. Multiple batteries (drone + controller)
6. Advanced specs (voltage/capacity/chemistry)
7. Insurance & warranty (with benefits)

Improvements:
- Health tooltip with explanation
- Better step progression
- Advanced moved to separate step
- Insurance with clear benefits
- Photo-as-preview question for AI
- Cleaner state management
- Better mobile UX
```

---

## Testing Checklist

- [ ] Minimal Flow (nur Name → Speichern)
- [ ] Full Flow (alle Schritte)
- [ ] Drohne + Controller Flow
- [ ] KI mit Photo → Als Preview?
- [ ] Community → Direct save
- [ ] Desktop UX
- [ ] Mobile UX
- [ ] Health Tooltip functionality
- [ ] All animations working
- [ ] Sound effects working
- [ ] Progress indicator correct

---

## Notes

- Backup erstellt: `DeviceWizard.tsx.backup`
- Aktueller Stand: v1.0.4
- Nächster Stand: v1.1.0
- Geschätzter Aufwand: ~1-2 Stunden
- Token-Budget beachten: Eventuell in 2 Sessions aufteilen

---

## Priority Order

1. **MUST HAVE:**
   - Current Status Step (Ladestand & Gesundheit)
   - Health Tooltip
   - Advanced Step (Voltage aus Main-Flow raus)

2. **SHOULD HAVE:**
   - Multiple Batteries Step
   - Insurance Step mit Benefits
   - Photo-as-Preview Question

3. **NICE TO HAVE:**
   - Drohne + Controller Split-Flow
   - Erweiterte Tooltips
   - Mehr Animationen
