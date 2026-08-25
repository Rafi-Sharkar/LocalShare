'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { QRCodeModal } from '@/components/QRCodeModal';
import { FileUploader } from '@/components/FileUploader';
import { FileList } from '@/components/FileList';
import { FilePreviewModal } from '@/components/FilePreviewModal';
import { TextShare } from '@/components/TextShare';
import { StorageStats } from '@/components/StorageStats';
import { Toast, ToastMessage } from '@/components/Toast';
import { FileMetadata, SharedText, StorageStats as StatsType } from '@/lib/types';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'files' | 'text'>('files');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);

  // Network info
  const [networkInfo, setNetworkInfo] = useState<{
    port: string;
    primaryIp: string;
    primaryUrl: string;
    interfaces: Array<{
      name: string;
      address: string;
      url: string;
      isRecommended?: boolean;
    }>;
  }>({
    port: '3000',
    primaryIp: '127.0.0.1',
    primaryUrl: 'http://localhost:3000',
    interfaces: [],
  });

  // Data states
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [texts, setTexts] = useState<SharedText[]>([]);
  const [stats, setStats] = useState<StatsType | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helper
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Math.random().toString(36).substring(7);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch Network Info
  const fetchNetworkInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/network-info');
      const data = await res.json();
      if (data.success) {
        setNetworkInfo({
          port: data.port,
          primaryIp: data.primaryIp,
          primaryUrl: data.primaryUrl,
          interfaces: data.interfaces || [],
        });
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch Files & Stats
  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
        setStats(data.stats);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch Shared Texts
  const fetchTexts = useCallback(async () => {
    try {
      const res = await fetch('/api/texts');
      const data = await res.json();
      if (data.success) {
        setTexts(data.texts);
      }
    } catch {
      // ignore
    }
  }, []);

  // Real-time SSE Connection
  useEffect(() => {
    fetchNetworkInfo();
    fetchFiles();
    fetchTexts();

    // Setup Server-Sent Events listener
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (
          payload.type === 'file:created' ||
          payload.type === 'file:deleted' ||
          payload.type === 'storage:updated'
        ) {
          fetchFiles();
        }
        if (
          payload.type === 'text:created' ||
          payload.type === 'text:deleted'
        ) {
          fetchTexts();
        }
      } catch {
        // Heartbeat or malformed
      }
    };

    return () => {
      eventSource.close();
    };
  }, [fetchNetworkInfo, fetchFiles, fetchTexts]);

  // Handle Theme change
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // File Deletion
  const handleDeleteFile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shared file?')) return;
    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('File deleted successfully', 'success');
        fetchFiles();
      } else {
        showToast('Failed to delete file', 'error');
      }
    } catch {
      showToast('Error deleting file', 'error');
    }
  };

  // Text Actions
  const handleAddText = async (content: string, title?: string) => {
    const res = await fetch('/api/texts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, title }),
    });
    const data = await res.json();
    if (data.success) {
      fetchTexts();
    } else {
      throw new Error(data.error || 'Failed to share text');
    }
  };

  const handleDeleteText = async (id: string) => {
    try {
      const res = await fetch(`/api/texts?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Note deleted', 'info');
        fetchTexts();
      }
    } catch {
      showToast('Error deleting note', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <Navbar
        primaryUrl={networkInfo.primaryUrl}
        primaryIp={networkInfo.primaryIp}
        port={networkInfo.port}
        isOnline={true}
        onOpenQR={() => setIsQRModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        fileCount={files.length}
        textCount={texts.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Storage Stats Banner */}
        <StorageStats stats={stats} />

        {/* Tab 1: Files Sharing */}
        {activeTab === 'files' && (
          <div className="space-y-6 animate-fade-in">
            <FileUploader
              onUploadSuccess={fetchFiles}
              showToast={showToast}
            />

            <FileList
              files={files}
              onDelete={handleDeleteFile}
              onPreview={(file) => setPreviewFile(file)}
              showToast={showToast}
            />
          </div>
        )}

        {/* Tab 2: Quick Notes / Clipboard Sharing */}
        {activeTab === 'text' && (
          <div className="animate-fade-in">
            <TextShare
              texts={texts}
              onAddText={handleAddText}
              onDeleteText={handleDeleteText}
              showToast={showToast}
            />
          </div>
        )}
      </main>

      {/* Modals & Overlays */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        interfaces={networkInfo.interfaces}
        primaryUrl={networkInfo.primaryUrl}
        port={networkInfo.port}
      />

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>LocalShare — High-speed peer-to-peer Wi-Fi file & text sharing</span>
          <span className="font-mono text-[11px] text-teal-400/80">
            Host: {networkInfo.primaryIp}:{networkInfo.port}
          </span>
        </div>
      </footer>
    </div>
  );
}
