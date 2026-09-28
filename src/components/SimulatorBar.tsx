import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Sliders, ArrowUpCircle, ArrowDownCircle, Sparkles } from 'lucide-react';

interface SimulatorBarProps {
  isSimulating: boolean;
  percentage: number;
  onToggleSimulator: (enabled: boolean) => void;
  onSetLevel: (level: number) => void;
}

export const SimulatorBar: React.FC<SimulatorBarProps> = ({
  isSimulating,
  percentage,
  onToggleSimulator,
  onSetLevel,
}) => {
  const [autoMode, setAutoMode] = useState<'off' | 'fill' | 'drain'>('off');
  const [speed, setSpeed] = useState<number>(1); // 1 = 1% per 200ms

  useEffect(() => {
    if (!isSimulating || autoMode === 'off') return;

    const interval = setInterval(() => {
      if (autoMode === 'fill') {
        if (percentage >= 100) {
          setAutoMode('drain'); // reverse
        } else {
          onSetLevel(Math.min(100, percentage + 1));
        }
      } else if (autoMode === 'drain') {
        if (percentage <= 0) {
          setAutoMode('fill'); // reverse
        } else {
          onSetLevel(Math.max(0, percentage - 1));
        }
      }
    }, 250 / speed);

    return () => clearInterval(interval);
  }, [isSimulating, autoMode, percentage, speed, onSetLevel]);

  return (
    <div className="p-4 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              Interactive Water Level Simulator & Alert Tester
            </h4>
            <p className="text-[11px] text-slate-400">
              Test alert chimes, voice notifications, and visuals at 0%, 25%, 50%, 75%, 100%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleSimulator(!isSimulating)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isSimulating
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isSimulating ? 'Simulator Active' : 'Enable Simulator'}
          </button>
        </div>
      </div>

      {/* Main slider and threshold trigger buttons */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-cyan-400 w-12 text-right">
            {percentage}%
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={percentage}
            onChange={(e) => {
              if (!isSimulating) onToggleSimulator(true);
              onSetLevel(parseInt(e.target.value, 10));
            }}
            className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Quick jump threshold buttons for the exact requested alerts */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-semibold text-slate-500 mr-1">
              Trigger Alerts:
            </span>
            <button
              onClick={() => {
                if (!isSimulating) onToggleSimulator(true);
                onSetLevel(0);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all active:scale-95"
            >
              0% (Empty Alert)
            </button>
            <button
              onClick={() => {
                if (!isSimulating) onToggleSimulator(true);
                onSetLevel(25);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 transition-all active:scale-95"
            >
              25% (Low Alert)
            </button>
            <button
              onClick={() => {
                if (!isSimulating) onToggleSimulator(true);
                onSetLevel(50);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all active:scale-95"
            >
              50% (Half Alert)
            </button>
            <button
              onClick={() => {
                if (!isSimulating) onToggleSimulator(true);
                onSetLevel(75);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all active:scale-95"
            >
              75% (High Alert)
            </button>
            <button
              onClick={() => {
                if (!isSimulating) onToggleSimulator(true);
                onSetLevel(100);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all active:scale-95"
            >
              100% (Full Alert)
            </button>
          </div>

          {/* Auto Simulation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (!isSimulating) onToggleSimulator(true);
                setAutoMode(autoMode === 'fill' ? 'off' : 'fill');
              }}
              title="Auto Fill Tank"
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                autoMode === 'fill'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>Fill</span>
            </button>
            <button
              onClick={() => {
                if (!isSimulating) onToggleSimulator(true);
                setAutoMode(autoMode === 'drain' ? 'off' : 'drain');
              }}
              title="Auto Drain Tank"
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                autoMode === 'drain'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>Drain</span>
            </button>
            {autoMode !== 'off' && (
              <button
                onClick={() => setAutoMode('off')}
                className="p-1.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 text-xs"
                title="Pause Auto Cycle"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
