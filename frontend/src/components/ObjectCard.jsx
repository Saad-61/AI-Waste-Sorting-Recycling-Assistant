import React from 'react';
import { Activity, ArrowUpRight, CheckCircle2, ChevronRight, Info, Package, AlertCircle } from 'lucide-react';
import Badge from './ui/Badge';

export const ObjectCard = ({ item, isSelected, onClick, onExplain }) => {
  if (!item) return null;

  // Stream color variant helper
  const getStreamColor = (bin) => {
    const b = (bin || '').toLowerCase();
    if (b.includes('recyclable') || b.includes('blue')) {
      return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', pill: 'bg-emerald-700 text-white' };
    }
    if (b.includes('organic') || b.includes('compost')) {
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', pill: 'bg-amber-600 text-white' };
    }
    if (b.includes('hazard') || b.includes('e-waste')) {
      return { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', pill: 'bg-rose-600 text-white' };
    }
    return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', pill: 'bg-slate-700 text-white' };
  };

  const streamStyle = getStreamColor(item.bin);
  const certaintyPercent = Math.round((item.confidence || 0) * 100);

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border transition-all duration-200 bg-white p-5 cursor-pointer shadow-nordic hover:shadow-nordic-hover ${
        isSelected
          ? 'border-slate-900 ring-2 ring-slate-900/10'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display font-bold text-slate-900 text-sm capitalize">
              {item.label}
            </h4>
            <span className="text-[11px] font-medium text-slate-500">
              {item.material || 'General Material'}
            </span>
          </div>
        </div>

        {/* Stream Pill */}
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${streamStyle.pill}`}>
          {item.bin}
        </span>
      </div>

      {/* Optical Certainty Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
          <span>Detection Certainty</span>
          <span className="font-mono font-semibold text-slate-800">{certaintyPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
          <div
            className="h-full bg-slate-900 rounded-full transition-all duration-500"
            style={{ width: `${certaintyPercent}%` }}
          />
        </div>
      </div>

      {/* Handling Instructions */}
      {item.instructions && (
        <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-800 block mb-0.5">Disposal Directive:</span>
          {item.instructions}
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
          <span className="text-slate-400">Stream:</span>
          <span className="text-slate-800 font-semibold">{item.recyclable}</span>
        </div>

        {onExplain && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExplain(item);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-700" />
            Neural Saliency Map
          </button>
        )}
      </div>
    </div>
  );
};

export default ObjectCard;
