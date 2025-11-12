// src/pages/Devices.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Battery, Plus, AlertCircle, Edit, ArrowLeft, Zap, BatteryCharging, AlertTriangle } from 'lucide-react';
import { useDevices } from '../context/DeviceContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { HistoryService } from '../services/HistoryService';
import toast from 'react-hot-toast';

const Devices: React.FC = () => {
  const navigate = useNavigate();
  const { devices, loading, updateDevice } = useDevices();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);

  const handleFullyCharged = async (deviceId: string, deviceName: string) => {
    try {
      await updateDevice(deviceId, { currentCharge: 100 });
      toast.success(`✅ ${deviceName} ist jetzt voll aufgeladen!`);
    } catch (error) {
      console.error('Error updating charge:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const handleChargedWithoutUse = async (deviceId: string, deviceName: string) => {
    if (!currentUser) return;

    const confirmed = window.confirm(t('devices.confirmChargedWithoutUse'));
    if (!confirmed) return;

    try {
      const now = new Date().toISOString();
      await updateDevice(deviceId, { lastUsed: now });
      await HistoryService.recordEvent(currentUser.uid, deviceId, 'charged_without_use');
      toast.success(t('devices.markedAsChargedWithoutUse'));
    } catch (error) {
      console.error('Error recording charged without use:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  const handleMarkDefective = async (deviceId: string, deviceName: string) => {
    if (!currentUser) return;

    const confirmed = window.confirm(t('devices.confirmMarkDefective'));
    if (!confirmed) return;

    try {
      await updateDevice(deviceId, { isDefective: true });
      await HistoryService.recordEvent(currentUser.uid, deviceId, 'marked_defective');
      toast.error(t('devices.markedAsDefective'));
    } catch (error) {
      console.error('Error marking device as defective:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  if (loading) {
    return (
      <div className="devices-page">
        <div className="loading-state">
          <Battery className="animate-pulse" size={48} />
          <p>Loading your devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="devices-page">
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'transparent',
          border: 'none',
          color: 'var(--vf-primary)',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '1rem',
          transition: 'all 0.3s'
        }}
      >
        <ArrowLeft size={20} />
        Zurück zum Dashboard
      </button>
      <div className="page-header">
        <h1>🦊 Meine Geräte</h1>
        <Link
          to="/add-device"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '50px',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 53, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.3)';
          }}
        >
          <Plus size={20} />
          Gerät hinzufügen
        </Link>
      </div>

      {devices.length === 0 ? (
        <div className="empty-state">
          <Battery size={64} />
          <h2>No devices yet</h2>
          <p>Add your first device to start monitoring batteries</p>
          <Link
            to="/add-device"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '50px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 53, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.3)';
            }}
          >
            <Plus size={20} />
            Add Your First Device
          </Link>
        </div>
      ) : (
        <div className="devices-grid">
          {devices.map((device) => (
            <div key={device.id} className="device-card">
              {/* Device Image/Icon */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                {device.imageUrl ? (
                  <img
                    src={device.imageUrl}
                    alt={device.name}
                    onClick={() => setLightboxImage(device.imageUrl || null)}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      border: '3px solid var(--vf-primary)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                ) : (
                  <div style={{
                    fontSize: '3.5rem',
                    width: '80px',
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    {device.icon || '🔋'}
                  </div>
                )}
              </div>

              <div className="device-header">
                <h3>{device.name}</h3>
                <span className={`battery-level level-${device.currentCharge > 50 ? 'good' : device.currentCharge > 20 ? 'medium' : 'low'}`}>
                  <Battery size={20} />
                  {device.currentCharge}%
                </span>
              </div>
              <p className="device-type">{device.type}</p>
              <p className="device-health">Health: {device.health}%</p>
              {device.currentCharge < 20 && (
                <div className="device-warning">
                  <AlertCircle size={16} />
                  Low battery!
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  onClick={() => device.id && handleFullyCharged(device.id, device.name)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  <Zap size={14} />
                  Voll
                </button>
                <Link
                  to={`/edit-device/${device.id}`}
                  className="btn-edit"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: '2px solid var(--vf-primary)',
                    color: 'var(--vf-primary)',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.3s'
                  }}
                >
                  <Edit size={14} />
                  Edit
                </Link>
              </div>

              {/* New Action Buttons Row */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => device.id && handleChargedWithoutUse(device.id, device.name)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(59, 130, 246, 0.3)';
                  }}
                  title={t('devices.chargedWithoutUse')}
                >
                  <BatteryCharging size={14} />
                  {t('devices.chargedWithoutUse').length > 20
                    ? t('devices.chargedWithoutUse').substring(0, 18) + '...'
                    : t('devices.chargedWithoutUse')}
                </button>
                <button
                  onClick={() => device.id && handleMarkDefective(device.id, device.name)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(239, 68, 68, 0.3)';
                  }}
                  title={t('devices.markDefective')}
                >
                  <AlertTriangle size={14} />
                  {t('devices.markDefective').length > 20
                    ? t('devices.markDefective').substring(0, 18) + '...'
                    : t('devices.markDefective')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer',
            animation: 'fadeIn 0.3s'
          }}
        >
          <img
            src={lightboxImage}
            alt="Vergrößertes Bild"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: '15px',
              boxShadow: '0 10px 50px rgba(0,0,0,0.5)',
              cursor: 'default'
            }}
          />
          <button
            onClick={() => setLightboxImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default Devices;
