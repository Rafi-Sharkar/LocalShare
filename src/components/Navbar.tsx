'use client';

import React from 'react';
import {
  QrCode,
  Share2,
  Moon,
  Sun,
  Radio,
  Files,
  FileText,
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
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 glass-card">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20">
            {/* Logo & App Name */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white shadow-lg shadow-teal-500/20 flex-shrink-0">
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse-subtle" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-teal-500"></span>
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent truncate">
                    LocalShare
                  </h1>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 whitespace-nowrap">
                    Wi-Fi
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Instant peer-to-peer sharing on your local network
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs (Hidden on mobile) */}
            <div className="hidden md:flex items-center bg-slate-900/70 p-1 rounded-xl border border-white/5 shadow-inner">
              <button
                onClick={() => setActiveTab('files')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'files'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Files className="w-4 h-4" />
                <span>Files</span>
                {fileCount > 0 && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full ${
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
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'text'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Quick Notes</span>
                {textCount > 0 && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full ${
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

            {/* Right Action buttons */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Wi-Fi IP Badge (Desktop/Tablet) */}
              <button
                onClick={onOpenQR}
                title="Click to view QR code or network address"
                className="cursor-pointer hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-950/40 border border-teal-500/30 text-teal-300 text-xs font-mono transition-all hover:bg-teal-900/40"
              >
                <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                <span>{primaryIp}:{port}</span>
              </button>

              {/* QR Connect Button */}
              <button
                onClick={onOpenQR}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
              >
                <QrCode className="w-4 h-4 flex-shrink-0" />
                <span className="hidden xs:inline sm:inline">Connect</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                aria-label="Toggle Theme"
                className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-white/5 transition-colors active:scale-95"
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

      {/* Mobile Bottom Navigation Bar (Visible only on screens < md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all duration-200 active:scale-95 ${
              activeTab === 'files'
                ? 'text-teal-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Files className="w-5 h-5" />
              {fileCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-teal-500 text-white shadow-sm">
                  {fileCount}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-tight">Shared Files</span>
          </button>

          {/* Quick Connect Button in mobile bar */}
          <button
            onClick={onOpenQR}
            className="flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-indigo-400 hover:text-indigo-300 transition-all active:scale-95"
          >
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shadow-sm">
              <QrCode className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-slate-300 leading-tight">QR Connect</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all duration-200 active:scale-95 ${
              activeTab === 'text'
                ? 'text-teal-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <FileText className="w-5 h-5" />
              {textCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-teal-500 text-white shadow-sm">
                  {textCount}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-tight">Quick Notes</span>
          </button>
        </div>
      </nav>
    </>
  );
};
