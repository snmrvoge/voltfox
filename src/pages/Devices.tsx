// src/pages/Devices.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Battery, Plus, AlertCircle, Edit, ArrowLeft } from 'lucide-react';
import { useDevices } from '../context/DeviceContext';

const Devices: React.FC = () => {
  const navigate = useNavigate();
  const { devices, loading } = useDevices();
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);

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
              <Link
                to={`/edit-device/${device.id}`}
                className="btn-edit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '1rem',
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '2px solid var(--vf-primary)',
                  color: 'var(--vf-primary)',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  transition: 'all 0.3s'
                }}
              >
                <Edit size={16} />
                Bearbeiten
              </Link>
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
