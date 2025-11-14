// src/components/DeviceWizard.tsx - v1.1.1
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Camera, Edit3, ArrowRight, ArrowLeft, Check, Plus, Sparkles, Battery, Save, Info, DollarSign, Zap, Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDevices } from '../context/DeviceContext';
import { useAuth } from '../context/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import toast from 'react-hot-toast';

interface DeviceWizardProps {
  onCommunitySearch: () => void;
  onCameraCapture: () => void;
  onComplete?: () => void;
  capturedImageUrl?: string;
  aiAnalysisData?: any;
}

type WizardStep = 'choose-method' | 'minimal-info' | 'save-or-continue' | 'details' | 'multiple-batteries';

const successSound = () => {
  const audio = new Audio('data:audio/wav;base64,UklGRhIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQA=');
  audio.volume = 0.3;
  audio.play().catch(() => {});
};

const clickSound = () => {
  const audio = new Audio('data:audio/wav;base64,UklGRhIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQA=');
  audio.volume = 0.15;
  audio.play().catch(() => {});
};

export const DeviceWizard: React.FC<DeviceWizardProps> = ({
  onCommunitySearch,
  onCameraCapture,
  onComplete
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addDevice } = useDevices();
  const { currentUser } = useAuth();

  const [currentStep, setCurrentStep] = useState<WizardStep>('choose-method');
  const [isAnimating, setIsAnimating] = useState(false);

  // Device data
  const [deviceName, setDeviceName] = useState('');
  const [deviceIcon, setDeviceIcon] = useState('🔋');
  const [deviceType, setDeviceType] = useState('other');
  const [deviceImageUrl, setDeviceImageUrl] = useState('');

  // Current status
  const [currentCharge, setCurrentCharge] = useState('100');
  const [health, setHealth] = useState('100');
  const [showHealthInfo, setShowHealthInfo] = useState(false);

  // Advanced (optional)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [voltage, setVoltage] = useState('');
  const [capacity, setCapacity] = useState('');
  const [chemistry, setChemistry] = useState('LiPo');

  // Multiple batteries
  const [batteryOption, setBatteryOption] = useState<'single' | 'multiple' | 'drone-controller' | 'mixed'>('single');
  const [batteryCount, setBatteryCount] = useState(1);

  // Photo upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Insurance (optional)
  const [showInsurance, setShowInsurance] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyUntil, setWarrantyUntil] = useState('');

  const deviceIcons = ['🔋', '⚡', '🔌', '📱', '💻', '🎧', '📷', '🎮', '⌚', '🚁', '🚲', '🏎️', '🚗', '🔊', '🎵', '💡', '🔦', '⏰'];
  const deviceTypes = ['drone', 'camera', 'laptop', 'phone', 'tablet', 'smartwatch', 'headphones', 'speaker', 'e-bike', 'rc-car', 'other'];

  const animateStep = (callback: () => void) => {
    setIsAnimating(true);
    clickSound();
    setTimeout(() => {
      callback();
      setIsAnimating(false);
    }, 300);
  };

  const handleMethodSelect = (method: 'community' | 'camera' | 'manual') => {
    animateStep(() => {
      switch (method) {
        case 'community':
          onCommunitySearch();
          break;
        case 'camera':
          onCameraCapture();
          break;
        case 'manual':
          setCurrentStep('minimal-info');
          break;
      }
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) {
      if (!currentUser) toast.error('Bitte erst anmelden');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bild darf maximal 5MB groß sein');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Bitte nur Bilddateien hochladen');
      return;
    }

    setUploadingPhoto(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Firebase
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storagePath = `device-images/${currentUser.uid}/new/${fileName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setDeviceImageUrl(url);
      setDeviceIcon(''); // Clear icon wenn Foto hochgeladen wurde
      toast.success('📸 Foto hochgeladen!');
    } catch (error: any) {
      console.error('Photo upload error:', error);
      toast.error('Fehler beim Hochladen');
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleMinimalSave = async () => {
    if (!deviceName.trim()) {
      toast.error('Bitte gib einen Namen ein');
      return;
    }
    animateStep(() => {
      setCurrentStep('save-or-continue');
      successSound();
    });
  };

  const handleFinalSave = async (addMore: boolean = false) => {
    if (!currentUser) return;

    try {
      const deviceData: any = {
        name: deviceName,
        icon: deviceImageUrl ? '' : deviceIcon,
        imageUrl: deviceImageUrl || '',
        type: deviceType,
        brand: '',
        model: '',
        health: parseFloat(health) || 100,
        status: 'healthy',
        currentCharge: parseFloat(currentCharge) || 100,
        chemistry: chemistry,
        dischargeRate: 1.0,
        lastCharged: new Date().toISOString(),
        reminderFrequency: 30
      };

      if (showAdvanced && voltage && capacity) {
        deviceData.voltage = parseFloat(voltage);
        deviceData.capacity = parseFloat(capacity);
      }

      if (showInsurance) {
        if (purchasePrice) deviceData.purchasePrice = parseFloat(purchasePrice);
        if (purchaseDate) deviceData.purchaseDate = purchaseDate;
        if (warrantyUntil) deviceData.warrantyUntil = warrantyUntil;
      }

      await addDevice(deviceData);
      successSound();
      toast.success('🎉 Gerät erfolgreich hinzugefügt!');

      setTimeout(() => {
        if (addMore) {
          resetWizard();
        } else {
          navigate('/devices');
        }
      }, 1000);
    } catch (error) {
      console.error('Error adding device:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  const resetWizard = () => {
    setCurrentStep('choose-method');
    setDeviceName('');
    setDeviceIcon('🔋');
    setDeviceType('other');
    setCurrentCharge('100');
    setHealth('100');
    setShowAdvanced(false);
    setShowInsurance(false);
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '2rem 1rem',
      opacity: isAnimating ? 0.7 : 1,
      transition: 'opacity 0.3s',
      animation: 'fadeIn 0.5s'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .wizard-card {
          animation: slideIn 0.5s ease-out;
        }
        .icon-selector {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .icon-option {
          font-size: 2rem;
          padding: 0.5rem;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        .icon-option:hover {
          transform: scale(1.1);
          background: #FFF8F3;
        }
        .icon-option.selected {
          border-color: #FF6B35;
          background: #FFF8F3;
          animation: bounce 0.5s;
        }
      `}</style>

      {/* Step 1: Choose Method */}
      {currentStep === 'choose-method' && (
        <div className="wizard-card">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{
              color: '#2E3A4B',
              marginBottom: '0.5rem',
              fontSize: '2rem',
              animation: 'slideIn 0.5s'
            }}>
              🦊 Wie möchtest du dein Gerät erfassen?
            </h2>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>
              Wähle die schnellste Methode für dich
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Community */}
            <button onClick={() => handleMethodSelect('community')} style={{
              padding: '2rem', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: 'none', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.3s',
              textAlign: 'center', position: 'relative', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)', color: 'white'
            }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.4)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)'; }}>
              <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255, 255, 255, 0.3)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>⚡ Schnellste</div>
              <Search size={56} style={{ margin: '0 auto 1rem', animation: 'bounce 2s infinite' }} />
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>Community durchsuchen</h3>
              <p style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: '1rem' }}>Gerät aus Datenbank wählen - fertig!</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>Nur 1 Klick <ArrowRight size={22} /></div>
            </button>

            {/* Camera */}
            <button onClick={() => handleMethodSelect('camera')} style={{
              padding: '2rem', background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              border: 'none', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.3s',
              textAlign: 'center', position: 'relative', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)', color: 'white'
            }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.4)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)'; }}>
              <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255, 255, 255, 0.3)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>🤖 Smart</div>
              <Camera size={56} style={{ margin: '0 auto 1rem', animation: 'bounce 2s infinite 0.5s' }} />
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>Mit KI-Foto</h3>
              <p style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: '1rem' }}>Foto machen - KI erkennt alles automatisch</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>~30 Sekunden <Sparkles size={22} /></div>
            </button>

            {/* Manual */}
            <button onClick={() => handleMethodSelect('manual')} style={{
              padding: '2rem', background: 'linear-gradient(135deg, #FF6B35 0%, #F97316 100%)',
              border: 'none', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.3s',
              textAlign: 'center', position: 'relative', boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)', color: 'white'
            }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 107, 53, 0.4)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.3)'; }}>
              <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255, 255, 255, 0.3)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>✨ Flexibel</div>
              <Edit3 size={56} style={{ margin: '0 auto 1rem', animation: 'bounce 2s infinite 1s' }} />
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>Manuell eingeben</h3>
              <p style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: '1rem' }}>Start schnell - Details später hinzufügen</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>Volle Kontrolle <Edit3 size={22} /></div>
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem', padding: '1.5rem', background: '#FFF8F3', borderRadius: '15px', border: '2px solid #FFD23F', animation: 'slideIn 1s' }}>
            <p style={{ color: '#666', margin: 0, fontSize: '1.05rem' }}>💡 <strong>Tipp:</strong> Du kannst später jederzeit weitere Details hinzufügen!</p>
          </div>
        </div>
      )}

      {/* Step 2: Minimal Info */}
      {currentStep === 'minimal-info' && (
        <div className="wizard-card" style={{ background: 'white', padding: '3rem 2rem', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#2E3A4B', marginBottom: '0.5rem', fontSize: '1.8rem' }}>⚡ Super! Wie heißt dein Gerät?</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>Gib einen einfachen Namen ein - das reicht schon!</p>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2E3A4B', fontWeight: 'bold', fontSize: '1.1rem' }}>📝 Gerätename *</label>
            <input type="text" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder="z.B. DJI Mavic 3, iPhone 14, E-Bike..." autoFocus
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', border: '2px solid #E5E7EB', borderRadius: '12px', outline: 'none', transition: 'all 0.3s', boxSizing: 'border-box' }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#FF6B35'} onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'} />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2E3A4B', fontWeight: 'bold', fontSize: '1.1rem' }}>😊 Wähle ein Icon (optional)</label>
            <div className="icon-selector">
              {deviceIcons.map((icon) => (
                <div key={icon} className={`icon-option ${deviceIcon === icon ? 'selected' : ''}`} onClick={() => { setDeviceIcon(icon); clickSound(); }}>{icon}</div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2E3A4B', fontWeight: 'bold', fontSize: '1.1rem' }}>🏷️ Geräte-Typ (optional)</label>
            <select value={deviceType} onChange={(e) => setDeviceType(e.target.value)}
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', border: '2px solid #E5E7EB', borderRadius: '12px', outline: 'none', background: 'white', cursor: 'pointer', boxSizing: 'border-box' }}>
              <option value="other">Andere</option>
              <option value="drone">Drohne</option>
              <option value="camera">Kamera</option>
              <option value="laptop">Laptop</option>
              <option value="phone">Smartphone</option>
              <option value="tablet">Tablet</option>
              <option value="smartwatch">Smartwatch</option>
              <option value="headphones">Kopfhörer</option>
              <option value="speaker">Lautsprecher</option>
              <option value="e-bike">E-Bike</option>
              <option value="rc-car">RC-Auto</option>
            </select>
          </div>

          {/* Photo Upload (Optional) */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#F0F9FF', borderRadius: '12px', border: '2px dashed #3B82F6' }}>
            <label style={{ display: 'block', marginBottom: '1rem', color: '#2E3A4B', fontWeight: 'bold', fontSize: '1.1rem' }}>📸 Foto hochladen (optional)</label>

            {photoPreview || deviceImageUrl ? (
              <div style={{ position: 'relative', textAlign: 'center' }}>
                <img src={photoPreview || deviceImageUrl} alt="Preview"
                  style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '12px', objectFit: 'cover', marginBottom: '1rem' }} />
                <button type="button" onClick={() => { setPhotoPreview(null); setDeviceImageUrl(''); }}
                  style={{ position: 'absolute', top: '10px', right: 'calc(50% - 110px)', background: '#EF4444', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                  <X size={20} />
                </button>
              </div>
            ) : (
              <label style={{ display: 'block', padding: '2rem', background: 'white', border: '2px dashed #3B82F6', borderRadius: '12px', textAlign: 'center', cursor: uploadingPhoto ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}>
                <Upload size={32} style={{ margin: '0 auto 0.5rem', color: '#3B82F6' }} />
                <p style={{ color: '#3B82F6', margin: 0, fontWeight: 600 }}>
                  {uploadingPhoto ? 'Wird hochgeladen...' : 'Klicke zum Hochladen'}
                </p>
                <p style={{ color: '#666', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>Max. 5MB</p>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto}
                  style={{ display: 'none' }} />
              </label>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button onClick={() => animateStep(() => setCurrentStep('choose-method'))}
              style={{ flex: 1, padding: '1rem', background: '#E5E7EB', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.3s' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#D1D5DB'} onMouseOut={(e) => e.currentTarget.style.background = '#E5E7EB'}>
              <ArrowLeft size={20} /> Zurück
            </button>
            <button onClick={handleMinimalSave} disabled={!deviceName.trim()}
              style={{ flex: 2, padding: '1rem', background: deviceName.trim() ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#D1D5DB', color: 'white', border: 'none', borderRadius: '12px', cursor: deviceName.trim() ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.3s', boxShadow: deviceName.trim() ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none' }}
              onMouseOver={(e) => { if (deviceName.trim()) { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'; } }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = deviceName.trim() ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none'; }}>
              Weiter <ArrowRight size={20} />
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1rem', background: '#FFF8F3', borderRadius: '10px' }}>
            <p style={{ color: '#666', margin: 0 }}>💡 Im nächsten Schritt kannst du direkt speichern oder Details hinzufügen.</p>
          </div>
        </div>
      )}

      {/* Step 3: Save or Continue */}
      {currentStep === 'save-or-continue' && (
        <div className="wizard-card" style={{ background: 'white', padding: '3rem 2rem', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          {deviceImageUrl ? (
            <img src={deviceImageUrl} alt={deviceName}
              style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '20px', objectFit: 'cover', margin: '0 auto 1rem', display: 'block', animation: 'bounce 1s' }} />
          ) : (
            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'bounce 1s' }}>{deviceIcon}</div>
          )}
          <h2 style={{ color: '#2E3A4B', marginBottom: '0.5rem', fontSize: '2rem' }}>🎉 Perfekt!</h2>
          <h3 style={{ color: '#666', marginBottom: '2rem', fontWeight: 'normal', fontSize: '1.3rem' }}>"{deviceName}" ist bereit zum Speichern</h3>

          <div style={{ background: '#F0FDF4', padding: '1.5rem', borderRadius: '15px', border: '2px solid #10B981', marginBottom: '2rem' }}>
            <p style={{ color: '#059669', margin: 0, fontSize: '1.1rem' }}>✓ Gerät ist einsatzbereit<br/>✓ Batterie-Überwachung aktiv<br/>✓ Benachrichtigungen aktiviert</p>
          </div>

          <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.1rem' }}>Möchtest du noch Details hinzufügen?</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <button onClick={() => handleFinalSave(false)}
              style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)'; }}>
              <Save size={24} style={{ display: 'block', margin: '0 auto 0.5rem' }} /> Jetzt speichern
            </button>

            <button onClick={() => animateStep(() => setCurrentStep('multiple-batteries'))}
              style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)'; }}>
              <Battery size={24} style={{ display: 'block', margin: '0 auto 0.5rem' }} /> Details hinzufügen
            </button>
          </div>

          <button onClick={() => handleFinalSave(true)}
            style={{ width: '100%', padding: '1rem', background: 'transparent', color: '#FF6B35', border: '2px solid #FF6B35', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.3s' }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#FF6B35'; e.currentTarget.style.color = 'white'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FF6B35'; }}>
            <Plus size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Speichern & weiteres Gerät hinzufügen
          </button>
        </div>
      )}

      {/* Step 4: Multiple Batteries */}
      {currentStep === 'multiple-batteries' && (
        <div className="wizard-card" style={{ background: 'white', padding: '3rem 2rem', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#2E3A4B', marginBottom: '0.5rem', fontSize: '1.8rem' }}>🔋 Weitere Akkus?</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>Hat dieses Gerät mehrere Akkus oder Komponenten?</p>

          <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
            {/* Single Battery */}
            <div onClick={() => { clickSound(); setBatteryOption('single'); }}
              style={{
                padding: '1.5rem',
                background: batteryOption === 'single' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#F8FAFC',
                color: batteryOption === 'single' ? 'white' : '#2E3A4B',
                border: batteryOption === 'single' ? '3px solid #10B981' : '2px solid #E5E7EB',
                borderRadius: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: batteryOption === 'single' ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none'
              }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❌</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.3rem' }}>Nein, nur ein Akku</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Standard-Setup mit einem einzelnen Akku</div>
            </div>

            {/* Multiple Same Batteries */}
            <div onClick={() => { clickSound(); setBatteryOption('multiple'); }}
              style={{
                padding: '1.5rem',
                background: batteryOption === 'multiple' ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' : '#F8FAFC',
                color: batteryOption === 'multiple' ? 'white' : '#2E3A4B',
                border: batteryOption === 'multiple' ? '3px solid #3B82F6' : '2px solid #E5E7EB',
                borderRadius: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: batteryOption === 'multiple' ? '0 4px 15px rgba(59, 130, 246, 0.3)' : 'none'
              }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.3rem' }}>Ja, mehrere baugleiche Akkus</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Gleiche Akkus werden gemeinsam verwaltet</div>
              {batteryOption === 'multiple' && (
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Anzahl Akkus</label>
                  <input type="number" min="2" max="10" value={batteryCount} onChange={(e) => setBatteryCount(parseInt(e.target.value) || 2)}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '2px solid white', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.9)', color: '#2E3A4B' }} />
                </div>
              )}
            </div>

            {/* Drone + Controller */}
            <div onClick={() => { clickSound(); setBatteryOption('drone-controller'); }}
              style={{
                padding: '1.5rem',
                background: batteryOption === 'drone-controller' ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' : '#F8FAFC',
                color: batteryOption === 'drone-controller' ? 'white' : '#2E3A4B',
                border: batteryOption === 'drone-controller' ? '3px solid #8B5CF6' : '2px solid #E5E7EB',
                borderRadius: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: batteryOption === 'drone-controller' ? '0 4px 15px rgba(139, 92, 246, 0.3)' : 'none'
              }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚁</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.3rem' }}>Ja, Drohne + Fernsteuerung</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Separate Erfassung von Drohne und Controller</div>
            </div>

            {/* Mixed Batteries */}
            <div onClick={() => { clickSound(); setBatteryOption('mixed'); }}
              style={{
                padding: '1.5rem',
                background: batteryOption === 'mixed' ? 'linear-gradient(135deg, #FF6B35 0%, #F97316 100%)' : '#F8FAFC',
                color: batteryOption === 'mixed' ? 'white' : '#2E3A4B',
                border: batteryOption === 'mixed' ? '3px solid #FF6B35' : '2px solid #E5E7EB',
                borderRadius: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: batteryOption === 'mixed' ? '0 4px 15px rgba(255, 107, 53, 0.3)' : 'none'
              }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.3rem' }}>Ja, verschiedene Akkus</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>z.B. Kamera + Batteriegriff (separate Erfassung)</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => animateStep(() => setCurrentStep('save-or-continue'))}
              style={{ flex: '1', padding: '1rem', background: '#E5E7EB', color: '#2E3A4B', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.3s' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#D1D5DB'}
              onMouseOut={(e) => e.currentTarget.style.background = '#E5E7EB'}>
              <ArrowLeft size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Zurück
            </button>

            <button onClick={() => animateStep(() => setCurrentStep('details'))}
              style={{ flex: '2', padding: '1rem', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)'; }}>
              Weiter <ArrowRight size={20} style={{ verticalAlign: 'middle', marginLeft: '0.5rem' }} />
            </button>
          </div>

          <button onClick={() => handleFinalSave(false)}
            style={{ width: '100%', padding: '1rem', marginTop: '1rem', background: 'transparent', color: '#10B981', border: '2px solid #10B981', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.3s' }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#10B981'; e.currentTarget.style.color = 'white'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#10B981'; }}>
            <Save size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Jetzt speichern
          </button>
        </div>
      )}

      {/* Step 5: Details (Current Status + Advanced + Insurance) */}
      {currentStep === 'details' && (
        <div className="wizard-card" style={{ background: 'white', padding: '3rem 2rem', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#2E3A4B', marginBottom: '0.5rem', fontSize: '1.8rem' }}>📊 Akku-Details</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>Ergänze Details für bessere Überwachung (alles optional)</p>

          {/* Current Status */}
          <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#2E3A4B', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Battery size={20} /> Aktueller Status
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2E3A4B', fontWeight: 'bold' }}>Ladestand (%)</label>
                <input type="number" min="0" max="100" value={currentCharge} onChange={(e) => setCurrentCharge(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '2px solid #E5E7EB', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ marginBottom: '0.5rem', color: '#2E3A4B', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Gesundheit (%)
                  <div style={{ position: 'relative' }}>
                    <Info size={16} style={{ cursor: 'pointer', color: '#3B82F6' }}
                      onClick={() => setShowHealthInfo(!showHealthInfo)}
                      onMouseEnter={() => setShowHealthInfo(true)}
                      onMouseLeave={() => setShowHealthInfo(false)} />
                    {showHealthInfo && (
                      <div style={{
                        position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                        background: 'white', padding: '1rem', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                        width: '280px', marginBottom: '10px', zIndex: 1000, border: '2px solid #3B82F6'
                      }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#2E3A4B', fontSize: '0.9rem' }}>💚 Akku-Gesundheit</h4>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#666' }}>
                          Die Gesundheit zeigt die maximale Kapazität im Vergleich zum Neuzustand.
                        </p>
                        <div style={{ fontSize: '0.8rem', lineHeight: '1.6', color: '#666' }}>
                          <div>100% = Wie neu</div>
                          <div>80-99% = Gut</div>
                          <div>60-79% = Mittel</div>
                          <div>&lt;60% = Ersatz empfohlen</div>
                        </div>
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #E5E7EB', fontSize: '0.75rem', color: '#999' }}>
                          Bei neuem Akku: 100%<br/>
                          Nach 1-2 Jahren: ~90%<br/>
                          Nach 3-4 Jahren: ~75%
                        </div>
                      </div>
                    )}
                  </div>
                </label>
                <input type="number" min="0" max="100" value={health} onChange={(e) => setHealth(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '2px solid #E5E7EB', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* Advanced Specs Toggle */}
          <div style={{ background: '#FFF8F3', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', cursor: 'pointer', border: showAdvanced ? '2px solid #FF6B35' : '2px solid #E5E7EB', transition: 'all 0.3s' }}
            onClick={() => { setShowAdvanced(!showAdvanced); clickSound(); }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={showAdvanced} onChange={(e) => setShowAdvanced(e.target.checked)}
                style={{ width: '24px', height: '24px', cursor: 'pointer' }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: '#2E3A4B', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={20} /> Technische Daten (Advanced)
                </div>
                <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>Voltage, Capacity, Chemie - für Experten</div>
              </div>
            </label>
          </div>

          {showAdvanced && (
            <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', animation: 'slideIn 0.5s' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2E3A4B', fontWeight: 'bold' }}>Voltage (V)</label>
                  <input type="number" step="0.1" value={voltage} onChange={(e) => setVoltage(e.target.value)} placeholder="11.1"
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '2px solid #E5E7EB', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2E3A4B', fontWeight: 'bold' }}>Capacity (mAh)</label>
                  <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="3830"
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '2px solid #E5E7EB', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2E3A4B', fontWeight: 'bold' }}>Chemie</label>
                  <select value={chemistry} onChange={(e) => setChemistry(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '2px solid #E5E7EB', borderRadius: '10px', outline: 'none', background: 'white', cursor: 'pointer', boxSizing: 'border-box' }}>
                    <option value="LiPo">LiPo</option>
                    <option value="Li-Ion">Li-Ion</option>
                    <option value="NiMH">NiMH</option>
                    <option value="Lead-Acid">Lead-Acid</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Insurance Toggle */}
          <div style={{ background: '#F0F9FF', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', cursor: 'pointer', border: showInsurance ? '2px solid #3B82F6' : '2px solid #E5E7EB', transition: 'all 0.3s' }}
            onClick={() => { setShowInsurance(!showInsurance); clickSound(); }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={showInsurance} onChange={(e) => setShowInsurance(e.target.checked)}
                style={{ width: '24px', height: '24px', cursor: 'pointer' }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: '#2E3A4B', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DollarSign size={20} /> Versicherung & Garantie
                </div>
                <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>Kaufpreis, Garantie - für Versicherungsschutz</div>
              </div>
            </label>
          </div>

          {showInsurance && (
            <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', animation: 'slideIn 0.5s' }}>
              <div style={{ background: '#DBEAFE', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #3B82F6' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1E40AF' }}>
                  <strong>✅ Vorteile:</strong> Versicherungsschutz • Wertermittlung • Garantie-Tracking
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2E3A4B', fontWeight: 'bold' }}>Kaufpreis (CHF)</label>
                  <input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="1500"
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '2px solid #E5E7EB', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2E3A4B', fontWeight: 'bold' }}>Kaufdatum</label>
                  <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '2px solid #E5E7EB', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#2E3A4B', fontWeight: 'bold' }}>Garantie bis</label>
                  <input type="date" value={warrantyUntil} onChange={(e) => setWarrantyUntil(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '2px solid #E5E7EB', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => animateStep(() => setCurrentStep('multiple-batteries'))}
              style={{ flex: 1, padding: '1rem', background: '#E5E7EB', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.3s' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#D1D5DB'} onMouseOut={(e) => e.currentTarget.style.background = '#E5E7EB'}>
              <ArrowLeft size={20} /> Zurück
            </button>
            <button onClick={() => handleFinalSave(false)}
              style={{ flex: 2, padding: '1rem', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)'; }}>
              <Save size={20} /> Gerät speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
