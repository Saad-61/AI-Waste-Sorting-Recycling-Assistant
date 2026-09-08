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
  Calendar,
  FileText,
  AlertCircle
} from 'lucide-react';
import { getScanHistory, getExportCsvUrl } from '../services/api';
import Modal from './ui/Modal';
import Badge from './ui/Badge';
import Button from './ui/Button';
import {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentGroup
} from './ui/attachment';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent
} from './ui/Empty';
import { Alert, AlertTitle, AlertDescription } from './ui/Alert';
import { formatImageSrc } from '../utils/imageUtils';

export const HistoryDrawer = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [emptyAlert, setEmptyAlert] = useState(false);

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

  const handleDownloadClick = (e) => {
    if (history.length === 0) {
      e.preventDefault();
      setEmptyAlert(true);
      setTimeout(() => setEmptyAlert(false), 5000);
      return;
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  // Helper for stream styling
  const getStreamColor = (bin) => {
    const b = (bin || '').toLowerCase();
    if (b.includes('recyclable') || b.includes('blue')) {
      return { bg: 'bg-[#0E261D]', text: 'text-[#34D399]', pill: 'bg-[#0E261D] text-[#34D399] border border-[#1B523B]', badge: 'success' };
    }
    if (b.includes('organic') || b.includes('compost')) {
      return { bg: 'bg-[#2A1B0E]', text: 'text-[#F97316]', pill: 'bg-[#2A1B0E] text-[#F97316] border border-[#5E3A1A]', badge: 'warning' };
    }
    if (b.includes('hazard') || b.includes('e-waste')) {
      return { bg: 'bg-[#2B1216]', text: 'text-[#F87171]', pill: 'bg-[#2B1216] text-[#F87171] border border-[#5C2028]', badge: 'danger' };
    }
    return { bg: 'bg-[#222530]', text: 'text-[#F4F5F7]', pill: 'bg-[#222530] text-[#D1D5DB] border border-[#282B37]', badge: 'secondary' };
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header & Export controls */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[#282B37]">
        <div className="flex items-center gap-3">
          <div className="transition-all duration-300 transform hover:scale-115 hover:-translate-y-0.5 cursor-pointer">
            <History className="w-6 h-6 text-[#34D399] transition-all duration-300" />
          </div>
          <div>
            <h3 className="text-base font-display font-bold text-[#F4F5F7]">Scan Ledger & Sorting Records</h3>
            <p className="text-xs text-[#9CA3AF]">Historical audits with image previews and material breakdowns</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchHistory} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <a
            href={history.length > 0 ? getExportCsvUrl() : '#'}
            download={history.length > 0 ? "waste_scan_history.csv" : undefined}
            onClick={handleDownloadClick}
          >
            <Attachment
              variant="outline"
              size="sm"
              className={`bg-[#1B1D24] hover:bg-[#222530] border-[#282B37] hover:border-[#3D4357] py-1 px-2.5 transition-colors ${
                history.length === 0 ? 'opacity-80 cursor-pointer' : ''
              }`}
            >
              <AttachmentMedia variant="icon" className="w-6 h-6 p-1 rounded-md bg-[#10B981]/15 border-[#10B981]/30">
                <FileText className="w-3.5 h-3.5 text-[#34D399]" />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle className="text-[11px]">waste_scan_history.csv</AttachmentTitle>
                <AttachmentDescription className="text-[10px]">
                  {history.length > 0 ? `${history.length} Records` : 'Empty Dataset'}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction aria-label="Export CSV history file">
                  <Download className="w-3.5 h-3.5 text-[#34D399]" />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
          </a>
        </div>
      </div>

      {/* Empty Ledger Download Warning Alert */}
      {emptyAlert && (
        <Alert
          variant="warning"
          className="flex items-start justify-between gap-3.5 bg-[#1B1D24] border-[#F59E0B]/35 p-4 rounded-2xl shadow-warm-md"
        >
          <div className="flex items-start gap-3.5">
            <div className="shrink-0 mt-0.5 transition-all duration-300 transform hover:scale-115 cursor-pointer">
              <AlertCircle className="w-6 h-6 text-[#FBBF24] transition-all duration-300" />
            </div>
            <div>
              <AlertTitle className="text-sm font-bold text-[#F4F5F7] font-display">
                Cannot Export Empty Ledger
              </AlertTitle>
              <AlertDescription className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
                There are no historical scan records or sorting sessions available to export. Upload or capture an image to generate ledger data before downloading.
              </AlertDescription>
            </div>
          </div>
          <button
            onClick={() => setEmptyAlert(false)}
            className="text-[#9CA3AF] hover:text-[#F4F5F7] p-1.5 shrink-0 rounded-lg hover:bg-[#222530] transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </Alert>
      )}

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
                  ? 'bg-[#2D3140] text-[#F4F5F7] shadow-sm'
                  : 'bg-[#1B1D24] text-[#9CA3AF] border border-[#282B37] hover:bg-[#222530]'
              }`}
            >
              {b}
            </button>
          );
        })}
      </div>

      {/* History table / card list */}
      {loading && history.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#9CA3AF] font-mono">
          Loading scan ledger...
        </div>
      ) : history.length === 0 ? (
        <Empty variant="default" size="lg" className="border-[#282B37] bg-[#1B1D24]">
          <EmptyHeader>
            <EmptyMedia variant="hover">
              <Package className="w-11 h-11 text-[#34D399] transition-all duration-300 hover:scale-115" />
            </EmptyMedia>
            <EmptyTitle>Scan Ledger is Empty</EmptyTitle>
            <EmptyDescription>
              Optical waste sorting records and material breakdowns will appear here automatically once you upload or capture a scene for inference.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="secondary" size="sm" onClick={fetchHistory} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Check for Records
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <AttachmentGroup className="gap-3">
          {history.map((record) => {
            const style = getStreamColor(record.primary_bin);
            const imageSrc = formatImageSrc(record.image_base64);

            return (
              <Attachment
                key={record.id}
                size="lg"
                variant="card"
                onClick={() => setSelectedRecord(record)}
                className="cursor-pointer group hover:border-[#3D4357] hover:bg-[#20232C] transition-all duration-200"
              >
                {/* Image Thumbnail */}
                <AttachmentMedia
                  variant="image"
                  className="w-16 h-16 rounded-xl border-[#282B37] shrink-0"
                >
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt="Scan preview"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-[#6B7280]" />
                  )}
                  <div className="absolute inset-0 bg-[#14151A]/0 group-hover:bg-[#14151A]/40 transition flex items-center justify-center">
                    <Maximize2 className="w-3.5 h-3.5 text-[#F4F5F7] opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </AttachmentMedia>

                {/* Content & Metadata */}
                <AttachmentContent>
                  <div className="flex items-center gap-2 flex-wrap">
                    <AttachmentTitle className="text-sm">
                      {record.filename || `Session #${record.id}`}
                    </AttachmentTitle>
                    <span className="text-xs font-medium text-[#9CA3AF]">
                      · {record.total_objects} {record.total_objects === 1 ? 'Object' : 'Objects'}
                    </span>
                    <Badge variant={style.badge || 'secondary'} className="text-[10px] py-0 px-2">
                      {record.primary_bin}
                    </Badge>
                  </div>

                  <AttachmentDescription>
                    <Clock className="w-3 h-3 text-[#6B7280]" />
                    <span>{record.processing_time_ms} ms</span>
                    <span>·</span>
                    <span>{new Date(record.created_at).toLocaleString()}</span>
                  </AttachmentDescription>
                </AttachmentContent>

                {/* Actions */}
                <AttachmentActions>
                  <span className="hidden sm:inline text-[11px] text-[#9CA3AF] group-hover:text-[#F4F5F7] font-medium transition mr-1">
                    View Details
                  </span>
                  <AttachmentAction aria-label={`View audit details for session ${record.id}`}>
                    <ExternalLink className="w-4 h-4 text-[#6B7280] group-hover:text-[#34D399] transition-colors" />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            );
          })}
        </AttachmentGroup>
      )}

      {/* History Detail Modal */}
      {selectedRecord && (
        <Modal
          isOpen={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          title={`Session Audit #${selectedRecord.id}`}
          maxWidth="max-w-2xl"
        >
          <div className="flex flex-col gap-5 text-[#F4F5F7]">
            {/* Attached Full Image */}
            {selectedRecord.image_base64 && (
              <Attachment variant="default" size="default" className="w-full flex-col items-stretch p-3 bg-[#14151A] border-[#282B37]">
                <div className="rounded-xl overflow-hidden border border-[#282B37] bg-[#0E0F12] flex items-center justify-center p-2 mb-2">
                  <img
                    src={formatImageSrc(selectedRecord.image_base64)}
                    alt="Full capture preview"
                    className="max-h-72 w-auto object-contain rounded-lg shadow-sm"
                  />
                </div>
                <div className="flex items-center justify-between w-full px-1">
                  <AttachmentContent>
                    <AttachmentTitle className="text-xs">
                      {selectedRecord.filename || `ledger_scan_${selectedRecord.id}.jpg`}
                    </AttachmentTitle>
                    <AttachmentDescription>
                      <span>Optical Waste Scene</span>
                      <span>·</span>
                      <span>{selectedRecord.processing_time_ms} ms latency</span>
                      <span>·</span>
                      <span>{new Date(selectedRecord.created_at).toLocaleDateString()}</span>
                    </AttachmentDescription>
                  </AttachmentContent>
                </div>
              </Attachment>
            )}

            {/* Session Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 bg-[#222530] rounded-xl border border-[#282B37]">
                <span className="text-[#9CA3AF] block mb-0.5 font-medium">Recommended Bin</span>
                <span className="font-bold text-[#34D399] font-display">{selectedRecord.primary_bin}</span>
              </div>
              <div className="p-3 bg-[#222530] rounded-xl border border-[#282B37]">
                <span className="text-[#9CA3AF] block mb-0.5 font-medium">Objects Detected</span>
                <span className="font-bold text-[#F4F5F7] font-display">{selectedRecord.total_objects}</span>
              </div>
              <div className="p-3 bg-[#222530] rounded-xl border border-[#282B37]">
                <span className="text-[#9CA3AF] block mb-0.5 font-medium">Inference Speed</span>
                <span className="font-mono font-bold text-[#F4F5F7]">{selectedRecord.processing_time_ms} ms</span>
              </div>
              <div className="p-3 bg-[#222530] rounded-xl border border-[#282B37]">
                <span className="text-[#9CA3AF] block mb-0.5 font-medium">Filename</span>
                <span className="font-mono text-[#9CA3AF] truncate block">{selectedRecord.filename}</span>
              </div>
            </div>

            {/* Detected Items Breakdown */}
            <div>
              <h4 className="font-display font-bold text-sm text-[#F4F5F7] mb-2.5">
                Detected Objects in This Capture ({selectedRecord.detected_items?.length || 0})
              </h4>
              <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
                {selectedRecord.detected_items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#222530] border border-[#282B37] text-xs flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F4F5F7] capitalize font-display">{item.label}</span>
                        <span className="text-[#9CA3AF]">({item.material || 'General Material'})</span>
                      </div>
                      <Badge variant="primary" className="text-[10px] py-0 px-2">
                        {item.bin}
                      </Badge>
                    </div>
                    {item.instructions && (
                      <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                        <strong className="text-[#F4F5F7]">Directive:</strong> {item.instructions}
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
