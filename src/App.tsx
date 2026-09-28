/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  AlertCircle,
  AlertTriangle,
  Bluetooth,
  Cable,
  CheckCircle2,
  Droplets,
  HelpCircle,
  History,
  Info,
  Radio,
  RefreshCw,
  Settings,
  Sliders,
  Terminal,
  Volume2,
  VolumeX,
  Wrench,
  Zap,
} from 'lucide-react';

import {
  AlertLogItem,
  AlertThreshold,
  ConnectionStatus,
  ConnectionType,
  TankConfig,
  TerminalLog,
  WaterLevelData,
} from './types';
import { soundService } from './services/soundEffects';
import { speechService } from './services/speechAlert';
import { BluetoothService } from './services/bluetoothService';

import { WaterTankVisual } from './components/WaterTankVisual';
import { AlertNotificationBanner } from './components/AlertNotificationBanner';
import { SimulatorBar } from './components/SimulatorBar';
import { LevelGraph } from './components/LevelGraph';
import { RawDataTerminal } from './components/RawDataTerminal';
import { ConnectionModal } from './components/ConnectionModal';
import { SocketTroubleshooter } from './components/SocketTroubleshooter';
import { TankSettingsModal } from './components/TankSettingsModal';
import { AlertHistoryModal } from './components/AlertHistoryModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { DownloadAppModal } from './components/DownloadAppModal';
import { OfflineIndicator } from './components/OfflineIndicator';

const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  {
    level: 0,
    name: 'Tank Empty',
    type: 'critical_low',
    enabled: true,
    message: 'CRITICAL: Water tank is EMPTY (0%)! Turn off pump to prevent dry run damage.',
    voiceMessage: 'Warning! Water tank is empty at zero percent. Turn off pump.',
    toneType: 'siren',
    color: '#ef4444',
  },
  {
    level: 25,
    name: 'Low Water Level',
    type: 'warning_low',
    enabled: true,
    message: 'WARNING: Water tank level dropped to 25%. Refill recommended.',
    voiceMessage: 'Notice. Water tank level has reached 25 percent.',
    toneType: 'warning',
    color: '#f97316',
  },
  {
    level: 50,
    name: 'Half Capacity',
    type: 'info_mid',
    enabled: true,
    message: 'NOTICE: Water tank is at 50% capacity.',
    voiceMessage: 'Water tank is at 50 percent capacity.',
    toneType: 'chime',
    color: '#06b6d4',
  },
  {
    level: 75,
    name: 'High Water Level',
    type: 'notice_high',
    enabled: true,
    message: 'NOTICE: Water tank reached 75% capacity.',
    voiceMessage: 'Water tank reached 75 percent.',
    toneType: 'success',
    color: '#3b82f6',
  },
  {
    level: 100,
    name: 'Tank Full / Overflow',
    type: 'critical_high',
    enabled: true,
    message: 'ALERT: Water tank is 100% FULL! Stop pump immediately to prevent overflow!',
    voiceMessage: 'Alert! Water tank is 100 percent full. Turn off water pump immediately!',
    toneType: 'alarm',
    color: '#6366f1',
  },
];

const DEFAULT_CONFIG: TankConfig = {
  tankHeightCm: 100,
  sensorOffsetCm: 15,
  capacityLiters: 1000,
  pumpStatus: 'idle',
  soundEnabled: true,
  voiceEnabled: true,
  vibrateEnabled: true,
  notificationsEnabled: false,
};

