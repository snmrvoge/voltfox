// src/pages/AddDevice.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Battery, ArrowLeft } from 'lucide-react';
import { useDevices } from '../context/DeviceContext';
import toast from 'react-hot-toast';

const AddDevice: React.FC = () => {
  const navigate = useNavigate();
  const { addDevice } = useDevices();
  const [formData, setFormData] = useState({
    name: '',
    type: 'drone',
    icon: '🔋',
    chemistry: 'LiPo',
    dischargeRate: 1.0,
    health: 100,
    status: 'healthy' as 'healthy' | 'warning' | 'critical' | 'dead',
    currentCharge: 100,
    lastCharged: new Date().toISOString(),
    reminderFrequency: 30
  });

  const deviceTypes = [
    'drone',
    'camera',
    'laptop',
    'phone',
    'tablet',
    'smartwatch',
    'headphones',
    'speaker',
    'e-bike',
    'other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addDevice(formData);
      toast.success('Device added successfully!');
      navigate('/devices');
    } catch (error) {
      toast.error('Failed to add device');
    }
  };

  return (
    <div className="add-device-page">
      <button
        onClick={() => navigate('/devices')}
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
        Zurück zu Geräten
      </button>
      <div className="page-header">
        <h1>🦊 Neues Gerät hinzufügen</h1>
        <p>Starte die Überwachung deiner Batterie</p>
      </div>

      <form onSubmit={handleSubmit} className="device-form">
        <div className="form-group">
          <label>
            <Battery size={20} />
            Device Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="My DJI Mavic 3"
            required
          />
        </div>

        <div className="form-group">
          <label>Device Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          >
            {deviceTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>
            <Battery size={20} />
            Current Charge Level (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.currentCharge}
            onChange={(e) => setFormData({ ...formData, currentCharge: parseInt(e.target.value) })}
            required
          />
        </div>

        <div className="form-group">
          <label>Battery Chemistry</label>
          <select
            value={formData.chemistry}
            onChange={(e) => setFormData({ ...formData, chemistry: e.target.value })}
            required
          >
            <option value="LiPo">LiPo</option>
            <option value="Li-ion">Li-ion</option>
            <option value="NiMH">NiMH</option>
            <option value="Lead-Acid">Lead-Acid</option>
          </select>
        </div>

        <button type="submit" className="btn-primary">
          Add Device
        </button>
      </form>
    </div>
  );
};

export default AddDevice;
