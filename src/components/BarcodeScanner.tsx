// src/components/BarcodeScanner.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, QrCode, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
  onPhotoCapture?: (imageFile: File) => void;
  onClose: () => void;
  mode?: 'barcode' | 'object';
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanSuccess,
  onPhotoCapture,
  onClose,
  mode = 'object' // Default to object mode
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [currentMode, setCurrentMode] = useState<'barcode' | 'object'>(mode);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices);
        // Prefer back camera
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
        setSelectedCamera(backCamera?.id || devices[0].id);
      } else {
        toast.error('Keine Kamera gefunden');
      }
    }).catch(err => {
      console.error('Kamera-Fehler:', err);
      toast.error('Kamera-Zugriff verweigert');
    });

    return () => {
      stopScanning();
    };
  }, []);

  const startBarcodeScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode('barcode-reader');
      scannerRef.current = html5QrCode;

      // Use environment (back) camera or selected camera
      const cameraId = selectedCamera || { facingMode: 'environment' };

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText, decodedResult) => {
          console.log('Barcode gescannt:', decodedText);
          toast.success('Barcode erkannt!');
          stopScanning();
          onScanSuccess(decodedText, decodedResult);
        },
        (errorMessage) => {
          // Silent - wird bei jedem Frame ohne Erkennung aufgerufen
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Scanner-Start-Fehler:', err);
      toast.error('Kamera konnte nicht gestartet werden');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          // Always prefer back camera on mobile
          facingMode: { ideal: 'environment' },
          // Limit resolution from the start
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsScanning(true);
      console.log('Camera started with resolution:',
        videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
    } catch (err) {
      console.error('Kamera-Start-Fehler:', err);
      toast.error('Kamera konnte nicht gestartet werden');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Scanner-Stop-Fehler:', err);
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsScanning(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !onPhotoCapture) return;

    setIsCapturing(true);
    try {
      const canvas = document.createElement('canvas');

      // Limit resolution to max 1280x720 for faster upload
      const maxWidth = 1280;
      const maxHeight = 720;
      let width = videoRef.current.videoWidth;
      let height = videoRef.current.videoHeight;

      // Calculate scaling
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);

        // Compress to 60% quality for much faster upload
        canvas.toBlob(async (blob) => {
          if (blob) {
            const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
            const sizeKB = (blob.size / 1024).toFixed(0);
            console.log('Photo size:', sizeMB, 'MB (', sizeKB, 'KB)');
            toast.loading(`Uploading ${sizeKB}KB...`, { id: 'upload-progress' });
            const file = new File([blob], `device-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            await stopScanning();
            onPhotoCapture(file);
          }
        }, 'image/jpeg', 0.6); // Reduced from 0.8 to 0.6 for faster upload
      }
    } catch (err) {
      console.error('Foto-Aufnahme-Fehler:', err);
      toast.error('Foto konnte nicht aufgenommen werden');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleClose = async () => {
    await stopScanning();
    onClose();
  };

  const switchMode = async (newMode: 'barcode' | 'object') => {
    await stopScanning();
    setCurrentMode(newMode);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        width: '100%',
        maxWidth: '500px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        color: 'white'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
          {currentMode === 'barcode' ? '📷 Barcode Scanner' : '🤖 Objekt-Erkennung'}
        </h2>
        <button
          onClick={handleClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '10px'
          }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Mode Selector */}
      {!isScanning && onPhotoCapture && (
        <div style={{
          width: '100%',
          maxWidth: '500px',
          display: 'flex',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => switchMode('barcode')}
            style={{
              flex: 1,
              padding: '12px',
              background: currentMode === 'barcode' ? '#FF6B35' : 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s'
            }}
          >
            <QrCode size={20} />
            Barcode
          </button>
          <button
            onClick={() => switchMode('object')}
            style={{
              flex: 1,
              padding: '12px',
              background: currentMode === 'object' ? '#10B981' : 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s'
            }}
          >
            <Sparkles size={20} />
            Objekt
          </button>
        </div>
      )}

      {/* Camera Selector */}
      {cameras.length > 1 && !isScanning && (
        <div style={{
          width: '100%',
          maxWidth: '500px',
          marginBottom: '20px'
        }}>
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: currentMode === 'barcode' ? '2px solid #FF6B35' : '2px solid #10B981',
              background: 'white',
              fontSize: '1rem'
            }}
          >
            {cameras.map(camera => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Kamera ${camera.id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scanner/Camera View */}
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: 'white',
        borderRadius: '15px',
        overflow: 'hidden',
        marginBottom: '20px',
        position: 'relative'
      }}>
        {currentMode === 'barcode' ? (
          <div id="barcode-reader" style={{ width: '100%' }}></div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: 'auto',
              display: isScanning ? 'block' : 'none'
            }}
          />
        )}

        {/* Capture Overlay */}
        {currentMode === 'object' && isScanning && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: '80%',
            border: '3px solid #10B981',
            borderRadius: '10px',
            pointerEvents: 'none'
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#10B981',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              textShadow: '0 0 10px rgba(0,0,0,0.8)'
            }}>
              📸 Objekt ausrichten
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        color: 'white',
        textAlign: 'center',
        marginBottom: '20px',
        maxWidth: '500px'
      }}>
        {currentMode === 'barcode' ? (
          <>
            <p style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>
              {isScanning ? '📸 Halte den Barcode in den Rahmen' : '👇 Kamera starten und Barcode scannen'}
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
              Funktioniert mit QR-Codes, EAN, UPC und mehr
            </p>
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>
              {isScanning ? '📸 Richte das Gerät aus und drücke auf Foto' : '👇 Kamera starten und Gerät fotografieren'}
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
              KI erkennt automatisch Gerät, Marke und Modell
            </p>
          </>
        )}
      </div>

      {/* Action Buttons */}
      {!isScanning && (
        <button
          onClick={currentMode === 'barcode' ? startBarcodeScanning : startCamera}
          disabled={!selectedCamera}
          style={{
            padding: '15px 40px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            background: selectedCamera ? (currentMode === 'barcode' ? '#FF6B35' : '#10B981') : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: selectedCamera ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.3s'
          }}
        >
          <Camera size={24} />
          Kamera starten
        </button>
      )}

      {isScanning && currentMode === 'barcode' && (
        <button
          onClick={stopScanning}
          style={{
            padding: '15px 40px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            background: '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          Scanner stoppen
        </button>
      )}

      {isScanning && currentMode === 'object' && (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={capturePhoto}
            disabled={isCapturing}
            style={{
              padding: '15px 40px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              background: isCapturing ? '#ccc' : '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: isCapturing ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Camera size={24} />
            {isCapturing ? 'Wird aufgenommen...' : 'Foto aufnehmen'}
          </button>
          <button
            onClick={stopScanning}
            style={{
              padding: '15px 40px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              background: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            Abbrechen
          </button>
        </div>
      )}
    </div>
  );
};