export default function App() {
  // Main state
  const [level, setLevel] = useState<number>(50);
  const [lastLevel, setLastLevel] = useState<number>(50);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectionType, setConnectionType] = useState<ConnectionType>('simulator');
  const [statusMessage, setStatusMessage] = useState<string>('Ready to connect or simulate');
  const [deviceName, setDeviceName] = useState<string | undefined>(undefined);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Configuration and alerts
  const [config, setConfig] = useState<TankConfig>(DEFAULT_CONFIG);
  const [thresholds, setThresholds] = useState<AlertThreshold[]>(DEFAULT_THRESHOLDS);
  const [activeAlert, setActiveAlert] = useState<AlertThreshold | null>(null);
  const [alertLogs, setAlertLogs] = useState<AlertLogItem[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  const [levelHistory, setLevelHistory] = useState<WaterLevelData[]>([
    { percentage: 50, timestamp: Date.now() - 30000, source: 'simulator' },
    { percentage: 50, timestamp: Date.now(), source: 'simulator' },
  ]);

  // Simulation mode
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Modals
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [isTroubleshooterOpen, setIsTroubleshooterOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);

  // Re-arm mechanism so we don't trigger the same threshold 60 times a second
  const lastTriggeredLevelRef = useRef<number | null>(null);

  // Bluetooth Service reference
  const bluetoothServiceRef = useRef<BluetoothService | null>(null);

  // Add terminal log helper
  const addTerminalLog = useCallback(
    (log: Omit<TerminalLog, 'id' | 'timestamp'>) => {
      setTerminalLogs((prev) => [
        ...prev.slice(-150),
        {
          ...log,
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
        },
      ]);
    },
    []
  );

  // Trigger alert threshold evaluation
  const checkAndTriggerAlert = useCallback(
    (newLevel: number) => {
      const match = thresholds.find((t) => t.level === newLevel && t.enabled);

      if (match) {
        // Only trigger if we haven't already triggered this exact level consecutively
        if (lastTriggeredLevelRef.current !== newLevel) {
          lastTriggeredLevelRef.current = newLevel;
          setActiveAlert(match);

          // 1. Play Tone Chime
          if (config.soundEnabled) {
            soundService.playTone(match.toneType);
          }

          // 2. Play Voice Alert
          if (config.voiceEnabled) {
            speechService.speak(match.voiceMessage);
          }

          // 3. Vibrate device (on mobile)
          if (config.vibrateEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate(newLevel === 0 || newLevel === 100 ? [300, 150, 300] : [150]);
            } catch {
              // ignore
            }
          }

          // 4. Confetti on 100% full
          if (newLevel === 100) {
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#38bdf8', '#0284c7', '#6366f1', '#a855f7'],
              });
            } catch {
              // ignore
            }
          }

          // 5. System Notification
          if (
            config.notificationsEnabled &&
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification(`Water Tank Alert: ${match.name} (${newLevel}%)`, {
              body: match.message,
              icon: '/favicon.ico',
            });
          }

          // 6. Record to alert logs
          setAlertLogs((prev) => [
            {
              id: Math.random().toString(36).substring(2, 9),
              timestamp: Date.now(),
              level: newLevel,
              threshold: match,
              acknowledged: false,
            },
            ...prev.slice(0, 49),
          ]);
        }
      } else {
        // If moved away by 2% or more, reset re-arm
        if (
          lastTriggeredLevelRef.current !== null &&
          Math.abs(newLevel - lastTriggeredLevelRef.current) >= 2
        ) {
          lastTriggeredLevelRef.current = null;
        }
      }
    },
    [config, thresholds]
  );

  // Update level callback
  const handleUpdateLevel = useCallback(
    (newLevel: number, source: ConnectionType = 'simulator') => {
      setLastLevel((prev) => {
        // Trend calculation
        return prev;
      });
      setLevel(newLevel);
      setLastUpdate(Date.now());

      setLevelHistory((prev) => [
        ...prev.slice(-40),
        {
          percentage: newLevel,
          timestamp: Date.now(),
          source,
        },
      ]);

      checkAndTriggerAlert(newLevel);
    },
    [checkAndTriggerAlert]
  );

  // Initialize Bluetooth Service
  useEffect(() => {
    bluetoothServiceRef.current = new BluetoothService({
      onLevelReceived: (pct, raw) => {
        handleUpdateLevel(pct, 'ble');
      },
      onStatusChange: (status, message, dName) => {
        setConnectionStatus(status);
        setStatusMessage(message);
        if (dName) setDeviceName(dName);
        if (status === 'connected') {
          setIsSimulating(false);
        }
      },
      onLog: (log) => {
        addTerminalLog(log);
      },
    });

    return () => {
      bluetoothServiceRef.current?.disconnect();
    };
  }, [handleUpdateLevel, addTerminalLog]);

  // Determine flow direction trend
  const flowRateTrend = React.useMemo<'filling' | 'draining' | 'stable'>(() => {
    if (levelHistory.length < 2) return 'stable';
    const recent = levelHistory.slice(-5);
    const first = recent[0].percentage;
    const last = recent[recent.length - 1].percentage;
    if (last > first) return 'filling';
    if (last < first) return 'draining';
    return 'stable';
  }, [levelHistory]);

  // Request browser notifications
  const handleRequestNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setConfig((prev) => ({ ...prev, notificationsEnabled: true }));
        new Notification('HydroPulse Water Monitor', {
          body: 'Push alerts enabled for 0%, 25%, 50%, 75%, and 100%!',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Droplets className="w-5 h-5 text-slate-950" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white">HydroPulse</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Water Monitor
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Ultrasonic Bluetooth Level Sensor & Alert System
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Download / Install App Button */}
            <PWAInstallButton onOpenDownloadModal={() => setIsDownloadModalOpen(true)} />

            {/* Socket Troubleshooter Direct Button */}
            <button
              onClick={() => setIsTroubleshooterOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)] transition-all active:scale-95"
              title="Fix 'socket might closed or timeout' error"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Socket Troubleshooter</span>
              <span className="md:hidden">Fix Error</span>
            </button>

            {/* Connect Button */}
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : connectionStatus === 'connecting'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              }`}
            >
              <Bluetooth className="w-4 h-4" />
              <span>
                {connectionStatus === 'connected'
                  ? 'Connected'
                  : connectionStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Connect Bluetooth'}
              </span>
            </button>

            {/* Tank Settings */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Calibration & Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Active Alert Banners & Audio/Voice Control strip */}
        <AlertNotificationBanner
          currentAlert={activeAlert}
          onDismissAlert={() => setActiveAlert(null)}
          alertLogs={alertLogs}
          soundEnabled={config.soundEnabled}
          voiceEnabled={config.voiceEnabled}
          onToggleSound={() =>
            setConfig((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
          }
          onToggleVoice={() =>
            setConfig((prev) => ({ ...prev, voiceEnabled: !prev.voiceEnabled }))
          }
          onOpenHistory={() => setIsHistoryOpen(true)}
        />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Visual Water Tank */}
          <div className="lg:col-span-5 space-y-4">
            <WaterTankVisual
              percentage={level}
              capacityLiters={config.capacityLiters}
              activeThreshold={activeAlert}
              flowRateTrend={flowRateTrend}
              onQuickSelectPercentage={(pct) => handleUpdateLevel(pct, 'simulator')}
              isSimulated={isSimulating}
            />

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Volume
                </span>
                <span className="text-base font-black text-cyan-400 font-mono mt-0.5 block">
                  {Math.round((level / 100) * config.capacityLiters)} L
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Status
                </span>
                <span className="text-base font-bold text-white capitalize mt-0.5 block">
                  {level === 0 ? 'Empty' : level === 100 ? 'Full' : flowRateTrend}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Updated
                </span>
                <span className="text-xs font-mono text-slate-300 mt-1 block">
                  {new Date(lastUpdate).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Simulator, Trends & Live Terminal */}
          <div className="lg:col-span-7 space-y-5">
            {/* Interactive Simulator Bar (with 0%, 25%, 50%, 75%, 100% alert triggers) */}
            <SimulatorBar
              isSimulating={isSimulating}
              percentage={level}
              onToggleSimulator={(enabled) => {
                setIsSimulating(enabled);
                if (enabled) {
                  addTerminalLog({
                    direction: 'system',
                    data: 'Simulator mode activated. You can test 0%, 25%, 50%, 75%, and 100% threshold alerts.',
                  });
                }
              }}
              onSetLevel={(lvl) => handleUpdateLevel(lvl, 'simulator')}
            />

            {/* Live Water Level Graph */}
            <LevelGraph history={levelHistory} />

            {/* Live Data Terminal (Shows raw BLE/Serial incoming stream) */}
            <RawDataTerminal
              logs={terminalLogs}
              onClearLogs={() => setTerminalLogs([])}
              onSendData={async (cmd) => {
                if (bluetoothServiceRef.current) {
                  return await bluetoothServiceRef.current.sendData(cmd);
                }
                return false;
              }}
              isConnected={connectionStatus === 'connected'}
            />
          </div>
        </div>

        {/* Feature Highlights / Bluetooth Tips banner */}
        <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-semibold text-white">Full Alert Range (0% - 100%)</h5>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Instant audio synthesizer tones & clear spoken voice alerts at 0%, 25%, 50%, 75%, and 100%.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <Bluetooth className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-semibold text-white">Flexible Data Parser</h5>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Parses "75%", "LEVEL: 75", raw integers, JSON, and ultrasonic distances automatically.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-semibold text-white">Socket Error Immunity</h5>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Includes non-blocking Arduino sketches with 30ms pulseIn timeouts and ESP32 BLE code.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ConnectionModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        status={connectionStatus}
        statusMessage={statusMessage}
        deviceName={deviceName}
        onConnectBLE={async (customUUID) => {
          if (bluetoothServiceRef.current) {
            return await bluetoothServiceRef.current.connectBLE(customUUID);
          }
          return false;
        }}
        onConnectSerial={async (baudRate) => {
          if (bluetoothServiceRef.current) {
            return await bluetoothServiceRef.current.connectSerial(baudRate);
          }
          return false;
        }}
        onDisconnect={() => {
          bluetoothServiceRef.current?.disconnect();
        }}
        onOpenTroubleshooter={() => {
          setIsConnectModalOpen(false);
          setIsTroubleshooterOpen(true);
        }}
        isBLESupported={
          bluetoothServiceRef.current?.isWebBluetoothSupported() ?? false
        }
        isSerialSupported={
          bluetoothServiceRef.current?.isWebSerialSupported() ?? false
        }
      />

      <SocketTroubleshooter
        isOpen={isTroubleshooterOpen}
        onClose={() => setIsTroubleshooterOpen(false)}
      />

      <TankSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        thresholds={thresholds}
        onSave={(newCfg, newThresholds) => {
          setConfig(newCfg);
          setThresholds(newThresholds);
        }}
        onRequestNotifications={handleRequestNotifications}
      />

      <AlertHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        logs={alertLogs}
        onClear={() => setAlertLogs([])}
      />

      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      <OfflineIndicator />
    </div>
  );
}
