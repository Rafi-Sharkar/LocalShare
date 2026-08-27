'use client';

import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Tablet,
  Copy,
  Check,
  X,
  Radio,
  Edit2,
  Save,
  Send,
  Plus,
  ShieldCheck,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { Device, isValidMac, normalizeMac } from '@/lib/types';

interface DeviceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  myDevice: Device | null;
  activeDevices: Device[];
  onUpdateDeviceName: (newName: string) => void;
  onSelectTargetDevice: (device: Device | { mac: string; name: string }) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  serverMac?: string;
}

export const DeviceManagerModal: React.FC<DeviceManagerModalProps> = ({
  isOpen,
  onClose,
  myDevice,
  activeDevices,
  onUpdateDeviceName,
  onSelectTargetDevice,
  showToast,
  serverMac,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(myDevice?.name || '');
  const [copiedMac, setCopiedMac] = useState<string | null>(null);

  // Manual custom MAC input state
  const [customMacInput, setCustomMacInput] = useState('');
  const [customNameInput, setCustomNameInput] = useState('');

  if (!isOpen) return null;

  const handleCopyMac = async (mac: string) => {
    try {
      await navigator.clipboard.writeText(mac);
      setCopiedMac(mac);
      showToast(`Copied MAC address: ${mac}`, 'success');
      setTimeout(() => setCopiedMac(null), 2000);
    } catch {
      showToast('Failed to copy MAC', 'error');
    }
  };

  const handleSaveName = () => {
    if (!editedName.trim()) return;
    onUpdateDeviceName(editedName.trim());
    setIsEditingName(false);
    showToast('Device name updated!', 'success');
  };

  const handleSendToManualMac = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidMac(customMacInput)) {
      showToast('Please enter a valid MAC address (e.g. AA:BB:CC:DD:EE:FF)', 'error');
      return;
    }
    const clean = normalizeMac(customMacInput);
    onSelectTargetDevice({
      mac: clean,
      name: customNameInput.trim() || `Device (${clean.slice(-5)})`,
    });
    showToast(`Target set to MAC: ${clean}`, 'success');
    onClose();
  };

  const getDeviceIcon = (os: string) => {
    if (/iPhone|Android/i.test(os)) {
      return <Smartphone className="w-5 h-5 text-purple-400" />;
    }
    if (/iPad/i.test(os)) {
      return <Tablet className="w-5 h-5 text-indigo-400" />;
    }
    return <Laptop className="w-5 h-5 text-teal-400" />;
  };

  const otherDevices = activeDevices.filter(
    (d) => myDevice?.mac && d.mac !== myDevice.mac
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-xl bg-slate-900/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden glass-card flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Device & 1-to-1 Sharing
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  MAC Target
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Identify devices and share securely with a specific MAC address
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Section 1: This Device Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-950/40 via-slate-800/50 to-slate-900/60 border border-teal-500/20 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  This Device (You)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                IP: {myDevice?.ip || '127.0.0.1'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Name & OS */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 border border-white/5">
                  {getDeviceIcon(myDevice?.os || '')}
                </div>
                <div>
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="px-2.5 py-1 text-sm bg-slate-950 border border-teal-500/50 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                        placeholder="Device name..."
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        className="p-1.5 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {myDevice?.name || 'Local Device'}
                      </span>
                      <button
                        onClick={() => {
                          setEditedName(myDevice?.name || '');
                          setIsEditingName(true);
                        }}
                        className="text-slate-400 hover:text-teal-300 transition-colors"
                        title="Rename device"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-slate-400">{myDevice?.os || 'Local Web Client'}</p>
                </div>
              </div>

              {/* MAC Address Badge & Copy */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end bg-slate-950/70 px-3 py-1.5 rounded-xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                    My MAC Address
                  </span>
                  <span className="font-mono text-xs font-bold text-teal-300">
                    {myDevice?.mac || '00:00:00:00:00:00'}
                  </span>
                </div>
                <button
                  onClick={() => myDevice?.mac && handleCopyMac(myDevice.mac)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Copy MAC Address"
                >
                  {copiedMac === myDevice?.mac ? (
                    <Check className="w-4 h-4 text-teal-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Discovered LAN Devices */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">
                  Active LAN Devices ({otherDevices.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400">Auto-discovered via Wi-Fi/LAN</span>
            </div>

            {otherDevices.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-800/20 border border-white/5 text-slate-400">
                <ShieldCheck className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No other devices active right now.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Open LocalShare on your phone, tablet, or another laptop connected to the same Wi-Fi network!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {otherDevices.map((device) => (
                  <div
                    key={device.mac}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-900 border border-white/5">
                        {getDeviceIcon(device.os)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">
                            {device.name}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              device.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                            }`}
                          />
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                          <span>{device.mac}</span>
                          <span>•</span>
                          <span>{device.ip}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyMac(device.mac)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Copy MAC"
                      >
                        {copiedMac === device.mac ? (
                          <Check className="w-3.5 h-3.5 text-teal-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          onSelectTargetDevice(device);
                          showToast(`Selected ${device.name} for 1-to-1 transfer`, 'success');
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-indigo-600 text-white text-xs font-medium hover:opacity-90 transition-all shadow-md shadow-teal-500/20"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send Direct</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Manual MAC Address Target */}
          <div className="pt-2 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Target Any Device by MAC Address
            </h3>

            <form onSubmit={handleSendToManualMac} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customMacInput}
                  onChange={(e) => setCustomMacInput(e.target.value)}
                  placeholder="Target MAC (e.g. AA:BB:CC:DD:EE:FF)"
                  className="px-3 py-2 text-xs font-mono bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
                <input
                  type="text"
                  value={customNameInput}
                  onChange={(e) => setCustomNameInput(e.target.value)}
                  placeholder="Nickname (e.g. Rafi's Phone)"
                  className="px-3 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={!customMacInput}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-teal-300 border border-teal-500/30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Set as 1-to-1 Recipient Target</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/70 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
          <span>LocalShare 1-to-1 Direct MAC Protocol</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
