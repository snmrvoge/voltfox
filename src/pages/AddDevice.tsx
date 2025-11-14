// src/pages/AddDevice.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Battery, ArrowLeft, Upload, Image as ImageIcon, Sparkles, Search, Camera } from 'lucide-react';
import { useDevices } from '../context/DeviceContext';
import { useAuth } from '../context/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '../config/firebase';
import { doc, getDoc, updateDoc, increment, collection, getDocs, query, setDoc, where, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { analyzeDeviceImage, mapToDeviceType } from '../utils/aiService';
import { AutocompleteInput } from '../components/AutocompleteInput';
import { BatteryManager } from '../components/BatteryManager';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { DeviceWizard } from '../components/DeviceWizard';

interface CommunityDevice {
  id: string;
  type: string;
  brand: string;
  model: string;
  userCount: number;
  totalHealthSum: number;
  avgHealth: number;
  imageUrl?: string;
  icon?: string;
  createdAt: string;
}

const AddDevice: React.FC = () => {
  const navigate = useNavigate();
  const { addDevice } = useDevices();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    type: 'drone',
    icon: '🔋',
    imageUrl: '',
    chemistry: 'LiPo',
    dischargeRate: 1.0,
    health: 100,
    status: 'healthy' as 'healthy' | 'warning' | 'critical' | 'dead',
    currentCharge: 100,
    lastCharged: new Date().toISOString(),
    reminderFrequency: 30,
    // Insurance fields
    purchaseDate: '',
    purchasePrice: undefined as number | undefined,
    currentValue: undefined as number | undefined,
    serialNumber: '',
    warrantyUntil: ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageSource, setImageSource] = useState<'emoji' | 'upload'>('emoji');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showInsuranceFields, setShowInsuranceFields] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showWizard, setShowWizard] = useState(true);

  // Community device linking
  const [communityDevices, setCommunityDevices] = useState<CommunityDevice[]>([]);
  const [selectedCommunityDevice, setSelectedCommunityDevice] = useState<CommunityDevice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCommunitySearch, setShowCommunitySearch] = useState(false);
  const [hasOptedIn, setHasOptedIn] = useState(false);
  const [shareWithCommunity, setShareWithCommunity] = useState(false);

  // Autocomplete suggestions
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);

  // Multi-battery support
  const [batteries, setBatteries] = useState<any[]>([]);

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

  // Load community settings
  useEffect(() => {
    const loadCommunitySettings = async () => {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setHasOptedIn(data?.communitySettings?.shareDataWithCommunity || false);
        }
      } catch (error) {
        console.error('Error loading community settings:', error);
      }
    };
    loadCommunitySettings();
  }, [currentUser]);

  // Load community devices for autocomplete
  useEffect(() => {
    const loadCommunityDevices = async () => {
      try {
        const devicesQuery = query(collection(db, 'communityDevices'));
        const querySnapshot = await getDocs(devicesQuery);
        const devices: CommunityDevice[] = [];
        querySnapshot.forEach((doc) => {
          devices.push({
            id: doc.id,
            ...doc.data()
          } as CommunityDevice);
        });
        setCommunityDevices(devices);

        // Extract unique brands for autocomplete
        const uniqueBrands = Array.from(new Set(devices.map(d => d.brand).filter(Boolean)));
        setBrandSuggestions(uniqueBrands.sort());

        console.log(`Loaded ${devices.length} community devices for autocomplete`);
      } catch (error) {
        console.error('Error loading community devices:', error);
        // Set empty arrays on error so the component doesn't break
        setCommunityDevices([]);
        setBrandSuggestions([]);
        // Don't show error to user - autocomplete will just be empty
      }
    };
    loadCommunityDevices();
  }, []);

  // Update model suggestions when brand changes
  useEffect(() => {
    if (formData.brand && communityDevices.length > 0) {
      const modelsForBrand = communityDevices
        .filter(d => d.brand.toLowerCase() === formData.brand.toLowerCase())
        .map(d => d.model)
        .filter(Boolean);
      const uniqueModels = Array.from(new Set(modelsForBrand));
      setModelSuggestions(uniqueModels.sort());
    } else {
      setModelSuggestions([]);
    }
  }, [formData.brand, communityDevices]);

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

  const handleBarcodeScan = async (barcode: string, result: any) => {
    console.log('Barcode gescannt:', barcode, result);
    toast.loading('🔍 Suche Produktinformationen...', { id: 'barcode-lookup' });

    try {
      // Try to lookup product info from Open Food Facts API or similar
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;

        // Fill in the form with product data
        setFormData({
          ...formData,
          name: product.product_name || barcode,
          brand: product.brands || '',
          model: product.generic_name || '',
          serialNumber: barcode
        });

        toast.success('✅ Produkt gefunden!', { id: 'barcode-lookup' });
      } else {
        // No product found, just fill in the barcode
        setFormData({
          ...formData,
          serialNumber: barcode,
          name: `Gerät (${barcode})`
        });

        toast.success('📦 Barcode gespeichert', { id: 'barcode-lookup' });
      }
    } catch (error) {
      console.error('Barcode lookup error:', error);
      // Still save the barcode even if lookup fails
      setFormData({
        ...formData,
        serialNumber: barcode,
        name: `Gerät (${barcode})`
      });

      toast.success('📦 Barcode gespeichert', { id: 'barcode-lookup' });
    }

    setShowBarcodeScanner(false);
  };

  const handlePhotoCapture = async (imageFile: File) => {
    console.log('📸 Foto aufgenommen:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type,
      sizeMB: (imageFile.size / 1024 / 1024).toFixed(2) + ' MB'
    });

    setShowBarcodeScanner(false);
    setUploadedFile(imageFile);

    // Upload the image first
    if (!currentUser) {
      toast.error('Bitte erst anmelden');
      return;
    }

    setUploadingImage(true);
    try {
      console.log('🔄 Starting upload...');
      console.log('Storage bucket:', storage.app.options.storageBucket);

      toast.loading('📸 Foto wird verarbeitet...', { id: 'upload-progress' });

      const timestamp = Date.now();
      const fileName = `${timestamp}_${imageFile.name}`;
      const storagePath = `device-images/${currentUser.uid}/new/${fileName}`;

      console.log('📦 Upload path:', storagePath);
      const storageRef = ref(storage, storagePath);

      console.log('⬆️ Uploading to Firebase Storage...');
      toast.loading('⬆️ Bild wird hochgeladen...', { id: 'upload-progress' });

      await uploadBytes(storageRef, imageFile);

      console.log('✅ Upload complete, getting URL...');
      toast.loading('📥 Bild wird gespeichert...', { id: 'upload-progress' });

      const url = await getDownloadURL(storageRef);
      console.log('🔗 Download URL:', url);

      setFormData({ ...formData, imageUrl: url, icon: '' });
      setImageSource('upload');

      toast.success('✅ Bild hochgeladen!', { id: 'upload-progress', duration: 1000 });

      console.log('🤖 Starting AI analysis...');
      toast.loading('🤖 KI analysiert dein Gerät...', { id: 'ai-analysis' });

      // Now analyze with AI
      await handleAIAnalysisWithFile(imageFile);
    } catch (error: any) {
      console.error('❌ Upload Fehler:', error);
      console.error('Error details:', {
        code: error?.code,
        message: error?.message,
        name: error?.name,
        serverResponse: error?.serverResponse
      });

      let errorMessage = '❌ Upload fehlgeschlagen';
      if (error?.code === 'storage/unauthorized') {
        errorMessage = '❌ Keine Berechtigung zum Hochladen';
      } else if (error?.code === 'storage/object-not-found') {
        errorMessage = '❌ Storage Bucket nicht gefunden';
      } else if (error?.message?.includes('CORS')) {
        errorMessage = '❌ CORS-Fehler - bitte Storage Bucket prüfen';
      } else if (error?.message) {
        errorMessage = `❌ Fehler: ${error.message}`;
      }

      toast.error(errorMessage, { id: 'upload-progress', duration: 10000 });

      // Show storage bucket info for debugging
      console.error('Storage bucket config:', storage.app.options.storageBucket);
    } finally {
      setUploadingImage(false);
      console.log('🏁 Upload process finished');
    }
  };

  const handleAIAnalysisWithFile = async (file: File) => {
    setIsAnalyzing(true);
    try {
      toast.loading('🤖 KI analysiert das Gerät...', { id: 'ai-analysis' });

      const result = await analyzeDeviceImage(file);
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

      if (result.brand) {
        updates.brand = result.brand;
      }

      if (result.model) {
        updates.model = result.model;
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
        `✅ Gerät erkannt: ${updates.name || 'Unbekannt'}`,
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

    try {
      // Clean up formData: only include filled fields
      const cleanedData: any = {
        name: formData.name,
        brand: formData.brand || '',
        model: formData.model || '',
        type: formData.type,
        chemistry: formData.chemistry,
        dischargeRate: formData.dischargeRate,
        health: formData.health,
        status: formData.status,
        currentCharge: formData.currentCharge,
        lastCharged: formData.lastCharged,
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

      // Only add insurance fields if they have values
      if (formData.purchaseDate) cleanedData.purchaseDate = formData.purchaseDate;
      if (formData.purchasePrice !== undefined && formData.purchasePrice > 0) {
        cleanedData.purchasePrice = formData.purchasePrice;
      }
      if (formData.currentValue !== undefined && formData.currentValue > 0) {
        cleanedData.currentValue = formData.currentValue;
      }
      if (formData.serialNumber) cleanedData.serialNumber = formData.serialNumber;
      if (formData.warrantyUntil) cleanedData.warrantyUntil = formData.warrantyUntil;

      // Add batteries if any
      if (batteries.length > 0) {
        cleanedData.batteries = batteries;
      }

      // Add community device reference if linked
      if (selectedCommunityDevice && hasOptedIn) {
        cleanedData.communityDeviceId = selectedCommunityDevice.id;
      }

      // Handle sharing with community
      if (shareWithCommunity && formData.brand && formData.model) {
        try {
          // Create sanitized ID from brand+model
          const sanitizedBrand = formData.brand.toLowerCase().replace(/[^a-z0-9]/g, '-');
          const sanitizedModel = formData.model.toLowerCase().replace(/[^a-z0-9]/g, '-');
          const communityDeviceId = `${sanitizedBrand}-${sanitizedModel}`;

          const communityDeviceRef = doc(db, 'communityDevices', communityDeviceId);
          const communityDeviceSnap = await getDoc(communityDeviceRef);

          if (communityDeviceSnap.exists()) {
            // Device already exists - increment counters
            const existingData = communityDeviceSnap.data();
            const newUserCount = (existingData.userCount || 0) + 1;
            const newTotalHealthSum = (existingData.totalHealthSum || 0) + formData.health;
            const newAvgHealth = Math.round(newTotalHealthSum / newUserCount);

            await updateDoc(communityDeviceRef, {
              userCount: newUserCount,
              totalHealthSum: newTotalHealthSum,
              avgHealth: newAvgHealth
            });

            console.log(`Updated existing community device: ${communityDeviceId}`);
          } else {
            // Device doesn't exist - create new one
            await setDoc(communityDeviceRef, {
              brand: formData.brand,
              model: formData.model,
              type: formData.type,
              icon: formData.icon || '🔋',
              imageUrl: formData.imageUrl || '',
              userCount: 1,
              totalHealthSum: formData.health,
              avgHealth: formData.health,
              createdAt: serverTimestamp()
            });

            console.log(`Created new community device: ${communityDeviceId}`);
          }

          // Link user's device to community device
          cleanedData.communityDeviceId = communityDeviceId;
        } catch (error) {
          console.error('Error sharing with community:', error);
          // Don't block device creation if community sharing fails
          toast.error('Community-Freigabe fehlgeschlagen, aber Gerät wird hinzugefügt');
        }
      }

      await addDevice(cleanedData);

      // Update community device statistics if linked and opted in (but not if we already shared with community above)
      if (selectedCommunityDevice && hasOptedIn && !shareWithCommunity) {
        try {
          const communityDeviceRef = doc(db, 'communityDevices', selectedCommunityDevice.id);
          await updateDoc(communityDeviceRef, {
            userCount: increment(1),
            totalHealthSum: increment(formData.health),
            avgHealth: Math.round((selectedCommunityDevice.totalHealthSum + formData.health) / (selectedCommunityDevice.userCount + 1))
          });
          toast.success('Gerät hinzugefügt und mit Community verknüpft!');
        } catch (error) {
          console.error('Error updating community device stats:', error);
          toast.success('Gerät hinzugefügt!');
        }
      } else if (shareWithCommunity) {
        toast.success('🌍 Gerät hinzugefügt und mit Community geteilt!');
      } else {
        toast.success('Gerät hinzugefügt!');
      }

      navigate('/devices');
    } catch (error) {
      console.error('Error adding device:', error);
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

      {showWizard ? (
        <DeviceWizard
          onCommunitySearch={() => {
            setShowWizard(false);
            setShowCommunitySearch(true);
          }}
          onCameraCapture={() => {
            setShowWizard(false);
            setShowBarcodeScanner(true);
          }}
          onComplete={() => {
            navigate('/devices');
          }}
        />
      ) : (
        <>
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
          <AutocompleteInput
            value={formData.brand}
            onChange={(value) => setFormData({ ...formData, brand: value })}
            suggestions={brandSuggestions}
            placeholder="DJI, Apple, Bosch..."
            label="Brand / Hersteller"
          />
        </div>

        <div className="form-group">
          <AutocompleteInput
            value={formData.model}
            onChange={(value) => setFormData({ ...formData, model: value })}
            suggestions={modelSuggestions}
            placeholder="Mavic 3, iPhone 15 Pro..."
            label="Model / Modell"
            disabled={!formData.brand}
          />
        </div>

        {/* Share with Community Checkbox */}
        {formData.brand && formData.model && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
            borderRadius: '12px',
            border: '2px solid rgba(102, 126, 234, 0.2)'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              cursor: 'pointer',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={shareWithCommunity}
                onChange={(e) => setShareWithCommunity(e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  marginTop: '2px',
                  cursor: 'pointer',
                  accentColor: '#667eea'
                }}
              />
              <div>
                <div style={{ fontWeight: 600, color: '#2E3A4B', marginBottom: '0.25rem' }}>
                  🌍 Mit Community teilen
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666', lineHeight: '1.4' }}>
                  Teile dein {formData.brand} {formData.model} mit anderen Nutzern und trage zur Community-Datenbank bei. Dein Gerät wird automatisch verlinkt.
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Community Device Search */}
        {hasOptedIn && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            borderRadius: '12px',
            border: '2px solid rgba(102, 126, 234, 0.3)'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#2E3A4B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={20} color="#667eea" />
                Community-Gerät verknüpfen (optional)
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                Suche nach deinem Gerät in der Community-Datenbank und nutze das Referenzbild
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCommunitySearch(!showCommunitySearch)}
              style={{
                padding: '0.75rem 1.5rem',
                background: showCommunitySearch ? '#667eea' : 'white',
                color: showCommunitySearch ? 'white' : '#667eea',
                border: '2px solid #667eea',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s',
                marginBottom: showCommunitySearch ? '1rem' : '0'
              }}
            >
              {showCommunitySearch ? 'Suche schließen' : 'Community-Geräte durchsuchen'}
            </button>

            {showCommunitySearch && (
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={formData.brand ? `Suche nach Modell oder Typ in ${formData.brand}-Geräten...` : "Suche nach Marke, Modell oder Typ..."}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    marginBottom: '1rem'
                  }}
                />

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {communityDevices
                    .filter(d => {
                      // First filter: if brand is entered, only show devices of that brand
                      if (formData.brand && d.brand.toLowerCase() !== formData.brand.toLowerCase()) {
                        return false;
                      }

                      // Second filter: search query within the filtered brand
                      if (searchQuery) {
                        return d.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                               d.type.toLowerCase().includes(searchQuery.toLowerCase());
                      }

                      return true;
                    })
                    .slice(0, 10)
                    .map((device) => (
                      <div
                        key={device.id}
                        onClick={() => {
                          setSelectedCommunityDevice(device);
                          setFormData({
                            ...formData,
                            brand: device.brand,
                            model: device.model,
                            type: device.type,
                            imageUrl: device.imageUrl || '',
                            icon: device.icon || formData.icon
                          });
                          setShowCommunitySearch(false);
                          toast.success(`Mit ${device.brand} ${device.model} verknüpft!`);
                        }}
                        style={{
                          padding: '1rem',
                          background: selectedCommunityDevice?.id === device.id ? '#F3F4F6' : 'white',
                          border: selectedCommunityDevice?.id === device.id ? '2px solid #667eea' : '1px solid #E5E7EB',
                          borderRadius: '8px',
                          marginBottom: '0.5rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem'
                        }}
                        onMouseOver={(e) => {
                          if (selectedCommunityDevice?.id !== device.id) {
                            e.currentTarget.style.background = '#F9FAFB';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (selectedCommunityDevice?.id !== device.id) {
                            e.currentTarget.style.background = 'white';
                          }
                        }}
                      >
                        {device.imageUrl ? (
                          <img
                            src={device.imageUrl}
                            alt={`${device.brand} ${device.model}`}
                            style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '8px',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '50px',
                            height: '50px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem'
                          }}>
                            {device.icon || '🔋'}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#2E3A4B' }}>
                            {device.brand} {device.model}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#666' }}>
                            {device.type} • {device.userCount} Nutzer • Ø {device.avgHealth}% Gesundheit
                          </div>
                        </div>
                      </div>
                    ))}
                  {communityDevices.filter(d => {
                    if (formData.brand && d.brand.toLowerCase() !== formData.brand.toLowerCase()) {
                      return false;
                    }
                    if (searchQuery) {
                      return d.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             d.type.toLowerCase().includes(searchQuery.toLowerCase());
                    }
                    return true;
                  }).length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                      {formData.brand
                        ? `Keine ${formData.brand}-Geräte gefunden. Du kannst das Gerät über die Checkbox "Mit Community teilen" hinzufügen.`
                        : 'Keine passenden Geräte gefunden. Du kannst das Gerät später in der Community-Seite hinzufügen.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedCommunityDevice && !showCommunitySearch && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'white',
                borderRadius: '8px',
                border: '2px solid #667eea',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                {selectedCommunityDevice.imageUrl ? (
                  <img
                    src={selectedCommunityDevice.imageUrl}
                    alt={`${selectedCommunityDevice.brand} ${selectedCommunityDevice.model}`}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '8px',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem'
                  }}>
                    {selectedCommunityDevice.icon || '🔋'}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#2E3A4B' }}>
                    Verknüpft mit: {selectedCommunityDevice.brand} {selectedCommunityDevice.model}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    Deine Daten werden zur Community-Statistik beitragen
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCommunityDevice(null);
                    toast.success('Verknüpfung entfernt');
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >
                  Entfernen
                </button>
              </div>
            )}
          </div>
        )}

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

                  {/* AI Analysis Result Box */}
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
                        onMouseOver={(e) => (e.currentTarget.style.background = '#047857')}
                        onMouseOut={(e) => (e.currentTarget.style.background = '#059669')}
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
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <label
                  style={{
                    flex: 1,
                    minWidth: '200px',
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

                <button
                  type="button"
                  onClick={() => setShowBarcodeScanner(true)}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '2rem',
                    background: '#f5f5f5',
                    border: '2px dashed #10B981',
                    borderRadius: '8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  <Camera size={32} style={{ margin: '0 auto 1rem', color: '#10B981' }} />
                  <p style={{ color: '#10B981', fontWeight: 600, margin: 0 }}>
                    📷 Mit Kamera scannen
                  </p>
                  <p style={{ color: '#666', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                    Objekt oder Barcode
                  </p>
                </button>
              </div>
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

        {/* Battery Management Section */}
        <BatteryManager
          batteries={batteries}
          onBatteriesChange={setBatteries}
          deviceName={formData.name || 'Neues Gerät'}
        />

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

        <button type="submit" className="btn-primary">
          Add Device
        </button>
      </form>
        </>
      )}

      {/* Camera Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScanSuccess={handleBarcodeScan}
          onPhotoCapture={handlePhotoCapture}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
    </div>
  );
};

export default AddDevice;
