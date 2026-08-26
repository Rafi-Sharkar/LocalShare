'use client';

import React from 'react';
import { HardDrive, Files, FileText } from 'lucide-react';
import { StorageStats as StatsType } from '@/lib/types';

interface StorageStatsProps {
  stats: StatsType | null;
}

export const StorageStats: React.FC<StorageStatsProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3.5 mb-4 sm:mb-6">
      <div className="glass-card p-2.5 sm:p-3.5 rounded-2xl flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-3">
        <div className="p-2 sm:p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex-shrink-0">
          <Files className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Shared Files</p>
          <p className="text-sm sm:text-lg font-bold text-slate-100">{stats.totalFiles}</p>
        </div>
      </div>

      <div className="glass-card p-2.5 sm:p-3.5 rounded-2xl flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-3">
        <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex-shrink-0">
          <HardDrive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Storage Used</p>
          <p className="text-sm sm:text-lg font-bold text-slate-100 truncate">
            {stats.formattedTotalSize}
          </p>
        </div>
      </div>

      <div className="glass-card p-2.5 sm:p-3.5 rounded-2xl flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-3">
        <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex-shrink-0">
          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Shared Notes</p>
          <p className="text-sm sm:text-lg font-bold text-slate-100">{stats.totalTexts}</p>
        </div>
      </div>
    </div>
  );
};
