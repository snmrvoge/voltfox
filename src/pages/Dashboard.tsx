// src/pages/Dashboard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Battery, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDevices } from '../context/DeviceContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { devices } = useDevices();

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
          Created by Mr. Vision ✨
        </p>
      </div>
    </div>
  );
}
