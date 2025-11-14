// src/components/DeviceWizard.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Camera, Edit3, ArrowRight, ArrowLeft, Check, Plus, Sparkles, Battery, Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDevices } from '../context/DeviceContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface DeviceWizardProps {
  onCommunitySearch: () => void;
  onCameraCapture: () => void;
  onComplete?: () => void;
}

type WizardStep = 'choose-method' | 'minimal-info' | 'save-or-continue' | 'current-status' | 'multiple-batteries' | 'advanced-specs' | 'insurance' | 'complete';

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

  // Minimal device data
  const [deviceName, setDeviceName] = useState('');
  const [deviceIcon, setDeviceIcon] = useState('🔋');
  const [deviceType, setDeviceType] = useState('other');

  // Current status
  const [currentCharge, setCurrentCharge] = useState('100');
  const [health, setHealth] = useState('100');
  const [showHealthInfo, setShowHealthInfo] = useState(false);

  // Multiple batteries
  const [hasMultipleBatteries, setHasMultipleBatteries] = useState(false);
  const [batteryCount, setBatteryCount] = useState(1);
  const [hasDroneAndController, setHasDroneAndController] = useState(false);

  // Advanced specs (optional)
  const [wantsAdvanced, setWantsAdvanced] = useState(false);
  const [voltage, setVoltage] = useState('');
  const [capacity, setCapacity] = useState('');
  const [chemistry, setChemistry] = useState('LiPo');

  // Insurance (optional)
  const [wantsInsurance, setWantsInsurance] = useState(false);
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
        icon: deviceIcon,
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

      if (wantsAdvanced && voltage && capacity) {
        deviceData.voltage = parseFloat(voltage);
        deviceData.capacity = parseFloat(capacity);
        deviceData.chemistry = chemistry;
      }

      if (wantsInsurance) {
        if (purchasePrice) deviceData.purchasePrice = parseFloat(purchasePrice);
        if (purchaseDate) deviceData.purchaseDate = purchaseDate;
        if (warrantyUntil) deviceData.warrantyUntil = warrantyUntil;
      }

      await addDevice(deviceData);

      successSound();
      toast.success('🎉 Gerät erfolgreich hinzugefügt!');

      setTimeout(() => {
        if (addMore) {
          // Reset and start over
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
    setHasMultipleBatteries(false);
    setWantsAdvanced(false);
    setVoltage('');
    setCapacity('');
    setWantsInsurance(false);
  };

  const getStepNumber = () => {
    const steps = {
      'choose-method': 1,
      'minimal-info': 2,
      'save-or-continue': 3,
      'battery-details': 4,
      'extra-batteries': 5,
      'insurance': 6,
      'complete': 7
    };
    return steps[currentStep] || 1;
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

      {/* Progress Indicator */}
      {currentStep !== 'choose-method' && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '2rem'
        }}>
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                background: getStepNumber() >= step + 1 ? '#10B981' : getStepNumber() === step ? '#FF6B35' : '#E5E7EB',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                transition: 'all 0.3s',
                animation: getStepNumber() === step ? 'pulse 2s infinite' : 'none'
              }}>
                {getStepNumber() >= step + 1 ? <Check size={18} /> : step}
              </div>
              {step < 3 && <div style={{ width: '40px', height: '3px', background: getStepNumber() > step ? '#10B981' : '#E5E7EB', transition: 'all 0.3s' }} />}
            </React.Fragment>
          ))}
        </div>
      )}

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
            {/* Community Search */}
            <button
              onClick={() => handleMethodSelect('community')}
              style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'center',
                position: 'relative',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                color: 'white'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'rgba(255, 255, 255, 0.3)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                ⚡ Schnellste
              </div>
              <Search size={56} style={{ margin: '0 auto 1rem', animation: 'bounce 2s infinite' }} />
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>
                Community durchsuchen
              </h3>
              <p style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: '1rem' }}>
                Gerät aus Datenbank wählen - fertig!
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}>
                Nur 1 Klick <ArrowRight size={22} />
              </div>
            </button>

            {/* Camera Capture */}
            <button
              onClick={() => handleMethodSelect('camera')}
              style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'center',
                position: 'relative',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                color: 'white'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'rgba(255, 255, 255, 0.3)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                🤖 Smart
              </div>
              <Camera size={56} style={{ margin: '0 auto 1rem', animation: 'bounce 2s infinite 0.5s' }} />
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>
                Mit KI-Foto
              </h3>
              <p style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: '1rem' }}>
                Foto machen - KI erkennt alles automatisch
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}>
                ~30 Sekunden <Sparkles size={22} />
              </div>
            </button>

            {/* Manual Entry */}
            <button
              onClick={() => handleMethodSelect('manual')}
              style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, #FF6B35 0%, #F97316 100%)',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'center',
                position: 'relative',
                boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)',
                color: 'white'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 107, 53, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.3)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'rgba(255, 255, 255, 0.3)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                ✨ Flexibel
              </div>
              <Edit3 size={56} style={{ margin: '0 auto 1rem', animation: 'bounce 2s infinite 1s' }} />
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>
                Manuell eingeben
              </h3>
              <p style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: '1rem' }}>
                Start schnell - Details später hinzufügen
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}>
                Volle Kontrolle <Edit3 size={22} />
              </div>
            </button>
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: '3rem',
            padding: '1.5rem',
            background: '#FFF8F3',
            borderRadius: '15px',
            border: '2px solid #FFD23F',
            animation: 'slideIn 1s'
          }}>
            <p style={{ color: '#666', margin: 0, fontSize: '1.05rem' }}>
              💡 <strong>Tipp:</strong> Du kannst später jederzeit weitere Details hinzufügen!
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Minimal Info (Name + Icon) */}
      {currentStep === 'minimal-info' && (
        <div className="wizard-card" style={{
          background: 'white',
          padding: '3rem 2rem',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            textAlign: 'center',
            color: '#2E3A4B',
            marginBottom: '0.5rem',
            fontSize: '1.8rem'
          }}>
            ⚡ Super! Wie heißt dein Gerät?
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#666',
            marginBottom: '2rem'
          }}>
            Gib einen einfachen Namen ein - das reicht schon!
          </p>

          {/* Device Name */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#2E3A4B',
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}>
              📝 Gerätename *
            </label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="z.B. DJI Mavic 3, iPhone 14, E-Bike..."
              autoFocus
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.1rem',
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                outline: 'none',
                transition: 'all 0.3s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#FF6B35'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            />
          </div>

          {/* Icon Selector */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#2E3A4B',
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}>
              😊 Wähle ein Icon (optional)
            </label>
            <div className="icon-selector">
              {deviceIcons.map((icon) => (
                <div
                  key={icon}
                  className={`icon-option ${deviceIcon === icon ? 'selected' : ''}`}
                  onClick={() => {
                    setDeviceIcon(icon);
                    clickSound();
                  }}
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Device Type */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#2E3A4B',
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}>
              🏷️ Geräte-Typ (optional)
            </label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.1rem',
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                outline: 'none',
                background: 'white',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
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

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            <button
              onClick={() => animateStep(() => setCurrentStep('choose-method'))}
              style={{
                flex: 1,
                padding: '1rem',
                background: '#E5E7EB',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#D1D5DB'}
              onMouseOut={(e) => e.currentTarget.style.background = '#E5E7EB'}
            >
              <ArrowLeft size={20} />
              Zurück
            </button>
            <button
              onClick={handleMinimalSave}
              disabled={!deviceName.trim()}
              style={{
                flex: 2,
                padding: '1rem',
                background: deviceName.trim() ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#D1D5DB',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: deviceName.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s',
                boxShadow: deviceName.trim() ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none'
              }}
              onMouseOver={(e) => {
                if (deviceName.trim()) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = deviceName.trim() ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none';
              }}
            >
              Weiter
              <ArrowRight size={20} />
            </button>
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            padding: '1rem',
            background: '#FFF8F3',
            borderRadius: '10px'
          }}>
            <p style={{ color: '#666', margin: 0 }}>
              💡 Im nächsten Schritt kannst du direkt speichern oder Details hinzufügen.
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Save or Continue */}
      {currentStep === 'save-or-continue' && (
        <div className="wizard-card" style={{
          background: 'white',
          padding: '3rem 2rem',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem',
            animation: 'bounce 1s'
          }}>
            {deviceIcon}
          </div>

          <h2 style={{
            color: '#2E3A4B',
            marginBottom: '0.5rem',
            fontSize: '2rem'
          }}>
            🎉 Perfekt!
          </h2>
          <h3 style={{
            color: '#666',
            marginBottom: '2rem',
            fontWeight: 'normal',
            fontSize: '1.3rem'
          }}>
            "{deviceName}" ist bereit zum Speichern
          </h3>

          <div style={{
            background: '#F0FDF4',
            padding: '1.5rem',
            borderRadius: '15px',
            border: '2px solid #10B981',
            marginBottom: '2rem'
          }}>
            <p style={{ color: '#059669', margin: 0, fontSize: '1.1rem' }}>
              ✓ Gerät ist einsatzbereit<br/>
              ✓ Batterie-Überwachung aktiv<br/>
              ✓ Benachrichtigungen aktiviert
            </p>
          </div>

          <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.1rem' }}>
            Möchtest du noch Details hinzufügen?
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <button
              onClick={() => handleFinalSave(false)}
              style={{
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
              }}
            >
              <Save size={24} style={{ display: 'block', margin: '0 auto 0.5rem' }} />
              Jetzt speichern
            </button>

            <button
              onClick={() => animateStep(() => setCurrentStep('current-status'))}
              style={{
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
              }}
            >
              <Battery size={24} style={{ display: 'block', margin: '0 auto 0.5rem' }} />
              Details hinzufügen
            </button>
          </div>

          <button
            onClick={() => handleFinalSave(true)}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'transparent',
              color: '#FF6B35',
              border: '2px solid #FF6B35',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#FF6B35';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#FF6B35';
            }}
          >
            <Plus size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Speichern & weiteres Gerät hinzufügen
          </button>
        </div>
      )}

      {/* Step 4: Battery Details (Optional) */}
      {currentStep === 'battery-details' && (
        <div className="wizard-card" style={{
          background: 'white',
          padding: '3rem 2rem',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            textAlign: 'center',
            color: '#2E3A4B',
            marginBottom: '0.5rem',
            fontSize: '1.8rem'
          }}>
            🔋 Akku-Details (optional)
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#666',
            marginBottom: '2rem'
          }}>
            Für präzisere Überwachung kannst du Akku-Daten eingeben
          </p>

          <div style={{
            background: '#F0FDF4',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            cursor: 'pointer',
            border: hasVoltage ? '2px solid #10B981' : '2px solid #E5E7EB',
            transition: 'all 0.3s'
          }}
          onClick={() => {
            setHasVoltage(!hasVoltage);
            clickSound();
          }}
          >
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={hasVoltage}
                onChange={(e) => setHasVoltage(e.target.checked)}
                style={{
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer'
                }}
              />
              <span style={{
                color: '#2E3A4B',
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}>
                Ich kenne die Akku-Daten
              </span>
            </label>
          </div>

          {hasVoltage && (
            <div style={{ animation: 'slideIn 0.5s' }}>
              {/* Technical Specs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#2E3A4B',
                    fontWeight: 'bold'
                  }}>
                    Voltage (V)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={voltage}
                    onChange={(e) => setVoltage(e.target.value)}
                    placeholder="11.1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      border: '2px solid #E5E7EB',
                      borderRadius: '10px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#2E3A4B',
                    fontWeight: 'bold'
                  }}>
                    Capacity (mAh)
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="3830"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      border: '2px solid #E5E7EB',
                      borderRadius: '10px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#2E3A4B',
                    fontWeight: 'bold'
                  }}>
                    Chemie
                  </label>
                  <select
                    value={chemistry}
                    onChange={(e) => setChemistry(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      border: '2px solid #E5E7EB',
                      borderRadius: '10px',
                      outline: 'none',
                      background: 'white',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="LiPo">LiPo</option>
                    <option value="Li-Ion">Li-Ion</option>
                    <option value="NiMH">NiMH</option>
                    <option value="Lead-Acid">Lead-Acid</option>
                  </select>
                </div>
              </div>

              {/* Current Status */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#2E3A4B',
                    fontWeight: 'bold'
                  }}>
                    Aktueller Ladestand (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={currentCharge}
                    onChange={(e) => setCurrentCharge(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      border: '2px solid #E5E7EB',
                      borderRadius: '10px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#2E3A4B',
                    fontWeight: 'bold'
                  }}>
                    Akku-Gesundheit (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={health}
                    onChange={(e) => setHealth(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      border: '2px solid #E5E7EB',
                      borderRadius: '10px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{
                background: '#FFF8F3',
                padding: '1rem',
                borderRadius: '10px',
                marginBottom: '2rem'
              }}>
                <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
                  💡 <strong>Tipp:</strong> Wenn nicht angegeben, werden automatisch 100% Ladestand und 100% Gesundheit gesetzt.
                </p>
              </div>
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '1rem'
          }}>
            <button
              onClick={() => animateStep(() => setCurrentStep('save-or-continue'))}
              style={{
                flex: 1,
                padding: '1rem',
                background: '#E5E7EB',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#D1D5DB'}
              onMouseOut={(e) => e.currentTarget.style.background = '#E5E7EB'}
            >
              <ArrowLeft size={20} />
              Zurück
            </button>
            <button
              onClick={() => handleFinalSave(false)}
              style={{
                flex: 2,
                padding: '1rem',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
              }}
            >
              <Save size={20} />
              Gerät speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
