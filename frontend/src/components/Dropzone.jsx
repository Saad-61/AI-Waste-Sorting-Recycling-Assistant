import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, FileText, X } from 'lucide-react';
import SpotlightCard from './bits/SpotlightCard';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from './ui/attachment';

export const Dropzone = ({ onFileSelect, isAnalyzing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [stagedFile, setStagedFile] = useState(null);
  const [stagedPreview, setStagedPreview] = useState(null);
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
        setStagedFile(file);
        setStagedPreview(URL.createObjectURL(file));
        onFileSelect(file);
      } else {
        alert('Please select an image file (JPG, PNG, WebP).');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setStagedFile(file);
      setStagedPreview(URL.createObjectURL(file));
      onFileSelect(file);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setStagedFile(null);
    setStagedPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <SpotlightCard
        spotlightColor="rgba(52, 211, 153, 0.14)"
        size={200}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative rounded-2xl border-2 border-dashed transition-all duration-200 p-10 text-center cursor-pointer bg-[#1B1D24] flex flex-col items-center justify-center min-h-[260px] shadow-warm-sm ${
          isDragOver
            ? 'border-[#34D399] bg-[#0E261D]/60 scale-[0.99]'
            : 'border-[#282B37] hover:border-[#3D4357] hover:bg-[#20232C]'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Unboxed Floating Hover Icon */}
        <div className="mb-4 transition-all duration-300 transform group-hover:scale-115 group-hover:-translate-y-1 hover:scale-125 cursor-pointer">
          <UploadCloud className="w-12 h-12 text-[#34D399] transition-all duration-300" />
        </div>

        <h3 className="font-display font-bold text-[#F4F5F7] text-base mb-1">
          Upload Scene for Optical Material Sorting
        </h3>
        <p className="text-[#9CA3AF] text-xs max-w-sm mb-4">
          Drag & drop photos of waste objects, or click to browse files from your computer.
        </p>

        <div className="flex items-center gap-2 text-[11px] font-mono text-[#9CA3AF] bg-[#222530] px-3.5 py-1 rounded-full border border-[#282B37]">
          <span>Supported: JPG, PNG, WEBP</span>
          <span>·</span>
          <span>Max 15MB</span>
        </div>

        {isAnalyzing && (
          <div className="absolute inset-0 bg-[#14151A]/92 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10 p-6">
            <div className="w-8 h-8 border-2 border-[#282B37] border-t-[#34D399] rounded-full animate-spin mb-3" />
            <span className="text-xs font-semibold text-[#F4F5F7] font-display mb-3">
              Processing Multi-Stage Detection & Feature Maps...
            </span>
            {stagedFile && (
              <div className="w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
                <Attachment variant="subtle" size="sm" className="bg-[#1B1D24]/80 border-[#282B37]">
                  <AttachmentMedia variant="image" src={stagedPreview} className="w-9 h-9 rounded-md">
                    <FileText className="w-4 h-4 text-[#34D399]" />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle className="text-xs">{stagedFile.name}</AttachmentTitle>
                    <AttachmentDescription>
                      <span>{(stagedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>·</span>
                      <span className="text-[#34D399]">Analyzing</span>
                    </AttachmentDescription>
                  </AttachmentContent>
                </Attachment>
              </div>
            )}
          </div>
        )}
      </SpotlightCard>

      {/* Staged Attachment Card */}
      {stagedFile && !isAnalyzing && (
        <Attachment variant="default" size="default" className="bg-[#1B1D24] border-[#282B37]">
          <AttachmentMedia variant="image" src={stagedPreview} className="w-11 h-11 rounded-lg">
            <FileText className="w-5 h-5 text-[#34D399]" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle className="text-xs">{stagedFile.name}</AttachmentTitle>
            <AttachmentDescription>
              <span>{(stagedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
              <span>·</span>
              <span>{stagedFile.type.split('/')[1]?.toUpperCase() || 'IMAGE'}</span>
              <span>·</span>
              <span className="text-[#34D399]">Ready for inference</span>
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction onClick={handleRemove} aria-label={`Remove ${stagedFile.name}`}>
              <X className="w-4 h-4 text-[#9CA3AF] hover:text-[#F87171] transition-colors" />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      )}
    </div>
  );
};

export default Dropzone;
