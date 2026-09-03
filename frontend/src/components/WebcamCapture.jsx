import React, { useRef, useState, useEffect } from 'react';
import { Camera, CameraOff, Sparkles, RefreshCw } from 'lucide-react';
import Button from './ui/Button';

export const WebcamCapture = ({ onCapture, isLoading = false }) => {
  const videoRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (err) {
      setErrorMessage('Could not access webcam. Please verify camera permissions.');
      console.error('Webcam error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const base64Data = canvas.toDataURL('image/jpeg', 0.85);
    onCapture(base64Data);
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
      <div className="relative w-full max-w-xl aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${streamActive ? 'block' : 'hidden'}`}
        />

        {!streamActive && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <CameraOff className="w-12 h-12 mb-3 stroke-1 text-slate-600" />
            <p className="text-sm font-medium text-slate-400 mb-1">Webcam Feed Inactive</p>
            <p className="text-xs text-slate-600 max-w-xs">
              Click Start Camera to inspect physical items directly under your lens.
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center p-6 text-center text-rose-400 text-xs">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {!streamActive ? (
          <Button onClick={startCamera} variant="primary">
            <Camera className="w-4 h-4 mr-2" />
            Start Camera
          </Button>
        ) : (
          <>
            <Button
              onClick={captureFrame}
              variant="primary"
              disabled={isLoading}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isLoading ? 'Processing...' : 'Scan Item'}
            </Button>
            <Button onClick={stopCamera} variant="secondary">
              Stop Camera
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default WebcamCapture;
