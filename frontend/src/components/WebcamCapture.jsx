import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, CircleDot, AlertCircle, Sparkles, HelpCircle, X } from 'lucide-react';
import Button from './ui/Button';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from './ui/attachment';

export const WebcamCapture = ({ onCapture, isAnalyzing }) => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState(null);
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
    setCapturedPreview(base64Image);
    onCapture(base64Image);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Viewfinder Canvas */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-[#282B37] bg-[#0E0F12] min-h-[380px] max-h-[520px] flex items-center justify-center shadow-warm-md">
        {error ? (
          <div className="p-8 text-center max-w-sm flex flex-col items-center z-10">
            {/* Unboxed Floating Hover Alert Icon */}
            <div className="mb-3.5 transition-all duration-300 transform hover:scale-115 hover:-translate-y-0.5 cursor-pointer">
              <AlertCircle className="w-11 h-11 text-[#FB923C] transition-all duration-300" />
            </div>
            <p className="text-xs text-[#9CA3AF] mb-4 leading-relaxed">{error}</p>
            <Button variant="secondary" size="sm" onClick={startCamera}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Retry Connection
            </Button>
          </div>
        ) : (
          <>
            {!stream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-0 pointer-events-none text-center p-6">
                <div className="mb-3 transition-all duration-300 transform">
                  <Camera className="w-11 h-11 text-[#34D399] animate-pulse" />
                </div>
                <p className="text-xs text-[#9CA3AF] font-mono">Initializing live optical sensor...</p>
              </div>
            )}
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
            <div className="absolute top-4 left-4 bg-[#14151A]/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#282B37] flex items-center gap-2 text-xs font-mono text-[#F4F5F7]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Camera Feed
            </div>
          </>
        )}

        {isAnalyzing && (
          <div className="absolute inset-0 bg-[#14151A]/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-[#F4F5F7]">
            <div className="w-8 h-8 border-2 border-[#282B37] border-t-emerald-400 rounded-full animate-spin mb-3" />
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
          className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white font-medium text-xs tracking-wide shadow-warm-md hover:shadow-warm-hover transition transform active:scale-95"
        >
          <CircleDot className="w-4 h-4 text-emerald-200" />
          Capture Frame & Analyze
        </button>

        <span className="text-[11px] text-[#9CA3AF] flex items-center gap-1 font-medium">
          <HelpCircle className="w-3 h-3 text-[#6B7280]" />
          Position items in frame and press Capture to grab a high-resolution snapshot for analysis.
        </span>

        {/* Staged Frame Attachment */}
        {capturedPreview && (
          <div className="w-full max-w-sm mt-2">
            <Attachment variant="default" size="default" className="bg-[#1B1D24] border-[#282B37]">
              <AttachmentMedia variant="image" src={capturedPreview} className="w-11 h-11 rounded-lg" />
              <AttachmentContent>
                <AttachmentTitle className="text-xs">live_sensor_capture.jpg</AttachmentTitle>
                <AttachmentDescription>
                  <span>Sensor Optical Capture</span>
                  <span>·</span>
                  <span className="text-[#34D399]">{isAnalyzing ? 'Analyzing scene...' : 'Captured'}</span>
                </AttachmentDescription>
              </AttachmentContent>
              {!isAnalyzing && (
                <AttachmentActions>
                  <AttachmentAction
                    onClick={() => setCapturedPreview(null)}
                    aria-label="Discard captured frame"
                  >
                    <X className="w-4 h-4 text-[#9CA3AF] hover:text-[#F87171] transition-colors" />
                  </AttachmentAction>
                </AttachmentActions>
              )}
            </Attachment>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebcamCapture;
