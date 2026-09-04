import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, CircleDot, AlertCircle } from 'lucide-react';
import Button from './ui/Button';

export const WebcamCapture = ({ onCapture, isAnalyzing }) => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Webcam error:', err);
      setError('Unable to access camera. Please verify camera permissions in your browser.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.95);
    onCapture(base64Image);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[360px] flex items-center justify-center shadow-nordic">
        {error ? (
          <div className="p-8 text-center max-w-sm flex flex-col items-center">
            <AlertCircle className="w-8 h-8 text-amber-500 mb-3" />
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">{error}</p>
            <Button variant="outline" size="sm" onClick={startCamera}>
              Retry Permissions
            </Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover max-h-[500px]"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Live Indicator Chip */}
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 flex items-center gap-2 text-xs font-mono text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Sensor Active
            </div>
          </>
        )}

        {isAnalyzing && (
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-white">
            <div className="w-8 h-8 border-2 border-slate-500 border-t-emerald-400 rounded-full animate-spin mb-3" />
            <span className="text-xs font-semibold font-display">Executing Inference Engine...</span>
          </div>
        )}
      </div>

      {/* Camera Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={takeSnapshot}
          disabled={isAnalyzing || !stream}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium text-xs tracking-wide shadow-md transition"
        >
          <CircleDot className="w-4 h-4 text-emerald-400" />
          Capture & Analyze Scene
        </button>
      </div>
    </div>
  );
};

export default WebcamCapture;
