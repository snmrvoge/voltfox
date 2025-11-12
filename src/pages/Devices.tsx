// src/pages/Devices.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Battery, Plus, AlertCircle, ArrowLeft, Zap, BatteryCharging, AlertTriangle, Settings, ChevronDown } from 'lucide-react';
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
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);

  const handleFullyCharged = async (deviceId: string, deviceName: string) => {
    if (!currentUser) return;

    const confirmed = window.confirm(t('devices.confirmUsedAndCharged'));
    if (!confirmed) return;

    try {
      const now = new Date().toISOString();
      await updateDevice(deviceId, {
        currentCharge: 100,
        lastUsed: now  // Zeitstempel für Benutzung setzen
      });
      await HistoryService.recordEvent(currentUser.uid, deviceId, 'used_and_charged');
      toast.success(t('devices.markedAsUsedAndCharged'));
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
      await updateDevice(deviceId, {
        lastUsed: now,
        currentCharge: 100  // Batterie auf 100% setzen
      });
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
      await updateDevice(deviceId, {
        isDefective: true,
        currentCharge: 0  // Batterie auf 0% setzen
      });
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

              {/* Status Badges */}
              {(device.isDefective || device.lastUsed) && (
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: 'center',
                  marginBottom: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  {device.isDefective && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                      border: '2px solid #EF4444',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#DC2626'
                    }}>
                      <AlertTriangle size={14} />
                      Defekt
                    </div>
                  )}
                  {device.lastUsed && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
                      border: '2px solid #3B82F6',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#2563EB'
                    }}>
                      <BatteryCharging size={14} />
                      {(() => {
                        const lastUsedDate = new Date(device.lastUsed);
                        const now = new Date();
                        const daysSince = Math.floor((now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24));
                        return daysSince === 0
                          ? 'Heute benutzt'
                          : `Seit ${daysSince} Tag${daysSince === 1 ? '' : 'en'} nicht mehr benutzt`;
                      })()}
                    </div>
                  )}
                </div>
              )}

              <div className="device-header">
                <h3>{device.name}</h3>
                <span className={`battery-level level-${device.currentCharge > 50 ? 'good' : device.currentCharge > 20 ? 'medium' : 'low'}`}>
                  <Battery size={20} />
                  {device.currentCharge}%
                </span>
              </div>
              <p className="device-type">{device.type}</p>
              <p className="device-health">Health: {device.health}%</p>
              {device.currentCharge < 20 && !device.isDefective && (
                <div className="device-warning">
                  <AlertCircle size={16} />
                  Low battery!
                </div>
              )}

              {/* Additional Batteries */}
              {device.batteries && device.batteries.length > 0 && (
                <div style={{
                  fontSize: '0.75rem',
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #E5E7EB',
                  width: '100%'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '0.5rem',
                    color: '#6B7280',
                    fontWeight: '600'
                  }}>
                    <span>🔋</span>
                    <span>Zusatzakkus ({device.batteries.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {device.batteries.map((battery: any) => (
                      <div
                        key={battery.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem',
                          background: battery.status === 'critical' ? '#FEE2E2' :
                                     battery.status === 'warning' ? '#FEF3C7' :
                                     battery.status === 'healthy' ? '#D1FAE5' : '#F3F4F6',
                          borderRadius: '6px',
                          border: `1px solid ${
                            battery.status === 'critical' ? '#FCA5A5' :
                            battery.status === 'warning' ? '#FCD34D' :
                            battery.status === 'healthy' ? '#6EE7B7' : '#D1D5DB'
                          }`
                        }}
                      >
                        <span style={{
                          fontWeight: '500',
                          color: '#374151',
                          fontSize: '0.8rem'
                        }}>
                          {battery.name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                            {battery.currentCharge}%
                          </span>
                          <Battery
                            size={14}
                            color={battery.status === 'critical' ? '#EF4444' :
                                   battery.status === 'warning' ? '#F59E0B' :
                                   battery.status === 'healthy' ? '#10B981' : '#6B7280'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', position: 'relative' }}>
                {/* Actions Dropdown Button */}
                <div style={{ position: 'relative', width: '80%' }}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === device.id ? null : device.id || null)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, var(--vf-primary) 0%, var(--vf-secondary) 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: '0 2px 6px rgba(255, 107, 53, 0.3)'
                    }}
                  >
                    <Zap size={14} />
                    Aktionen
                    <ChevronDown
                      size={14}
                      style={{
                        transition: 'transform 0.3s',
                        transform: openDropdown === device.id ? 'rotate(180deg)' : 'rotate(0)'
                      }}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {openDropdown === device.id && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div
                        onClick={() => setOpenDropdown(null)}
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 998
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '0.5rem',
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        overflow: 'hidden',
                        zIndex: 999,
                        animation: 'slideDown 0.2s ease-out'
                      }}>
                        <style>{`
                          @keyframes slideDown {
                            from {
                              opacity: 0;
                              transform: translateY(-10px);
                            }
                            to {
                              opacity: 1;
                              transform: translateY(0);
                            }
                          }
                        `}</style>

                        {/* Option 1: Benutzt & Voll */}
                        <button
                          onClick={() => {
                            device.id && handleFullyCharged(device.id, device.name);
                            setOpenDropdown(null);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 16px',
                            background: 'white',
                            border: 'none',
                            borderBottom: '1px solid #f0f0f0',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            fontSize: '0.9rem',
                            color: '#2E3A4B'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#f8f8f8'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Zap size={16} color="white" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{t('devices.usedAndCharged')}</div>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
                              Gerät wurde benutzt und ist voll aufgeladen
                            </div>
                          </div>
                        </button>

                        {/* Option 2: Aufgeladen ohne Benutzung */}
                        <button
                          onClick={() => {
                            device.id && handleChargedWithoutUse(device.id, device.name);
                            setOpenDropdown(null);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 16px',
                            background: 'white',
                            border: 'none',
                            borderBottom: '1px solid #f0f0f0',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            fontSize: '0.9rem',
                            color: '#2E3A4B'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#f8f8f8'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <BatteryCharging size={16} color="white" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{t('devices.chargedWithoutUse')}</div>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
                              Nur aufgeladen, aber nicht verwendet
                            </div>
                          </div>
                        </button>

                        {/* Option 3: Tiefentladen / Defekt */}
                        <button
                          onClick={() => {
                            device.id && handleMarkDefective(device.id, device.name);
                            setOpenDropdown(null);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 16px',
                            background: 'white',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            fontSize: '0.9rem',
                            color: '#2E3A4B'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#FEE2E2'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <AlertTriangle size={16} color="white" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{t('devices.markDefective')}</div>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
                              Gerät ist tiefentladen oder defekt
                            </div>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Edit Button */}
                <Link
                  to={`/edit-device/${device.id}`}
                  className="btn-edit"
                  style={{
                    width: '80%',
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
                  title="Gerät bearbeiten"
                >
                  <Settings size={18} />
                  Bearbeiten
                </Link>
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
