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
  Lock,
  Globe,
  Radio,
  ChevronDown,
  Laptop,
  Smartphone,
  Tablet,
  Sparkles,
} from 'lucide-react';
import { formatBytes, Device, isValidMac, normalizeMac } from '@/lib/types';

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
  myDevice: Device | null;
  activeDevices: Device[];
  selectedTargetDevice?: { mac: string; name: string } | null;
  onClearTargetDevice?: () => void;
  onSelectTargetDevice?: (device: { mac: string; name: string } | null) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadSuccess,
  showToast,
  myDevice,
  activeDevices,
  selectedTargetDevice,
  onClearTargetDevice,
  onSelectTargetDevice,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [tasks, setTasks] = useState<FileUploadTask[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [customMacInput, setCustomMacInput] = useState('');
  const [customNameInput, setCustomNameInput] = useState('');

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
    newTasks.forEach((task) => uploadSingleFile(task));
  };

  const uploadSingleFile = (task: FileUploadTask) => {
    const formData = new FormData();
    formData.append('files', task.file);

    if (myDevice?.mac) {
      formData.append('uploaderMac', myDevice.mac);
      formData.append('uploaderName', myDevice.name);
    }

    if (selectedTargetDevice && selectedTargetDevice.mac) {
      formData.append('targetMac', selectedTargetDevice.mac);
      formData.append('targetName', selectedTargetDevice.name);
    }

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
        const targetDesc = selectedTargetDevice?.name
          ? `to ${selectedTargetDevice.name}`
          : 'publicly';
        showToast(`Uploaded "${task.file.name}" ${targetDesc}!`, 'success');
        onUploadSuccess();

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
    if (myDevice?.mac) {
      xhr.setRequestHeader('x-device-mac', myDevice.mac);
    }
    xhr.send(formData);
  };

  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const otherDevices = activeDevices.filter(
    (d) => myDevice?.mac && d.mac !== myDevice.mac
  );

  const handleApplyCustomMac = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidMac(customMacInput)) {
      showToast('Please enter a valid MAC address (e.g. AA:BB:CC:DD:EE:FF)', 'error');
      return;
    }
    const clean = normalizeMac(customMacInput);
    onSelectTargetDevice?.({
      mac: clean,
      name: customNameInput.trim() || `Device (${clean.slice(-5)})`,
    });
    setIsPickerOpen(false);
    showToast(`Target set to MAC: ${clean}`, 'success');
  };

  const getDeviceIcon = (os: string) => {
    if (/iPhone|Android/i.test(os)) {
      return <Smartphone className="w-3.5 h-3.5 text-purple-400" />;
    }
    if (/iPad/i.test(os)) {
      return <Tablet className="w-3.5 h-3.5 text-indigo-400" />;
    }
    return <Laptop className="w-3.5 h-3.5 text-teal-400" />;
  };

  return (
    <div className="w-full space-y-3">
      {/* Hidden file inputs */}
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

      {/* Target Recipient Selector Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-slate-900/80 border border-white/10 shadow-sm relative">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recipient:
          </span>

          {/* Recipient Dropdown Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                selectedTargetDevice
                  ? 'bg-gradient-to-r from-teal-500/20 to-indigo-500/20 text-teal-300 border-teal-500/40 shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-white border-white/10'
              }`}
            >
              {selectedTargetDevice ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-teal-400" />
                  <span>
                    Direct 1-to-1: <strong className="text-white">{selectedTargetDevice.name}</strong>
                  </span>
                  <span className="font-mono text-[10px] text-teal-400/80">
                    ({selectedTargetDevice.mac.slice(-5)})
                  </span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Everyone (Public LAN)</span>
                </>
              )}
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
            </button>

            {/* Recipient Selector Popover */}
            {isPickerOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 p-3 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl z-50 glass-card animate-fade-in space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Select Share Destination
                </div>

                {/* Option 1: Public LAN */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTargetDevice?.(null);
                    setIsPickerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                    !selectedTargetDevice
                      ? 'bg-teal-500/20 text-teal-300 font-semibold'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Everyone (Public LAN)</span>
                  </div>
                  {!selectedTargetDevice && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                </button>

                {/* Option 2: Active LAN devices */}
                <div className="border-t border-white/10 pt-2 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-1 flex items-center justify-between">
                    <span>Discovered Devices</span>
                    <span className="text-emerald-400">{otherDevices.length} online</span>
                  </div>

                  {otherDevices.length === 0 ? (
                    <p className="text-[11px] text-slate-400 px-2 py-1.5 italic">
                      No other devices active. You can enter a MAC address below.
                    </p>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {otherDevices.map((device) => {
                        const isSelected = selectedTargetDevice?.mac === device.mac;
                        return (
                          <button
                            key={device.mac}
                            type="button"
                            onClick={() => {
                              onSelectTargetDevice?.(device);
                              setIsPickerOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                              isSelected
                                ? 'bg-teal-500/20 text-teal-300 font-semibold'
                                : 'text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(device.os)}
                              <div className="text-left">
                                <p className="font-medium text-white truncate max-w-[130px]">
                                  {device.name}
                                </p>
                                <p className="font-mono text-[10px] text-slate-400">
                                  {device.mac}
                                </p>
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Option 3: Custom MAC input */}
                <div className="border-t border-white/10 pt-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-1 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-400" />
                    <span>Enter Custom MAC</span>
                  </div>
                  <form onSubmit={handleApplyCustomMac} className="space-y-1.5">
                    <input
                      type="text"
                      value={customMacInput}
                      onChange={(e) => setCustomMacInput(e.target.value)}
                      placeholder="e.g. AA:BB:CC:DD:EE:FF"
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-950 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={!customMacInput}
                      className="w-full py-1 px-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-xs font-medium text-white transition-colors"
                    >
                      Target this MAC
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {selectedTargetDevice ? (
            <div className="flex items-center gap-1.5 text-teal-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span>🔒 Only recipient MAC can view & download</span>
              {onClearTargetDevice && (
                <button
                  type="button"
                  onClick={() => onSelectTargetDevice?.(null)}
                  className="ml-1 text-slate-400 hover:text-rose-400 underline text-[11px]"
                >
                  Reset
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Visible to all devices on local Wi-Fi</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Upload Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-dashed transition-all duration-300 p-5 sm:p-9 text-center glass-card active:scale-[0.99] ${
          isDragging
            ? 'border-teal-400 bg-teal-500/10 scale-[1.01]'
            : selectedTargetDevice
            ? 'border-teal-500/50 hover:border-teal-400 bg-teal-950/10 hover:bg-teal-950/20'
            : 'border-slate-700/80 hover:border-teal-500/50 hover:bg-slate-900/40'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
          <div
            className={`p-3.5 sm:p-5 rounded-2xl transition-all duration-300 ${
              isDragging
                ? 'bg-teal-500 text-white scale-110 shadow-lg shadow-teal-500/30'
                : selectedTargetDevice
                ? 'bg-teal-600/20 text-teal-300 group-hover:scale-105'
                : 'bg-slate-800/80 text-teal-400 group-hover:bg-teal-500/20 group-hover:scale-105'
            }`}
          >
            {selectedTargetDevice ? (
              <Lock className="w-7 h-7 sm:w-10 sm:h-10 animate-pulse-subtle" />
            ) : (
              <UploadCloud className="w-7 h-7 sm:w-10 sm:h-10 animate-pulse-subtle" />
            )}
          </div>

          <div>
            <p className="text-base sm:text-lg font-semibold text-white">
              {isDragging
                ? 'Drop files right here'
                : selectedTargetDevice
                ? `Send Direct 1-to-1 File to ${selectedTargetDevice.name}`
                : 'Tap to select or drop files here'}
            </p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              {selectedTargetDevice
                ? `Secured for MAC: ${selectedTargetDevice.mac}`
                : 'Any file size, photos, videos, or documents over local Wi-Fi.'}
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
