import { ConnectionStatus, ConnectionType, TerminalLog } from '../types';

// Common Bluetooth BLE UART service UUIDs
const BLE_SERVICES = [
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10, CC2541, JDY-08/10/30/31, AT-09
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service (NUS)
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
  '0000fff0-0000-1000-8000-00805f9b34fb', // Common ESP32 BLE custom UART
  '0000dfb0-0000-1000-8000-00805f9b34fb', // Bluno DFRobot
];

const BLE_CHARACTERISTICS = [
  '0000ffe1-0000-1000-8000-00805f9b34fb', // HM-10 TX/RX
  '6e400003-b5a3-f393-e0a9-e50e24dcca9e', // Nordic TX (Notify)
  '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // Nordic RX (Write)
  '49535343-1e4d-4bd9-ba61-23c647249616', // ISSC TX
  '0000fff1-0000-1000-8000-00805f9b34fb', // Common ESP32
];

export interface BluetoothServiceListeners {
  onLevelReceived: (percentage: number, rawData: string) => void;
  onStatusChange: (status: ConnectionStatus, message: string, deviceName?: string) => void;
  onLog: (log: Omit<TerminalLog, 'id' | 'timestamp'>) => void;
}

// Web Bluetooth types
interface BluetoothRemoteGATTCharacteristic {
  value?: DataView;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  writeValue?(data: BufferSource): Promise<void>;
  writeValueWithoutResponse?(data: BufferSource): Promise<void>;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  properties?: {
    notify?: boolean;
    indicate?: boolean;
    read?: boolean;
    write?: boolean;
    writeWithoutResponse?: boolean;
  };
  uuid: string;
}

interface BluetoothRemoteGATTService {
  uuid: string;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothDeviceWithGATT {
  name?: string;
  id: string;
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface ExtendedNavigator {
  bluetooth?: {
    requestDevice(options: {
      acceptAllDevices?: boolean;
      filters?: Array<{ name?: string; namePrefix?: string; services?: string[] }>;
      optionalServices?: string[];
    }): Promise<BluetoothDeviceWithGATT>;
  };
  serial?: {
    requestPort(): Promise<SerialPort>;
  };
}

interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
}

export class BluetoothService {
  private listeners: BluetoothServiceListeners;
  private currentDevice: BluetoothDeviceWithGATT | null = null;
  private currentCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private serialPort: SerialPort | null = null;
  private serialReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private connectionType: ConnectionType | null = null;
  private incomingBuffer = '';
  private isDisconnectingExplicitly = false;

  constructor(listeners: BluetoothServiceListeners) {
    this.listeners = listeners;
  }

  public isWebBluetoothSupported(): boolean {
    const nav = navigator as unknown as ExtendedNavigator;
    return typeof window !== 'undefined' && !!nav.bluetooth;
  }

  public isWebSerialSupported(): boolean {
    const nav = navigator as unknown as ExtendedNavigator;
    return typeof window !== 'undefined' && !!nav.serial;
  }

  /**
   * Connect to Bluetooth Low Energy (BLE) module (e.g. HM-10, ESP32, JDY-30/31 BLE, AT-09, Arduino BLE)
   */
  public async connectBLE(customUUID?: string): Promise<boolean> {
    const nav = navigator as unknown as ExtendedNavigator;
    if (!nav.bluetooth) {
      this.listeners.onStatusChange(
        'error',
        'Web Bluetooth is not supported on this browser. Use Chrome on Android/Desktop or enable flags.'
      );
      return false;
    }

    try {
      this.isDisconnectingExplicitly = false;
      this.listeners.onStatusChange('connecting', 'Requesting Bluetooth device...');
      this.listeners.onLog({
        direction: 'system',
        data: 'Opening Bluetooth pairing dialog...',
      });

      const optionalServices = [...BLE_SERVICES];
      if (customUUID && !optionalServices.includes(customUUID.toLowerCase())) {
        optionalServices.push(customUUID.toLowerCase());
      }

      // Request device with all services we might communicate with
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: optionalServices,
      });

      this.currentDevice = device;
      const deviceName = device.name || 'Unnamed Bluetooth Device';
      this.listeners.onStatusChange('connecting', `Connecting to ${deviceName}...`, deviceName);
      this.listeners.onLog({
        direction: 'system',
        data: `Discovered device: "${deviceName}" (ID: ${device.id.substring(0, 8)}...). Connecting to GATT Server...`,
      });

      // Handle spontaneous disconnection
      device.addEventListener('gattserverdisconnected', () => {
        if (!this.isDisconnectingExplicitly) {
          this.listeners.onStatusChange(
            'disconnected',
            'Bluetooth device disconnected or connection dropped.'
          );
          this.listeners.onLog({
            direction: 'system',
            data: 'Device disconnected (GATT Server Disconnected).',
          });
        }
      });

      if (!device.gatt) {
        throw new Error('Device does not support GATT communication');
      }

