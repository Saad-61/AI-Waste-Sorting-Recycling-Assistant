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
    if (b.includes('recyclable') || b.includes('blue')) {
      return { border: 'border-emerald-300', text: 'text-emerald-900', bg: 'bg-emerald-50/70', badge: 'success' };
    }
    if (b.includes('organic') || b.includes('compost')) {
      return { border: 'border-amber-300', text: 'text-amber-900', bg: 'bg-amber-50/70', badge: 'warning' };
    }
    if (b.includes('hazard') || b.includes('e-waste')) {
      return { border: 'border-rose-300', text: 'text-rose-900', bg: 'bg-rose-50/70', badge: 'danger' };
    }
    return { border: 'border-slate-300', text: 'text-slate-900', bg: 'bg-slate-50', badge: 'secondary' };
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 flex flex-col bg-dot-grid">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Recycle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-display font-bold tracking-tight text-slate-900 flex items-center gap-2">
                EcoSort Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                  v2.0
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Autonomous Optical Material & Stream Sorting
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'upload'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 text-slate-700" />
                Upload Scene
              </button>

              <button
                onClick={() => setActiveTab('camera')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'camera'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-slate-700" />
                Live Sensor
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'history'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5 text-slate-700" />
                History
              </button>
            </div>

            {/* Engine Status Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
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
                  annotatedImage={`data:image/jpeg;base64,${analysisResult.annotated_image}`}
                  originalImage={originalImagePreview}
                  items={analysisResult.items}
                  onSelectObject={setSelectedItem}
                  onOpenFullscreen={() => setIsFullscreenOpen(true)}
                />
              )}

              {/* Telemetry Strip */}
              {analysisResult && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-nordic flex items-center justify-between text-xs font-mono text-slate-600 flex-wrap gap-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Inference: <strong>{analysisResult.processing_time_ms} ms</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    <span>Targets: <strong>{analysisResult.total_objects}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Architecture: <strong>YOLOv8s + MobileNetV3</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Classification & Stream Directives (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {analysisResult ? (
                <>
                  {/* Primary Stream Banner Card */}
                  <div
                    className={`p-6 rounded-2xl border transition-all ${
                      getPrimaryStreamStyle(analysisResult.primary_bin).border
                    } ${getPrimaryStreamStyle(analysisResult.primary_bin).bg} shadow-nordic`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
                        Primary Disposal Stream
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

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      All identified materials in this capture fulfill municipal directives for the designated stream.
                    </p>
                  </div>

                  {/* Detected Items Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                      Identified Objects
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
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
                <div className="p-8 rounded-2xl border border-slate-200 bg-white text-center flex flex-col items-center justify-center min-h-[380px] shadow-nordic">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-3 shadow-sm">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-slate-900 text-sm mb-1">
                    No Active Optical Session
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
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
          annotatedImage={`data:image/jpeg;base64,${analysisResult.annotated_image}`}
          originalImage={originalImagePreview}
          heatmapImage={explainItem?.heatmap || (analysisResult.items[0]?.heatmap ? analysisResult.items[0].heatmap : null)}
          totalObjects={analysisResult.total_objects}
          items={analysisResult.items}
        />
      )}
    </div>
  );
}

export default App;
