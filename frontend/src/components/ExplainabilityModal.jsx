import React from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Layers,
  Eye,
  Trash2,
  Recycle,
} from 'lucide-react';
import Modal from './ui/Modal';
import { formatImageSrc } from '../utils/imageUtils';

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const ConfidenceBar = ({ value, label }) => {
  const pct = Math.round((value || 0) * 100);
  const color =
    pct >= 75 ? '#34D399' : pct >= 50 ? '#FBBF24' : '#F87171';
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1 text-[#B0A698] font-medium">
        <span>{label}</span>
        <span className="font-mono font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-[#36312D] rounded-full overflow-hidden border border-[#4A433D]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

const BinIcon = ({ bin }) => {
  const b = (bin || '').toLowerCase();
  if (b.includes('recycle') || b.includes('glass') || b.includes('metal') || b.includes('paper')) {
    return <Recycle className="w-4 h-4 text-[#34D399]" />;
  }
  if (b.includes('hazard') || b.includes('e-waste') || b.includes('battery')) {
    return <AlertTriangle className="w-4 h-4 text-[#F87171]" />;
  }
  if (b.includes('organic') || b.includes('compost') || b.includes('yard')) {
    return <Activity className="w-4 h-4 text-[#FBBF24]" />;
  }
  if (b.includes('soft plastic') || b.includes('drop-off')) {
    return <AlertTriangle className="w-4 h-4 text-[#FBBF24]" />;
  }
  return <Trash2 className="w-4 h-4 text-[#B0A698]" />;
};

const RecyclabilityChip = ({ status }) => {
  const s = (status || '').toLowerCase();
  if (s === 'yes') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1C3B2E] text-[#34D399] border border-[#2D7351]">
      <CheckCircle2 className="w-3.5 h-3.5" /> Recyclable
    </span>
  );
  if (s.includes('compost') || s.includes('organic')) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#3A2216] text-[#FDBA74] border border-[#7D492A]">
      <Activity className="w-3.5 h-3.5" /> Compostable
    </span>
  );
  if (s.includes('drop-off') || s.includes('special') || s.includes('collection')) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#3A2E12] text-[#FBBF24] border border-[#7D6015]">
      <AlertTriangle className="w-3.5 h-3.5" /> Special Collection
    </span>
  );
  if (s.includes('certified') || s.includes('hazard') || s === 'no') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#3F1919] text-[#FCA5A5] border border-[#872D2D]">
      <XCircle className="w-3.5 h-3.5" /> Not Recyclable
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#36312D] text-[#D8D1C7] border border-[#4A433D]">
      <Info className="w-3.5 h-3.5" /> {status || 'Unknown'}
    </span>
  );
};

/* ─── main modal ──────────────────────────────────────────────────────────── */

