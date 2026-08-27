export interface Device {
  mac: string;
  ip: string;
  name: string;
  os: string;
  userAgent?: string;
  lastSeen: string;
  isOnline: boolean;
  isCurrentDevice?: boolean;
}

export interface FileMetadata {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  category: 'image' | 'video' | 'audio' | 'document' | 'pdf' | 'code' | 'archive' | 'other';
  uploadedAt: string;
  uploaderIp: string;
  uploaderDevice: string;
  uploaderMac?: string;
  uploaderName?: string;
  targetMac?: string; // MAC address of recipient or undefined/'all' for public
  targetName?: string;
  isPrivate?: boolean;
  downloadUrl: string;
  previewUrl: string;
}

export interface SharedText {
  id: string;
  title?: string;
  content: string;
  createdAt: string;
  creatorIp: string;
  creatorDevice: string;
  creatorMac?: string;
  creatorName?: string;
  targetMac?: string;
  targetName?: string;
  isPrivate?: boolean;
  isCode?: boolean;
  language?: string;
}

export interface StorageStats {
  totalFiles: number;
  totalBytes: number;
  formattedTotalSize: string;
  totalTexts: number;
  privateFilesCount?: number;
  publicFilesCount?: number;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function normalizeMac(mac?: string | null): string {
  if (!mac) return '';
  // Remove non-hex characters and convert to standard XX:XX:XX:XX:XX:XX uppercase format
  const cleaned = mac.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  if (cleaned.length !== 12) return mac.trim().toUpperCase();
  return cleaned.match(/.{1,2}/g)?.join(':') || cleaned;
}

export function isValidMac(mac?: string | null): boolean {
  if (!mac) return false;
  const regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return regex.test(mac.trim());
}
