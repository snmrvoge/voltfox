// src/pages/EditDevice.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Battery, Trash2, ArrowLeft, Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useDevices } from '../context/DeviceContext';
import { useAuth } from '../context/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import toast from 'react-hot-toast';
import { analyzeDeviceImage, mapToDeviceType } from '../utils/aiService';
import { DeviceHistory } from '../components/DeviceHistory';

const EditDevice: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { devices, updateDevice, deleteDevice } = useDevices();
  const { currentUser } = useAuth();

  const device = devices.find(d => d.id === id);

  const [formData, setFormData] = useState({
    name: '',
    type: 'drone',
    icon: '🔋',
    imageUrl: '',
    chemistry: 'LiPo',
    dischargeRate: 1.0,
    currentCharge: 100,
    health: 100,
    reminderFrequency: 30,
    // Insurance fields
    purchaseDate: '',
    purchasePrice: undefined as number | undefined,
    currentValue: undefined as number | undefined,
    serialNumber: '',
    warrantyUntil: ''
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageSource, setImageSource] = useState<'emoji' | 'upload'>('emoji');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showInsuranceFields, setShowInsuranceFields] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name,
        type: device.type,
        icon: device.icon || '🔋',
        imageUrl: device.imageUrl || '',
        chemistry: device.chemistry,
        dischargeRate: device.dischargeRate,
        currentCharge: device.currentCharge,
        health: device.health || 100,
        reminderFrequency: device.reminderFrequency,
        // Insurance fields
        purchaseDate: device.purchaseDate || '',
        purchasePrice: device.purchasePrice,
        currentValue: device.currentValue,
        serialNumber: device.serialNumber || '',
        warrantyUntil: device.warrantyUntil || ''
      });
      setImageSource(device.imageUrl ? 'upload' : 'emoji');
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
    'rc-car',
    'other'
  ];

  const communityIcons = [
    '🔋', '⚡', '🔌', '📱', '💻', '🎧', '📷', '🎮',
    '⌚', '🚁', '🚲', '🏎️', '🚗', '🔊', '🎵', '💡', '🔦', '⏰'
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !id) {
      console.log('Upload abgebrochen:', { file: !!file, currentUser: !!currentUser, id: !!id });
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

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bild darf maximal 5MB groß sein');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte nur Bilddateien hochladen');
      return;
    }

    setUploadingImage(true);
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storagePath = `device-images/${currentUser.uid}/${id}/${fileName}`;

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
      setAiResult(result);

      toast.success(
        `✅ KI-Analyse abgeschlossen!`,
        { id: 'ai-analysis', duration: 3000 }
      );

    } catch (error: any) {
      console.error('AI Analysis Error:', error);
      toast.error(error.message || 'KI-Analyse fehlgeschlagen', { id: 'ai-analysis' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    try {
      // Clean up formData: remove undefined values and empty strings from optional fields
      const cleanedData: any = {
        name: formData.name,
        type: formData.type,
        chemistry: formData.chemistry,
        dischargeRate: formData.dischargeRate,
        currentCharge: formData.currentCharge,
        health: formData.health,
        reminderFrequency: formData.reminderFrequency
      };

      // Add icon or imageUrl
      if (formData.imageUrl) {
        cleanedData.imageUrl = formData.imageUrl;
        cleanedData.icon = '';
      } else {
        cleanedData.icon = formData.icon;
        cleanedData.imageUrl = '';
      }

      // Add optional insurance fields only if they have values
      if (formData.purchaseDate) cleanedData.purchaseDate = formData.purchaseDate;
      if (formData.purchasePrice !== undefined && formData.purchasePrice > 0) {
        cleanedData.purchasePrice = formData.purchasePrice;
      }
      if (formData.currentValue !== undefined && formData.currentValue > 0) {
        cleanedData.currentValue = formData.currentValue;
      }
      if (formData.serialNumber) cleanedData.serialNumber = formData.serialNumber;
      if (formData.warrantyUntil) cleanedData.warrantyUntil = formData.warrantyUntil;

      console.log('Saving device with data:', cleanedData);

      await updateDevice(id, cleanedData);
      toast.success('Änderungen gespeichert!');
      navigate('/devices');
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!id) return;

    try {
      await deleteDevice(id);
      toast.success('Gerät gelöscht');
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
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: isAnalyzing ? '12px' : '8px',
                        margin: '1rem auto 0',
                        padding: isAnalyzing ? '1rem 1.5rem' : '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                        transition: 'all 0.3s',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Sparkles
                          size={24}
                          style={{
                            animation: isAnalyzing ? 'spin 2s linear infinite' : 'none',
                            filter: isAnalyzing ? 'drop-shadow(0 0 8px rgba(255,215,0,0.8))' : 'none'
                          }}
                        />
                        <span style={{ fontSize: '1rem', fontWeight: 700 }}>
                          {isAnalyzing ? '🤖 Analysiere Bild...' : '🤖 Mit KI analysieren (BETA)'}
                        </span>
                      </div>
                      {isAnalyzing && (
                        <span style={{
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          opacity: 0.95,
                          animation: 'pulse 2s ease-in-out infinite'
                        }}>
                          ⏳ Bitte um Geduld, das kann bis zu 30 Sekunden dauern
                        </span>
                      )}
                      <style>{`
                        @keyframes spin {
                          from { transform: rotate(0deg); }
                          to { transform: rotate(360deg); }
                        }
                        @keyframes pulse {
                          0%, 100% { opacity: 0.9; }
                          50% { opacity: 1; }
                        }
                      `}</style>
                    </button>
                  )}

                  {/* AI Result Confirmation Box */}
                  {aiResult && !isAnalyzing && (
                    <div style={{
                      marginTop: '1.5rem',
                      padding: '1.5rem',
                      background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                      border: '3px solid #10B981',
                      borderRadius: '12px',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                      animation: 'slideIn 0.4s ease-out'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '1rem'
                      }}>
                        <Sparkles size={24} color="#059669" />
                        <h3 style={{
                          margin: 0,
                          color: '#065F46',
                          fontSize: '1.1rem',
                          fontWeight: 700
                        }}>
                          ✅ Erkannt - Bitte überprüfen!
                        </h3>
                      </div>

                      <div style={{ color: '#065F46', fontSize: '0.95rem', lineHeight: '1.8' }}>
                        {(aiResult.deviceName || aiResult.brand) && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Gerät:</strong> {aiResult.deviceName || `${aiResult.brand} ${aiResult.model || ''}`.trim()}
                          </div>
                        )}
                        {aiResult.deviceType && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Typ:</strong> {aiResult.deviceType}
                          </div>
                        )}
                        {aiResult.batteryType && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Batterie:</strong> {aiResult.batteryType}
                          </div>
                        )}
                        {aiResult.confidence && (
                          <div style={{ marginTop: '0.8rem', fontSize: '0.9rem', opacity: 0.8 }}>
                            <strong>Sicherheit:</strong> {aiResult.confidence}%
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setAiResult(null)}
                        style={{
                          marginTop: '1rem',
                          padding: '0.5rem 1rem',
                          background: '#059669',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#047857'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#059669'}
                      >
                        OK, verstanden
                      </button>

                      <style>{`
                        @keyframes slideIn {
                          from {
                            opacity: 0;
                            transform: translateY(-20px);
                          }
                          to {
                            opacity: 1;
                            transform: translateY(0);
                          }
                        }
                      `}</style>
                    </div>
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
            Aktueller Ladestand (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.currentCharge}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setFormData({ ...formData, currentCharge: isNaN(value) ? 0 : value });
            }}
            required
          />
        </div>

        <div className="form-group">
          <label>
            💊 Batteriegesundheit (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.health}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setFormData({ ...formData, health: isNaN(value) ? 0 : value });
            }}
            required
          />
          <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
            100% = Neu, 80-99% = Gut, 60-79% = Mittel, {'<'}60% = Schwach
          </small>
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
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setFormData({ ...formData, dischargeRate: isNaN(value) ? 0 : value });
            }}
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
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setFormData({ ...formData, reminderFrequency: isNaN(value) ? 30 : value });
            }}
            required
          />
        </div>

        {/* Insurance Information Section */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 210, 63, 0.1) 100%)',
          borderRadius: '12px',
          border: '2px solid rgba(255, 107, 53, 0.3)'
        }}>
          <div
            onClick={() => setShowInsuranceFields(!showInsuranceFields)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              marginBottom: showInsuranceFields ? '1.5rem' : '0'
            }}
          >
            <h3 style={{ margin: 0, color: 'var(--vf-primary)' }}>
              🛡️ Versicherungsangaben (optional)
            </h3>
            <span style={{ fontSize: '1.5rem', transition: 'transform 0.3s', transform: showInsuranceFields ? 'rotate(180deg)' : 'rotate(0)' }}>
              ▼
            </span>
          </div>

          {showInsuranceFields && (
            <div>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Dokumentiere deine Gerätewerte für Versicherungszwecke
              </p>

              <div className="form-group">
                <label>Kaufdatum</label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Kaufpreis (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchasePrice || ''}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="999.99"
                />
              </div>

              <div className="form-group">
                <label>Aktueller Wert (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.currentValue || ''}
                  onChange={(e) => setFormData({ ...formData, currentValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="799.99"
                />
              </div>

              <div className="form-group">
                <label>Seriennummer</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="SN123456789"
                />
              </div>

              <div className="form-group">
                <label>Garantie bis</label>
                <input
                  type="date"
                  value={formData.warrantyUntil}
                  onChange={(e) => setFormData({ ...formData, warrantyUntil: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Device History Section */}
        {id && device && (
          <DeviceHistory
            deviceId={id}
            deviceName={formData.name}
          />
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="submit" className="btn-primary" style={{ flex: 1 }}>
            Änderungen speichern
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="btn-primary"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Trash2 size={18} />
            Löschen
          </button>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{
              color: '#2E3A4B',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Trash2 size={24} color="#EF4444" />
              Gerät wirklich löschen?
            </h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              Möchtest du <strong>"{device?.name}"</strong> wirklich dauerhaft löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Trash2 size={18} />
                Ja, löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditDevice;
