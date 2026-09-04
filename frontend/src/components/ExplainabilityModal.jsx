import React from 'react';
import { Activity, ShieldCheck, HelpCircle, Layers, CheckCircle2 } from 'lucide-react';
import Modal from './ui/Modal';
import Badge from './ui/Badge';

export const ExplainabilityModal = ({ isOpen, onClose, item }) => {
  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Neural Saliency Analysis: ${item.label}`}
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-5 text-slate-800">
        {/* Heatmap preview */}
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex flex-col items-center justify-center p-4 shadow-sm">
          {item.heatmap ? (
            <img
              src={item.heatmap}
              alt="Grad-CAM Saliency Feature Map"
              className="max-h-72 w-auto object-contain rounded-lg shadow-md"
            />
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              Heatmap representation not available for this item.
            </div>
          )}
          <span className="text-xs text-slate-300 mt-3 font-mono text-center">
            Thermal gradient signifies convolutional filter activation density.
          </span>
        </div>

        {/* Breakdown details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-xs block mb-1 font-medium">Target Category</span>
            <span className="font-semibold text-slate-900 capitalize font-display">{item.label}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-xs block mb-1 font-medium">Material Classification</span>
            <span className="font-semibold text-emerald-800 font-display">{item.material || 'Standard Material'}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-xs block mb-1 font-medium">Assigned Stream</span>
            <Badge variant="primary">{item.bin}</Badge>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-xs block mb-1 font-medium">Stream Status</span>
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {item.recyclable}
            </span>
          </div>
        </div>

        {/* Optical Feature Map explanation */}
        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-slate-700 flex items-start gap-3">
          <Activity className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-slate-900 block mb-1">Optical Feature Attribution:</span>
            The convolutional feature maps localized structural edges, surface reflectance, and opacity contours characteristic of <strong>{item.material || item.label}</strong>, fulfilling compliance rules for the <strong>{item.bin}</strong> stream.
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExplainabilityModal;
