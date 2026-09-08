import React from 'react';
import { Activity, Package, ChevronRight } from 'lucide-react';
import Badge from './ui/Badge';
import Progress from './ui/Progress';
import SpotlightCard from './bits/SpotlightCard';
import CountUp from './bits/CountUp';
import DecryptedText from './bits/DecryptedText';

export const ObjectCard = ({ item, isSelected, onClick, onExplain }) => {
  if (!item) return null;

  // Bin colour theme
  const getStreamColor = (bin) => {
    const b = (bin || '').toLowerCase();
    if (b.includes('recyclable') || b.includes('glass') || b.includes('metal') || b.includes('paper')) {
      return {
        bg: 'bg-[#0E261D]',
        text: 'text-[#34D399]',
        pill: 'bg-[#0E261D] text-[#34D399] border border-[#1B523B]',
        spotlight: 'rgba(52, 211, 153, 0.16)'
      };
    }
    if (b.includes('organic') || b.includes('compost') || b.includes('yard')) {
      return {
        bg: 'bg-[#2A1B0E]',
        text: 'text-[#F97316]',
        pill: 'bg-[#2A1B0E] text-[#F97316] border border-[#5E3A1A]',
        spotlight: 'rgba(249, 115, 22, 0.16)'
      };
    }
    if (b.includes('hazard') || b.includes('e-waste') || b.includes('battery')) {
      return {
        bg: 'bg-[#2B1216]',
        text: 'text-[#F87171]',
        pill: 'bg-[#2B1216] text-[#F87171] border border-[#5C2028]',
        spotlight: 'rgba(248, 113, 113, 0.16)'
      };
    }
    if (b.includes('soft plastic') || b.includes('drop-off') || b.includes('special')) {
      return {
        bg: 'bg-[#29210C]',
        text: 'text-[#FBBF24]',
        pill: 'bg-[#29210C] text-[#FBBF24] border border-[#5C4916]',
        spotlight: 'rgba(251, 191, 36, 0.16)'
      };
    }
    return {
      bg: 'bg-[#222530]',
      text: 'text-[#F4F5F7]',
      pill: 'bg-[#222530] text-[#D1D5DB] border border-[#282B37]',
      spotlight: 'rgba(156, 163, 175, 0.12)'
    };
  };

  const streamStyle = getStreamColor(item.bin);
  const detectorPct = Math.round((item.confidence || 0) * 100);
  const classifierPct = Math.round((item.classifier_confidence || item.confidence || 0) * 100);
  const avgPct = Math.round((detectorPct + classifierPct) / 2);

  const barColor =
    avgPct >= 70 ? '#34D399' : avgPct >= 50 ? '#38BDF8' : '#FBBF24';

  return (
    <SpotlightCard
      spotlightColor={streamStyle.spotlight}
      size={160}
      onClick={onClick}
      className={`rounded-2xl border transition-all duration-200 bg-[#1B1D24] p-5 cursor-pointer shadow-warm-sm hover:shadow-warm-hover ${
        isSelected
          ? 'border-[#34D399] ring-2 ring-[#34D399]/20'
          : 'border-[#282B37] hover:border-[#3D4357] hover:bg-[#20232C]'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="transition-transform duration-200 transform hover:scale-115 cursor-pointer text-[#34D399] shrink-0">
            <Package className="w-5 h-5 text-[#34D399]" />
          </div>
          <div>
            <h4 className="font-display font-bold text-[#F4F5F7] text-sm capitalize">
              <DecryptedText text={item.label} speed={30} maxIterations={8} />
            </h4>
            <span className="text-[11px] font-medium text-[#9CA3AF]">
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
        <div className="flex justify-between text-[11px] text-[#9CA3AF] mb-1.5 font-medium">
          <span>Detection certainty</span>
          <span className="font-mono font-semibold" style={{ color: barColor }}>
            <CountUp to={detectorPct} suffix="%" duration={0.6} />
          </span>
        </div>
        <Progress value={detectorPct} indicatorColor={barColor} className="h-1.5" />
      </div>

      {/* Classifier confidence (secondary, smaller) */}
      <div className="mt-2.5">
        <div className="flex justify-between text-[11px] text-[#6B7280] mb-1 font-medium">
          <span>Material certainty</span>
          <span className="font-mono font-semibold" style={{ color: barColor }}>
            <CountUp to={classifierPct} suffix="%" duration={0.6} delay={0.1} />
          </span>
        </div>
        <Progress value={classifierPct} indicatorColor={barColor} className="h-1" />
      </div>

      {/* Handling Instructions */}
      {item.instructions && (
        <div className="mt-3.5 p-3 rounded-xl bg-[#222530] border border-[#282B37] text-xs text-[#D1D5DB] leading-relaxed">
          <span className="font-semibold text-[#F4F5F7] block mb-0.5">How to dispose:</span>
          {item.instructions}
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-4 pt-3 border-t border-[#282B37] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] font-medium">
          <span className="text-[#6B7280]">Recyclable:</span>
          <span className="text-[#F4F5F7] font-semibold">{item.recyclable}</span>
        </div>

        {onExplain && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExplain(item);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-[#F4F5F7] bg-[#222530] hover:bg-[#2D3140] border border-[#282B37] transition active:scale-95"
          >
            <Activity className="w-3.5 h-3.5 text-[#34D399]" />
            See why
            <ChevronRight className="w-3 h-3 text-[#6B7280]" />
          </button>
        )}
      </div>
    </SpotlightCard>
  );
};

export default ObjectCard;
