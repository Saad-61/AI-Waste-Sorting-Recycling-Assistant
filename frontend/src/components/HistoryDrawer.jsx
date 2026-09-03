import React, { useState, useEffect } from 'react';
import { Download, History, RefreshCw, Calendar, Clock, ChevronRight } from 'lucide-react';
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-800 rounded-xl">
            <History className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Scan History & Telemetry</h3>
            <p className="text-xs text-slate-400">Past detection sessions and disposal audits</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchHistory} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <a href={getExportCsvUrl()} download="waste_scan_history.csv">
            <Button variant="outline" size="sm">
              <Download className="w-3.5 h-3.5 mr-1" />
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Recyclable', 'Organic', 'Hazardous', 'General Waste'].map((b) => {
          const active = (b === 'All' && !filter) || filter === b;
          return (
            <button
              key={b}
              onClick={() => setFilter(b === 'All' ? null : b)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                active
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {b}
            </button>
          );
        })}
      </div>

      {/* History Records List */}
      <div className="flex flex-col gap-3">
        {history.length === 0 ? (
          <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/30 text-slate-500 text-sm">
            {loading ? 'Loading scan history...' : 'No scan records recorded yet.'}
          </div>
        ) : (
          history.map((record) => (
            <Card key={record.id} hover className="p-4 bg-slate-900/60 border-slate-800">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {record.created_at ? new Date(record.created_at).toLocaleString() : 'Recent'}
                  </span>
                  <span className="text-slate-600">•</span>
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{record.processing_time_ms} ms</span>
                </div>

                <Badge variant={record.primary_bin === 'Recyclable' ? 'success' : 'secondary'}>
                  {record.primary_bin || 'General'}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-white">
                  {record.filename || `Scan #${record.id}`}
                </span>
                <span className="text-xs text-emerald-400 font-medium">
                  {record.total_objects} item(s) classified
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryDrawer;
