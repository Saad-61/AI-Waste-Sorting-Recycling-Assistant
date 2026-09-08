import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Layers,
  Eye,
  Activity,
  RotateCcw,
  Sliders,
  Info
} from 'lucide-react';

export const FullscreenLightbox = ({
  isOpen,
  onClose,
  annotatedImage,
  originalImage,
  heatmapImage,
  totalObjects = 0,
  items = []
}) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeLayer, setActiveLayer] = useState('annotated'); // 'annotated' | 'original' | 'heatmap'

  // Reset zoom & pan on open/close
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setActiveLayer('annotated');
    }
  }, [isOpen]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-' || e.key === '_') handleZoomOut();
      if (e.key === '0') handleReset();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, zoom, heatmapImage]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.5, 0.75));
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Determine active image source
  let currentImageSrc = annotatedImage || originalImage;
  if (activeLayer === 'original' && originalImage) {
    currentImageSrc = originalImage;
  } else if (activeLayer === 'heatmap' && heatmapImage) {
    currentImageSrc = heatmapImage;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B0C10]/95 backdrop-blur-md flex flex-col select-none animate-in fade-in duration-200"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Header Bar */}
      <header className="h-16 px-6 border-b border-[#282B37] bg-[#14151A]/90 flex items-center justify-between text-[#F4F5F7]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="font-display font-semibold text-[#F4F5F7] text-sm tracking-wide uppercase">
              Optical Inspector
            </h2>
          </div>
          <span className="text-[#282B37]">|</span>
          <span className="text-xs font-mono text-[#9CA3AF]">
            {totalObjects} {totalObjects === 1 ? 'Object Detected' : 'Objects Detected'}
          </span>
        </div>

        {/* Center Title Badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-[#0E0F12] rounded-lg border border-[#282B37] text-xs font-mono text-[#34D399]">
          <Layers className="w-3.5 h-3.5" />
          <span>Annotated Bounding Box Inspection</span>
        </div>

        {/* Right Close & Zoom stats */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-[#9CA3AF] bg-[#0E0F12] px-2.5 py-1 rounded border border-[#282B37]">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#222530] hover:bg-[#2D3140] text-[#9CA3AF] hover:text-[#F4F5F7] transition"
            title="Close Fullscreen (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Interactive Canvas */}
      <div
        className={`flex-1 overflow-hidden relative flex items-center justify-center ${
          zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
          className="relative max-w-full max-h-full flex items-center justify-center p-6"
        >
          <img
            src={currentImageSrc}
            alt="Full Inspection View"
            className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl border border-[#282B37] pointer-events-none"
            draggable={false}
          />
        </div>

        {/* Bottom Floating Control Pill */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#14151A]/90 backdrop-blur-md border border-[#282B37] rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl text-xs text-[#9CA3AF]">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.75}
            className="p-1.5 rounded-full hover:bg-[#222530] disabled:opacity-30 transition"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="font-mono text-[#F4F5F7] font-medium min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="p-1.5 rounded-full hover:bg-[#222530] disabled:opacity-30 transition"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-[#282B37] mx-1" />

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#222530] transition text-[#9CA3AF] hover:text-[#F4F5F7]"
            title="Reset Zoom (0)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Footer Info Bar */}
      <footer className="h-10 px-6 border-t border-[#282B37] bg-[#14151A]/80 flex items-center justify-between text-[11px] font-mono text-[#6B7280]">
        <div>
          Keys: <kbd className="px-1.5 py-0.5 bg-[#222530] rounded text-[#9CA3AF]">+</kbd> Zoom In ·{' '}
          <kbd className="px-1.5 py-0.5 bg-[#222530] rounded text-[#9CA3AF]">-</kbd> Zoom Out ·{' '}
          <kbd className="px-1.5 py-0.5 bg-[#222530] rounded text-[#9CA3AF]">0</kbd> Reset ·{' '}
          <kbd className="px-1.5 py-0.5 bg-[#222530] rounded text-[#9CA3AF]">ESC</kbd> Exit
        </div>
        <div>Drag to Pan when zoomed · Scroll wheel to inspect details</div>
      </footer>
    </div>
  );
};

export default FullscreenLightbox;
