// src/pages/AddDevice.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Battery, ArrowLeft, Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useDevices } from '../context/DeviceContext';
import { useAuth } from '../context/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import toast from 'react-hot-toast';
import { analyzeDeviceImage, mapToDeviceType } from '../utils/aiService';

const AddDevice: React.FC = () => {
  const navigate = useNavigate();
  const { addDevice } = useDevices();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    type: 'drone',
    icon: '🔋',
    imageUrl: '',
    chemistry: 'LiPo',
    dischargeRate: 1.0,
    health: 100,
    status: 'healthy' as 'healthy' | 'warning' | 'critical' | 'dead',
    currentCharge: 100,
    lastCharged: new Date().toISOString(),
    reminderFrequency: 30
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageSource, setImageSource] = useState<'emoji' | 'upload'>('emoji');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const communityIcons = [
    '🔋', '⚡', '🔌', '📱', '💻', '🎧', '📷', '🎮',
    '⌚', '🚁', '🚲', '🔊', '🎵', '💡', '🔦', '⏰'
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) {
      console.log('Upload abgebrochen:', { file: !!file, currentUser: !!currentUser });
      if (!file) toast.error('Keine Datei ausgewählt');
      if (!currentUser) toast.error('Bitte erst anmelden');
      return;
    }

    console.log('Starte Upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: currentUser.uid
    });

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bild darf maximal 5MB groß sein');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Bitte nur Bilddateien hochladen');
      return;
    }

    setUploadingImage(true);
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storagePath = `device-images/${currentUser.uid}/new/${fileName}`;

      console.log('Upload zu:', storagePath);

      const storageRef = ref(storage, storagePath);
      console.log('Uploading file...');
      await uploadBytes(storageRef, file);

      console.log('Getting download URL...');
      const url = await getDownloadURL(storageRef);
      console.log('Download URL:', url);

      setFormData({ ...formData, imageUrl: url, icon: '' });
      setImageSource('upload');
      setUploadedFile(file);
      toast.success('Bild erfolgreich hochgeladen!');
    } catch (error: any) {
      console.error('Upload Fehler:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);

      let errorMessage = 'Fehler beim Hochladen';
      if (error?.code === 'storage/unauthorized') {
        errorMessage = 'Keine Berechtigung zum Hochladen. Bitte Firebase Storage Rules prüfen.';
      } else if (error?.message) {
        errorMessage = `Fehler: ${error.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (!uploadedFile) {
      toast.error('Bitte erst ein Bild hochladen');
      return;
    }

    setIsAnalyzing(true);
    try {
      toast.loading('🤖 KI analysiert das Bild...', { id: 'ai-analysis' });

      const result = await analyzeDeviceImage(uploadedFile);

      console.log('AI Analysis Result:', result);

      // Auto-fill form fields with AI results
      const updates: any = {};

      if (result.deviceName) {
        updates.name = result.deviceName;
      } else if (result.brand && result.model) {
        updates.name = `${result.brand} ${result.model}`;
      } else if (result.brand) {
        updates.name = result.brand;
      }

      if (result.deviceType) {
        updates.type = mapToDeviceType(result.deviceType);
      }

      if (result.batteryType) {
        updates.chemistry = result.batteryType;
      }

      setFormData({ ...formData, ...updates });

      toast.success(
        `KI-Analyse abgeschlossen! (${result.confidence}% Sicherheit)`,
        { id: 'ai-analysis' }
      );

      // Show detailed results
      if (result.deviceName || result.brand) {
        toast.success(`Erkannt: ${result.deviceName || result.brand}`, { duration: 4000 });
      }
      if (result.batteryType) {
        toast.success(`Batterie: ${result.batteryType}`, { duration: 4000 });
      }

    } catch (error: any) {
      console.error('AI Analysis Error:', error);
      toast.error(error.message || 'KI-Analyse fehlgeschlagen', { id: 'ai-analysis' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addDevice(formData);
      toast.success('Gerät hinzugefügt!');
      navigate('/devices');
    } catch (error) {
      toast.error('Fehler beim Hinzufügen');
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
            <ImageIcon size={20} />
            Gerätebild
          </label>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => {
                setImageSource('emoji');
                setFormData({ ...formData, imageUrl: '', icon: formData.icon || '🔋' });
              }}
              style={{
                padding: '0.5rem 1rem',
                background: imageSource === 'emoji' ? 'var(--vf-primary)' : 'transparent',
                color: imageSource === 'emoji' ? 'white' : 'var(--vf-primary)',
                border: '2px solid var(--vf-primary)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Community Icons
            </button>
            <button
              type="button"
              onClick={() => setImageSource('upload')}
              style={{
                padding: '0.5rem 1rem',
                background: imageSource === 'upload' ? 'var(--vf-primary)' : 'transparent',
                color: imageSource === 'upload' ? 'white' : 'var(--vf-primary)',
                border: '2px solid var(--vf-primary)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <Upload size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
              Eigenes Bild
            </button>
          </div>

          {imageSource === 'emoji' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '0.5rem',
              padding: '1rem',
              background: '#f5f5f5',
              borderRadius: '8px'
            }}>
              {communityIcons.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: emoji, imageUrl: '' })}
                  style={{
                    fontSize: '2rem',
                    padding: '0.5rem',
                    background: formData.icon === emoji ? 'var(--vf-primary)' : 'white',
                    border: '2px solid',
                    borderColor: formData.icon === emoji ? 'var(--vf-primary)' : '#ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            <div>
              {formData.imageUrl && (
                <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                  <img
                    src={formData.imageUrl}
                    alt="Device"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      objectFit: 'cover'
                    }}
                  />

                  {/* AI Analysis Button */}
                  {uploadedFile && (
                    <button
                      type="button"
                      onClick={handleAIAnalysis}
                      disabled={isAnalyzing}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        margin: '1rem auto 0',
                        padding: '0.75rem 1.5rem',
                        background: isAnalyzing
                          ? '#ccc'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                        transition: 'all 0.3s',
                        opacity: isAnalyzing ? 0.6 : 1
                      }}
                    >
                      <Sparkles size={18} />
                      {isAnalyzing ? 'Analysiere...' : '🤖 Mit KI analysieren (BETA)'}
                    </button>
                  )}
                </div>
              )}
              <label
                style={{
                  display: 'block',
                  padding: '2rem',
                  background: '#f5f5f5',
                  border: '2px dashed var(--vf-primary)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                <Upload size={32} style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--vf-primary)', fontWeight: 600 }}>
                  {uploadingImage ? 'Wird hochgeladen...' : 'Bild hochladen (max. 5MB)'}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}
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
