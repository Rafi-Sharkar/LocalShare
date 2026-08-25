'use client';

import React from 'react';
import {
  Wifi,
  QrCode,
  Share2,
  Moon,
  Sun,
  Laptop,
  Smartphone,
  Radio,
} from 'lucide-react';

interface NavbarProps {
  primaryUrl: string;
  primaryIp: string;
  port: string;
  isOnline: boolean;
  onOpenQR: () => void;
  activeTab: 'files' | 'text';
  setActiveTab: (tab: 'files' | 'text') => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  fileCount: number;
  textCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  primaryUrl,
  primaryIp,
  port,
  isOnline,
  onOpenQR,
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  fileCount,
  textCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 glass-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white shadow-lg shadow-teal-500/20">
              <Share2 className="w-5 h-5 animate-pulse-subtle" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                  LocalShare
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Wi-Fi LAN
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Instant peer-to-peer sharing on your local network
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Center) */}
          <div className="flex items-center bg-slate-900/60 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                activeTab === 'files'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span>Files</span>
              {fileCount > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    activeTab === 'files'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {fileCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                activeTab === 'text'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span>Quick Notes</span>
              {textCount > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    activeTab === 'text'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {textCount}
                </span>
              )}
            </button>
          </div>

          {/* Right Action buttons: Live Network IP Badge & QR Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Wi-Fi IP Badge */}
            <div
              onClick={onOpenQR}
              title="Click to view QR code or change network address"
              className="cursor-pointer hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-950/40 border border-teal-500/30 text-teal-300 text-xs font-mono transition-all hover:bg-teal-900/40"
            >
              <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span>{primaryIp}:{port}</span>
            </div>

            {/* QR Connect Button */}
            <button
              onClick={onOpenQR}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-200 active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Connect Device</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-white/5 transition-colors"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-300" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
