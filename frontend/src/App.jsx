import React, { useState, useEffect } from 'react';
import {
  Recycle,
  Upload,
  Camera,
  History,
  Activity,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import Dropzone from './components/Dropzone';
import WebcamCapture from './components/WebcamCapture';
import AnnotatedViewer from './components/AnnotatedViewer';
import ObjectCard from './components/ObjectCard';
import ExplainabilityModal from './components/ExplainabilityModal';
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
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    checkHealth()
      .then((data) => setSystemHealth(data))
      .catch((err) => console.log('Backend not currently reachable', err));
  }, []);

  const handleFileUpload = async (file) => {
    setIsAnalyzing(true);
    // Create preview
    const reader = new FileReader();
    reader.onload = () => setOriginalImagePreview(reader.result);
    reader.readAsDataURL(file);

    try {
      const data = await analyzeImageFile(file);
      setAnalysisResult(data);
    } catch (err) {
      console.error('Analysis error:', err);
      alert('Error during waste analysis. Please check that the backend is running.');
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
      alert('Error during webcam snapshot analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Recycle className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                AI Waste Sorting
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  v1.0
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Multi-Stage Detection, Classification & Explainability
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'upload'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload
            </button>
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'camera'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Live Camera
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'history'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
          </div>

          {/* System status pill */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400">
              {systemHealth ? 'AI Engine Ready' : 'Connecting to API...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'history' ? (
          <HistoryDrawer />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Input & Image Visualizer */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {activeTab === 'upload' ? (
                <Dropzone onFileSelected={handleFileUpload} isLoading={isAnalyzing} />
              ) : (
                <WebcamCapture onCapture={handleWebcamCapture} isLoading={isAnalyzing} />
              )}

              {/* Visual detection canvas */}
              {originalImagePreview && (
                <AnnotatedViewer
                  originalImage={originalImagePreview}
                  annotatedImage={analysisResult?.annotated_image}
                  items={analysisResult?.items || []}
                  selectedItemId={selectedItem?.id}
                  onSelectItem={setSelectedItem}
                />
              )}
            </div>

            {/* Right Column: Breakdown & Results */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {analysisResult ? (
                <>
                  {/* Summary Metric Card */}
                  <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-slate-800">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Primary Disposal Stream
                        </span>
                        <h2 className="text-2xl font-extrabold text-emerald-400">
                          {analysisResult.primary_bin}
                        </h2>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Processing Speed</span>
                        <span className="text-sm font-bold text-slate-200 flex items-center justify-end gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          {analysisResult.processing_time_ms} ms
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <span className="text-slate-500 block mb-0.5">Total Objects</span>
                        <span className="text-base font-bold text-white">
                          {analysisResult.total_objects}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <span className="text-slate-500 block mb-0.5">Scan ID</span>
                        <span className="text-base font-bold text-slate-300">
                          #{analysisResult.scan_id || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Detected Items Breakdown */}
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                      Detected Objects ({analysisResult.items?.length || 0})
                    </h3>

                    {analysisResult.items?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No recyclable objects recognized in this frame.</p>
                    ) : (
                      analysisResult.items.map((item) => (
                        <ObjectCard
                          key={item.id}
                          item={item}
                          isSelected={selectedItem?.id === item.id}
                          onSelect={() => setSelectedItem(item)}
                          onExplain={(it) => setExplainItem(it)}
                        />
                      ))
                    )}
                  </div>
                </>
              ) : (
                /* Empty state / placeholder instructions */
                <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">Awaiting Waste Input</h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-4">
                    Upload a photograph or take a live camera snapshot of mixed recyclables to see
                    multi-item detection, material identification, and disposal recommendations.
                  </p>
                  <div className="flex flex-col gap-2 w-full text-left text-xs text-slate-400 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                    <span className="font-semibold text-slate-300">Supported streams:</span>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>Plastics (PET, HDPE), Aluminum, Cardboard & Paper</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      <span>Organic & Compostable Food Residues</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                      <span>Batteries & Electronic Waste</span>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Explainability Modal */}
      <ExplainabilityModal
        isOpen={!!explainItem}
        onClose={() => setExplainItem(null)}
        item={explainItem}
      />
    </div>
  );
}

export default App;
