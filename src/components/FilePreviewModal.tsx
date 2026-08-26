'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  FileText,
  Music,
  Loader2,
} from 'lucide-react';
import { FileMetadata, formatBytes } from '@/lib/types';

interface FilePreviewModalProps {
  file: FileMetadata | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
}) => {
  const [textContent, setTextContent] = useState<string>('');
  const [loadingText, setLoadingText] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!file) return;

    if (file.category === 'code' || file.category === 'document' || file.mimeType.startsWith('text/')) {
      setLoadingText(true);
      fetch(file.previewUrl)
        .then((res) => res.text())
        .then((data) => {
          setTextContent(data);
          setLoadingText(false);
        })
        .catch(() => {
          setTextContent('Failed to load file contents.');
          setLoadingText(false);
        });
    } else {
      setTextContent('');
    }
  }, [file]);

  if (!file) return null;

  const handleCopyContent = async () => {
    if (!textContent) return;
    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="min-w-0 pr-2 sm:pr-4 flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-white truncate">
              {file.originalName}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 font-mono mt-0.5 truncate">
              {formatBytes(file.size)} • {file.mimeType}
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <a
              href={file.downloadUrl}
              download={file.originalName}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-600/20 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 flex items-center justify-center bg-slate-950/40">
          {/* IMAGE */}
          {file.category === 'image' && (
            <div className="max-h-[65vh] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.previewUrl}
                alt={file.originalName}
                className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>
          )}

          {/* VIDEO */}
          {file.category === 'video' && (
            <div className="w-full max-w-3xl rounded-xl overflow-hidden bg-black shadow-lg">
              <video
                controls
                autoPlay
                playsInline
                className="w-full max-h-[60vh]"
                src={file.previewUrl}
              >
                Your browser does not support HTML5 video playback.
              </video>
            </div>
          )}

          {/* AUDIO */}
          {file.category === 'audio' && (
            <div className="w-full max-w-md p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center shadow-xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-amber-500/20">
                <Music className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
              </div>
              <p className="font-semibold text-slate-200 text-xs sm:text-sm mb-3 sm:mb-4 truncate">
                {file.originalName}
              </p>
              <audio controls className="w-full" src={file.previewUrl}>
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {/* PDF */}
          {file.category === 'pdf' && (
            <div className="w-full h-[60vh] rounded-xl overflow-hidden border border-slate-800 bg-white">
              <iframe
                src={file.previewUrl}
                className="w-full h-full"
                title={file.originalName}
              />
            </div>
          )}

          {/* CODE / TEXT */}
          {(file.category === 'code' || file.category === 'document' || file.mimeType.startsWith('text/')) && (
            <div className="w-full h-[60vh] flex flex-col rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400">
                <span>Text Viewer</span>
                <button
                  onClick={handleCopyContent}
                  className="flex items-center gap-1 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xs font-semibold"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-auto p-3.5 sm:p-4 font-mono text-xs sm:text-sm text-slate-300 leading-relaxed select-text">
                {loadingText ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap font-mono">{textContent}</pre>
                )}
              </div>
            </div>
          )}

          {/* OTHER UNPREVIEWABLE FORMATS */}
          {!['image', 'video', 'audio', 'pdf', 'code', 'document'].includes(file.category) &&
            !file.mimeType.startsWith('text/') && (
              <div className="text-center p-6 sm:p-8">
                <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500 mx-auto mb-3" />
                <h4 className="text-sm sm:text-base font-semibold text-slate-300">
                  Preview not available for this file type
                </h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  You can download it directly to view on your device.
                </p>
                <a
                  href={file.downloadUrl}
                  download={file.originalName}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold active:scale-95 shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </a>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
