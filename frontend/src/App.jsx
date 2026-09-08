import React, { useState, useEffect } from 'react';
import {
  Recycle,
  UploadCloud,
  Camera,
  History,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  Maximize2,
  Cpu,
  Package,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import Dropzone from './components/Dropzone';
import WebcamCapture from './components/WebcamCapture';
import ObjectCard from './components/ObjectCard';
import ExplainabilityModal from './components/ExplainabilityModal';
import FullscreenLightbox from './components/FullscreenLightbox';
import HistoryDrawer from './components/HistoryDrawer';
import BrandHeader from './components/BrandHeader';
import Card from './components/ui/Card';
import Badge from './components/ui/Badge';
import Button from './components/ui/Button';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from './components/ui/Empty';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/Tooltip';
import DotGrid from './components/bits/DotGrid';
import SpotlightCard from './components/bits/SpotlightCard';
import CountUp from './components/bits/CountUp';
import { analyzeImageFile, analyzeBase64, checkHealth } from './services/api';
import { formatImageSrc } from './utils/imageUtils';

export function App() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'camera' | 'history'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [originalImagePreview, setOriginalImagePreview] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [explainItem, setExplainItem] = useState(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    checkHealth()
      .then((data) => setSystemHealth(data))
      .catch((err) => console.log('Backend connection notice:', err));
  }, []);

  const handleFileUpload = async (file) => {
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = () => setOriginalImagePreview(reader.result);
    reader.readAsDataURL(file);

    try {
      const data = await analyzeImageFile(file);
      setAnalysisResult(data);
    } catch (err) {
      console.error('Analysis error:', err);
      alert('Error during waste analysis. Verify the backend service is running on port 8000.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleWebcamCapture = async (base64) => {
    setIsAnalyzing(true);
    setOriginalImagePreview(base64);

    try {
      const data = await analyzeBase64(base64);
      setAnalysisResult(data);
    } catch (err) {
      console.error('Webcam analysis error:', err);
      alert('Error during webcam capture analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetScene = () => {
    setAnalysisResult(null);
    setOriginalImagePreview(null);
    setSelectedItem(null);
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
    <div className="min-h-screen bg-[#14151A] text-[#F4F5F7] flex flex-col relative overflow-x-hidden">
      {/* React Bits Ambient Animated Dot Grid Background with Inertia Bulge */}
      <DotGrid spacing={20} dotColor="rgba(161, 171, 186, 0.42)" activeDotColor="rgba(52, 211, 153, 0.95)" bulgeRadius={125} maxPush={28} />

      {/* Top Header */}
      <header className="border-b border-[#282B37] bg-[#14151A]/90 backdrop-blur-md sticky top-0 z-30 shadow-warm-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <BrandHeader />

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#222530] p-0.5 rounded-xl border border-[#282B37] text-xs font-medium">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
                  activeTab === 'upload'
                    ? 'bg-[#2D3140] text-[#F4F5F7] shadow-sm font-semibold'
                    : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#34D399]" />
                Upload Scene
              </button>

              <button
                onClick={() => setActiveTab('camera')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
                  activeTab === 'camera'
                    ? 'bg-[#2D3140] text-[#F4F5F7] shadow-sm font-semibold'
                    : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-[#34D399]" />
                Live Sensor
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
                  activeTab === 'history'
                    ? 'bg-[#2D3140] text-[#F4F5F7] shadow-sm font-semibold'
                    : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
                }`}
              >
                <History className="w-3.5 h-3.5 text-[#34D399]" />
                Ledger History
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">
        {activeTab === 'history' ? (
          <HistoryDrawer />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Viewport / Capture Interface (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {analysisResult ? (
                <div className="flex flex-col gap-4">
                  {/* Top Bar with View in Fullscreen and Change Scene */}
                  <div className="flex items-center justify-between bg-[#1B1D24] border border-[#282B37] px-4 py-3 rounded-2xl shadow-warm-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="transition-transform hover:scale-110">
                        <Package className="w-5 h-5 text-[#34D399]" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-[#F4F5F7]">
                          Annotated Detection Scene
                        </h3>
                        <p className="text-[11px] font-mono text-[#9CA3AF]">
                          {analysisResult.items?.length || 0} discrete {analysisResult.items?.length === 1 ? 'target' : 'targets'} isolated
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsFullscreenOpen(true)}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#34D399]/15 hover:bg-[#34D399]/25 text-[#34D399] border border-[#34D399]/40 text-xs font-semibold transition-all shadow-sm"
                        id="view-fullscreen-btn"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-[#34D399]" />
                        View in Fullscreen
                      </button>

                      <button
                        onClick={handleResetScene}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#222530] hover:bg-[#282B37] text-[#9CA3AF] hover:text-[#F4F5F7] border border-[#282B37] text-xs font-medium transition-all"
                        title="Upload a new scene image"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Change Scene
                      </button>
                    </div>
                  </div>

                  {/* Annotated Bounding Box Image Frame */}
                  <div
                    className="group relative rounded-2xl overflow-hidden border border-[#282B37] bg-[#14151A] flex items-center justify-center min-h-[380px] max-h-[580px] shadow-warm-sm cursor-pointer"
                    onClick={() => setIsFullscreenOpen(true)}
                    title="Click to open Fullscreen Inspector"
                  >
                    <img
                      src={formatImageSrc(analysisResult.annotated_image)}
                      alt="Annotated waste detection view"
                      className="w-full h-full object-contain max-h-[560px] rounded-xl"
                    />

                    {/* Subtle bottom hover hint */}
                    <div className="absolute bottom-3 right-3 bg-[#1B1D24]/90 backdrop-blur-sm border border-[#282B37] text-[#9CA3AF] group-hover:text-[#F4F5F7] text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg transition-colors">
                      <Maximize2 className="w-3 h-3 text-[#34D399]" />
                      Click image or button above for Fullscreen
                    </div>
                  </div>

                  {/* Telemetry Strip */}
                  <TooltipProvider>
                    <div className="p-4 rounded-2xl bg-[#1B1D24]/95 backdrop-blur-sm border border-[#282B37] shadow-warm-sm flex items-center justify-between text-xs font-mono text-[#9CA3AF] flex-wrap gap-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 cursor-help">
                            <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                            <span>Inference: <strong className="text-[#F4F5F7]"><CountUp to={analysisResult.processing_time_ms} suffix=" ms" duration={0.5} /></strong></span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          End-to-end multi-stage pipeline inference latency
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 cursor-help">
                            <Package className="w-3.5 h-3.5 text-[#6B7280]" />
                            <span>Targets: <strong className="text-[#F4F5F7]"><CountUp to={analysisResult.total_objects} duration={0.4} /></strong></span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          Discrete waste targets isolated in scene
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 cursor-help">
                            <Layers className="w-3.5 h-3.5 text-[#6B7280]" />
                            <span>Pipeline: <strong className="text-[#34D399]">YOLOv8 + EfficientNet</strong></span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          Multi-stage architecture: YOLOv8m detection + 11-class EfficientNet-B2 classification + Grad-CAM saliency
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
              ) : (
                /* Capture Box when no result */
                activeTab === 'upload' ? (
                  <Dropzone onFileSelect={handleFileUpload} isAnalyzing={isAnalyzing} />
                ) : (
                  <WebcamCapture onCapture={handleWebcamCapture} isAnalyzing={isAnalyzing} />
                )
              )}
            </div>

            {/* Right Column: Classification & Directives (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {analysisResult ? (
                <>
                  {/* Primary Stream Banner Card with Spotlight */}
                  <SpotlightCard
                    spotlightColor={getPrimaryStreamStyle(analysisResult.primary_bin).spotlight}
                    size={200}
                    className={`p-6 rounded-2xl border transition-all ${
                      getPrimaryStreamStyle(analysisResult.primary_bin).border
                    } ${getPrimaryStreamStyle(analysisResult.primary_bin).bg} shadow-warm-sm`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#9CA3AF]">
                        Recommended Disposal Bin
                      </span>
                      <Badge variant={getPrimaryStreamStyle(analysisResult.primary_bin).badge}>
                        Session #{analysisResult.scan_id || '1'}
                      </Badge>
                    </div>

                    <h2
                      className={`text-2xl font-display font-extrabold tracking-tight ${
                        getPrimaryStreamStyle(analysisResult.primary_bin).text
                      }`}
                    >
                      {analysisResult.primary_bin}
                    </h2>

                    <p className="text-xs text-[#D1D5DB] mt-2 leading-relaxed font-medium">
                      All identified materials in this capture fulfill municipal directives for the designated bin.
                    </p>
                  </SpotlightCard>

                  {/* Detected Items Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-[#F4F5F7] text-sm tracking-tight flex items-center gap-2">
                      Identified Objects
                      <span className="text-xs font-mono text-[#9CA3AF] bg-[#222530] px-2.5 py-0.5 rounded-full border border-[#282B37]">
                        {analysisResult.items.length}
                      </span>
                    </h3>
                  </div>

                  {/* List of Detected Object Cards */}
                  <div className="flex flex-col gap-3.5">
                    {analysisResult.items.map((item) => (
                      <ObjectCard
                        key={item.id}
                        item={item}
                        isSelected={selectedItem?.id === item.id}
                        onClick={() => setSelectedItem(item)}
                        onExplain={(targetItem) => setExplainItem(targetItem)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                /* Contextual empty state prompt */
                <Empty variant="default" size="default" className="min-h-[380px] p-8">
                  <EmptyHeader>
                    <EmptyMedia variant="hover">
                      {activeTab === 'upload' ? (
                        <UploadCloud className="w-12 h-12 text-[#34D399] transition-all duration-300 hover:scale-115 cursor-pointer" />
                      ) : (
                        <Camera className="w-12 h-12 text-[#34D399] transition-all duration-300 hover:scale-115 cursor-pointer" />
                      )}
                    </EmptyMedia>
                    <EmptyTitle className="text-sm">
                      {activeTab === 'upload'
                        ? 'Awaiting Scene Upload'
                        : 'Awaiting Sensor Capture'}
                    </EmptyTitle>
                    <EmptyDescription className="max-w-xs leading-relaxed">
                      {activeTab === 'upload'
                        ? 'Drop or select an image on the left to initiate multi-target optical classification, confidence scoring, and disposal directives.'
                        : 'Position waste items within the sensor viewfinder on the left and capture a frame to generate instant stream directives.'}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Saliency Map Modal (Grad-CAM) */}
      <ExplainabilityModal
        isOpen={Boolean(explainItem)}
        onClose={() => setExplainItem(null)}
        item={explainItem}
      />

      {/* Fullscreen Interactive Lightbox */}
      {analysisResult && (
        <FullscreenLightbox
          isOpen={isFullscreenOpen}
          onClose={() => setIsFullscreenOpen(false)}
          annotatedImage={formatImageSrc(analysisResult.annotated_image)}
          originalImage={originalImagePreview}
          heatmapImage={explainItem?.heatmap ? formatImageSrc(explainItem.heatmap) : (analysisResult.items[0]?.heatmap ? formatImageSrc(analysisResult.items[0].heatmap) : null)}
          totalObjects={analysisResult.total_objects}
          items={analysisResult.items}
        />
      )}
    </div>
  );
}

export default App;
