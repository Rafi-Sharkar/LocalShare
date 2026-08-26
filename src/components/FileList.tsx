'use client';

import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  FileCode,
  Archive,
  File as FileIcon,
  Download,
  Eye,
  Trash2,
  Copy,
  Check,
  Search,
  LayoutGrid,
  List as ListIcon,
  Laptop,
  Smartphone,
  X,
} from 'lucide-react';
import { FileMetadata, formatBytes } from '@/lib/types';

interface FileListProps {
  files: FileMetadata[];
  onDelete: (id: string) => void;
  onPreview: (file: FileMetadata) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onDelete,
  onPreview,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Category Icons & colors
  const getCategoryIcon = (category: FileMetadata['category']) => {
    switch (category) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-pink-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-amber-400" />;
      case 'code':
        return <FileCode className="w-5 h-5 text-emerald-400" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-orange-400" />;
      case 'pdf':
      case 'document':
        return <FileText className="w-5 h-5 text-cyan-400" />;
      default:
        return <FileIcon className="w-5 h-5 text-slate-400" />;
    }
  };

  const getDeviceIcon = (device: string) => {
    if (/iOS|Android/i.test(device)) {
      return <Smartphone className="w-3.5 h-3.5 text-slate-400" />;
    }
    return <Laptop className="w-3.5 h-3.5 text-slate-400" />;
  };

  // Filtered files
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.originalName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopyLink = async (file: FileMetadata) => {
    try {
      const fullUrl = `${window.location.origin}${file.downloadUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(file.id);
      showToast('Download link copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('Failed to copy link', 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return (
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ', ' +
      date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    );
  };

  const isPreviewable = (category: FileMetadata['category']) => {
    return ['image', 'video', 'audio', 'pdf', 'code', 'document'].includes(
      category
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search, Filter & View Controls */}
      <div className="flex flex-col gap-2.5 sm:gap-3 glass-card p-2.5 sm:p-3.5 rounded-2xl">
        {/* Top search & view toggle row */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search shared files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/70 border border-slate-700/60 rounded-xl pl-9 pr-8 py-2 text-base sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-0.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex-shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid view"
              className={`p-1.5 sm:p-2 rounded-lg transition-all active:scale-95 ${
                viewMode === 'grid'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List view"
              className={`p-1.5 sm:p-2 rounded-lg transition-all active:scale-95 ${
                viewMode === 'list'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Categories Horizontal Scroll Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x -mx-1 px-1">
          {[
            { id: 'all', label: 'All Files' },
            { id: 'image', label: 'Photos' },
            { id: 'video', label: 'Videos' },
            { id: 'audio', label: 'Audio' },
            { id: 'document', label: 'Docs' },
            { id: 'code', label: 'Code' },
            { id: 'archive', label: 'Archives' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all active:scale-95 flex-shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-teal-500 text-white shadow-sm shadow-teal-500/30 font-semibold'
                  : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Files Content */}
      {filteredFiles.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 sm:p-12 text-center text-slate-400">
          <FileIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-slate-600 animate-pulse-subtle" />
          <h3 className="text-sm sm:text-base font-semibold text-slate-300">
            {searchQuery ? 'No files match your search' : 'No files shared yet'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Try changing your search term or category filter.'
              : 'Upload files above to instantly make them accessible to any device on your Wi-Fi.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="group glass-card glass-card-hover rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden relative shadow-md"
            >
              {/* Top Row: Icon & Actions */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 shadow-inner flex-shrink-0">
                    {getCategoryIcon(file.category)}
                  </div>

                  <div className="flex items-center gap-1">
                    {isPreviewable(file.category) && (
                      <button
                        onClick={() => onPreview(file)}
                        title="Preview file"
                        aria-label="Preview file"
                        className="p-2 rounded-xl text-slate-400 hover:text-teal-300 active:scale-95 hover:bg-teal-500/10 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleCopyLink(file)}
                      title="Copy download link"
                      aria-label="Copy download link"
                      className="p-2 rounded-xl text-slate-400 hover:text-teal-300 active:scale-95 hover:bg-teal-500/10 transition-colors"
                    >
                      {copiedId === file.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => onDelete(file.id)}
                      title="Delete file"
                      aria-label="Delete file"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 active:scale-95 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* File Name & Preview Image Thumbnail (if image) */}
                {file.category === 'image' && (
                  <div
                    onClick={() => onPreview(file)}
                    className="cursor-pointer mb-2.5 w-full h-32 sm:h-36 rounded-xl overflow-hidden bg-slate-950/60 border border-slate-800 flex items-center justify-center group-hover:border-teal-500/30 transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={file.previewUrl}
                      alt={file.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}

                <h4
                  title={file.originalName}
                  className="font-semibold text-xs sm:text-sm text-slate-100 truncate group-hover:text-teal-300 transition-colors"
                >
                  {file.originalName}
                </h4>

                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-400 mt-1">
                  <span className="font-mono">{formatBytes(file.size)}</span>
                  <span>•</span>
                  <span className="truncate">{formatDate(file.uploadedAt)}</span>
                </div>
              </div>

              {/* Bottom Metadata & Download Button */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 min-w-0">
                  {getDeviceIcon(file.uploaderDevice)}
                  <span className="truncate max-w-[90px] sm:max-w-[120px]">{file.uploaderDevice}</span>
                </div>

                <a
                  href={file.downloadUrl}
                  download={file.originalName}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-600/20 active:scale-95 transition-all flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-slate-800/60 shadow-md">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-3 hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 flex-shrink-0">
                  {getCategoryIcon(file.category)}
                </div>

                <div className="min-w-0 flex-1">
                  <h4
                    title={file.originalName}
                    className="text-xs sm:text-sm font-semibold text-slate-200 truncate hover:text-teal-300 transition-colors"
                  >
                    {file.originalName}
                  </h4>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                    <span className="font-mono">{formatBytes(file.size)}</span>
                    <span>•</span>
                    <span className="truncate">{formatDate(file.uploadedAt)}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:flex items-center gap-1">
                      {getDeviceIcon(file.uploaderDevice)}
                      <span className="truncate max-w-[100px]">{file.uploaderDevice}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {isPreviewable(file.category) && (
                  <button
                    onClick={() => onPreview(file)}
                    title="Preview"
                    aria-label="Preview"
                    className="p-2 rounded-xl text-slate-400 hover:text-teal-300 active:scale-95 hover:bg-teal-500/10 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleCopyLink(file)}
                  title="Copy link"
                  aria-label="Copy link"
                  className="p-2 rounded-xl text-slate-400 hover:text-teal-300 active:scale-95 hover:bg-teal-500/10 transition-colors"
                >
                  {copiedId === file.id ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <a
                  href={file.downloadUrl}
                  download={file.originalName}
                  title="Download"
                  aria-label="Download"
                  className="p-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  onClick={() => onDelete(file.id)}
                  title="Delete"
                  aria-label="Delete"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 active:scale-95 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
