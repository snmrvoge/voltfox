// src/pages/EditDevice.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Battery, Trash2, ArrowLeft } from 'lucide-react';
import { useDevices } from '../context/DeviceContext';
import toast from 'react-hot-toast';

const EditDevice: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { devices, updateDevice, deleteDevice } = useDevices();

  const device = devices.find(d => d.id === id);

  const [formData, setFormData] = useState({
    name: '',
    type: 'drone',
    icon: '🔋',
    chemistry: 'LiPo',
    dischargeRate: 1.0,
    currentCharge: 100,
    reminderFrequency: 30
  });

  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name,
        type: device.type,
        icon: device.icon,
        chemistry: device.chemistry,
        dischargeRate: device.dischargeRate,
        currentCharge: device.currentCharge,
        reminderFrequency: device.reminderFrequency
      });
    }
  }, [device]);

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

    if (!id) return;

    try {
      await updateDevice(id, formData);
      navigate('/devices');
    } catch (error) {
      console.error('Error updating device:', error);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    const confirmed = window.confirm(`Möchtest du "${device?.name}" wirklich löschen?`);
    if (!confirmed) return;

    try {
      await deleteDevice(id);
      navigate('/devices');
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  if (!device) {
    return (
      <div className="add-device-page">
        <div className="page-header">
          <h1>Gerät nicht gefunden</h1>
        </div>
        <p>Das Gerät konnte nicht gefunden werden.</p>
      </div>
    );
  }

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
        <h1>🦊 Gerät bearbeiten</h1>
        <p>Aktualisiere die Details deines Geräts</p>
      </div>

      <form onSubmit={handleSubmit} className="device-form">
        <div className="form-group">
          <label>
            <Battery size={20} />
            Gerätename
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Mein DJI Mavic 3"
            required
          />
        </div>

        <div className="form-group">
          <label>Gerätetyp</label>
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
            Aktueller Ladestand (%)
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
          <label>Batteriechemie</label>
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

        <div className="form-group">
          <label>Entladerate (%/Tag)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.dischargeRate}
            onChange={(e) => setFormData({ ...formData, dischargeRate: parseFloat(e.target.value) })}
            required
          />
        </div>

        <div className="form-group">
          <label>Erinnerungsintervall (Tage)</label>
          <input
            type="number"
            min="1"
            max="365"
            value={formData.reminderFrequency}
            onChange={(e) => setFormData({ ...formData, reminderFrequency: parseInt(e.target.value) })}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="submit" className="btn-primary" style={{ flex: 1 }}>
            Änderungen speichern
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="btn-danger"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Trash2 size={18} />
            Löschen
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditDevice;
