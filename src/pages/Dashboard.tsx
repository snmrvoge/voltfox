// src/pages/Dashboard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Battery, AlertCircle, FileText, Settings, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDevices } from '../context/DeviceContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { APP_VERSION } from '../version';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const { devices } = useDevices();
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);

  // Check if user is admin (will be loaded from Firestore)
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [userName, setUserName] = React.useState('');

  // Function to get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return t('dashboard.greetings.morning');
    } else if (hour >= 12 && hour < 18) {
      return t('dashboard.greetings.afternoon');
    } else if (hour >= 18 && hour < 22) {
      return t('dashboard.greetings.evening');
    } else {
      return t('dashboard.greetings.night');
    }
  };

  // Load admin status and user name from Firestore
  React.useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) {
        setIsAdmin(false);
        setUserName('');
        return;
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setIsAdmin(userData?.isAdmin === true || userData?.role === 'admin');
          setUserName(userData?.firstName || '');
        } else {
          setIsAdmin(false);
          setUserName('');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setIsAdmin(false);
        setUserName('');
      }
    };

    loadUserData();
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const activeDevices = devices.filter(d => d.status === 'healthy');
  const warnings = devices.filter(d => d.status === 'warning' || d.currentCharge < 20).length;
  const critical = devices.filter(d => d.status === 'critical').length;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFF8F3',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{ color: '#2E3A4B' }}>
            🦊 {t('dashboard.welcome')}
          </h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/insurance')}
              style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '38px'
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <FileText size={18} /> Versicherung
            </button>
            <button
              onClick={() => navigate('/community')}
              style={{
                padding: '0.5rem 1rem',
                background: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '38px'
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#059669')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#10B981')}
            >
              <Users size={18} /> Community
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minHeight: '38px'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#5568d3')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#667eea')}
              >
                🛡️ {t('nav.admin')}
              </button>
            )}
            <button
              onClick={() => navigate('/settings')}
              style={{
                padding: '0.5rem 1rem',
                background: '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '38px'
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#4B5563')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#6B7280')}
            >
              <Settings size={18} /> {t('nav.settings')}
            </button>
            <button
              onClick={handleSignOut}
              style={{
                padding: '0.5rem 1rem',
                background: '#FF6B35',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '38px'
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#E85A26')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#FF6B35')}
            >
              {t('nav.signOut')}
            </button>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '15px',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: '#2E3A4B', marginBottom: '1rem' }}>
            {userName ? `${getTimeBasedGreeting()}, ${userName}!` : t('dashboard.welcome')}
          </h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            {currentUser?.email ? `${t('dashboard.loggedInAs')} ${currentUser.email}` : t('dashboard.addFirstDevice')}
          </p>
          <Link to="/add-device" style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '50px',
            fontWeight: 'bold'
          }}>
            + {t('dashboard.addDevice')}
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '15px',
            borderLeft: '4px solid #10B981'
          }}>
            <h3 style={{ color: '#2E3A4B', marginBottom: '0.5rem' }}>{t('dashboard.stats.devices')}</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>{devices.length}</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>{activeDevices.length} {t('dashboard.stats.healthy')}</p>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '15px',
            borderLeft: '4px solid #F59E0B'
          }}>
            <h3 style={{ color: '#2E3A4B', marginBottom: '0.5rem' }}>{t('dashboard.stats.warnings')}</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#F59E0B' }}>{warnings}</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>{critical} {t('dashboard.stats.critical')}</p>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '15px',
            borderLeft: '4px solid #3B82F6'
          }}>
            <h3 style={{ color: '#2E3A4B', marginBottom: '0.5rem' }}>{t('dashboard.stats.batteryHealth')}</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3B82F6' }}>
              {devices.length > 0 ? Math.round(devices.reduce((acc, d) => acc + d.health, 0) / devices.length) : 0}%
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>{t('dashboard.stats.average')}</p>
          </div>
        </div>

        {devices.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ color: '#2E3A4B', margin: 0 }}>{t('dashboard.yourDevices')}</h2>
              <Link to="/devices" style={{ color: '#FF6B35', textDecoration: 'none', fontWeight: 'bold' }}>
                {t('dashboard.viewAll')} →
              </Link>
            </div>
            <div className="devices-grid">
              {devices.slice(0, 3).map((device) => (
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
                  <p className="device-health">{t('dashboard.health')} {device.health}%</p>

                  {/* Last Used Information */}
                  {device.lastUsed && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#666',
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      background: '#F3F4F6',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ fontSize: '1rem' }}>🕒</span>
                      <span>
                        Zuletzt: {(() => {
                          const lastUsedDate = new Date(device.lastUsed);
                          const now = new Date();
                          const diffTime = Math.abs(now.getTime() - lastUsedDate.getTime());
                          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                          if (diffDays === 0) return 'Heute';
                          if (diffDays === 1) return 'Gestern';
                          if (diffDays < 7) return `vor ${diffDays}T`;
                          if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)}W`;
                          return `vor ${Math.floor(diffDays / 30)}M`;
                        })()}
                      </span>
                    </div>
                  )}

                  {/* Additional Batteries */}
                  {device.batteries && device.batteries.length > 0 && (
                    <div style={{
                      fontSize: '0.75rem',
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #E5E7EB'
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

                  {device.currentCharge < 20 && (
                    <div className="device-warning">
                      <AlertCircle size={16} />
                      {t('dashboard.lowBattery')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{
          marginTop: '3rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.9rem',
          color: '#9CA3AF'
        }}>
          <a
            href="https://mr-vision.ch"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#9CA3AF',
              textDecoration: 'none',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#FF6B35')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#9CA3AF')}
          >
            {t('common.createdBy')} ✨
          </a>
          <span style={{ color: '#D1D5DB' }}>•</span>
          <span style={{ fontSize: '0.8rem', color: '#D1D5DB' }}>v{APP_VERSION}</span>
        </div>

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
    </div>
  );
}
