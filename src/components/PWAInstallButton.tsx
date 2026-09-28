import React, { useState } from 'react';
import { Download, Smartphone, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenDownloadModal: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenDownloadModal,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // If already running in standalone mode (already installed), show a subtle active badge or hide
  if (isInstalled) {
    return (
      <button
        onClick={onOpenDownloadModal}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
        title="App Installed in Standalone Mode"
      >
        <Smartphone className="w-4 h-4 text-emerald-400" />
        <span className="hidden sm:inline">Installed</span>
      </button>
    );
  }

  // If browser fired beforeinstallprompt
  if (isInstallable) {
    return (
      <button
        onClick={async () => {
          const success = await install();
          if (!success) {
            onOpenDownloadModal();
          }
        }}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all active:scale-95 animate-pulse"
        title="Install app to your device home screen"
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
    );
  }

  // Default state: Show "Download / Install App" button which opens the complete guide
  return (
    <button
      onClick={onOpenDownloadModal}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-all active:scale-95"
      title="Download or install app to phone/PC"
    >
      <Download className="w-4 h-4 text-cyan-400" />
      <span className="hidden sm:inline">Download App</span>
      <span className="sm:hidden">Install</span>
    </button>
  );
};
