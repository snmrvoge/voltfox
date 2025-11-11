// src/pages/Devices.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Battery, Plus, AlertCircle, Edit, ArrowLeft } from 'lucide-react';
import { useDevices } from '../context/DeviceContext';

const Devices: React.FC = () => {
  const navigate = useNavigate();
  const { devices, loading } = useDevices();

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
        <Link to="/add-device" className="btn-primary">
          <Plus size={20} />
          Gerät hinzufügen
        </Link>
      </div>

      {devices.length === 0 ? (
        <div className="empty-state">
          <Battery size={64} />
          <h2>No devices yet</h2>
          <p>Add your first device to start monitoring batteries</p>
          <Link to="/add-device" className="btn-primary">
            <Plus size={20} />
            Add Your First Device
          </Link>
        </div>
      ) : (
        <div className="devices-grid">
          {devices.map((device) => (
            <div key={device.id} className="device-card">
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
    </div>
  );
};

export default Devices;
