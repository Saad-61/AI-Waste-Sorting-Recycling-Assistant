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
        alert('Please select an image file (JPG, PNG, WebP).');
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
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 p-10 text-center cursor-pointer bg-[#2E2A27] flex flex-col items-center justify-center min-h-[260px] shadow-warm-sm ${
          isDragOver
            ? 'border-[#34D399] bg-[#1F4334] scale-[0.99]'
            : 'border-[#4A433D] hover:border-[#635A52] hover:bg-[#342F2B]'
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
        <div className="w-14 h-14 rounded-2xl bg-[#36312D] border border-[#4A433D] flex items-center justify-center text-[#34D399] mb-4 shadow-sm">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="font-display font-bold text-[#F4EFEA] text-base mb-1">
          Upload Scene for Optical Material Sorting
        </h3>
        <p className="text-[#B0A698] text-xs max-w-sm mb-4">
          Drag & drop photos of waste objects, or click to browse files from your computer.
        </p>

        <div className="flex items-center gap-2 text-[11px] font-mono text-[#B0A698] bg-[#36312D] px-3.5 py-1 rounded-full border border-[#4A433D]">
          <span>Supported: JPG, PNG, WEBP</span>
          <span>·</span>
          <span>Max 15MB</span>
        </div>

        {isAnalyzing && (
          <div className="absolute inset-0 bg-[#242220]/92 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
            <div className="w-8 h-8 border-2 border-[#4A433D] border-t-[#34D399] rounded-full animate-spin mb-3" />
            <span className="text-xs font-semibold text-[#F4EFEA] font-display">
              Processing Multi-Stage Detection & Feature Maps...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dropzone;
