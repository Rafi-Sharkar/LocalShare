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
  isCode?: boolean;
  language?: string;
}

export interface StorageStats {
  totalFiles: number;
  totalBytes: number;
  formattedTotalSize: string;
  totalTexts: number;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
