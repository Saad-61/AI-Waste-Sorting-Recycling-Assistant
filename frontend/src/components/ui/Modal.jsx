import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141210]/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`bg-[#2E2A27] border border-[#4A433D] rounded-2xl w-full ${maxWidth} overflow-hidden shadow-warm-modal transition-all`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#4A433D] bg-[#36312D]">
          <h3 className="text-sm font-display font-bold text-[#F4EFEA] tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#B0A698] hover:text-[#F4EFEA] p-1.5 rounded-lg hover:bg-[#4A433D] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
