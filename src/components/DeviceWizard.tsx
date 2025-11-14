// src/components/DeviceWizard.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Camera, Edit3, ArrowRight, ArrowLeft, Check, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface DeviceWizardProps {
  onCommunitySearch: () => void;
  onCameraCapture: () => void;
  onManualEntry: () => void;
}

type InputMethod = 'community' | 'camera' | 'manual' | null;
type WizardStep = 'choose-method' | 'minimal-info' | 'optional-details' | 'complete';

export const DeviceWizard: React.FC<DeviceWizardProps> = ({
  onCommunitySearch,
  onCameraCapture,
  onManualEntry
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>('choose-method');
  const [selectedMethod, setSelectedMethod] = useState<InputMethod>(null);

  const handleMethodSelect = (method: InputMethod) => {
    setSelectedMethod(method);

    switch (method) {
      case 'community':
        onCommunitySearch();
        break;
      case 'camera':
        onCameraCapture();
        break;
      case 'manual':
        onManualEntry();
        break;
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      {/* Progress Indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '3rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: currentStep === 'choose-method' ? '#FF6B35' : '#10B981',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold'
        }}>
          {currentStep === 'choose-method' ? '1' : <Check size={20} />}
        </div>
        <div style={{ width: '60px', height: '3px', background: '#E5E7EB' }} />
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: currentStep === 'minimal-info' || currentStep === 'optional-details' || currentStep === 'complete' ? '#FF6B35' : '#E5E7EB',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold'
        }}>
          {currentStep === 'complete' ? <Check size={20} /> : '2'}
        </div>
      </div>

      {/* Step 1: Choose Method */}
      {currentStep === 'choose-method' && (
        <div>
          <h2 style={{
            textAlign: 'center',
            color: '#2E3A4B',
            marginBottom: '1rem',
            fontSize: '2rem'
          }}>
            Wie möchtest du dein Gerät erfassen?
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#666',
            marginBottom: '3rem'
          }}>
            Wähle die schnellste Methode für dich
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Community Search */}
            <button
              onClick={() => handleMethodSelect('community')}
              style={{
                padding: '2rem',
                background: 'white',
                border: '3px solid #10B981',
                borderRadius: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#10B981',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                Schnellste
              </div>
              <Search size={48} color="#10B981" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ color: '#2E3A4B', marginBottom: '0.5rem' }}>
                Community durchsuchen
              </h3>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Gerät aus Datenbank wählen
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: '#10B981',
                fontWeight: 'bold'
              }}>
                Nur 1 Klick
                <ArrowRight size={20} />
              </div>
            </button>

            {/* Camera Capture */}
            <button
              onClick={() => handleMethodSelect('camera')}
              style={{
                padding: '2rem',
                background: 'white',
                border: '3px solid #3B82F6',
                borderRadius: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'center',
                position: 'relative'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#3B82F6',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                Smart
              </div>
              <Camera size={48} color="#3B82F6" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ color: '#2E3A4B', marginBottom: '0.5rem' }}>
                Mit KI-Foto
              </h3>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Gerät fotografieren, KI erkennt Details
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: '#3B82F6',
                fontWeight: 'bold'
              }}>
                ~30 Sekunden
                <ArrowRight size={20} />
              </div>
            </button>

            {/* Manual Entry */}
            <button
              onClick={() => handleMethodSelect('manual')}
              style={{
                padding: '2rem',
                background: 'white',
                border: '3px solid #FF6B35',
                borderRadius: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'center',
                position: 'relative'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 107, 53, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#FF6B35',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                Vollständig
              </div>
              <Edit3 size={48} color="#FF6B35" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ color: '#2E3A4B', marginBottom: '0.5rem' }}>
                Manuell eingeben
              </h3>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Alle Details selbst eintragen
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: '#FF6B35',
                fontWeight: 'bold'
              }}>
                Maximale Kontrolle
                <ArrowRight size={20} />
              </div>
            </button>
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: '3rem',
            padding: '1.5rem',
            background: '#FFF8F3',
            borderRadius: '10px',
            border: '2px solid #FFD23F'
          }}>
            <p style={{ color: '#666', margin: 0 }}>
              💡 <strong>Tipp:</strong> Du kannst später jederzeit weitere Details hinzufügen
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
