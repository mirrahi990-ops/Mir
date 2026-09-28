import React, { useMemo } from 'react';
import { AlertCircle, Bell, CheckCircle2, Droplets, Waves, Zap } from 'lucide-react';
import { AlertThreshold } from '../types';

interface WaterTankVisualProps {
  percentage: number;
  capacityLiters: number;
  activeThreshold: AlertThreshold | null;
  flowRateTrend: 'filling' | 'draining' | 'stable';
  onQuickSelectPercentage?: (pct: number) => void;
  isSimulated?: boolean;
}

export const WaterTankVisual: React.FC<WaterTankVisualProps> = ({
  percentage,
  capacityLiters,
  activeThreshold,
  flowRateTrend,
  onQuickSelectPercentage,
  isSimulated,
}) => {
  const currentLiters = Math.round((percentage / 100) * capacityLiters);

  // Dynamic fluid styling based on water level
  const fluidColor = useMemo(() => {
    if (percentage <= 10) return {
      gradientStart: '#ef4444',
      gradientEnd: '#b91c1c',
      glow: 'rgba(239, 68, 68, 0.4)',
      text: 'text-red-500',
      badge: 'bg-red-500/20 text-red-400 border-red-500/40',
    };
    if (percentage <= 25) return {
      gradientStart: '#f97316',
      gradientEnd: '#c2410c',
      glow: 'rgba(249, 115, 22, 0.35)',
      text: 'text-orange-500',
      badge: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    };
    if (percentage <= 75) return {
      gradientStart: '#06b6d4',
      gradientEnd: '#0284c7',
      glow: 'rgba(6, 182, 212, 0.35)',
      text: 'text-cyan-400',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    };
    if (percentage < 100) return {
      gradientStart: '#3b82f6',
      gradientEnd: '#1d4ed8',
      glow: 'rgba(59, 130, 246, 0.4)',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    };
    // 100% Full / Overflow
    return {
      gradientStart: '#6366f1',
      gradientEnd: '#4338ca',
      glow: 'rgba(99, 102, 241, 0.5)',
      text: 'text-indigo-400',
      badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse',
    };
  }, [percentage]);

  const milestones = [100, 75, 50, 25, 0];

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl">
      {/* Tank Header Info */}
      <div className="w-full flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Main Water Reservoir</h3>
            <p className="text-xs text-slate-400">Ultrasonic Echo Sensing</p>
          </div>
        </div>

        {/* Dynamic status badge */}
        <div className="flex items-center gap-2">
          {flowRateTrend === 'filling' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Pumping / Filling
            </span>
          )}
          {flowRateTrend === 'draining' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              Water Outflow
            </span>
          )}
          {flowRateTrend === 'stable' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              Level Stable
            </span>
          )}
          {isSimulated && (
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
              SIM
            </span>
          )}
        </div>
      </div>

      {/* Tank Graphic Container */}
      <div className="relative w-full max-w-md flex items-center justify-center gap-4 my-2">
        {/* Main Cylindrical Tank */}
        <div className="relative w-56 h-80 rounded-[2.5rem] p-2 bg-gradient-to-b from-slate-800 via-slate-850 to-slate-950 border-2 border-slate-700/80 shadow-[0_0_35px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Glass glare effect highlight */}
          <div className="absolute top-0 left-6 w-8 h-full bg-gradient-to-r from-white/10 to-transparent skew-x-[-15deg] pointer-events-none z-20"></div>

          {/* Top Ultrasonic Sensor Node */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-3 bg-slate-700 rounded-full border border-slate-600 flex items-center justify-center gap-2 z-30 shadow-md">
            <div className="w-2 h-2 rounded-full bg-cyan-400/80 animate-ping"></div>
            <span className="text-[8px] font-mono text-slate-300">HC-SR04</span>
          </div>

          {/* Fluid Container (Clipped to Tank) */}
          <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-slate-950/80 flex flex-col justify-end">
            {/* Water Body */}
            <div
              className="relative w-full transition-all duration-700 ease-out"
              style={{
                height: `${Math.max(2, percentage)}%`,
                background: `linear-gradient(180deg, ${fluidColor.gradientStart} 0%, ${fluidColor.gradientEnd} 100%)`,
                boxShadow: `0 0 25px ${fluidColor.glow}`,
              }}
            >
              {/* Animated Wave Top Layer */}
              <div className="absolute -top-3 left-0 w-[200%] h-6 opacity-80 pointer-events-none overflow-hidden">
                <svg
                  className="w-full h-full animate-wave"
                  viewBox="0 0 1200 120"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,0 C150,90 350,-40 500,50 C650,140 900,-30 1200,40 L1200,120 L0,120 Z"
                    fill={fluidColor.gradientStart}
                  />
                </svg>
              </div>

              {/* Floating Air Bubbles */}
              {percentage > 15 && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute bottom-2 left-1/4 w-2 h-2 rounded-full bg-white/40 animate-bounce duration-1000"></div>
                  <div className="absolute bottom-8 left-2/3 w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse duration-700"></div>
                  <div className="absolute bottom-16 left-1/2 w-2.5 h-2.5 rounded-full bg-white/30 animate-ping duration-1000"></div>
                </div>
              )}
            </div>

            {/* Inner Percentage Display Badge in Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <div className="text-center px-4 py-2 rounded-2xl bg-slate-900/75 border border-slate-700/60 backdrop-blur-md shadow-xl">
                <div className="flex items-baseline justify-center gap-0.5">
                  <span className="text-4xl font-black tracking-tight text-white drop-shadow">
                    {percentage}
                  </span>
                  <span className={`text-xl font-bold ${fluidColor.text}`}>%</span>
                </div>
                <div className="text-[11px] font-medium text-slate-300 tracking-wide mt-0.5">
                  {currentLiters} / {capacityLiters} L
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Threshold Rulers (0%, 25%, 50%, 75%, 100%) */}
        <div className="flex flex-col justify-between h-80 py-4">
          {milestones.map((mark) => {
            const isTarget = percentage === mark || (mark === 0 && percentage === 0);
            const isPassed = percentage >= mark;
            return (
              <button
                key={mark}
                onClick={() => onQuickSelectPercentage?.(mark)}
                title={`Click to test ${mark}% alert threshold`}
                className={`group flex items-center gap-2.5 text-left transition-all ${
                  isTarget
                    ? 'scale-105 font-bold'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                {/* Horizontal marker tick */}
                <div
                  className={`h-0.5 w-4 transition-colors ${
                    isPassed ? 'bg-cyan-400' : 'bg-slate-700'
                  } ${isTarget ? 'w-6 bg-cyan-300' : ''}`}
                />

                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all ${
                    isTarget
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : isPassed
                      ? 'bg-slate-800/80 text-slate-300 border-slate-700'
                      : 'bg-slate-900/50 text-slate-500 border-slate-800'
                  }`}
                >
                  <Bell
                    className={`w-3 h-3 ${
                      mark === 100 || mark === 0
                        ? 'text-red-400'
                        : mark === 25
                        ? 'text-orange-400'
                        : 'text-cyan-400'
                    }`}
                  />
                  <span>{mark}%</span>
                  {mark === 0 && <span className="text-[10px] text-red-400 font-semibold">EMPTY</span>}
                  {mark === 25 && <span className="text-[10px] text-orange-400">LOW</span>}
                  {mark === 50 && <span className="text-[10px] text-cyan-400">HALF</span>}
                  {mark === 75 && <span className="text-[10px] text-blue-400">HIGH</span>}
                  {mark === 100 && <span className="text-[10px] text-indigo-400 font-semibold">FULL</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Alert Banner below tank if on a threshold */}
      {activeThreshold && (
        <div
          className={`mt-4 w-full flex items-center justify-between p-3.5 rounded-2xl border ${
            activeThreshold.level === 0 || activeThreshold.level === 100
              ? 'bg-red-500/15 border-red-500/40 text-red-200'
              : activeThreshold.level === 25
              ? 'bg-orange-500/15 border-orange-500/40 text-orange-200'
              : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                activeThreshold.level === 0 || activeThreshold.level === 100
                  ? 'bg-red-500/20 text-red-400 animate-bounce'
                  : 'bg-cyan-500/20 text-cyan-300'
              }`}
            >
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {activeThreshold.name} Triggered
              </p>
              <p className="text-sm font-medium">{activeThreshold.message}</p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-black/40 font-mono font-semibold">
            {activeThreshold.level}%
          </span>
        </div>
      )}
    </div>
  );
};
