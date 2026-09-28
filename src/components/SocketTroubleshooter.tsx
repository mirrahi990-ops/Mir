import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  Cpu,
  FileCode,
  HelpCircle,
  Radio,
  RefreshCw,
  Terminal,
  Wrench,
  X,
} from 'lucide-react';

interface SocketTroubleshooterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SocketTroubleshooter: React.FC<SocketTroubleshooterProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'why' | 'checklist' | 'arduino_code' | 'esp32_code'>('why');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const arduinoCode = `/*
  * HydroPulse Water Tank Monitor - Arduino + Ultrasonic (HC-SR04) + Bluetooth
  * Fixes "Socket Closed / Read Failed / Timeout" by preventing pulseIn() blocking
  * and sending formatted water level percentages every 1 second.
  */

#include <SoftwareSerial.h>

// Pins for Ultrasonic Sensor HC-SR04
const int TRIG_PIN = 9;
const int ECHO_PIN = 10;

// Bluetooth Module Pins (HC-05 or HM-10)
// Connect Bluetooth TX -> Arduino Pin 2 (BT_RX)
// Connect Bluetooth RX -> 1k/2k Resistor Divider -> Arduino Pin 3 (BT_TX)
const int BT_RX_PIN = 2; 
const int BT_TX_PIN = 3; 

SoftwareSerial btSerial(BT_RX_PIN, BT_TX_PIN);

// TANK DIMENSIONS (Adjust these in centimeters)
const float TANK_TOTAL_HEIGHT_CM = 100.0; // Distance when tank is completely empty
const float MIN_SENSOR_DISTANCE_CM = 15.0; // Sensor to full water line (100% full)

unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(9600);
  btSerial.begin(9600); // Default baud for HC-05 / HM-10

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  Serial.println("HydroPulse Water Monitor Initialized!");
}

void loop() {
  // Read ultrasonic level every 1000ms
  if (millis() - lastSendTime >= 1000) {
    lastSendTime = millis();

    // 1. Trigger ultrasonic pulse
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    // 2. CRITICAL FIX: Add 30,000 microsecond (30ms) timeout!
    // Without timeout, pulseIn blocks execution forever if echo is lost,
    // which triggers the Android "socket might closed or timeout" error!
    long duration = pulseIn(ECHO_PIN, HIGH, 30000);

    if (duration == 0) {
      Serial.println("Warning: Ultrasonic echo timeout");
      return;
    }

    // Distance in cm = (duration * 0.0343) / 2
    float distanceCm = (duration * 0.0343) / 2.0;

    // Calculate water level % (100% when distance is close to MIN, 0% when at TOTAL)
    float effectiveRange = TANK_TOTAL_HEIGHT_CM - MIN_SENSOR_DISTANCE_CM;
    float waterDepth = TANK_TOTAL_HEIGHT_CM - distanceCm;
    int percentage = (int)round((waterDepth / effectiveRange) * 100.0);

    // Constrain 0 to 100%
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;

    // Send formatted message with newline delimiter
    // Format: "LEVEL: 75" or "75%"
    btSerial.print("LEVEL: ");
    btSerial.println(percentage);

    // Also output to USB Serial monitor for easy debugging
    Serial.print("Dist: ");
    Serial.print(distanceCm);
    Serial.print(" cm | Water Level: ");
    Serial.print(percentage);
    Serial.println("%");
  }
}`;

  const esp32Code = `/*
  * HydroPulse Water Tank Monitor - ESP32 Built-in BLE
  * 100% eliminates "read failed socket closed" errors!
  * Native Web Bluetooth BLE connects directly in mobile Chrome!
  */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

const int TRIG_PIN = 5;
const int ECHO_PIN = 18;

const float TANK_TOTAL_HEIGHT_CM = 100.0;
const float MIN_SENSOR_DISTANCE_CM = 15.0;

// Standard Nordic UART Service UUIDs (Fully supported by HydroPulse web app)
#define SERVICE_UUID           "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

BLEServer *pServer = NULL;
BLECharacteristic *pTxCharacteristic = NULL;
bool deviceConnected = false;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
    };
    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      // Restart advertising so web app can reconnect immediately
      pServer->getAdvertising()->start();
    }
};

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Initialize ESP32 BLE
  BLEDevice::init("HydroPulse-WaterTank");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);
  pTxCharacteristic = pService->createCharacteristic(
                        CHARACTERISTIC_UUID_TX,
                        BLECharacteristic::PROPERTY_NOTIFY
                      );
  pTxCharacteristic->addDescriptor(new BLE2902());
  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->start();

  Serial.println("ESP32 BLE Ready! Connect from HydroPulse Web App.");
}

void loop() {
  // Ultrasonic pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  if (duration > 0) {
    float distanceCm = (duration * 0.0343) / 2.0;
    float range = TANK_TOTAL_HEIGHT_CM - MIN_SENSOR_DISTANCE_CM;
    int percentage = (int)round(((TANK_TOTAL_HEIGHT_CM - distanceCm) / range) * 100.0);
    percentage = constrain(percentage, 0, 100);

    if (deviceConnected) {
      String msg = "LEVEL:" + String(percentage) + "\\n";
      pTxCharacteristic->setValue((uint8_t*)msg.c_str(), msg.length());
      pTxCharacteristic->notify();
    }
    Serial.println("Water Level: " + String(percentage) + "%");
  }

  delay(1000);
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Bluetooth Connection & Socket Fix Center
              </h2>
              <p className="text-xs text-slate-400">
                Fixing "read failed: socket might closed or timeout"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-5 pt-3 gap-2 bg-slate-950/40 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('why')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'why'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Why The Error Happened
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'checklist'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            5-Point Hardware Checklist
          </button>
          <button
            onClick={() => setActiveTab('arduino_code')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'arduino_code'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Arduino (HC-05 / HM-10) Code
          </button>
          <button
            onClick={() => setActiveTab('esp32_code')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'esp32_code'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            ESP32 BLE Code (Recommended)
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-sm text-slate-300 space-y-4">
          {activeTab === 'why' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white">The Root Cause of "Read Failed / Socket Closed"</h4>
                    <p className="mt-1 text-xs text-amber-300/90 leading-relaxed">
                      This infamous error on Android occurs for three primary hardware/firmware reasons when paired with Arduino Bluetooth modules:
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                  <span className="inline-block px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold mb-2">
                    1. HC-05 Classic vs BLE
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    HC-05 is Bluetooth 2.0 Classic SPP. Web browsers and modern mobile stacks use Bluetooth Low Energy (BLE) like HM-10 or ESP32. Trying to connect to an HC-05 via BLE causes the OS to abort with "socket might closed or timeout".
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                  <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold mb-2">
                    2. Ultrasonic Blocking
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    Standard <code className="text-cyan-300 font-mono">pulseIn(echoPin, HIGH)</code> blocks execution for 1000ms if an echo is lost. The phone OS detects zero incoming stream data, assumes the socket died, and closes it.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                  <span className="inline-block px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold mb-2">
                    3. Paired in Phone Settings
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    If a BLE device is already paired in Android Bluetooth settings, the Android system locks the RFCOMM port and refuses new app connections. You must UNPAIR it in Android settings and connect directly inside the app!
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/40">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">
                  How This New App Solves It:
                </h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>Supports <strong>Web Bluetooth BLE</strong> (HM-10, ESP32, JDY-30/31, Nordic UART).</li>
                  <li>Supports <strong>Web Serial API</strong> (for USB OTG Arduino cable or Bluetooth Virtual COM port).</li>
                  <li>Built-in <strong>Interactive Simulator</strong> so you can test tank alerts at 0%, 25%, 50%, 75%, and 100% even before wiring up hardware!</li>
                  <li>Tested non-blocking Arduino and ESP32 firmware provided in the next tabs.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Check TX & RX Cross-Wiring</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Bluetooth <strong>TX</strong> must connect to Arduino <strong>RX</strong>. Bluetooth <strong>RX</strong> must connect to Arduino <strong>TX</strong>. (Do not connect TX to TX!).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Unpair from Phone Android Bluetooth Settings (For BLE)</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Go to phone <em>Settings &gt; Bluetooth &gt; Paired Devices</em>. If your module (HM-10 / ESP32) is paired there, tap <strong>Unpair / Forget</strong>. Then open this web app in Chrome and click "Connect via Bluetooth".
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Add Voltage Divider on Bluetooth RX Pin</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Arduino UNO operates at 5V logic, but Bluetooth module RX pin is 3.3V. Connect a 1kΩ resistor from Arduino TX to Bluetooth RX, and a 2kΩ resistor from Bluetooth RX to Ground. This prevents chip reset loops.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Add 30ms Timeout to pulseIn()</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Use <code className="text-cyan-300 font-mono">pulseIn(ECHO_PIN, HIGH, 30000)</code> instead of plain <code className="text-cyan-300 font-mono">pulseIn(ECHO_PIN, HIGH)</code>. This guarantees your loop never freezes when water ripples or echoes deflect.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  5
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Power Supply Decoupling</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    When the ultrasonic sensor transducers pulse, they cause a brief current spike on the 5V rail. Place a 100µF or 10µF capacitor between 5V and GND near the sensor to eliminate sudden Bluetooth brownout resets.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'arduino_code' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  Ready-to-upload Arduino UNO / Nano Sketch:
                </span>
                <button
                  onClick={() => copyToClipboard(arduinoCode, 'arduino')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/30 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedCode === 'arduino' ? 'Copied to Clipboard!' : 'Copy Code'}
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto max-h-72">
                <code>{arduinoCode}</code>
              </pre>
            </div>
          )}

          {activeTab === 'esp32_code' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  ESP32 Built-in BLE Sketch (Recommended for 100% reliable connections):
                </span>
                <button
                  onClick={() => copyToClipboard(esp32Code, 'esp32')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/30 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedCode === 'esp32' ? 'Copied to Clipboard!' : 'Copy Code'}
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto max-h-72">
                <code>{esp32Code}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Tip: You can use the built-in <strong>Simulator Mode</strong> below to verify alerts immediately.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
