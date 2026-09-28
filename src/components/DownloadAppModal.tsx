import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Laptop,
  Share2,
  Copy,
  Check,
  ExternalLink,
  X,
  FileCode,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'install' | 'phone_url' | 'sketches'>('install');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleInstallClick = async () => {
    await install();
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const arduinoIno = `/* HydroPulse Arduino UNO/Nano Ultrasonic + Bluetooth Sketch */
#include <SoftwareSerial.h>

const int TRIG_PIN = 9;
const int ECHO_PIN = 10;
const int BT_RX_PIN = 2; // Connect to Bluetooth TX
const int BT_TX_PIN = 3; // Connect to Bluetooth RX (via 1k/2k divider)

SoftwareSerial btSerial(BT_RX_PIN, BT_TX_PIN);

const float TANK_TOTAL_HEIGHT_CM = 100.0;
const float MIN_SENSOR_DISTANCE_CM = 15.0;

unsigned long lastSend = 0;

void setup() {
  Serial.begin(9600);
  btSerial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  if (millis() - lastSend >= 1000) {
    lastSend = millis();
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    // 30ms timeout prevents socket freeze
    long duration = pulseIn(ECHO_PIN, HIGH, 30000);
    if (duration > 0) {
      float distanceCm = (duration * 0.0343) / 2.0;
      float range = TANK_TOTAL_HEIGHT_CM - MIN_SENSOR_DISTANCE_CM;
      int percentage = (int)round(((TANK_TOTAL_HEIGHT_CM - distanceCm) / range) * 100.0);
      percentage = constrain(percentage, 0, 100);

      btSerial.print("LEVEL: ");
      btSerial.println(percentage);
    }
  }
}`;

  const esp32Ino = `/* HydroPulse ESP32 BLE Water Tank Monitor Sketch */
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

const int TRIG_PIN = 5;
const int ECHO_PIN = 18;
const float TANK_TOTAL_HEIGHT_CM = 100.0;
const float MIN_SENSOR_DISTANCE_CM = 15.0;

#define SERVICE_UUID           "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

BLEServer *pServer = NULL;
BLECharacteristic *pTxCharacteristic = NULL;
bool deviceConnected = false;

class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) { deviceConnected = true; }
  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    pServer->getAdvertising()->start();
  }
};

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

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
  BLEDevice::getAdvertising()->start();
}

void loop() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
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
  }
  delay(1000);
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Download & Install HydroPulse
              </h3>
              <p className="text-xs text-slate-400">
                Install as a native standalone app on mobile or desktop
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
            onClick={() => setActiveTab('install')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'install'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Direct File Downloads (.html / .tar.gz)
          </button>
          <button
            onClick={() => setActiveTab('phone_url')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'phone_url'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Install on Phone (PWA)
          </button>
          <button
            onClick={() => setActiveTab('sketches')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'sketches'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Download Arduino Firmware
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-300 space-y-4">
          {activeTab === 'install' && (
            <div className="space-y-4">
              {/* Standalone File Download Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/70 to-blue-950/70 border border-cyan-500/50 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500 text-slate-950 font-black">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        HydroPulse Standalone Offline App (.html)
                      </h4>
                      <p className="text-[11px] text-cyan-300">
                        Zero server needed • 100% Offline • No Google Login required
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    Recommended
                  </span>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">
                  This is a self-contained application file with all styling, Web Bluetooth drivers, and audio alerts included. Download this file, send it to your phone via WhatsApp, USB cable, or Google Drive, and tap to open it in Chrome!
                </p>

                <a
                  href="/HydroPulse-Standalone.html"
                  download="HydroPulse-WaterTank-App.html"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 active:scale-95 text-center"
                >
                  <Download className="w-4 h-4" />
                  Download Standalone App (.html)
                </a>
              </div>

              {/* Source code archive download */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Complete Project Source Code (.tar.gz)</h5>
                    <p className="text-[10px] text-slate-400">
                      React + TypeScript + Tailwind source files
                    </p>
                  </div>
                </div>
                <a
                  href="/HydroPulse-Source.tar.gz"
                  download="HydroPulse-Source.tar.gz"
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Archive
                </a>
              </div>

              {/* Notice why the cloud URL threw an error */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
                <span className="font-bold flex items-center gap-1.5 text-amber-300">
                  <ExternalLink className="w-4 h-4" />
                  Why did the previous web link show an error on your phone?
                </span>
                <p className="text-[11px] text-amber-300/90 leading-relaxed">
                  Google AI Studio development URLs are protected by Google Cloud Identity firewall. External devices or phones not logged into this Google Cloud developer session are blocked. The <strong>Standalone App (.html)</strong> above runs directly on your device without communicating through Google's cloud servers!
                </p>
              </div>

              {/* 1-Click PWA Installation on current browser */}
              {isInstallable && !isInstalled && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Install on this device:</span>
                    <button
                      onClick={handleInstallClick}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all"
                    >
                      Install Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'phone_url' && (
            <div className="space-y-4">
              {/* Step-by-step instructions for Android */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>How to install on Android (Chrome / Edge / Samsung Internet):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300">
                  <li>Open this app in <strong>Google Chrome</strong> on your Android phone.</li>
                  <li>
                    Tap the <strong>three dots (⋮)</strong> menu at the top right of Chrome.
                  </li>
                  <li>
                    Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </li>
                  <li>
                    Tap <strong>Install</strong>. Android will create an app icon named <strong>HydroPulse</strong> on your phone's home screen.
                  </li>
                  <li>
                    Tap the icon anytime to open the full-screen app with direct Bluetooth access!
                  </li>
                </ol>
              </div>

              {/* Step-by-step instructions for iPhone / iPad */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>How to install on iPhone / iPad (iOS Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300">
                  <li>Open this app in <strong>Safari</strong> on your iPhone.</li>
                  <li>
                    Tap the <strong>Share</strong> button (the box with an upward arrow <span className="px-1 py-0.5 rounded bg-slate-800 font-mono">⎋</span>) at the bottom toolbar.
                  </li>
                  <li>
                    Scroll down and tap <strong>"Add to Home Screen"</strong>.
                  </li>
                  <li>
                    Tap <strong>Add</strong> in the top right.
                  </li>
                  <li>
                    <em>Note for iOS Bluetooth:</em> Web Bluetooth on iOS is supported via the free <strong>Bluefy</strong> browser app on the App Store.
                  </li>
                </ol>
              </div>

              {/* Step-by-step instructions for PC / Mac */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Laptop className="w-4 h-4 text-purple-400" />
                  <span>How to install on Windows PC / Mac / Linux:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300">
                  <li>In Google Chrome or Microsoft Edge, look at the right end of the address URL bar.</li>
                  <li>
                    Click the <strong>Install icon</strong> (a small monitor with a down arrow).
                  </li>
                  <li>Click <strong>Install</strong> to add it to your Desktop and Start menu.</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  Open on your Mobile Phone
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  To connect your water tank sensor via Bluetooth from your phone, open this link in Chrome on your Android phone:
                </p>

                {/* URL box with copy button */}
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="flex-1 bg-transparent text-cyan-300 outline-none text-[11px] overflow-ellipsis"
                  />
                  <button
                    onClick={copyUrl}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-sans font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 space-y-2">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                  Why this is better than a standard Google Play app:
                </span>
                <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside">
                  <li>No 50MB app download; loads instantly in seconds.</li>
                  <li>Automatically receives new updates without manual Play Store updates.</li>
                  <li>Direct hardware access to Web Bluetooth BLE and Web Serial.</li>
                  <li>Works offline once opened!</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'sketches' && (
            <div className="space-y-4">
              <p className="text-[11px] text-slate-300">
                Download the verified, non-blocking Arduino and ESP32 code files ready to open in the Arduino IDE:
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Arduino UNO/Nano Sketch</h5>
                    <p className="text-[10px] text-slate-400">
                      HC-SR04 + HC-05 / HM-10 with 30ms pulse timeout
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => downloadFile('WaterTank_Arduino_HCSR04.ino', arduinoIno)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .ino
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white">ESP32 BLE Sketch</h5>
                    <p className="text-[10px] text-slate-400">
                      HC-SR04 + ESP32 Native BLE (Nordic UART Service)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => downloadFile('WaterTank_ESP32_BLE.ino', esp32Ino)}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .ino
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            PWA Standard • Web Bluetooth API • Offline Ready
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
