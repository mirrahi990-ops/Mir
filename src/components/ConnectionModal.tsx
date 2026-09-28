import React, { useState } from 'react';
import { Bluetooth, Cable, Check, AlertCircle, HelpCircle, RefreshCw, X, Radio } from 'lucide-react';
import { ConnectionStatus } from '../types';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ConnectionStatus;
  statusMessage: string;
  deviceName?: string;
  onConnectBLE: (customUUID?: string) => Promise<boolean>;
  onConnectSerial: (baudRate: number) => Promise<boolean>;
  onDisconnect: () => void;
  onOpenTroubleshooter: () => void;
  isBLESupported: boolean;
  isSerialSupported: boolean;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  status,
  statusMessage,
  deviceName,
  onConnectBLE,
  onConnectSerial,
  onDisconnect,
  onOpenTroubleshooter,
  isBLESupported,
  isSerialSupported,
}) => {
  const [tab, setTab] = useState<'ble' | 'serial'>('ble');
  const [customUUID, setCustomUUID] = useState('');
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [connecting, setConnecting] = useState(false);

  if (!isOpen) return null;

  const handleConnectBLE = async () => {
    setConnecting(true);
    try {
      await onConnectBLE(customUUID.trim() || undefined);
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectSerial = async () => {
    setConnecting(true);
    try {
      await onConnectSerial(baudRate);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Connect Water Tank Device</h3>
              <p className="text-xs text-slate-400">Pair via Web Bluetooth BLE or USB/Serial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status card if connected or connecting */}
        <div className="px-5 pt-4">
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              status === 'connected'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : status === 'connecting'
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
                : status === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-200'
                : 'bg-slate-800/60 border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {status === 'connected' ? (
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              ) : status === 'connecting' ? (
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">
                  Status: {status}
                </p>
                <p className="text-xs opacity-90">{statusMessage || 'Device disconnected'}</p>
                {deviceName && (
                  <p className="text-[11px] text-cyan-300 font-mono mt-0.5">
                    Device: {deviceName}
                  </p>
                )}
              </div>
            </div>

            {status === 'connected' && (
              <button
                onClick={onDisconnect}
                className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-semibold"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        {/* Method Tabs */}
        <div className="flex border-b border-slate-800 px-5 pt-4 gap-2 text-xs font-semibold">
          <button
            onClick={() => setTab('ble')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'ble'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Bluetooth Low Energy (HM-10 / ESP32)
          </button>
          <button
            onClick={() => setTab('serial')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'serial'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cable className="w-3.5 h-3.5" />
            Serial Port / OTG (HC-05 / USB)
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 space-y-4">
          {tab === 'ble' && (
            <div className="space-y-4">
              {!isBLESupported && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    Web Bluetooth is not natively enabled in this environment. Use Google Chrome on Android or Desktop, or test with the built-in simulator.
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-300 space-y-2">
                <p>
                  Connects directly to <strong>HM-10, JDY-30/31 BLE, AT-09, ESP32, and Arduino BLE</strong> without needing system pairing.
                </p>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300 block mb-1">Auto-detected Services:</span>
                  Nordic UART (NUS), HM-10 (0xFFE0), ISSC Transparent, and custom ESP32 BLE GATT.
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Optional Custom Service UUID (Leave blank for auto-detection):
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6e400001-b5a3-f393-e0a9-e50e24dcca9e"
                  value={customUUID}
                  onChange={(e) => setCustomUUID(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleConnectBLE}
                disabled={connecting || status === 'connected'}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bluetooth className="w-4 h-4" />
                {connecting ? 'Searching & Connecting...' : 'Scan & Connect Bluetooth Device'}
              </button>
            </div>
          )}

          {tab === 'serial' && (
            <div className="space-y-4">
              {!isSerialSupported && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    Web Serial API is supported in Google Chrome, Microsoft Edge, and Opera on desktop/Android.
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-300 space-y-2">
                <p>
                  Connect via <strong>USB OTG Cable</strong> directly to your Arduino/ESP32, or via a <strong>Bluetooth Classic HC-05 COM port</strong>.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Baud Rate:
                </label>
                <select
                  value={baudRate}
                  onChange={(e) => setBaudRate(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value={9600}>9600 (Standard Arduino / HC-05 default)</option>
                  <option value={38400}>38400 (HC-05 AT Command Mode)</option>
                  <option value={57600}>57600</option>
                  <option value={115200}>115200 (ESP32 High Speed)</option>
                </select>
              </div>

              <button
                onClick={handleConnectSerial}
                disabled={connecting || status === 'connected'}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Cable className="w-4 h-4" />
                {connecting ? 'Opening Port...' : 'Select & Open Serial Port'}
              </button>
            </div>
          )}
        </div>

        {/* Footer with Socket Troubleshooter link */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenTroubleshooter();
            }}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium underline"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Troubleshoot "Socket Might Closed" Error
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
