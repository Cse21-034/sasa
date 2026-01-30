import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Check } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraReady(true);
        };
      }
    } catch (err: any) {
      setError(err.message || 'Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
        setPreview(dataUrl);
      }
    }
  };

  const confirmCapture = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          onCapture(file);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const retakePhoto = () => {
    setPreview(null);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
          <h2 className="text-lg font-semibold mb-4">Camera Error</h2>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <div className="flex gap-2">
            <Button onClick={onCancel} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={startCamera} className="flex-1">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
        <div className="relative bg-black">
          {!preview ? (
            <>
              <video
                ref={videoRef}
                className="w-full aspect-video object-cover"
                playsInline
              />
              {!isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <p className="text-white">Initializing camera...</p>
                </div>
              )}
            </>
          ) : (
            <img src={preview} alt="Captured photo" className="w-full aspect-video object-cover" />
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Close button */}
          <button
            onClick={onCancel}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3">
          {!preview ? (
            <>
              <p className="text-sm text-gray-600 text-center">
                📷 Hold your ID next to your face and ensure good lighting
              </p>
              <Button
                onClick={capturePhoto}
                disabled={!isCameraReady}
                className="w-full"
                size="lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                Take Photo
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 text-center">
                ✓ Photo captured. Confirm or retake?
              </p>
              <div className="flex gap-2">
                <Button onClick={retakePhoto} variant="outline" className="flex-1">
                  Retake
                </Button>
                <Button onClick={confirmCapture} className="flex-1">
                  <Check className="w-5 h-5 mr-2" />
                  Confirm
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
