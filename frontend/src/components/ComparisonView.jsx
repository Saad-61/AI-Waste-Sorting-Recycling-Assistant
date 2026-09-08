import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Layers,
  Clock,
  Package,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Maximize2,
  Cpu,
  ShieldCheck,
  ChevronRight,
  SplitSquareVertical,
  Activity,
  ArrowRight
} from 'lucide-react';
import AnnotatedViewer from './AnnotatedViewer';
import ObjectCard from './ObjectCard';
import FullscreenLightbox from './FullscreenLightbox';
import ExplainabilityModal from './ExplainabilityModal';
import SpotlightCard from './bits/SpotlightCard';
import CountUp from './bits/CountUp';
import ShinyText from './bits/ShinyText';
import Badge from './ui/Badge';
import { formatImageSrc } from '../utils/imageUtils';
import { compareModels } from '../services/api';

export default function ComparisonView() {
  const [comparisonResult, setComparisonResult] = useState(null);
  const [rawOriginalImage, setRawOriginalImage] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fullscreen & Explainability modal states
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    annotated: null,
    items: [],
    totalObjects: 0,
    modelName: ''
  });
  const [explainItem, setExplainItem] = useState(null);

  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processComparison(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processComparison(e.target.files[0]);
    }
  };

  const processComparison = async (file) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }

    setErrorMsg(null);
    setIsComparing(true);

    const reader = new FileReader();
    reader.onload = () => setRawOriginalImage(reader.result);
    reader.readAsDataURL(file);

    try {
      const data = await compareModels(file);
      setComparisonResult(data);
    } catch (err) {
      console.error('Comparison error:', err);
      setErrorMsg('Failed to run dual-model comparison. Ensure FastAPI server is running on port 8000.');
    } finally {
      setIsComparing(false);
    }
  };

  const handleReset = () => {
    setComparisonResult(null);
    setRawOriginalImage(null);
    setErrorMsg(null);
    setLightboxState({ isOpen: false, annotated: null, items: [], totalObjects: 0, modelName: '' });
    setExplainItem(null);
  };

  // Helper for primary stream styling
  const getPrimaryStreamStyle = (bin) => {
    const b = (bin || '').toLowerCase();
    if (b.includes('recyclable') || b.includes('glass') || b.includes('metal') || b.includes('paper')) {
      return { border: 'border-[#1B523B]', text: 'text-[#34D399]', bg: 'bg-[#0E261D]', badge: 'success', spotlight: 'rgba(52, 211, 153, 0.22)' };
    }
    if (b.includes('organic') || b.includes('compost') || b.includes('yard')) {
      return { border: 'border-[#5E3A1A]', text: 'text-[#F97316]', bg: 'bg-[#2A1B0E]', badge: 'warning', spotlight: 'rgba(249, 115, 22, 0.22)' };
    }
    if (b.includes('hazard') || b.includes('e-waste') || b.includes('battery')) {
      return { border: 'border-[#5C2028]', text: 'text-[#F87171]', bg: 'bg-[#2B1216]', badge: 'danger', spotlight: 'rgba(248, 113, 113, 0.22)' };
    }
    if (b.includes('soft plastic') || b.includes('drop-off') || b.includes('special')) {
      return { border: 'border-[#5C4916]', text: 'text-[#FBBF24]', bg: 'bg-[#29210C]', badge: 'warning', spotlight: 'rgba(251, 191, 36, 0.22)' };
    }
    return { border: 'border-[#282B37]', text: 'text-[#F4F5F7]', bg: 'bg-[#1B1D24]', badge: 'secondary', spotlight: 'rgba(156, 163, 175, 0.16)' };
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* ── 1. Upload & Scanning State (When no results yet) ───────────────── */}
      {!comparisonResult && (
        <div className="flex flex-col items-center justify-center min-h-[500px] w-full max-w-3xl mx-auto">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isComparing && fileInputRef.current?.click()}
            className={`w-full relative flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2 transition-all cursor-pointer ${
              dragActive
                ? 'border-[#34D399] bg-[#34D399]/5 scale-[1.01]'
                : 'border-[#282B37] hover:border-[#34D399]/50 bg-[#1B1D24]/80'
            } shadow-warm-md`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isComparing}
            />

            {isComparing ? (
              <div className="flex flex-col items-center gap-4">
                <div className="mb-2 transition-all duration-300 transform animate-pulse">
                  <SplitSquareVertical className="w-12 h-12 text-[#34D399]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-lg font-bold text-[#F4F5F7]">
                    Benchmarking Dual Pipelines...
                  </h3>
                  <p className="text-xs font-mono text-[#9CA3AF]">
                    Executing v1.0 (YOLOv8n + MobileNetV3) &amp; v2.0 (YOLOv8m + EfficientNet-B2)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono bg-[#14151A] px-4 py-2 rounded-xl border border-[#282B37] text-[#34D399]">
                  <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                  Extracting Saliency &amp; Cross-Comparing Decisions
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="mb-2 transition-all duration-300 transform group-hover:scale-115 group-hover:-translate-y-1 hover:scale-125 cursor-pointer">
                  <SplitSquareVertical className="w-12 h-12 text-[#34D399] transition-all duration-300" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-display text-xl font-bold text-[#F4F5F7]">
                    Upload Single Scene for Dual-Model Comparison
                  </h3>
                  <p className="text-xs text-[#9CA3AF] max-w-md">
                    Drag and drop or click to test one image across both <strong className="text-[#F4F5F7]">v1.0 (Edge Speed)</strong> and <strong className="text-[#34D399]">v2.0 (Deep Precision)</strong> simultaneously.
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 rounded-lg bg-[#14151A] border border-[#282B37] text-[11px] font-mono text-[#9CA3AF]">
                    JPG, PNG, WEBP
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-[#14151A] border border-[#282B37] text-[11px] font-mono text-[#34D399]">
                    Single Upload • Side-by-Side View
                  </span>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-[#2B1216] border border-[#5C2028] text-xs font-medium text-[#F87171] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}
        </div>
      )}

      {/* ── 2. Comparison Results View (50/50 Split Screen) ────────────────── */}
      {comparisonResult && (
        <div className="flex flex-col gap-6 w-full animate-fadeIn">
          {/* Top Telemetry Comparison Ribbon */}
          <div className="bg-[#1B1D24] border border-[#282B37] p-4 rounded-2xl shadow-warm-sm flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Telemetry Metrics */}
            <div className="flex items-center flex-wrap gap-4 text-xs font-mono">
              {/* Speedup Metric */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#14151A] border border-[#282B37]">
                <Clock className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-[#9CA3AF]">Speed Advantage: </span>
                  <strong className="text-[#34D399] font-bold">
                    {comparisonResult.summary.faster_model} is {comparisonResult.summary.speedup_factor}
                  </strong>
                  <span className="text-[#6B7280] ml-1">
                    ({comparisonResult.summary.latency_diff_ms} ms delta)
                  </span>
                </div>
              </div>

              {/* Object Counts Delta */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#14151A] border border-[#282B37]">
                <Package className="w-4 h-4 text-[#38BDF8]" />
                <div>
                  <span className="text-[#9CA3AF]">Isolated Targets: </span>
                  <strong className="text-[#F4F5F7]">
                    v1: {comparisonResult.summary.total_objects_v1}
                  </strong>
                  <span className="text-[#6B7280] mx-1.5">vs</span>
                  <strong className="text-[#34D399]">
                    v2: {comparisonResult.summary.total_objects_v2}
                  </strong>
                </div>
              </div>

              {/* Classification Agreement */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#14151A] border border-[#282B37]">
                {comparisonResult.summary.primary_bin_agreement ? (
                  <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
                <div>
                  <span className="text-[#9CA3AF]">Stream Consensus: </span>
                  <strong className={comparisonResult.summary.primary_bin_agreement ? 'text-[#34D399]' : 'text-amber-400'}>
                    {comparisonResult.summary.primary_bin_agreement ? '100% Agreement' : 'Divergent Streams'}
                  </strong>
                </div>
              </div>

              {/* Resolution */}
              <div className="hidden xl:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#14151A] border border-[#282B37] text-[#9CA3AF]">
                <span>Resolution: <strong className="text-[#F4F5F7]">{comparisonResult.summary.image_resolution}</strong></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#222530] hover:bg-[#282B37] text-[#9CA3AF] hover:text-[#F4F5F7] border border-[#282B37] text-xs font-medium transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Change Benchmark Scene
              </button>
            </div>
          </div>

          {/* Symmetrical 50/50 Split Screen Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
            {/* ── Left Column: Pipeline v1.0 (Edge Speed) ────────────────────── */}
            <div className="flex flex-col gap-4 bg-[#1B1D24]/60 border border-[#282B37] p-4 sm:p-5 rounded-3xl shadow-warm-md">
              {/* Pipeline Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#282B37]">
                <div className="flex items-center gap-2.5">
                  <div className="transition-transform hover:scale-110">
                    <Package className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-sm text-[#F4F5F7]">
                        Pipeline v1.0
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Edge Speed
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-[#9CA3AF]">
                      YOLOv8n + MobileNetV3 • Edge Architecture
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <div className="px-2.5 py-1 rounded-lg bg-[#14151A] border border-[#282B37] text-[11px] font-mono text-[#9CA3AF]">
                    Latency: <strong className="text-[#F4F5F7]"><CountUp to={comparisonResult.v1.processing_time_ms} suffix=" ms" duration={0.4} /></strong>
                  </div>
                </div>
              </div>

              {/* Annotated Image Frame */}
              <div className="w-full">
                <AnnotatedViewer
                  annotatedImage={comparisonResult.v1.annotated_image}
                  originalImage={rawOriginalImage}
                  items={comparisonResult.v1.items || []}
                  modelBadge="YOLOv8n + MobileNetV3"
                  onOpenFullscreen={() => setLightboxState({
                    isOpen: true,
                    annotated: comparisonResult.v1.annotated_image,
                    items: comparisonResult.v1.items || [],
                    totalObjects: comparisonResult.v1.total_objects || 0,
                    modelName: 'Pipeline v1.0 (MobileNetV3 + YOLOv8n)'
                  })}
                />
              </div>

              {/* Scrollable Data Stack */}
              <div className="flex flex-col gap-3.5 max-h-[500px] overflow-y-auto pr-1.5 custom-scrollbar">
                {/* Primary Stream Banner */}
                <SpotlightCard
                  spotlightColor={getPrimaryStreamStyle(comparisonResult.v1.primary_bin).spotlight}
                  size={160}
                  className={`p-4 rounded-2xl border transition-all shrink-0 min-h-[82px] ${
                    getPrimaryStreamStyle(comparisonResult.v1.primary_bin).border
                  } ${getPrimaryStreamStyle(comparisonResult.v1.primary_bin).bg}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#9CA3AF]">
                      Disposal Stream (v1.0)
                    </span>
                    <Badge variant={getPrimaryStreamStyle(comparisonResult.v1.primary_bin).badge}>
                      v1.0 Verdict
                    </Badge>
                  </div>
                  <h4 className={`text-lg font-display font-extrabold ${getPrimaryStreamStyle(comparisonResult.v1.primary_bin).text}`}>
                    {comparisonResult.v1.primary_bin}
                  </h4>
                </SpotlightCard>

                {/* Targets List */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-mono text-[#9CA3AF]">
                    Isolated Targets ({comparisonResult.v1.items?.length || 0})
                  </span>
                </div>

                {comparisonResult.v1.items && comparisonResult.v1.items.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {comparisonResult.v1.items.map((item) => (
                      <ObjectCard
                        key={item.id}
                        item={item}
                        isSelected={false}
                        onClick={() => {}}
                        onExplain={() => setExplainItem(item)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs font-mono text-[#6B7280] bg-[#14151A] rounded-2xl border border-[#282B37]">
                    No discrete targets isolated by v1.0
                  </div>
                )}
              </div>
            </div>

            {/* ── Right Column: Pipeline v2.0 (Deep Precision) ───────────────── */}
            <div className="flex flex-col gap-4 bg-[#1B1D24]/60 border border-[#282B37] p-4 sm:p-5 rounded-3xl shadow-warm-md">
              {/* Pipeline Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#282B37]">
                <div className="flex items-center gap-2.5">
                  <div className="transition-transform hover:scale-110">
                    <Package className="w-5 h-5 text-[#34D399]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-sm text-[#F4F5F7]">
                        Pipeline v2.0
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#34D399] border border-[#10B981]/20 font-semibold">
                        Deep Precision
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-[#9CA3AF]">
                      YOLOv8m + EfficientNet-B2 • High-Fidelity Saliency
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <div className="px-2.5 py-1 rounded-lg bg-[#14151A] border border-[#282B37] text-[11px] font-mono text-[#9CA3AF]">
                    Latency: <strong className="text-[#34D399]"><CountUp to={comparisonResult.v2.processing_time_ms} suffix=" ms" duration={0.4} /></strong>
                  </div>
                </div>
              </div>

              {/* Annotated Image Frame */}
              <div className="w-full">
                <AnnotatedViewer
                  annotatedImage={comparisonResult.v2.annotated_image}
                  originalImage={rawOriginalImage}
                  items={comparisonResult.v2.items || []}
                  modelBadge="YOLOv8m + EfficientNet-B2"
                  onOpenFullscreen={() => setLightboxState({
                    isOpen: true,
                    annotated: comparisonResult.v2.annotated_image,
                    items: comparisonResult.v2.items || [],
                    totalObjects: comparisonResult.v2.total_objects || 0,
                    modelName: 'Pipeline v2.0 (EfficientNet-B2 + YOLOv8m)'
                  })}
                />
              </div>

              {/* Scrollable Data Stack */}
              <div className="flex flex-col gap-3.5 max-h-[500px] overflow-y-auto pr-1.5 custom-scrollbar">
                {/* Primary Stream Banner */}
                <SpotlightCard
                  spotlightColor={getPrimaryStreamStyle(comparisonResult.v2.primary_bin).spotlight}
                  size={160}
                  className={`p-4 rounded-2xl border transition-all shrink-0 min-h-[82px] ${
                    getPrimaryStreamStyle(comparisonResult.v2.primary_bin).border
                  } ${getPrimaryStreamStyle(comparisonResult.v2.primary_bin).bg}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#9CA3AF]">
                      Disposal Stream (v2.0)
                    </span>
                    <Badge variant={getPrimaryStreamStyle(comparisonResult.v2.primary_bin).badge}>
                      v2.0 Verdict
                    </Badge>
                  </div>
                  <h4 className={`text-lg font-display font-extrabold ${getPrimaryStreamStyle(comparisonResult.v2.primary_bin).text}`}>
                    {comparisonResult.v2.primary_bin}
                  </h4>
                </SpotlightCard>

                {/* Targets List */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-mono text-[#9CA3AF]">
                    Isolated Targets ({comparisonResult.v2.items?.length || 0})
                  </span>
                </div>

                {comparisonResult.v2.items && comparisonResult.v2.items.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {comparisonResult.v2.items.map((item) => (
                      <ObjectCard
                        key={item.id}
                        item={item}
                        isSelected={false}
                        onClick={() => {}}
                        onExplain={() => setExplainItem(item)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs font-mono text-[#6B7280] bg-[#14151A] rounded-2xl border border-[#282B37]">
                    No discrete targets isolated by v2.0
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shared Fullscreen Lightbox */}
      <FullscreenLightbox
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}
        annotatedImage={lightboxState.annotated}
        originalImage={rawOriginalImage}
        items={lightboxState.items}
        totalObjects={lightboxState.totalObjects}
      />

      {/* Shared Explainability Modal */}
      <ExplainabilityModal
        isOpen={!!explainItem}
        onClose={() => setExplainItem(null)}
        item={explainItem}
      />
    </div>
  );
}
