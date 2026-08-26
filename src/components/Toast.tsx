'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-5 left-3 right-3 sm:left-auto sm:right-5 z-50 flex flex-col gap-2 pointer-events-none sm:max-w-sm sm:w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-3 sm:p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-2.5 sm:gap-3 border backdrop-blur-xl animate-slide-up transition-all ${
            t.type === 'success'
              ? 'bg-slate-900/95 text-slate-100 border-emerald-500/40 shadow-emerald-500/20'
              : t.type === 'error'
              ? 'bg-slate-900/95 text-slate-100 border-rose-500/40 shadow-rose-500/20'
              : 'bg-slate-900/95 text-slate-100 border-teal-500/40 shadow-teal-500/20'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {t.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            {t.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            {t.type === 'info' && (
              <Info className="w-4 h-4 text-teal-400 flex-shrink-0" />
            )}
            <p className="text-xs font-medium truncate">{t.message}</p>
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss toast"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white active:scale-95 hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
