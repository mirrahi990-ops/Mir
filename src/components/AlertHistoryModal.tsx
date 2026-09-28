import React from 'react';
import { AlertTriangle, Bell, Clock, Trash2, X, Download } from 'lucide-react';
import { AlertLogItem } from '../types';

interface AlertHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AlertLogItem[];
  onClear: () => void;
}

export const AlertHistoryModal: React.FC<AlertHistoryModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClear,
}) => {
  if (!isOpen) return null;

  const exportCSV = () => {
    const headers = 'Timestamp,Level,Alert Name,Message\n';
    const rows = logs
      .map(
        (l) =>
          `"${new Date(l.timestamp).toISOString()}",${l.level}%,"${l.threshold.name}","${l.threshold.message.replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `water-level-alerts-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Water Level Alert Log</h3>
              <p className="text-xs text-slate-400">Historical threshold trigger events</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs">
              <Bell className="w-8 h-8 mb-2 opacity-40" />
              <p>No threshold alerts triggered yet.</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Alerts at 0%, 25%, 50%, 75%, and 100% will appear here.
              </p>
            </div>
          ) : (
            logs.map((log) => {
              const dateStr = new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              const isCritical = log.level === 0 || log.level === 100;
              const isWarning = log.level === 25;

              return (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    isCritical
                      ? 'bg-red-500/10 border-red-500/30 text-red-200'
                      : isWarning
                      ? 'bg-orange-500/10 border-orange-500/30 text-orange-200'
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-black/40">
                      {log.level}%
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {log.threshold.name}
                      </p>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {log.threshold.message}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {dateStr}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <>
                <button
                  onClick={exportCSV}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button
                  onClick={onClear}
                  className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
