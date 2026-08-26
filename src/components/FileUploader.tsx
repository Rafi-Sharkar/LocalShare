'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  Image,
  FolderOpen,
} from 'lucide-react';
import { formatBytes } from '@/lib/types';

interface FileUploadTask {
  id: string;
  file: globalThis.File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

interface FileUploaderProps {
  onUploadSuccess: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadSuccess,
  showToast,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [tasks, setTasks] = useState<FileUploadTask[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (mediaInputRef.current) mediaInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const addFilesToQueue = (files: globalThis.File[]) => {
    const newTasks: FileUploadTask[] = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'pending',
    }));

    setTasks((prev) => [...prev, ...newTasks]);
    // Upload files
    newTasks.forEach((task) => uploadSingleFile(task));
  };

  const uploadSingleFile = (task: FileUploadTask) => {
    const formData = new FormData();
    formData.append('files', task.file);

    const xhr = new XMLHttpRequest();

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'uploading' } : t))
    );

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, progress: percent } : t))
        );
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, progress: 100, status: 'completed' } : t
          )
        );
        showToast(`Uploaded "${task.file.name}" successfully!`, 'success');
        onUploadSuccess();

        // Auto remove completed task after 3 seconds
        setTimeout(() => {
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
        }, 3000);
      } else {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, status: 'error', errorMessage: 'Upload failed' }
              : t
          )
        );
        showToast(`Failed to upload "${task.file.name}"`, 'error');
      }
    });

    xhr.addEventListener('error', () => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: 'error', errorMessage: 'Network error' }
            : t
        )
      );
      showToast(`Network error while uploading "${task.file.name}"`, 'error');
    });

    xhr.open('POST', '/api/files');
    xhr.send(formData);
  };

  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return (
    <div className="w-full">
      {/* Hidden file inputs for specialized mobile triggers */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Main Upload Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-dashed transition-all duration-300 p-5 sm:p-10 text-center glass-card active:scale-[0.99] ${
          isDragging
            ? 'border-teal-400 bg-teal-500/10 scale-[1.01]'
            : 'border-slate-700/80 hover:border-teal-500/50 hover:bg-slate-900/40'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
          <div
            className={`p-3.5 sm:p-5 rounded-2xl transition-all duration-300 ${
              isDragging
                ? 'bg-teal-500 text-white scale-110 shadow-lg shadow-teal-500/30'
                : 'bg-slate-800/80 text-teal-400 group-hover:bg-teal-500/20 group-hover:scale-105'
            }`}
          >
            <UploadCloud className="w-7 h-7 sm:w-10 sm:h-10 animate-pulse-subtle" />
          </div>

          <div>
            <p className="text-base sm:text-lg font-semibold text-white">
              {isDragging ? 'Drop files right here' : 'Tap to select or drop files here'}
            </p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Any file size, photos, videos, or documents over local Wi-Fi.
            </p>
          </div>

          {/* Mobile Quick Action Buttons (Photos, Camera, Browse) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-2 pt-1 sm:pt-2 w-full max-w-sm"
          >
            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-medium border border-slate-700/60 shadow-sm transition-all"
            >
              <Image className="w-3.5 h-3.5 text-pink-400" />
              <span>Photos</span>
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-medium border border-slate-700/60 shadow-sm transition-all"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Camera</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-medium border border-slate-700/60 shadow-sm transition-all"
            >
              <FolderOpen className="w-3.5 h-3.5 text-teal-400" />
              <span>Browse</span>
            </button>
          </div>

          <div className="hidden sm:flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-400">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/60">
              ⚡ High-speed LAN transfer
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/60">
              📂 Batch upload supported
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/60">
              🔒 100% Private local network
            </span>
          </div>
        </div>
      </div>

      {/* Active Upload Tasks list */}
      {tasks.length > 0 && (
        <div className="mt-3 space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-3 sm:p-4 rounded-xl bg-slate-900/95 border border-slate-800 flex items-center gap-2.5 sm:gap-3 shadow-md animate-slide-up"
            >
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 flex-shrink-0">
                <File className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-200 truncate pr-2">
                    {task.file.name}
                  </span>
                  <span className="text-slate-400 font-mono flex-shrink-0 text-[11px]">
                    {formatBytes(task.file.size)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      task.status === 'error'
                        ? 'bg-rose-500'
                        : task.status === 'completed'
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-teal-400 to-cyan-500'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 mt-1">
                  <span>
                    {task.status === 'uploading' && `Uploading... ${task.progress}%`}
                    {task.status === 'completed' && 'Upload completed!'}
                    {task.status === 'error' && (task.errorMessage || 'Failed')}
                    {task.status === 'pending' && 'Queued...'}
                  </span>
                </div>
              </div>

              <div className="flex items-center flex-shrink-0">
                {task.status === 'uploading' && (
                  <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                )}
                {task.status === 'completed' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                {task.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <button
                  onClick={() => removeTask(task.id)}
                  aria-label="Remove upload item"
                  className="ml-1 p-2 text-slate-400 hover:text-white active:scale-95 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
