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
import AnnotatedViewer from './components/AnnotatedViewer';
import ObjectCard from './components/ObjectCard';
import ExplainabilityModal from './components/ExplainabilityModal';
import FullscreenLightbox from './components/FullscreenLightbox';
import HistoryDrawer from './components/HistoryDrawer';
import Card from './components/ui/Card';
import Badge from './components/ui/Badge';
import Button from './components/ui/Button';
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

  // Helper for primary stream styling
  const getPrimaryStreamStyle = (bin) => {
    const b = (bin || '').toLowerCase();
    if (b.includes('recyclable') || b.includes('glass') || b.includes('metal') || b.includes('paper')) {
      return { border: 'border-[#2D7351]', text: 'text-[#5EEAD4]', bg: 'bg-[#1C3B2E]', badge: 'success' };
    }
    if (b.includes('organic') || b.includes('compost') || b.includes('yard')) {
      return { border: 'border-[#7D492A]', text: 'text-[#FDBA74]', bg: 'bg-[#3A2216]', badge: 'warning' };
    }
    if (b.includes('hazard') || b.includes('e-waste') || b.includes('battery')) {
      return { border: 'border-[#872D2D]', text: 'text-[#FCA5A5]', bg: 'bg-[#3F1919]', badge: 'danger' };
    }
    if (b.includes('soft plastic') || b.includes('drop-off') || b.includes('special')) {
      return { border: 'border-[#7D6015]', text: 'text-[#FBBF24]', bg: 'bg-[#3A2E12]', badge: 'warning' };
    }
    return { border: 'border-[#4A433D]', text: 'text-[#F4EFEA]', bg: 'bg-[#2E2A27]', badge: 'secondary' };
  };

  return (
    <div className="min-h-screen bg-[#242220] text-[#F4EFEA] flex flex-col bg-warm-grid">
      {/* Top Header */}
      <header className="border-b border-[#4A433D] bg-[#242220]/90 backdrop-blur-md sticky top-0 z-30 shadow-warm-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1F5A3B] text-white flex items-center justify-center shadow-warm-sm">
              <Recycle className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-sm font-display font-bold tracking-tight text-[#F4EFEA] flex items-center gap-2">
                EcoSort Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1C3B2E] text-[#5EEAD4] border border-[#2D7351] font-mono font-medium">
                  v2.0
                </span>
              </h1>
              <p className="text-[11px] text-[#B0A698] hidden sm:block">
                Autonomous Optical Waste & Material Sorting
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#36312D] p-0.5 rounded-xl border border-[#4A433D] text-xs font-medium">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
                  activeTab === 'upload'
                    ? 'bg-[#4A433D] text-[#F4EFEA] shadow-sm font-semibold'
                    : 'text-[#B0A698] hover:text-[#F4EFEA]'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#34D399]" />
                Upload Scene
              </button>

              <button
                onClick={() => setActiveTab('camera')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
                  activeTab === 'camera'
                    ? 'bg-[#4A433D] text-[#F4EFEA] shadow-sm font-semibold'
                    : 'text-[#B0A698] hover:text-[#F4EFEA]'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-[#34D399]" />
                Live Sensor
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
                  activeTab === 'history'
                    ? 'bg-[#4A433D] text-[#F4EFEA] shadow-sm font-semibold'
                    : 'text-[#B0A698] hover:text-[#F4EFEA]'
                }`}
              >
                <History className="w-3.5 h-3.5 text-[#34D399]" />
                Ledger History
              </button>
            </div>

            {/* Engine Status Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2E2A27] border border-[#4A433D] text-[11px] font-mono text-[#B0A698]">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Engine: Online
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'history' ? (
          <HistoryDrawer />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Viewport / Capture Interface (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Capture Box */}
              {activeTab === 'upload' ? (
                <Dropzone onFileSelect={handleFileUpload} isAnalyzing={isAnalyzing} />
              ) : (
                <WebcamCapture onCapture={handleWebcamCapture} isAnalyzing={isAnalyzing} />
              )}

              {/* Inspection Viewport */}
              {analysisResult && (
                <AnnotatedViewer
                  annotatedImage={formatImageSrc(analysisResult.annotated_image)}
                  originalImage={originalImagePreview}
                  items={analysisResult.items}
                  onSelectObject={setSelectedItem}
                  onOpenFullscreen={() => setIsFullscreenOpen(true)}
                />
              )}

              {/* Telemetry Strip */}
              {analysisResult && (
                <div className="p-4 rounded-2xl bg-[#2E2A27] border border-[#4A433D] shadow-warm-sm flex items-center justify-between text-xs font-mono text-[#B0A698] flex-wrap gap-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#8A7F73]" />
                    <span>Inference: <strong className="text-[#F4EFEA]">{analysisResult.processing_time_ms} ms</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#8A7F73]" />
                    <span>Targets: <strong className="text-[#F4EFEA]">{analysisResult.total_objects}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#8A7F73]" />
                    <span>Pipeline: <strong className="text-[#34D399]">YOLOv8s + MobileNetV3</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Classification & Directives (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {analysisResult ? (
                <>
                  {/* Primary Stream Banner Card */}
                  <div
                    className={`p-6 rounded-2xl border transition-all ${
                      getPrimaryStreamStyle(analysisResult.primary_bin).border
                    } ${getPrimaryStreamStyle(analysisResult.primary_bin).bg} shadow-warm-sm`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#B0A698]">
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

                    <p className="text-xs text-[#D8D1C7] mt-2 leading-relaxed font-medium">
                      All identified materials in this capture fulfill municipal directives for the designated bin.
                    </p>
                  </div>

                  {/* Detected Items Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-[#F4EFEA] text-sm tracking-tight flex items-center gap-2">
                      Identified Objects
                      <span className="text-xs font-mono text-[#B0A698] bg-[#36312D] px-2.5 py-0.5 rounded-full border border-[#4A433D]">
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
                /* Empty state prompt */
                <div className="p-8 rounded-2xl border border-[#4A433D] bg-[#2E2A27] text-center flex flex-col items-center justify-center min-h-[380px] shadow-warm-sm">
                  <div className="w-12 h-12 rounded-2xl bg-[#36312D] border border-[#4A433D] flex items-center justify-center text-[#B0A698] mb-3 shadow-sm">
                    <Layers className="w-6 h-6 text-[#34D399]" />
                  </div>
                  <h3 className="font-display font-bold text-[#F4EFEA] text-sm mb-1">
                    No Active Optical Session
                  </h3>
                  <p className="text-xs text-[#B0A698] max-w-xs leading-relaxed">
                    Upload an image or activate the live sensor on the left to initiate real-time material classification and disposal guidance.
                  </p>
                </div>
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
