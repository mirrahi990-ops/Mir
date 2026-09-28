import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  X,
  History,
} from 'lucide-react';
import { AlertLogItem, AlertThreshold } from '../types';

interface AlertNotificationBannerProps {
  currentAlert: AlertThreshold | null;
  onDismissAlert: () => void;
  alertLogs: AlertLogItem[];
  soundEnabled: boolean;
  voiceEnabled: boolean;
  onToggleSound: () => void;
  onToggleVoice: () => void;
  onOpenHistory: () => void;
}

export const AlertNotificationBanner: React.FC<AlertNotificationBannerProps> = ({
  currentAlert,
  onDismissAlert,
  alertLogs,
  soundEnabled,
  voiceEnabled,
  onToggleSound,
  onToggleVoice,
  onOpenHistory,
}) => {
  return (
    <div className="w-full space-y-3">
      {/* Active Alert Notification Card if triggered */}
      {currentAlert && (
        <div
          role="alert"
          className={`relative p-4 rounded-3xl border shadow-2xl flex items-center justify-between gap-4 transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            currentAlert.level === 0 || currentAlert.level === 100
              ? 'bg-red-500/20 border-red-500/60 shadow-red-500/20 text-red-100'
              : currentAlert.level === 25
              ? 'bg-orange-500/20 border-orange-500/60 shadow-orange-500/20 text-orange-100'
              : 'bg-cyan-500/20 border-cyan-500/60 shadow-cyan-500/20 text-cyan-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                currentAlert.level === 0 || currentAlert.level === 100
                  ? 'bg-red-500/30 text-red-300 animate-pulse'
                  : currentAlert.level === 25
                  ? 'bg-orange-500/30 text-orange-300'
                  : 'bg-cyan-500/30 text-cyan-300'
              }`}
            >
              {currentAlert.level === 0 || currentAlert.level === 100 ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Bell className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40">
                  {currentAlert.level}% Level Alert
                </span>
                <span className="text-xs font-semibold">{currentAlert.name}</span>
              </div>
              <p className="text-sm font-medium mt-1 leading-snug">
                {currentAlert.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onDismissAlert}
              className="px-3.5 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-white font-semibold text-xs border border-white/20 transition-all active:scale-95"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Alert Control Strip (Audio, Voice, Alert Log) */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-medium">Alert Notifications:</span>
          <button
            onClick={onToggleSound}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all ${
              soundEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Tone Chime: {soundEnabled ? 'ON' : 'MUTED'}</span>
          </button>

          <button
            onClick={onToggleVoice}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all ${
              voiceEnabled
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            {voiceEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span>Voice Speech: {voiceEnabled ? 'ON' : 'MUTED'}</span>
          </button>
        </div>

        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <History className="w-3.5 h-3.5" />
          <span>Alert History ({alertLogs.length})</span>
        </button>
      </div>
    </div>
  );
};
