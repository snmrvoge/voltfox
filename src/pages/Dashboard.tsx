// src/pages/Dashboard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Battery, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDevices } from '../context/DeviceContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { devices } = useDevices();
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);

  // Check if user is admin (will be loaded from Firestore)
  const [isAdmin, setIsAdmin] = React.useState(false);

  // Load admin status from Firestore
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        setIsAdmin(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setIsAdmin(userData?.isAdmin === true || userData?.role === 'admin');
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
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
            🦊 VoltFox Dashboard
          </h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#5568d3')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#667eea')}
              >
                🛡️ Admin
              </button>
            )}
            <button
              onClick={handleSignOut}
              style={{
                padding: '0.5rem 1rem',
                background: '#FF6B35',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Sign Out
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
            Willkommen bei VoltFox!
          </h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            {currentUser?.email ? `Angemeldet als: ${currentUser.email}` : 'Füge dein erstes Gerät hinzu'}
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
            + Gerät hinzufügen
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
            <h3 style={{ color: '#2E3A4B', marginBottom: '0.5rem' }}>Geräte</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>{devices.length}</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>{activeDevices.length} gesund</p>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '15px',
            borderLeft: '4px solid #F59E0B'
          }}>
            <h3 style={{ color: '#2E3A4B', marginBottom: '0.5rem' }}>Warnungen</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#F59E0B' }}>{warnings}</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>{critical} kritisch</p>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '15px',
            borderLeft: '4px solid #3B82F6'
          }}>
            <h3 style={{ color: '#2E3A4B', marginBottom: '0.5rem' }}>Batterie-Gesundheit</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3B82F6' }}>
              {devices.length > 0 ? Math.round(devices.reduce((acc, d) => acc + d.health, 0) / devices.length) : 0}%
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Durchschnitt</p>
          </div>
        </div>

        {devices.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: '#2E3A4B' }}>Deine Geräte</h2>
              <Link to="/devices" style={{ color: '#FF6B35', textDecoration: 'none', fontWeight: 'bold' }}>
                Alle anzeigen →
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
                  <p className="device-health">Gesundheit: {device.health}%</p>
                  {device.currentCharge < 20 && (
                    <div className="device-warning">
                      <AlertCircle size={16} />
                      Niedriger Ladestand!
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{
          marginTop: '3rem',
          fontSize: '0.9rem',
          color: '#9CA3AF',
          textAlign: 'center'
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
            Created by Mr. Vision ✨
          </a>
        </p>

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
