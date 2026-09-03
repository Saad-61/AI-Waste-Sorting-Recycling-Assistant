import React, { useState } from 'react';
import { Eye, Layers, ZoomIn } from 'lucide-react';
import Badge from './ui/Badge';

export const AnnotatedViewer = ({
  originalImage,
  annotatedImage,
  items = [],
  onSelectItem,
  selectedItemId = null,
}) => {
  const [showAnnotated, setShowAnnotated] = useState(true);

  const displayImage = showAnnotated && annotatedImage ? annotatedImage : originalImage;

  if (!displayImage) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-slate-800 rounded-2xl bg-slate-900/30 text-slate-500">
        <Layers className="w-12 h-12 mb-2 stroke-1" />
        <p className="text-sm">No image loaded for annotation preview.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Controls toolbar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Detection Viewport
          </span>
          <Badge variant="primary">{items.length} detected</Badge>
        </div>

        {annotatedImage && (
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setShowAnnotated(true)}
              className={`px-3 py-1 rounded-md transition ${
                showAnnotated
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Annotated
            </button>
            <button
              onClick={() => setShowAnnotated(false)}
              className={`px-3 py-1 rounded-md transition ${
                !showAnnotated
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Original
            </button>
          </div>
        )}
      </div>

      {/* Main Image Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex items-center justify-center min-h-[320px] max-h-[500px]">
        <img
          src={displayImage}
          alt="Waste analysis viewport"
          className="w-full h-auto max-h-[500px] object-contain"
        />
      </div>
    </div>
  );
};

export default AnnotatedViewer;
