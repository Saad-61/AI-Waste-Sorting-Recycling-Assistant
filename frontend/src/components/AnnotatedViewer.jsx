import React, { useState } from 'react';
import { Eye, Layers, Maximize2, ZoomIn } from 'lucide-react';
import Badge from './ui/Badge';
import { formatImageSrc } from '../utils/imageUtils';

export const AnnotatedViewer = ({
  annotatedImage,
  originalImage,
  items = [],
  onSelectObject,
  onOpenFullscreen
}) => {
  const [viewMode, setViewMode] = useState('annotated'); // 'annotated' | 'original'
  const [isHovered, setIsHovered] = useState(false);

  const rawImage = viewMode === 'annotated' ? annotatedImage : originalImage;
  const displayImage = formatImageSrc(rawImage);

  return (
    <div className="flex flex-col gap-3">
      {/* Viewport Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#B0A698] font-mono">
            Optical Viewport
          </span>
          <Badge variant="outline" className="text-[11px] font-mono py-0 px-2 border-[#4A433D] text-[#F4EFEA] bg-[#36312D]">
            {items.length} {items.length === 1 ? 'Target' : 'Targets'}
          </Badge>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#36312D] p-0.5 rounded-lg text-xs font-medium border border-[#4A433D]">
            <button
              onClick={() => setViewMode('annotated')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                viewMode === 'annotated'
                  ? 'bg-[#4A433D] text-[#F4EFEA] shadow-sm font-semibold'
                  : 'text-[#B0A698] hover:text-[#F4EFEA]'
              }`}
            >
              <Layers className="w-3 h-3 text-[#34D399]" />
              Detection
            </button>
            <button
              onClick={() => setViewMode('original')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                viewMode === 'original'
                  ? 'bg-[#4A433D] text-[#F4EFEA] shadow-sm font-semibold'
                  : 'text-[#B0A698] hover:text-[#F4EFEA]'
              }`}
            >
              <Eye className="w-3 h-3 text-[#B0A698]" />
              Original
            </button>
          </div>

          {onOpenFullscreen && (
            <button
              onClick={onOpenFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#36312D] hover:bg-[#433D37] text-[#F4EFEA] border border-[#4A433D] text-xs font-medium transition shadow-sm"
              title="Open Fullscreen Studio"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#34D399]" />
              Fullscreen
            </button>
          )}
        </div>
      </div>

      {/* Main Image Frame */}
      <div
        className="group relative rounded-2xl overflow-hidden border border-[#4A433D] bg-[#2E2A27] flex items-center justify-center min-h-[380px] max-h-[580px] shadow-warm-sm cursor-pointer transition"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onOpenFullscreen}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt="Waste detection view"
            className="w-full h-full object-contain max-h-[560px] rounded-xl"
          />
        ) : (
          <div className="text-xs text-[#8A7F73] font-mono">No Image Available</div>
        )}

        {/* Hover Fullscreen Prompt */}
        <div
          className={`absolute inset-0 bg-[#242220]/30 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="bg-[#2E2A27]/95 text-[#F4EFEA] border border-[#4A433D] px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 shadow-xl transform translate-y-1 group-hover:translate-y-0 transition-transform">
            <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
            Click to Open Fullscreen Inspection
          </div>
        </div>

        {/* Discrete bottom timestamp info */}
        <div className="absolute bottom-3 right-3 pointer-events-none">
          <span className="px-2 py-1 bg-[#242220]/85 text-[#F4EFEA] text-[10px] font-mono rounded border border-[#4A433D] backdrop-blur-sm">
            {viewMode === 'annotated' ? 'YOLOv8s + MobileNetV3' : 'Raw Capture'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnnotatedViewer;
