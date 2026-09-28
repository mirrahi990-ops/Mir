import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Send, Trash2, ArrowDownLeft, ArrowUpRight, Cpu } from 'lucide-react';
import { TerminalLog } from '../types';

interface RawDataTerminalProps {
  logs: TerminalLog[];
  onClearLogs: () => void;
  onSendData: (data: string) => Promise<boolean>;
  isConnected: boolean;
}

export const RawDataTerminal: React.FC<RawDataTerminalProps> = ({
  logs,
  onClearLogs,
  onSendData,
  isConnected,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    await onSendData(inputVal.trim());
    setInputVal('');
  };

  const sendPreset = (preset: string) => {
    onSendData(preset);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-3xl border border-slate-800 shadow-xl overflow-hidden font-mono">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            Live Bluetooth / Serial Terminal
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {logs.length} events
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
              autoScroll
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={onClearLogs}
            title="Clear logs"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preset Quick Commands */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/50 border-b border-slate-800/80 text-[11px] overflow-x-auto">
        <span className="text-slate-500 text-[10px] font-sans mr-1">Quick Send:</span>
        <button
          onClick={() => sendPreset('PING')}
          disabled={!isConnected}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
        >
          PING
        </button>
        <button
          onClick={() => sendPreset('STATUS')}
          disabled={!isConnected}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
        >
          STATUS
        </button>
        <button
          onClick={() => sendPreset('LEVEL:75')}
          disabled={!isConnected}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
        >
          LEVEL:75
        </button>
        <button
          onClick={() => sendPreset('LEVEL:100')}
          disabled={!isConnected}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
        >
          LEVEL:100
        </button>
      </div>

      {/* Log Output Area */}
      <div
        ref={containerRef}
        className="flex-1 p-3 overflow-y-auto space-y-1.5 text-xs text-slate-300 max-h-56 min-h-[140px]"
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs py-8">
            <Cpu className="w-6 h-6 mb-2 opacity-50" />
            <p>Waiting for Bluetooth packets or serial stream...</p>
            <p className="text-[10px] text-slate-600 mt-1">
              Data matching "LEVEL: 50", "75%", or "0" will update the tank.
            </p>
          </div>
        ) : (
          logs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={log.id}
                className={`flex items-start gap-2 py-0.5 leading-relaxed ${
                  log.direction === 'system'
                    ? 'text-yellow-400/90'
                    : log.direction === 'out'
                    ? 'text-cyan-400'
                    : 'text-emerald-400'
                }`}
              >
                <span className="text-[10px] text-slate-500 shrink-0 select-none">
                  [{timeStr}]
                </span>
                <span className="shrink-0">
                  {log.direction === 'system' && (
                    <span className="px-1 rounded bg-yellow-500/10 text-yellow-300 text-[10px]">
                      SYS
                    </span>
                  )}
                  {log.direction === 'in' && (
                    <ArrowDownLeft className="w-3.5 h-3.5 inline text-emerald-400" />
                  )}
                  {log.direction === 'out' && (
                    <ArrowUpRight className="w-3.5 h-3.5 inline text-cyan-400" />
                  )}
                </span>
                <span className="break-all font-mono">{log.data}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Send Input Bar */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 p-2 bg-slate-900 border-t border-slate-800"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={
            isConnected
              ? 'Type command to transmit (e.g. AT or PING)...'
              : 'Connect Bluetooth to send commands...'
          }
          disabled={!isConnected}
          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!isConnected || !inputVal.trim()}
          className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center gap-1 hover:bg-cyan-400 transition-colors disabled:opacity-40"
        >
          <Send className="w-3 h-3" />
          Send
        </button>
      </form>
    </div>
  );
};
