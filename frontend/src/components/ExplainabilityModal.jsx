import React from 'react';
import { Sparkles, Info, ShieldCheck, HelpCircle } from 'lucide-react';
import Modal from './ui/Modal';
import Badge from './ui/Badge';

export const ExplainabilityModal = ({ isOpen, onClose, item }) => {
  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Explainable AI (Grad-CAM): ${item.label}`}
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-5">
        {/* Heatmap preview */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col items-center justify-center p-4">
          {item.heatmap ? (
            <img
              src={item.heatmap}
              alt="Grad-CAM Saliency Map"
              className="max-h-72 w-auto object-contain rounded-xl shadow-lg"
            />
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              Heatmap representation not available for this item.
            </div>
          )}
          <span className="text-xs text-slate-400 mt-3 italic text-center">
            Red/Warm regions signify areas of strongest neural network feature activation.
          </span>
        </div>

        {/* Breakdown details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-xs block mb-1">Target Object</span>
            <span className="font-bold text-white capitalize">{item.label}</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-xs block mb-1">Identified Material</span>
            <span className="font-bold text-emerald-400">{item.material || 'Standard material'}</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-xs block mb-1">Assigned Bin</span>
            <Badge variant="primary">{item.bin}</Badge>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-xs block mb-1">Recyclability Status</span>
            <span className="font-semibold text-slate-200">{item.recyclable}</span>
          </div>
        </div>

        {/* Explainability explanation box */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-slate-300 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white block mb-1">Visual Decision Rationale:</span>
            The vision model identified prominent edges, transparency gradients, and structural contours characteristic of <strong>{item.material || item.label}</strong>, satisfying the local guidelines for the <strong>{item.bin}</strong> stream.
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExplainabilityModal;