export const ExplainabilityModal = ({ isOpen, onClose, item }) => {
  if (!item) return null;

  const heatmapSrc = formatImageSrc(item.heatmap);
  const cropSrc = formatImageSrc(item.crop_image);
  const detectorPct = Math.round((item.confidence || 0) * 100);
  const classifierPct = Math.round((item.classifier_confidence || item.confidence || 0) * 100);

  const isHighConf = detectorPct >= 75 && classifierPct >= 65;
  const isMedConf = !isHighConf && (detectorPct >= 50 || classifierPct >= 50);

  const verdictText = isHighConf
    ? 'High-certainty detection — the system is confident in this result.'
    : isMedConf
    ? 'Moderate certainty — the result is likely correct but worth a quick visual check.'
    : 'Low certainty — please inspect this item manually before disposal.';

  const verdictColor = isHighConf ? '#34D399' : isMedConf ? '#FBBF24' : '#F87171';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Visual Analysis: ${item.label}`}
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-5 text-[#F4EFEA]">

        {/* ── Image pair: crop vs heatmap ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Crop */}
          <div className="rounded-xl overflow-hidden border border-[#4A433D] bg-[#1E1B19] flex flex-col">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#4A433D] bg-[#242220]">
              <Eye className="w-3.5 h-3.5 text-[#B0A698]" />
              <span className="text-[11px] font-medium text-[#B0A698] font-mono uppercase tracking-wider">
                Detected Region
              </span>
            </div>
            <div className="flex items-center justify-center p-2 min-h-[160px]">
              {cropSrc ? (
                <img
                  src={cropSrc}
                  alt="Detected crop"
                  className="max-h-44 w-auto object-contain rounded-lg"
                />
              ) : (
                <span className="text-xs text-[#8A7F73] italic">Not available</span>
              )}
            </div>
          </div>

          {/* Heatmap */}
          <div className="rounded-xl overflow-hidden border border-[#4A433D] bg-[#1E1B19] flex flex-col">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#4A433D] bg-[#242220]">
              <Layers className="w-3.5 h-3.5 text-[#34D399]" />
              <span className="text-[11px] font-medium text-[#B0A698] font-mono uppercase tracking-wider">
                Attention Map
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 min-h-[160px] gap-2">
              {heatmapSrc ? (
                <img
                  src={heatmapSrc}
                  alt="Saliency heatmap"
                  className="max-h-44 w-auto object-contain rounded-lg"
                />
              ) : (
                <span className="text-xs text-[#8A7F73] italic">Not available</span>
              )}
              <span className="text-[10px] text-[#8A7F73] font-mono text-center leading-tight">
                Red = high focus · Blue = low focus
              </span>
            </div>
          </div>
        </div>

        {/* ── What does this mean? ────────────────────────────────────────── */}
        <div className="p-4 rounded-xl border border-[#4A433D] bg-[#2A2622]">
          <span className="text-xs font-semibold text-[#B0A698] uppercase tracking-wider block mb-2">
            How this was identified
          </span>
          <p className="text-sm text-[#D8D1C7] leading-relaxed">
            The detection system scanned the image and spotted{' '}
            <strong className="text-[#F4EFEA]">{item.label}</strong> based on its shape and edges.
            The material analyser then examined the texture, colour, and surface pattern of the
            highlighted region and classified it as{' '}
            <strong className="text-[#34D399]">{item.material || item.label}</strong>.
            The heatmap on the right shows which parts of the object influenced that decision most —
            warmer colours indicate where the system focused its attention.
          </p>
        </div>

        {/* ── Confidence scores ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-[#36312D] border border-[#4A433D] flex flex-col gap-3">
            <ConfidenceBar value={item.confidence} label="Object Detection" />
            <ConfidenceBar value={item.classifier_confidence || item.confidence} label="Material Classification" />
          </div>

          {/* Result summary */}
          <div className="p-4 rounded-xl bg-[#36312D] border border-[#4A433D] flex flex-col gap-3 justify-between">
            <div>
              <span className="text-[11px] font-medium text-[#B0A698] block mb-1">Disposal Bin</span>
              <div className="flex items-center gap-2">
                <BinIcon bin={item.bin} />
                <span className="font-semibold text-sm text-[#F4EFEA] font-display">{item.bin}</span>
              </div>
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#B0A698] block mb-1.5">Recyclability</span>
              <RecyclabilityChip status={item.recyclable} />
            </div>
          </div>
        </div>

        {/* ── Verdict banner ──────────────────────────────────────────────── */}
        <div
          className="p-3.5 rounded-xl border flex items-start gap-3"
          style={{ borderColor: `${verdictColor}33`, backgroundColor: `${verdictColor}0D` }}
        >
          {isHighConf ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: verdictColor }} />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: verdictColor }} />
          )}
          <p className="text-xs leading-relaxed" style={{ color: verdictColor }}>
            <strong>Verdict: </strong>{verdictText}
          </p>
        </div>

        {/* ── Disposal instructions ───────────────────────────────────────── */}
        {item.instructions && (
          <div className="p-4 bg-[#1C3B2E] border border-[#2D7351] rounded-xl">
            <span className="text-[11px] font-semibold text-[#34D399] uppercase tracking-wider block mb-1.5">
              Disposal Instructions
            </span>
            <p className="text-sm text-[#A7F3D0] leading-relaxed">{item.instructions}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ExplainabilityModal;
