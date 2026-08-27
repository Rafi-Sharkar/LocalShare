'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Send,
  Copy,
  Check,
  Trash2,
  Clipboard,
  Laptop,
  Smartphone,
  Tablet,
  Sparkles,
  Lock,
  Globe,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { SharedText, Device, isValidMac, normalizeMac } from '@/lib/types';

interface TextShareProps {
  texts: SharedText[];
  onAddText: (
    content: string,
    title?: string,
    options?: { targetMac?: string; targetName?: string }
  ) => Promise<void>;
  onDeleteText: (id: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  myDevice: Device | null;
  activeDevices: Device[];
  selectedTargetDevice?: { mac: string; name: string } | null;
}

export const TextShare: React.FC<TextShareProps> = ({
  texts,
  onAddText,
  onDeleteText,
  showToast,
  myDevice,
  activeDevices,
  selectedTargetDevice,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Local target selector state
  const [targetRecipient, setTargetRecipient] = useState<{ mac: string; name: string } | null>(
    selectedTargetDevice || null
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [customMacInput, setCustomMacInput] = useState('');
  const [customNameInput, setCustomNameInput] = useState('');

  const myCleanMac = myDevice?.mac ? normalizeMac(myDevice.mac).toUpperCase() : '';
  const otherDevices = activeDevices.filter(
    (d) => myCleanMac && normalizeMac(d.mac).toUpperCase() !== myCleanMac
  );

  // Sync local targetRecipient when parent's selectedTargetDevice changes
  useEffect(() => {
    setTargetRecipient(selectedTargetDevice || null);
  }, [selectedTargetDevice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddText(content, title, {
        targetMac: targetRecipient?.mac,
        targetName: targetRecipient?.name,
      });
      setContent('');
      setTitle('');
      const targetDesc = targetRecipient ? `to ${targetRecipient.name}` : 'to everyone';
      showToast(`Note shared ${targetDesc}!`, 'success');
    } catch {
      showToast('Failed to share note', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setContent(text);
        showToast('Pasted from clipboard!', 'info');
      }
    } catch {
      showToast('Please allow clipboard permission to paste directly.', 'error');
    }
  };

  const handleCopyText = async (text: SharedText) => {
    try {
      await navigator.clipboard.writeText(text.content);
      setCopiedId(text.id);
      showToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('Failed to copy', 'error');
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

  const getDeviceIcon = (deviceStr?: string) => {
    if (!deviceStr) return <Laptop className="w-3.5 h-3.5 text-slate-400" />;
    if (/iPhone|Android/i.test(deviceStr)) {
      return <Smartphone className="w-3.5 h-3.5 text-slate-400" />;
    }
    if (/iPad/i.test(deviceStr)) {
      return <Tablet className="w-3.5 h-3.5 text-slate-400" />;
    }
    return <Laptop className="w-3.5 h-3.5 text-slate-400" />;
  };

  const handleApplyCustomMac = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidMac(customMacInput)) {
      showToast('Please enter a valid MAC address', 'error');
      return;
    }
    const clean = normalizeMac(customMacInput);
    setTargetRecipient({
      mac: clean,
      name: customNameInput.trim() || `Device (${clean.slice(-5)})`,
    });
    setIsPickerOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Create / Share Note Box */}
      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-3 sm:space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-white min-w-0">
            <Sparkles className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <span className="truncate">Share Text / Quick Note</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Recipient Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPickerOpen(!isPickerOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  targetRecipient
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                    : 'bg-slate-800/90 text-slate-200 border-white/5 hover:bg-slate-700'
                }`}
              >
                {targetRecipient ? (
                  <>
                    <Lock className="w-3 h-3 text-teal-400" />
                    <span className="max-w-[110px] truncate">{targetRecipient.name}</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3 text-cyan-400" />
                    <span>Public LAN</span>
                  </>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Recipient Popover */}
              {isPickerOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl z-50 glass-card animate-fade-in space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetRecipient(null);
                      setIsPickerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs ${
                      !targetRecipient ? 'bg-teal-500/20 text-teal-300 font-semibold' : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Everyone (Public LAN)</span>
                    </div>
                    {!targetRecipient && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                  </button>

                  <div className="border-t border-white/10 pt-2 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 px-1">
                      Target LAN Device (1-to-1)
                    </div>
                    {otherDevices.length === 0 ? (
                      <p className="text-[11px] text-slate-400 px-1 py-1 italic">
                        No other online devices found.
                      </p>
                    ) : (
                      otherDevices.map((d) => (
                        <button
                          key={d.mac}
                          type="button"
                          onClick={() => {
                            setTargetRecipient(d);
                            setIsPickerOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-xs ${
                            targetRecipient?.mac === d.mac
                              ? 'bg-teal-500/20 text-teal-300 font-semibold'
                              : 'text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <div className="text-left">
                            <p className="font-medium text-white truncate max-w-[130px]">{d.name}</p>
                            <p className="font-mono text-[10px] text-slate-400">{d.mac}</p>
                          </div>
                          {targetRecipient?.mac === d.mac && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-medium border border-white/5 shadow-sm transition-all flex-shrink-0"
            >
              <Clipboard className="w-3.5 h-3.5 text-teal-400" />
              <span>Paste</span>
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Title or note label (optional)..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-900/70 border border-slate-700/60 rounded-xl px-3.5 sm:px-4 py-2.5 text-base sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
        />

        <textarea
          rows={4}
          placeholder="Type or paste any link, text, code snippet, or Wi-Fi password to share instantly..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className="w-full bg-slate-900/70 border border-slate-700/60 rounded-2xl px-3.5 sm:px-4 py-3 text-base sm:text-sm font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 leading-relaxed resize-y"
        />

        <div className="flex items-center justify-between pt-1 gap-2">
          <div className="text-[11px] sm:text-xs text-slate-400 min-w-0 truncate">
            {targetRecipient ? (
              <span className="text-teal-300 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>1-to-1 for {targetRecipient.name} ({targetRecipient.mac.slice(-5)})</span>
              </span>
            ) : (
              <span>
                {content.length > 0 && `${content.length} chars • `}Public note
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold shadow-md shadow-teal-500/25 transition-all active:scale-95 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{isSubmitting ? 'Sharing...' : targetRecipient ? 'Send 1-to-1' : 'Share Note'}</span>
          </button>
        </div>
      </form>

      {/* Shared Text Snippets List */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wider px-1">
          Shared Notes & Clipboard ({texts.length})
        </h3>

        {texts.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 sm:p-10 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-600 animate-pulse-subtle" />
            <h4 className="text-sm font-medium text-slate-300">
              No notes shared yet
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Paste or type anything above to share it instantly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {texts.map((text) => (
              <div
                key={text.id}
                className="group glass-card glass-card-hover rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h4 className="font-semibold text-xs sm:text-sm text-slate-100 truncate">
                        {text.title || 'Untitled Note'}
                      </h4>
                      {text.isPrivate && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                          <Lock className="w-2.5 h-2.5" />
                          1-to-1
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleCopyText(text)}
                        title="Copy to clipboard"
                        aria-label="Copy to clipboard"
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all ${
                          copiedId === text.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {copiedId === text.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onDeleteText(text.id)}
                        title="Delete note"
                        aria-label="Delete note"
                        className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-rose-400 active:scale-95 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Text Content Box */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 font-mono text-xs sm:text-sm text-slate-300 whitespace-pre-wrap break-words max-h-48 overflow-y-auto leading-relaxed select-text">
                    {text.content}
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {getDeviceIcon(text.creatorDevice)}
                    <span className="truncate max-w-[120px]">
                      {text.creatorName || text.creatorDevice}
                    </span>
                    {text.targetName && (
                      <span className="text-teal-400/80 truncate">
                        ➔ {text.targetName}
                      </span>
                    )}
                  </div>
                  <span className="truncate flex-shrink-0">{formatDate(text.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
