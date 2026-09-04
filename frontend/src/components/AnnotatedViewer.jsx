import React, { useState } from 'react';
import { Eye, Layers, Maximize2, ZoomIn } from 'lucide-react';
import Badge from './ui/Badge';

export const AnnotatedViewer = ({
  annotatedImage,
  originalImage,
  items = [],
  onSelectObject,
  onOpenFullscreen
}) => {
  const [viewMode, setViewMode] = useState('annotated'); // 'annotated' | 'original'
  const [isHovered, setIsHovered] = useState(false);

  const displayImage = viewMode === 'annotated' ? annotatedImage : originalImage;

  return (
    <div className="flex flex-col gap-3">
      {/* Viewport Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
            Optical Viewport
          </span>
          <Badge variant="outline" className="text-[11px] font-mono py-0 px-2 border-slate-300 text-slate-700 bg-white">
            {items.length} {items.length === 1 ? 'Target' : 'Targets'}
          </Badge>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs font-medium border border-slate-300/80">
            <button
              onClick={() => setViewMode('annotated')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                viewMode === 'annotated'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3 h-3 text-emerald-700" />
              Detection
            </button>
            <button
              onClick={() => setViewMode('original')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                viewMode === 'original'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3 h-3 text-slate-500" />
              Original
            </button>
          </div>

          {onOpenFullscreen && (
            <button
              onClick={onOpenFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition shadow-sm"
              title="Open Fullscreen Studio"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Fullscreen
            </button>
          )}
        </div>
      </div>

      {/* Main Image Frame */}
      <div
        className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center min-h-[380px] max-h-[580px] shadow-nordic cursor-pointer transition"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onOpenFullscreen}
      >
        <img
          src={displayImage}
          alt="Waste detection view"
          className="w-full h-full object-contain max-h-[560px] rounded-xl"
        />

        {/* Hover Fullscreen Prompt */}
        <div
          className={`absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="bg-slate-900/90 text-white px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 shadow-lg transform translate-y-1 group-hover:translate-y-0 transition-transform">
            <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
            Click to Expand & Inspect Fullscreen
          </div>
        </div>

        {/* Discrete bottom timestamp info */}
        <div className="absolute bottom-3 right-3 pointer-events-none">
          <span className="px-2 py-1 bg-slate-900/80 text-white text-[10px] font-mono rounded backdrop-blur-sm">
            {viewMode === 'annotated' ? 'YOLOv8s + MobileNetV3' : 'Raw Capture'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnnotatedViewer;
