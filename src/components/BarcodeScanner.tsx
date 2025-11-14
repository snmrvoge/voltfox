// src/components/BarcodeScanner.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');

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

  const startScanning = async () => {
    if (!selectedCamera) {
      toast.error('Bitte wähle eine Kamera');
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode('barcode-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText, decodedResult) => {
          // Success callback
          console.log('Barcode gescannt:', decodedText);
          toast.success('Barcode erkannt!');
          stopScanning();
          onScanSuccess(decodedText, decodedResult);
        },
        (errorMessage) => {
          // Error callback (wird bei jedem Frame ohne Erkennung aufgerufen)
          // Wir loggen es nicht, um Spam zu vermeiden
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Scanner-Start-Fehler:', err);
      toast.error('Kamera konnte nicht gestartet werden');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Scanner-Stop-Fehler:', err);
      }
    }
  };

  const handleClose = async () => {
    await stopScanning();
    onClose();
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
          📷 Barcode Scanner
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
              border: '2px solid #FF6B35',
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

      {/* Scanner View */}
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: 'white',
        borderRadius: '15px',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <div id="barcode-reader" style={{ width: '100%' }}></div>
      </div>

      {/* Instructions */}
      <div style={{
        color: 'white',
        textAlign: 'center',
        marginBottom: '20px',
        maxWidth: '500px'
      }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>
          {isScanning ? '📸 Halte den Barcode in den Rahmen' : '👇 Kamera starten und Barcode scannen'}
        </p>
        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
          Funktioniert mit QR-Codes, EAN, UPC und mehr
        </p>
      </div>

      {/* Start Button */}
      {!isScanning && (
        <button
          onClick={startScanning}
          disabled={!selectedCamera}
          style={{
            padding: '15px 40px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            background: selectedCamera ? '#FF6B35' : '#ccc',
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

      {/* Stop Button */}
      {isScanning && (
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
    </div>
  );
};
