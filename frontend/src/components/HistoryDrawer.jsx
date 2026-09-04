import React, { useState, useEffect } from 'react';
import { Download, History, RefreshCw, Calendar, Clock, ChevronRight, Package } from 'lucide-react';
import { getScanHistory, getExportCsvUrl } from '../services/api';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';

export const HistoryDrawer = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(null);

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

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Export controls */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-100 rounded-xl border border-slate-200 text-slate-800">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-display font-bold text-slate-900">Scan History & Stream Records</h3>
            <p className="text-xs text-slate-500">Chronological ledger of past material sorting sessions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchHistory} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <a href={getExportCsvUrl()} download="waste_scan_history.csv">
            <Button variant="primary" size="sm">
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
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {b}
            </button>
          );
        })}
      </div>

      {/* History table / card list */}
      {loading && history.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 font-mono">
          Loading scan history...
        </div>
      ) : history.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center">
          <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 font-display">No records found</p>
          <p className="text-xs text-slate-400 mt-1">Upload or capture an image to create the first session entry.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((record) => (
            <div
              key={record.id}
              className="p-4 rounded-xl bg-white border border-slate-200 shadow-nordic hover:shadow-nordic-hover transition flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-mono text-xs font-bold text-slate-800">
                  #{record.id}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-xs font-display">
                      {record.total_objects} {record.total_objects === 1 ? 'Object' : 'Objects'} Detected
                    </span>
                    <Badge variant="primary" className="text-[10px] py-0 px-2">
                      {record.primary_disposal_bin}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {record.processing_time_ms} ms
                    </span>
                    <span>·</span>
                    <span>{new Date(record.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="text-slate-700 font-mono text-[11px]">{record.filename}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryDrawer;
