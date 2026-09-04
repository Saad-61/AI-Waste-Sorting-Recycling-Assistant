import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, CircleDot, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';
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
      setError('Camera access is restricted. Please enable camera permissions in your browser to use live optical capture.');
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
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.95);
    onCapture(base64Image);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Viewfinder Canvas */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-[#4A433D] bg-[#1E1B19] min-h-[380px] max-h-[520px] flex items-center justify-center shadow-warm-md">
        {error ? (
          <div className="p-8 text-center max-w-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#36312D] border border-[#4A433D] flex items-center justify-center text-[#FB923C] mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-xs text-[#B0A698] mb-4 leading-relaxed">{error}</p>
            <Button variant="secondary" size="sm" onClick={startCamera}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Retry Connection
            </Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover max-h-[520px]"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Corner Viewfinder Reticles */}
            <div className="absolute inset-6 pointer-events-none border border-white/10 rounded-xl">
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#34D399]" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#34D399]" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#34D399]" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#34D399]" />
            </div>

            {/* Live Indicator Chip */}
            <div className="absolute top-4 left-4 bg-[#242220]/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#4A433D] flex items-center gap-2 text-xs font-mono text-[#F4EFEA]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Camera Feed
            </div>
          </>
        )}

        {isAnalyzing && (
          <div className="absolute inset-0 bg-[#242220]/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-[#F4EFEA]">
            <div className="w-8 h-8 border-2 border-[#4A433D] border-t-emerald-400 rounded-full animate-spin mb-3" />
            <span className="text-xs font-semibold font-display tracking-wide">
              Analyzing Captured Frame...
            </span>
          </div>
        )}
      </div>

      {/* Camera Capture Shutter Bar */}
      <div className="flex flex-col items-center gap-2 w-full">
        <button
          onClick={takeSnapshot}
          disabled={isAnalyzing || !stream}
          className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#1F5A3B] hover:bg-[#256B47] disabled:opacity-50 text-white font-medium text-xs tracking-wide shadow-warm-md hover:shadow-warm-hover transition transform active:scale-95"
        >
          <CircleDot className="w-4 h-4 text-emerald-300" />
          Capture Frame & Analyze
        </button>

        <span className="text-[11px] text-[#B0A698] flex items-center gap-1 font-medium">
          <HelpCircle className="w-3 h-3 text-[#8A7F73]" />
          Position items in frame and press Capture to grab a high-resolution snapshot for analysis.
        </span>
      </div>
    </div>
  );
};

export default WebcamCapture;
