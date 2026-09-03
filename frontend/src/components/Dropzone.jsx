import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles } from 'lucide-react';
import Button from './ui/Button';

export const Dropzone = ({ onFileSelected, isLoading = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    onFileSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group ${
        isDragging
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-slate-700/80 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-900/80'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {preview ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-full max-w-sm max-h-64 rounded-xl overflow-hidden border border-slate-700 shadow-xl">
            <img src={preview} alt="Selected preview" className="w-full h-full object-cover" />
          </div>
          <p className="text-sm text-slate-400">Click or drag another image to replace</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h4 className="text-base font-semibold text-white mb-1">
            Drag & drop your waste image here
          </h4>
          <p className="text-xs text-slate-400 mb-4">
            Supports JPEG, PNG, WEBP up to 20MB
          </p>
          <Button variant="secondary" size="sm" disabled={isLoading}>
            <ImageIcon className="w-4 h-4 mr-2" />
            Browse Image
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          <span className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Analyzing with AI Models...
          </span>
        </div>
      )}
    </div>
  );
};

export default Dropzone;
