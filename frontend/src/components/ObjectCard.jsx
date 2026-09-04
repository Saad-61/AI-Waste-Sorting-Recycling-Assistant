import React from 'react';
import { Activity, Package, ChevronRight } from 'lucide-react';
import Badge from './ui/Badge';

export const ObjectCard = ({ item, isSelected, onClick, onExplain }) => {
  if (!item) return null;

  // Bin colour theme
  const getStreamColor = (bin) => {
    const b = (bin || '').toLowerCase();
    if (b.includes('recyclable') || b.includes('glass') || b.includes('metal') || b.includes('paper')) {
      return {
        bg: 'bg-[#1C3B2E]',
        text: 'text-[#5EEAD4]',
        pill: 'bg-[#1C3B2E] text-[#5EEAD4] border border-[#2D7351]',
      };
    }
    if (b.includes('organic') || b.includes('compost') || b.includes('yard')) {
      return {
        bg: 'bg-[#3A2216]',
        text: 'text-[#FDBA74]',
        pill: 'bg-[#3A2216] text-[#FDBA74] border border-[#7D492A]',
      };
    }
    if (b.includes('hazard') || b.includes('e-waste') || b.includes('battery')) {
      return {
        bg: 'bg-[#3F1919]',
        text: 'text-[#FCA5A5]',
        pill: 'bg-[#3F1919] text-[#FCA5A5] border border-[#872D2D]',
      };
    }
    if (b.includes('soft plastic') || b.includes('drop-off') || b.includes('special')) {
      return {
        bg: 'bg-[#3A2E12]',
        text: 'text-[#FBBF24]',
        pill: 'bg-[#3A2E12] text-[#FBBF24] border border-[#7D6015]',
      };
    }
    return {
      bg: 'bg-[#36312D]',
      text: 'text-[#F4EFEA]',
      pill: 'bg-[#36312D] text-[#D8D1C7] border border-[#4A433D]',
    };
  };

  const streamStyle = getStreamColor(item.bin);
  const detectorPct = Math.round((item.confidence || 0) * 100);
  const classifierPct = Math.round((item.classifier_confidence || item.confidence || 0) * 100);
  const avgPct = Math.round((detectorPct + classifierPct) / 2);

  const barColor =
    avgPct >= 75 ? '#34D399' : avgPct >= 50 ? '#FBBF24' : '#F87171';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border transition-all duration-200 bg-[#2E2A27] p-5 cursor-pointer shadow-warm-sm hover:shadow-warm-hover ${
        isSelected
          ? 'border-[#34D399] ring-2 ring-[#34D399]/20'
          : 'border-[#4A433D] hover:border-[#635A52] hover:bg-[#332E2A]'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#36312D] border border-[#4A433D] flex items-center justify-center text-[#34D399] shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display font-bold text-[#F4EFEA] text-sm capitalize">
              {item.label}
            </h4>
            <span className="text-[11px] font-medium text-[#B0A698]">
              {item.material || 'General Material'}
            </span>
          </div>
        </div>

        {/* Bin Pill */}
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${streamStyle.pill}`}>
          {item.bin}
        </span>
      </div>

      {/* Confidence — combined bar */}
      <div className="mt-4">
        <div className="flex justify-between text-[11px] text-[#B0A698] mb-1.5 font-medium">
          <span>Detection certainty</span>
          <span className="font-mono font-semibold" style={{ color: barColor }}>{detectorPct}%</span>
        </div>
        <div className="w-full h-1.5 bg-[#36312D] rounded-full overflow-hidden border border-[#4A433D]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${detectorPct}%`, backgroundColor: barColor }}
          />
        </div>
      </div>

      {/* Classifier confidence (secondary, smaller) */}
      <div className="mt-2">
        <div className="flex justify-between text-[11px] text-[#8A7F73] mb-1 font-medium">
          <span>Material certainty</span>
          <span className="font-mono font-semibold" style={{ color: barColor }}>{classifierPct}%</span>
        </div>
        <div className="w-full h-1 bg-[#36312D] rounded-full overflow-hidden border border-[#4A433D]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${classifierPct}%`, backgroundColor: barColor }}
          />
        </div>
      </div>

      {/* Handling Instructions */}
      {item.instructions && (
        <div className="mt-3.5 p-3 rounded-xl bg-[#36312D] border border-[#4A433D] text-xs text-[#D8D1C7] leading-relaxed">
          <span className="font-semibold text-[#F4EFEA] block mb-0.5">How to dispose:</span>
          {item.instructions}
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-4 pt-3 border-t border-[#4A433D] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-[#B0A698] font-medium">
          <span className="text-[#8A7F73]">Recyclable:</span>
          <span className="text-[#F4EFEA] font-semibold">{item.recyclable}</span>
        </div>

        {onExplain && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExplain(item);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-[#F4EFEA] bg-[#36312D] hover:bg-[#433D37] border border-[#4A433D] transition"
          >
            <Activity className="w-3.5 h-3.5 text-[#34D399]" />
            See why
            <ChevronRight className="w-3 h-3 text-[#8A7F73]" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ObjectCard;
