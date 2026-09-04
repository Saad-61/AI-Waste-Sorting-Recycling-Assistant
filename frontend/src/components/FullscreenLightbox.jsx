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
      if (e.key === '1') setActiveLayer('annotated');
      if (e.key === '2') setActiveLayer('original');
      if (e.key === '3' && heatmapImage) setActiveLayer('heatmap');
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
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col select-none animate-in fade-in duration-200"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Studio Bar */}
      <header className="h-16 px-6 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between text-slate-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-display font-semibold text-white text-sm tracking-wide uppercase">
              Inspection Studio
            </h2>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-xs font-mono text-slate-400">
            {totalObjects} {totalObjects === 1 ? 'Object Detected' : 'Objects Detected'}
          </span>
        </div>

        {/* Center Layer Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveLayer('annotated')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeLayer === 'annotated'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Detection View (1)
          </button>

          <button
            onClick={() => setActiveLayer('original')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeLayer === 'original'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Original Capture (2)
          </button>

          {heatmapImage && (
            <button
              onClick={() => setActiveLayer('heatmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                activeLayer === 'heatmap'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Neural Saliency Map (3)
            </button>
          )}
        </div>

        {/* Right Close & Zoom stats */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
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
            className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl border border-slate-800/80 pointer-events-none"
            draggable={false}
          />
        </div>

        {/* Bottom Floating Control Pill */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl text-xs text-slate-300">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.75}
            className="p-1.5 rounded-full hover:bg-slate-800 disabled:opacity-30 transition"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="font-mono text-white font-medium min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="p-1.5 rounded-full hover:bg-slate-800 disabled:opacity-30 transition"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 transition text-slate-400 hover:text-white"
            title="Reset Zoom (0)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Footer Info Bar */}
      <footer className="h-10 px-6 border-t border-slate-800/60 bg-slate-900/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <div>
          Keys: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">1</kbd> Detection View ·{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">2</kbd> Original ·{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">3</kbd> Saliency ·{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">ESC</kbd> Exit
        </div>
        <div>Drag to Pan when zoomed · Scroll wheel to inspect details</div>
      </footer>
    </div>
  );
};

export default FullscreenLightbox;
