import React, { useState, useRef } from 'react';
import { UploadCloud, Image, FileText, ArrowRight } from 'lucide-react';

export const Dropzone = ({ onFileSelect, isAnalyzing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      } else {
        alert('Please drop an image file (JPG, PNG, WebP).');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 p-10 text-center cursor-pointer bg-white flex flex-col items-center justify-center min-h-[260px] shadow-nordic ${
          isDragOver
            ? 'border-emerald-700 bg-emerald-50/40 scale-[0.99]'
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Upload Icon Disc */}
        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-4 shadow-sm">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="font-display font-bold text-slate-900 text-base mb-1">
          Upload Scene for Optical Material Analysis
        </h3>
        <p className="text-slate-500 text-xs max-w-sm mb-4">
          Drag & drop any photo containing waste items, or click to browse files from your disk.
        </p>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          <span>Supported: JPG, PNG, WEBP</span>
          <span>·</span>
          <span>Max 15MB</span>
        </div>

        {isAnalyzing && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-emerald-700 rounded-full animate-spin mb-3" />
            <span className="text-xs font-semibold text-slate-800 font-display">
              Processing Multi-Stage Detection & Feature Maps...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dropzone;
