import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle } from 'lucide-react';

const Scanner = ({ onScan, onClose }) => {
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isStarted, setIsStarted] = useState(() => {
    return localStorage.getItem('camera_permission_granted') === 'true';
  });
  const [isSecure, setIsSecure] = useState(true);
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
    // iOS and most modern browsers require HTTPS for camera access
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setIsSecure(false);
    }
  }, [onScan]);

  const startScanner = async () => {
    setError(null);
    setIsInitializing(true);
    setIsStarted(true);

    try {
      // Small delay to ensure the DOM element is ready for the scanner
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          // Larger, more responsive box for barcodes
          const width = viewfinderWidth * 0.85;
          const height = Math.min(viewfinderHeight * 0.4, 200);
          return { width, height };
        },
        aspectRatio: 1.0
      };

      const devices = await Html5Qrcode.getCameras();
      let cameraId = { facingMode: "environment" }; // Fallback
      
      if (devices && devices.length > 0) {
        // সাধারণত শেষের ক্যামেরাটি মেইন ক্যামেরা হয় (Wide angle এড়াতে এটি ট্রাই করুন)
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') && 
          !device.label.toLowerCase().includes('wide')
        ) || devices[devices.length - 1];

        cameraId = backCamera.id;
      }

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          if (onScanRef.current) onScanRef.current(decodedText);
        },
        (errorMessage) => {
          // Ignore
        }
      );
      
      localStorage.setItem('camera_permission_granted', 'true');
      setIsInitializing(false);
    } catch (err) {
      console.error("Scanner error:", err);
      setError(
        "Could not access camera. Please ensure you have granted camera permissions and are using a secure connection (HTTPS)."
      );
      localStorage.setItem('camera_permission_granted', 'false');
      setIsInitializing(false);
      setIsStarted(false);
    }
  };

  useEffect(() => {
    if (isStarted && isSecure) {
      startScanner();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(console.error);
        }
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="bg-indigo-600 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3 font-bold text-lg">
            <div className="p-2 bg-white/20 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            Scan Barcode
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 active:scale-95 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-2 sm:p-4 bg-gray-900 flex items-center justify-center min-h-[400px] sm:min-h-[500px] relative">
          {!isSecure && (
            <div className="absolute inset-0 bg-red-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-20">
              <div className="w-16 h-16 bg-white/10 text-white rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-white font-bold mb-2">Insecure Connection</h4>
              <p className="text-red-100 text-sm leading-relaxed mb-6">
                iOS requires an <b>HTTPS</b> connection for camera access. You are currently using an unencrypted connection.
              </p>
              <button 
                onClick={onClose}
                className="w-full py-3 bg-white text-red-900 rounded-xl font-bold active:scale-95 transition-transform"
              >
                Go Back
              </button>
            </div>
          )}

          <div id="reader" className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden"></div>
          
          {!isStarted && isSecure && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/40 backdrop-blur-[2px] z-10">
              <button 
                onClick={startScanner}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/40 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3"
              >
                <Camera className="w-6 h-6" />
                Start Camera
              </button>
              <p className="text-indigo-200 text-xs mt-4 font-medium px-6 text-center">Required by iOS for camera activation</p>
            </div>
          )}

          {(isInitializing || error) && isSecure && (
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-20">
              {error ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                    <X className="w-8 h-8" />
                  </div>
                  <p className="text-white font-medium text-sm leading-relaxed">{error}</p>
                  <button 
                    onClick={startScanner}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-indigo-200 font-medium">Initializing camera...</p>
                </div>
              )}
            </div>
          )}
          
          {isStarted && !error && !isInitializing && isSecure && (
            <div className="absolute pointer-events-none border-2 border-indigo-400 w-[85%] h-[40%] rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] z-10">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white -mt-1 -ml-1 rounded-tl-sm"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white -mt-1 -mr-1 rounded-tr-sm"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white -mb-1 -ml-1 rounded-bl-sm"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white -mb-1 -mr-1 rounded-br-sm"></div>
            </div>
          )}
        </div>
        
        <div className="p-6 text-center bg-white border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-900 mb-1">Center the barcode</p>
          <p className="text-xs text-gray-400">Scan will happen automatically</p>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
