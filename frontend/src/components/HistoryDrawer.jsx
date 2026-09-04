import React, { useState, useEffect } from 'react';
import {
  Download,
  History,
  RefreshCw,
  Clock,
  Package,
  Layers,
  CheckCircle2,
  ExternalLink,
  X,
  Maximize2,
  Calendar
} from 'lucide-react';
import { getScanHistory, getExportCsvUrl } from '../services/api';
import Modal from './ui/Modal';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { formatImageSrc } from '../utils/imageUtils';

export const HistoryDrawer = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getScanHistory(30, 0, filter);
      setHistory(data.records || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  // Helper for stream styling
  const getStreamColor = (bin) => {
    const b = (bin || '').toLowerCase();
    if (b.includes('recyclable') || b.includes('blue')) {
      return { bg: 'bg-[#1C3B2E]', text: 'text-[#5EEAD4]', pill: 'bg-[#1C3B2E] text-[#5EEAD4] border border-[#2D7351]' };
    }
    if (b.includes('organic') || b.includes('compost')) {
      return { bg: 'bg-[#3A2216]', text: 'text-[#FDBA74]', pill: 'bg-[#3A2216] text-[#FDBA74] border border-[#7D492A]' };
    }
    if (b.includes('hazard') || b.includes('e-waste')) {
      return { bg: 'bg-[#3F1919]', text: 'text-[#FCA5A5]', pill: 'bg-[#3F1919] text-[#FCA5A5] border border-[#872D2D]' };
    }
    return { bg: 'bg-[#36312D]', text: 'text-[#F4EFEA]', pill: 'bg-[#36312D] text-[#D8D1C7] border border-[#4A433D]' };
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header & Export controls */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[#4A433D]">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#2E2A27] rounded-xl border border-[#4A433D] text-[#34D399] shadow-warm-sm">
            <History className="w-5 h-5 text-[#34D399]" />
          </div>
          <div>
            <h3 className="text-base font-display font-bold text-[#F4EFEA]">Scan Ledger & Sorting Records</h3>
            <p className="text-xs text-[#B0A698]">Historical audits with image previews and material breakdowns</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchHistory} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <a href={getExportCsvUrl()} download="waste_scan_history.csv">
            <Button variant="evergreen" size="sm">
              <Download className="w-3.5 h-3.5 mr-1" />
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Recyclable', 'Organic', 'Hazardous', 'General Waste'].map((b) => {
          const isSelected = (filter === null && b === 'All') || filter === b;
          return (
            <button
              key={b}
              onClick={() => setFilter(b === 'All' ? null : b)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                isSelected
                  ? 'bg-[#4A433D] text-[#F4EFEA] shadow-sm'
                  : 'bg-[#2E2A27] text-[#B0A698] border border-[#4A433D] hover:bg-[#36312D]'
              }`}
            >
              {b}
            </button>
          );
        })}
      </div>

      {/* History table / card list */}
      {loading && history.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#B0A698] font-mono">
          Loading scan ledger...
        </div>
      ) : history.length === 0 ? (
        <div className="p-12 bg-[#2E2A27] rounded-2xl border border-[#4A433D] text-center shadow-warm-sm">
          <Package className="w-8 h-8 text-[#8A7F73] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#F4EFEA] font-display">No records found</p>
          <p className="text-xs text-[#B0A698] mt-1">Upload or capture an image to generate the first ledger record.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((record) => {
            const style = getStreamColor(record.primary_bin);
            const imageSrc = formatImageSrc(record.image_base64);

            return (
              <div
                key={record.id}
                onClick={() => setSelectedRecord(record)}
                className="p-4 rounded-2xl bg-[#2E2A27] border border-[#4A433D] shadow-warm-sm hover:border-[#635A52] hover:bg-[#332E2A] transition flex items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  {/* Image Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#242220] border border-[#4A433D] flex items-center justify-center shrink-0 relative">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt="Scan preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-[#8A7F73]" />
                    )}
                    <div className="absolute inset-0 bg-[#242220]/0 group-hover:bg-[#242220]/40 transition flex items-center justify-center">
                      <Maximize2 className="w-3.5 h-3.5 text-[#F4EFEA] opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </div>

                  {/* Details */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#F4EFEA] text-sm font-display">
                        Session #{record.id}
                      </span>
                      <span className="text-xs font-medium text-[#B0A698]">
                        · {record.total_objects} {record.total_objects === 1 ? 'Object' : 'Objects'}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.pill}`}>
                        {record.primary_bin}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-[#B0A698] mt-1.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#8A7F73]" />
                        {record.processing_time_ms} ms
                      </span>
                      <span>·</span>
                      <span>{new Date(record.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right Inspect Prompt */}
                <div className="flex items-center gap-2 text-xs font-medium text-[#B0A698] group-hover:text-[#F4EFEA] transition">
                  <span className="hidden sm:inline text-[11px]">View Details</span>
                  <ExternalLink className="w-4 h-4 text-[#8A7F73] group-hover:text-[#34D399]" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Detail Modal */}
      {selectedRecord && (
        <Modal
          isOpen={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          title={`Session Audit #${selectedRecord.id}`}
          maxWidth="max-w-2xl"
        >
          <div className="flex flex-col gap-5 text-[#F4EFEA]">
            {/* Full Image */}
            {selectedRecord.image_base64 && (
              <div className="rounded-xl overflow-hidden border border-[#4A433D] bg-[#242220] flex items-center justify-center p-2">
                <img
                  src={formatImageSrc(selectedRecord.image_base64)}
                  alt="Full capture preview"
                  className="max-h-72 w-auto object-contain rounded-lg shadow-sm"
                />
              </div>
            )}

            {/* Session Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 bg-[#36312D] rounded-xl border border-[#4A433D]">
                <span className="text-[#B0A698] block mb-0.5 font-medium">Recommended Bin</span>
                <span className="font-bold text-[#34D399] font-display">{selectedRecord.primary_bin}</span>
              </div>
              <div className="p-3 bg-[#36312D] rounded-xl border border-[#4A433D]">
                <span className="text-[#B0A698] block mb-0.5 font-medium">Objects Detected</span>
                <span className="font-bold text-[#F4EFEA] font-display">{selectedRecord.total_objects}</span>
              </div>
              <div className="p-3 bg-[#36312D] rounded-xl border border-[#4A433D]">
                <span className="text-[#B0A698] block mb-0.5 font-medium">Inference Speed</span>
                <span className="font-mono font-bold text-[#F4EFEA]">{selectedRecord.processing_time_ms} ms</span>
              </div>
              <div className="p-3 bg-[#36312D] rounded-xl border border-[#4A433D]">
                <span className="text-[#B0A698] block mb-0.5 font-medium">Filename</span>
                <span className="font-mono text-[#B0A698] truncate block">{selectedRecord.filename}</span>
              </div>
            </div>

            {/* Detected Items Breakdown */}
            <div>
              <h4 className="font-display font-bold text-sm text-[#F4EFEA] mb-2.5">
                Detected Objects in This Capture ({selectedRecord.detected_items?.length || 0})
              </h4>
              <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
                {selectedRecord.detected_items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#36312D] border border-[#4A433D] text-xs flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F4EFEA] capitalize font-display">{item.label}</span>
                        <span className="text-[#B0A698]">({item.material || 'General Material'})</span>
                      </div>
                      <Badge variant="primary" className="text-[10px] py-0 px-2">
                        {item.bin}
                      </Badge>
                    </div>
                    {item.instructions && (
                      <p className="text-[11px] text-[#B0A698] leading-relaxed">
                        <strong className="text-[#F4EFEA]">Directive:</strong> {item.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HistoryDrawer;
