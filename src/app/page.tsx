'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { QRCodeModal } from '@/components/QRCodeModal';
import { DeviceManagerModal } from '@/components/DeviceManagerModal';
import { FileUploader } from '@/components/FileUploader';
import { FileList } from '@/components/FileList';
import { FilePreviewModal } from '@/components/FilePreviewModal';
import { TextShare } from '@/components/TextShare';
import { StorageStats } from '@/components/StorageStats';
import { Toast, ToastMessage } from '@/components/Toast';
import { FileMetadata, SharedText, StorageStats as StatsType, Device, normalizeMac } from '@/lib/types';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'files' | 'text'>('files');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);

  // Device & 1-to-1 Sharing State
  const [myDevice, setMyDevice] = useState<Device | null>(null);
  const [serverMac, setServerMac] = useState<string>('');
  const [activeDevices, setActiveDevices] = useState<Device[]>([]);
  const [selectedTargetDevice, setSelectedTargetDevice] = useState<{
    mac: string;
    name: string;
  } | null>(null);

  const myMacRef = useRef<string>('');

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
      }, 4500);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Device Registration & Heartbeat
  const syncDevicePresence = useCallback(async (customName?: string) => {
    try {
      const storedMac = typeof window !== 'undefined' ? localStorage.getItem('localshare_device_mac') || '' : '';
      const storedName = customName || (typeof window !== 'undefined' ? localStorage.getItem('localshare_device_name') || '' : '');

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedMac) {
        headers['x-device-mac'] = storedMac;
      }

      const res = await fetch('/api/devices', {
        method: storedName || storedMac ? 'POST' : 'GET',
        headers,
        body: storedName || storedMac ? JSON.stringify({ mac: storedMac, name: storedName }) : undefined,
      });

      const data = await res.json();
      if (data.success && data.myDevice) {
        setMyDevice(data.myDevice);
        myMacRef.current = data.myDevice.mac;
        if (typeof window !== 'undefined') {
          localStorage.setItem('localshare_device_mac', data.myDevice.mac);
          if (data.myDevice.name) {
            localStorage.setItem('localshare_device_name', data.myDevice.name);
          }
        }
        if (data.activeDevices) {
          setActiveDevices(data.activeDevices);
        }
        if (data.serverMac) {
          setServerMac(data.serverMac);
        }
      }
    } catch {
      // offline or server restarting
    }
  }, []);

  const handleUpdateDeviceName = async (newName: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('localshare_device_name', newName);
    }
    await syncDevicePresence(newName);
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

  // Fetch Files & Stats with MAC access header
  const fetchFiles = useCallback(async () => {
    try {
      const storedMac = myMacRef.current || (typeof window !== 'undefined' ? localStorage.getItem('localshare_device_mac') || '' : '');
      const headers: Record<string, string> = {};
      if (storedMac) headers['x-device-mac'] = storedMac;

      const res = await fetch('/api/files', { headers });
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
        setStats(data.stats);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch Shared Texts with MAC access header
  const fetchTexts = useCallback(async () => {
    try {
      const storedMac = myMacRef.current || (typeof window !== 'undefined' ? localStorage.getItem('localshare_device_mac') || '' : '');
      const headers: Record<string, string> = {};
      if (storedMac) headers['x-device-mac'] = storedMac;

      const res = await fetch('/api/texts', { headers });
      const data = await res.json();
      if (data.success) {
        setTexts(data.texts);
      }
    } catch {
      // ignore
    }
  }, []);

  // Initialize & Setup SSE Listener
  useEffect(() => {
    syncDevicePresence();
    fetchNetworkInfo();
    fetchFiles();
    fetchTexts();

    // Periodic heartbeat to refresh device list every 12 seconds
    const heartbeatInterval = setInterval(() => {
      syncDevicePresence();
    }, 12000);

    // Setup Server-Sent Events listener
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === 'device:updated') {
          syncDevicePresence();
        }

        if (
          payload.type === 'file:created' ||
          payload.type === 'file:deleted' ||
          payload.type === 'storage:updated'
        ) {
          fetchFiles();

          // Check if newly created file was targeted to this device
          if (payload.type === 'file:created' && payload.data) {
            const file = payload.data as FileMetadata;
            const currentMac = myMacRef.current ? normalizeMac(myMacRef.current).toUpperCase() : '';
            const targetMac = file.targetMac ? normalizeMac(file.targetMac).toUpperCase() : '';
            const uploaderMac = file.uploaderMac ? normalizeMac(file.uploaderMac).toUpperCase() : '';

            if (file.isPrivate && targetMac === currentMac && uploaderMac !== currentMac) {
              showToast(
                `🔔 Direct 1-to-1 file received from ${file.uploaderName || file.uploaderDevice}: "${file.originalName}"`,
                'success'
              );
            }
          }
        }

        if (
          payload.type === 'text:created' ||
          payload.type === 'text:deleted'
        ) {
          fetchTexts();

          if (payload.type === 'text:created' && payload.data) {
            const text = payload.data as SharedText;
            const currentMac = myMacRef.current ? normalizeMac(myMacRef.current).toUpperCase() : '';
            const targetMac = text.targetMac ? normalizeMac(text.targetMac).toUpperCase() : '';
            const creatorMac = text.creatorMac ? normalizeMac(text.creatorMac).toUpperCase() : '';

            if (text.isPrivate && targetMac === currentMac && creatorMac !== currentMac) {
              showToast(
                `💬 Direct note received from ${text.creatorName || text.creatorDevice}!`,
                'info'
              );
            }
          }
        }
      } catch {
        // Heartbeat or malformed
      }
    };

    return () => {
      clearInterval(heartbeatInterval);
      eventSource.close();
    };
  }, [syncDevicePresence, fetchNetworkInfo, fetchFiles, fetchTexts, showToast]);

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
      const storedMac = myDevice?.mac || '';
      const headers: Record<string, string> = {};
      if (storedMac) headers['x-device-mac'] = storedMac;

      const res = await fetch(`/api/files/${id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (data.success) {
        showToast('File deleted successfully', 'success');
        fetchFiles();
      } else {
        showToast(data.error || 'Failed to delete file', 'error');
      }
    } catch {
      showToast('Error deleting file', 'error');
    }
  };

  // Text Actions
  const handleAddText = async (
    content: string,
    title?: string,
    options?: { targetMac?: string; targetName?: string }
  ) => {
    const storedMac = myDevice?.mac || '';
    const res = await fetch('/api/texts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(storedMac ? { 'x-device-mac': storedMac } : {}),
      },
      body: JSON.stringify({
        content,
        title,
        creatorMac: myDevice?.mac,
        creatorName: myDevice?.name,
        targetMac: options?.targetMac,
        targetName: options?.targetName,
      }),
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
        onOpenDeviceManager={() => setIsDeviceModalOpen(true)}
        myDevice={myDevice}
        activeDevicesCount={activeDevices.length}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        fileCount={files.length}
        textCount={texts.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
        {/* Storage Stats Banner */}
        <StorageStats stats={stats} />

        {/* Tab 1: Files Sharing */}
        {activeTab === 'files' && (
          <div className="space-y-5 sm:space-y-6 animate-fade-in">
            <FileUploader
              onUploadSuccess={fetchFiles}
              showToast={showToast}
              myDevice={myDevice}
              activeDevices={activeDevices}
              selectedTargetDevice={selectedTargetDevice}
              onClearTargetDevice={() => setSelectedTargetDevice(null)}
              onSelectTargetDevice={(d) => setSelectedTargetDevice(d)}
            />

            <FileList
              files={files}
              onDelete={handleDeleteFile}
              onPreview={(file) => setPreviewFile(file)}
              showToast={showToast}
              myDevice={myDevice}
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
              myDevice={myDevice}
              activeDevices={activeDevices}
              selectedTargetDevice={selectedTargetDevice}
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

      <DeviceManagerModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        myDevice={myDevice}
        activeDevices={activeDevices}
        onUpdateDeviceName={handleUpdateDeviceName}
        onSelectTargetDevice={(target) => setSelectedTargetDevice(target)}
        showToast={showToast}
        serverMac={serverMac}
      />

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Footer */}
      <footer className="border-t border-white/5 py-4 sm:py-6 text-center text-xs text-slate-500 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>LocalShare — High-speed peer-to-peer 1-to-1 Wi-Fi file & text sharing</span>
          <span className="font-mono text-[11px] text-teal-400/80">
            Host: {networkInfo.primaryIp}:{networkInfo.port} {serverMac ? `• MAC: ${serverMac}` : ''}
          </span>
        </div>
      </footer>
    </div>
  );
}
