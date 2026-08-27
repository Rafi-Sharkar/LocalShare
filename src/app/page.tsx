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
import { FileMetadata, SharedText, StorageStats as StatsType, Device, normalizeMac, isValidMac, generateClientMac } from '@/lib/types';

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

  /**
   * Get or create a stable client MAC stored in localStorage.
   * This is called once on init and used for all API requests.
   */
  const getStableClientMac = useCallback((): string => {
    if (typeof window === 'undefined') return '';
    let mac = localStorage.getItem('localshare_device_mac') || '';
    if (!mac || !isValidMac(mac)) {
      mac = generateClientMac();
      localStorage.setItem('localshare_device_mac', mac);
    }
    myMacRef.current = mac;
    return mac;
  }, []);

  // Device Registration & Heartbeat
  const syncDevicePresence = useCallback(async (customName?: string) => {
    try {
      const mac = getStableClientMac();
      if (!mac) return;

      const storedName = customName || (typeof window !== 'undefined' ? localStorage.getItem('localshare_device_name') || '' : '');

      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-mac': mac,
        },
        body: JSON.stringify({ mac, name: storedName }),
      });

      const data = await res.json();
      if (data.success && data.myDevice) {
        setMyDevice({
          ...data.myDevice,
          mac, // Always use our client-side stable MAC
          isCurrentDevice: true,
        });
        if (typeof window !== 'undefined' && data.myDevice.name) {
          localStorage.setItem('localshare_device_name', data.myDevice.name);
        }
        if (data.activeDevices) {
          const myCleanMac = normalizeMac(mac).toUpperCase();
          setActiveDevices(
            data.activeDevices.map((d: Device) => ({
              ...d,
              isCurrentDevice: normalizeMac(d.mac).toUpperCase() === myCleanMac,
            }))
          );
        }
        if (data.serverMac) {
          setServerMac(data.serverMac);
        }
      }
    } catch {
      // offline or server restarting
    }
  }, [getStableClientMac]);

  const handleUpdateDeviceName = async (newName: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('localshare_device_name', newName);
    }
    await syncDevicePresence(newName);
  };

  // Helper to get MAC header for API requests
  const getMacHeaders = useCallback((): Record<string, string> => {
    const mac = myMacRef.current || (typeof window !== 'undefined' ? localStorage.getItem('localshare_device_mac') || '' : '');
    return mac ? { 'x-device-mac': mac } : {};
  }, []);

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
      const res = await fetch('/api/files', { headers: getMacHeaders() });
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
        setStats(data.stats);
      }
    } catch {
      // ignore
    }
  }, [getMacHeaders]);

  // Fetch Shared Texts with MAC access header
  const fetchTexts = useCallback(async () => {
    try {
      const res = await fetch('/api/texts', { headers: getMacHeaders() });
      const data = await res.json();
      if (data.success) {
        setTexts(data.texts);
      }
    } catch {
      // ignore
    }
  }, [getMacHeaders]);

  // Initialize & Setup SSE Listener
  useEffect(() => {
    // Ensure stable client MAC is created before any API calls
    getStableClientMac();

    syncDevicePresence();
    fetchNetworkInfo();
    fetchFiles();
    fetchTexts();

    // Periodic heartbeat to refresh device presence every 30 seconds
    const heartbeatInterval = setInterval(() => {
      syncDevicePresence();
    }, 30000);

    // Setup Server-Sent Events listener with client MAC as query param
    const clientMac = myMacRef.current || localStorage.getItem('localshare_device_mac') || '';
    const sseUrl = clientMac ? `/api/events?mac=${encodeURIComponent(clientMac)}` : '/api/events';
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const currentMac = myMacRef.current ? normalizeMac(myMacRef.current).toUpperCase() : '';

        if (payload.type === 'device:updated' && payload.data) {
          if (payload.data.activeDevices) {
            // Mark isCurrentDevice on all devices using our client MAC
            setActiveDevices(
              payload.data.activeDevices.map((d: Device) => ({
                ...d,
                isCurrentDevice: currentMac ? normalizeMac(d.mac).toUpperCase() === currentMac : false,
              }))
            );
          }
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
  }, [getStableClientMac, syncDevicePresence, fetchNetworkInfo, fetchFiles, fetchTexts, showToast]);

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
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE', headers: getMacHeaders() });
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
    const res = await fetch('/api/texts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getMacHeaders(),
      },
      body: JSON.stringify({
        content,
        title,
        creatorMac: myMacRef.current || myDevice?.mac,
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
      const res = await fetch(`/api/texts?id=${id}`, { method: 'DELETE', headers: getMacHeaders() });
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
