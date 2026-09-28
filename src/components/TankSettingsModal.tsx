import React, { useState } from 'react';
import { Settings, Sliders, Bell, Volume2, Mic, X, Save, RotateCcw } from 'lucide-react';
import { AlertThreshold, TankConfig } from '../types';

interface TankSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TankConfig;
  thresholds: AlertThreshold[];
  onSave: (newConfig: TankConfig, newThresholds: AlertThreshold[]) => void;
  onRequestNotifications: () => void;
}

export const TankSettingsModal: React.FC<TankSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  thresholds,
  onSave,
  onRequestNotifications,
}) => {
  const [localConfig, setLocalConfig] = useState<TankConfig>({ ...config });
  const [localThresholds, setLocalThresholds] = useState<AlertThreshold[]>([...thresholds]);

  if (!isOpen) return null;

  const handleThresholdToggle = (level: number) => {
    setLocalThresholds((prev) =>
      prev.map((t) => (t.level === level ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleThresholdMessageChange = (level: number, message: string) => {
    setLocalThresholds((prev) =>
      prev.map((t) => (t.level === level ? { ...t, message, voiceMessage: message } : t))
    );
  };

  const handleSave = () => {
    onSave(localConfig, localThresholds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Tank Calibration & Alert Settings</h3>
              <p className="text-xs text-slate-400">Configure ultrasonic dimensions & alert rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-slate-300">
          {/* Tank Dimensions & Capacity */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-cyan-400">
              <Sliders className="w-4 h-4" />
              Reservoir Dimensions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Tank Capacity (Liters):
                </label>
                <input
                  type="number"
                  min="10"
                  max="100000"
                  value={localConfig.capacityLiters}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, capacityLiters: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Total Height (cm):
                </label>
                <input
                  type="number"
                  min="20"
                  max="1000"
                  value={localConfig.tankHeightCm}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, tankHeightCm: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Sensor Offset (cm):
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={localConfig.sensorOffsetCm}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, sensorOffsetCm: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              * The HC-SR04 ultrasonic sensor has a ~15cm blind zone at the very top. Setting offset ensures 100% calculation is accurate.
            </p>
          </div>

          {/* Threshold Alerts (0%, 25%, 50%, 75%, 100%) */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-cyan-400">
              <Bell className="w-4 h-4" />
              Alert Rules (0%, 25%, 50%, 75%, 100%)
            </h4>

            <div className="space-y-2.5">
              {localThresholds.map((threshold) => (
                <div
                  key={threshold.level}
                  className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={threshold.enabled}
                      onChange={() => handleThresholdToggle(threshold.level)}
                      className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-300 w-10">
                        {threshold.level}%
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        {threshold.name}
                      </span>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={threshold.message}
                    onChange={(e) =>
                      handleThresholdMessageChange(threshold.level, e.target.value)
                    }
                    className="flex-1 w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sound & Notification Toggles */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-cyan-400">
              <Volume2 className="w-4 h-4" />
              Feedback & Speech Output
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.soundEnabled}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, soundEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
                />
                <div>
                  <span className="font-semibold text-slate-200 block">Synthesized Alarm Tones</span>
                  <span className="text-[10px] text-slate-400">Plays distinct audio chimes for each level</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.voiceEnabled}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, voiceEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-purple-500 bg-slate-900 border-slate-700"
                />
                <div>
                  <span className="font-semibold text-slate-200 block">Text-to-Speech Voice</span>
                  <span className="text-[10px] text-slate-400">Speaks out water level alerts aloud</span>
                </div>
              </label>
            </div>

            <button
              type="button"
              onClick={onRequestNotifications}
              className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
            >
              Request Browser System Push Notifications
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