      const server = await device.gatt.connect();
      this.listeners.onLog({
        direction: 'system',
        data: 'Connected to GATT Server. Searching for UART / Data service...',
      });

      // Try discovering known services or explore all
      let targetCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

      try {
        const services = await server.getPrimaryServices();
        this.listeners.onLog({
          direction: 'system',
          data: `Found ${services.length} primary service(s). Discovering characteristics...`,
        });

        for (const service of services) {
          try {
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
              const props = char.properties;
              if (props?.notify || props?.indicate || props?.read) {
                targetCharacteristic = char;
                this.listeners.onLog({
                  direction: 'system',
                  data: `Identified notification characteristic: ${char.uuid}`,
                });
                break;
              }
            }
            if (targetCharacteristic) break;
          } catch {
            // continue checking other services
          }
        }
      } catch (svcErr) {
        this.listeners.onLog({
          direction: 'system',
          data: `Direct service query fallback: ${svcErr instanceof Error ? svcErr.message : String(svcErr)}`,
        });
      }

      // If still not found, try the standard HM-10 / NUS service directly
      if (!targetCharacteristic) {
        for (const sUuid of optionalServices) {
          try {
            const service = await server.getPrimaryService(sUuid);
            for (const cUuid of BLE_CHARACTERISTICS) {
              try {
                const char = await service.getCharacteristic(cUuid);
                if (char) {
                  targetCharacteristic = char;
                  break;
                }
              } catch {
                // try next characteristic
              }
            }
            if (targetCharacteristic) break;
          } catch {
            // try next service
          }
        }
      }

      if (!targetCharacteristic) {
        throw new Error(
          'Could not find a readable or notifying characteristic on this device. Ensure your module exposes a BLE UART service (HM-10, NUS, or ESP32 UART).'
        );
      }

      this.currentCharacteristic = targetCharacteristic;
      await targetCharacteristic.startNotifications();
      this.listeners.onLog({
        direction: 'system',
        data: 'Subscribed to notifications! Listening for water level data...',
      });

      targetCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
        const target = event.target as unknown as { value: DataView };
        if (target && target.value) {
          const decoder = new TextDecoder('utf-8');
          const chunk = decoder.decode(target.value);
          this.handleIncomingRawText(chunk);
        }
      });

      this.connectionType = 'ble';
      this.listeners.onStatusChange('connected', `Connected via BLE to ${deviceName}`, deviceName);
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.listeners.onLog({
        direction: 'system',
        data: `Connection error: ${errorMsg}`,
      });

      // Provide helpful diagnosis if the user hits the socket / timeout error
      if (errorMsg.includes('cancelled') || errorMsg.includes('User cancelled')) {
        this.listeners.onStatusChange('disconnected', 'Bluetooth pairing cancelled by user.');
      } else {
        this.listeners.onStatusChange('error', `Connection failed: ${errorMsg}`);
      }
      return false;
    }
  }

  /**
   * Connect via Web Serial API (For USB OTG cable or Bluetooth Serial Virtual COM Port)
   */
  public async connectSerial(baudRate = 9600): Promise<boolean> {
    const nav = navigator as unknown as ExtendedNavigator;
    if (!nav.serial) {
      this.listeners.onStatusChange(
        'error',
        'Web Serial API is not supported in this browser. Try Chrome or Edge.'
      );
      return false;
    }

    try {
      this.isDisconnectingExplicitly = false;
      this.listeners.onStatusChange('connecting', 'Requesting Serial Port...');
      const port = await nav.serial.requestPort();
      await port.open({ baudRate });

      this.serialPort = port;
      this.connectionType = 'serial';
      this.listeners.onStatusChange('connected', `Connected via Serial Port (${baudRate} baud)`);
      this.listeners.onLog({
        direction: 'system',
        data: `Serial port opened at ${baudRate} baud. Reading stream...`,
      });

      this.readSerialStream(port);
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.listeners.onStatusChange('error', `Serial connection error: ${errorMsg}`);
      this.listeners.onLog({
        direction: 'system',
        data: `Serial error: ${errorMsg}`,
      });
      return false;
    }
  }

  private async readSerialStream(port: SerialPort) {
    while (port.readable && !this.isDisconnectingExplicitly) {
      try {
        const reader = port.readable.getReader();
        this.serialReader = reader;
        const decoder = new TextDecoder('utf-8');

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            const chunk = decoder.decode(value);
            this.handleIncomingRawText(chunk);
          }
        }
      } catch (err) {
        if (!this.isDisconnectingExplicitly) {
          this.listeners.onLog({
            direction: 'system',
            data: `Serial read stream error: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
        break;
      }
    }
  }

  /**
   * Parse incoming serial/BLE data chunks, assemble lines, and extract percentage (0-100)
   */
  public handleIncomingRawText(chunk: string) {
    this.incomingBuffer += chunk;

    // Check for newline or carriage return delimiter
    if (this.incomingBuffer.includes('\n') || this.incomingBuffer.includes('\r')) {
      const lines = this.incomingBuffer.split(/[\r\n]+/);
      // Keep last incomplete segment in buffer
      this.incomingBuffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 0) {
          this.listeners.onLog({
            direction: 'in',
            data: trimmed,
          });
          this.parseAndEmitLevel(trimmed);
        }
      }
    } else if (this.incomingBuffer.length > 100) {
      // Buffer got too large without newline; attempt parsing raw
      const raw = this.incomingBuffer.trim();
      this.incomingBuffer = '';
      this.listeners.onLog({
        direction: 'in',
        data: raw,
      });
      this.parseAndEmitLevel(raw);
    }
  }

  /**
   * Intelligently parses water level from various Arduino/sensor output formats:
   * "75%", "LEVEL: 75", "WATER: 50", "{"level": 100}", "25", "DIST: 30cm", etc.
   */
  public parseAndEmitLevel(raw: string) {
    let parsedPercentage: number | null = null;

    // 1. JSON check: {"level": 75} or {"water": 50}
    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed.level === 'number') parsedPercentage = parsed.level;
        else if (typeof parsed.water === 'number') parsedPercentage = parsed.water;
        else if (typeof parsed.percentage === 'number') parsedPercentage = parsed.percentage;
      } catch {
        // Not valid JSON, continue with regex
      }
    }

    if (parsedPercentage === null) {
      // 2. Prefixed formats like "LEVEL: 75", "WATER=50%", "L: 25", "Tank: 100%"
      const prefixMatch = raw.match(/(?:level|water|tank|val|lvl|l)\s*[:=]\s*(\d+(?:\.\d+)?)\s*%?/i);
      if (prefixMatch && prefixMatch[1]) {
        parsedPercentage = parseFloat(prefixMatch[1]);
      }
    }

    if (parsedPercentage === null) {
      // 3. Percentage format like "75%", "100 %"
      const percentMatch = raw.match(/(\d+(?:\.\d+)?)\s*%/);
      if (percentMatch && percentMatch[1]) {
        parsedPercentage = parseFloat(percentMatch[1]);
      }
    }

    if (parsedPercentage === null) {
      // 4. Standalone integer or float number: "75", "0", "100"
      const numMatch = raw.match(/^\s*(\d+(?:\.\d+)?)\s*$/);
      if (numMatch && numMatch[1]) {
        parsedPercentage = parseFloat(numMatch[1]);
      }
    }

    if (parsedPercentage !== null && !isNaN(parsedPercentage)) {
      // Clamp between 0 and 100
      const clamped = Math.max(0, Math.min(100, Math.round(parsedPercentage)));
      this.listeners.onLevelReceived(clamped, raw);
    }
  }

  /**
   * Send a test command or packet to the device
   */
  public async sendData(text: string): Promise<boolean> {
    try {
      this.listeners.onLog({
        direction: 'out',
        data: text,
      });

      const encoder = new TextEncoder();
      const data = encoder.encode(text + '\n');

      if (this.connectionType === 'ble' && this.currentCharacteristic) {
        if (this.currentCharacteristic.writeValueWithoutResponse) {
          await this.currentCharacteristic.writeValueWithoutResponse(data);
        } else if (this.currentCharacteristic.writeValue) {
          await this.currentCharacteristic.writeValue(data);
        }
        return true;
      } else if (this.connectionType === 'serial' && this.serialPort && this.serialPort.writable) {
        const writer = this.serialPort.writable.getWriter();
        await writer.write(data);
        writer.releaseLock();
        return true;
      }
      return false;
    } catch (err) {
      this.listeners.onLog({
        direction: 'system',
        data: `Failed to send data: ${err instanceof Error ? err.message : String(err)}`,
      });
      return false;
    }
  }

  /**
   * Disconnect cleanly
   */
  public async disconnect() {
    this.isDisconnectingExplicitly = true;

    try {
      if (this.currentCharacteristic) {
        try {
          await this.currentCharacteristic.stopNotifications();
        } catch {
          // ignore
        }
        this.currentCharacteristic = null;
      }

      if (this.currentDevice?.gatt?.connected) {
        this.currentDevice.gatt.disconnect();
      }
      this.currentDevice = null;

      if (this.serialReader) {
        try {
          await this.serialReader.cancel();
          this.serialReader.releaseLock();
        } catch {
          // ignore
        }
        this.serialReader = null;
      }

      if (this.serialPort) {
        try {
          await this.serialPort.close();
        } catch {
          // ignore
        }
        this.serialPort = null;
      }
    } finally {
      this.connectionType = null;
      this.listeners.onStatusChange('disconnected', 'Disconnected');
      this.listeners.onLog({
        direction: 'system',
        data: 'Disconnected from device.',
      });
    }
  }

  public getConnectionType(): ConnectionType | null {
    return this.connectionType;
  }
}
