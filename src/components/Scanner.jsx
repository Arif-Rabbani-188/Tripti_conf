import React, { useEffect, useRef, useState, useCallback } from 'react';
import { readBarcodes } from 'zxing-wasm/reader';
import { Camera, X, AlertCircle } from 'lucide-react';

const Scanner = ({ onScan, onClose }) => {
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isStarted, setIsStarted] = useState(() => {
    return localStorage.getItem('camera_permission_granted') === 'true';
  });
  const [isSecure, setIsSecure] = useState(true);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const onScanRef = useRef(onScan);
  
  const streamRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const isScanningRef = useRef(false);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    onScanRef.current = onScan;
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setIsSecure(false);
    }
  }, [onScan]);

  const stopScanner = useCallback(() => {
    isScanningRef.current = false;
    
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const scanLoop = async () => {
    if (!isScanningRef.current || !videoRef.current || !canvasRef.current || hasScannedRef.current) return;

    const video = videoRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      const cw = video.clientWidth;
      const ch = video.clientHeight;
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      if (cw > 0 && ch > 0) {
        // We replicate CSS `object-cover` math to extract ONLY the visually rendered pixels natively
        const car = cw / ch;      // Container aspect ratio
        const var_ratio = vw / vh; // Video intrinsic aspect ratio

        let renderWidth, renderHeight, offsetX, offsetY;

        if (car > var_ratio) {
          // Container is relatively wider, video scales by width, crops top/bottom
          renderWidth = vw;
          renderHeight = vw / car;
          offsetX = 0;
          offsetY = (vh - renderHeight) / 2;
        } else {
          // Container is relatively taller, video scales by height, crops left/right
          renderWidth = vh * car;
          renderHeight = vh;
          offsetX = (vw - renderWidth) / 2;
          offsetY = 0;
        }

        renderWidth = Math.floor(renderWidth);
        renderHeight = Math.floor(renderHeight);
        offsetX = Math.floor(offsetX);
        offsetY = Math.floor(offsetY);

        if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
          canvas.width = renderWidth;
          canvas.height = renderHeight;
        }

        // Draw ONLY the exact cropped native region (matching the UI box) onto the canvas
        ctx.drawImage(
          video,
          offsetX, offsetY, renderWidth, renderHeight, // Source crop rectangle
          0, 0, canvas.width, canvas.height            // Destination canvas placement
        );
        
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          const results = await readBarcodes(imageData, {
              formats: ["EAN_13", "UPC_A", "EAN_8", "CODE_128", "QR_CODE"],
              tryHarder: false, 
              fastDecoding: true 
          });

          if (results && results.length > 0 && results[0].text && !hasScannedRef.current) {
            hasScannedRef.current = true;
            if (onScanRef.current) onScanRef.current(results[0].text);
            stopScanner(); 
            return; 
          }
        } catch (err) {
          // Empty frame, ignore and continue
        }
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(scanLoop);
  };

  const startScanner = async () => {
    setError(null);
    setIsInitializing(true);
    setIsStarted(true);
    hasScannedRef.current = false;

    try {
      stopScanner(); 

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 }, 
          height: { ideal: 480 } 
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadeddata = () => {
          videoRef.current.play().catch(console.error);
          isScanningRef.current = true;
          scanLoop(); 
        };
      } else {
         throw new Error("Video element missing");
      }

      localStorage.setItem('camera_permission_granted', 'true');
      setIsInitializing(false);
    } catch (err) {
      console.error("Scanner error:", err);
      let errorMsg = "Could not access camera. Please ensure you have granted camera permissions.";
      if (err.name === 'NotAllowedError') errorMsg = "Camera access denied by user or system.";
      if (err.name === 'NotFoundError') errorMsg = "No suitable camera device found.";
      if (err.name === 'NotReadableError') errorMsg = "Camera is already in use by another application.";

      setError(`${errorMsg} (HTTPS required)`);
      localStorage.setItem('camera_permission_granted', 'false');
      setIsInitializing(false);
      setIsStarted(false);
    }
  };

  useEffect(() => {
    if (isStarted && isSecure && videoRef.current) {
      startScanner();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef]); 

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

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
        
        <div className="p-6 bg-gray-900 flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden">
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

          <canvas ref={canvasRef} className="hidden" />

          {/* EXACT SIZED TARGET BOX */}
          <div 
            className="relative w-full max-w-[320px] aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-black border-[3px]"
            style={{ borderColor: isStarted && !error ? '#6366f1' : '#374151' }}
          >
            <video 
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              playsInline
              webkit-playsinline="true"
              muted
            />

            {/* Corner Markers */}
            {isStarted && !error && !isInitializing && isSecure && (
              <>
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl m-2 opacity-90"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl m-2 opacity-90"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl m-2 opacity-90"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl m-2 opacity-90"></div>
              </>
            )}

            {!isStarted && isSecure && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-sm z-10">
                <button 
                  onClick={startScanner}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Start Camera
                </button>
              </div>
            )}

            {(isInitializing || error) && isSecure && (
               <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20">
                 {error ? (
                   <div className="space-y-3">
                     <div className="w-12 h-12 bg-red-100/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                       <AlertCircle className="w-6 h-6" />
                     </div>
                     <p className="text-white font-medium text-xs leading-relaxed px-2">{error}</p>
                     <button 
                       onClick={startScanner}
                       className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold active:scale-95 transition-transform text-sm"
                     >
                       Try Again
                     </button>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                     <p className="text-indigo-200 font-medium text-sm">Initializing...</p>
                   </div>
                 )}
               </div>
             )}
          </div>
          
          <div className="mt-8 text-center text-white">
            <p className="font-bold text-lg mb-1">Center the barcode</p>
            <p className="text-sm text-gray-400">Scan will happen automatically</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
