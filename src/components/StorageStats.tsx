'use client';

import React from 'react';
import { HardDrive, Files, FileText, Activity } from 'lucide-react';
import { StorageStats as StatsType } from '@/lib/types';

interface StorageStatsProps {
  stats: StatsType | null;
}

export const StorageStats: React.FC<StorageStatsProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
      <div className="glass-card p-3.5 rounded-2xl flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
          <Files className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Shared Files</p>
          <p className="text-lg font-bold text-slate-100">{stats.totalFiles}</p>
        </div>
      </div>

      <div className="glass-card p-3.5 rounded-2xl flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <HardDrive className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Storage Used</p>
          <p className="text-lg font-bold text-slate-100">
            {stats.formattedTotalSize}
          </p>
        </div>
      </div>

      <div className="glass-card p-3.5 rounded-2xl flex items-center gap-3 col-span-2 sm:col-span-1">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Shared Notes</p>
          <p className="text-lg font-bold text-slate-100">{stats.totalTexts}</p>
        </div>
      </div>
    </div>
  );
};
