export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type ConnectionType = 'ble' | 'serial' | 'simulator';

export interface WaterLevelData {
  percentage: number; // 0 to 100
  rawDistanceCm?: number;
  timestamp: number;
  source: ConnectionType;
}

export interface AlertThreshold {
  level: number; // 0, 25, 50, 75, 100
  name: string;
  type: 'critical_low' | 'warning_low' | 'info_mid' | 'notice_high' | 'critical_high';
  enabled: boolean;
  message: string;
  voiceMessage: string;
  toneType: 'siren' | 'warning' | 'chime' | 'success' | 'alarm';
  color: string;
}

export interface TankConfig {
  tankHeightCm: number; // e.g. 100cm
  sensorOffsetCm: number; // e.g. 15cm (minimum distance sensor can read at top)
  capacityLiters: number; // e.g. 1000 Liters
  pumpStatus: 'off' | 'filling' | 'draining' | 'idle';
  soundEnabled: boolean;
  voiceEnabled: boolean;
  vibrateEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface AlertLogItem {
  id: string;
  timestamp: number;
  level: number;
  threshold: AlertThreshold;
  acknowledged: boolean;
}

export interface TerminalLog {
  id: string;
  timestamp: number;
  direction: 'in' | 'out' | 'system';
  data: string;
}
