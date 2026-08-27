import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mime from 'mime-types';
import { broadcastEvent } from './events';
import { FileMetadata, SharedText, StorageStats, formatBytes, normalizeMac } from './types';

export * from './types';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DATA_DIR = path.join(process.cwd(), 'data');
const FILES_META_FILE = path.join(DATA_DIR, 'files.json');
const TEXTS_FILE = path.join(DATA_DIR, 'texts.json');

// Ensure necessary directories exist
function ensureDirs() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILES_META_FILE)) {
    fs.writeFileSync(FILES_META_FILE, JSON.stringify([]), 'utf-8');
  }
  if (!fs.existsSync(TEXTS_FILE)) {
    fs.writeFileSync(TEXTS_FILE, JSON.stringify([]), 'utf-8');
  }
}

export function detectDevice(userAgent?: string | null): string {
  if (!userAgent) return 'Unknown Device';
  if (/iPhone/i.test(userAgent)) return 'iOS Device';
  if (/iPad/i.test(userAgent)) return 'iPad';
  if (/Android/i.test(userAgent)) return 'Android Device';
  if (/Macintosh|Mac OS X/i.test(userAgent)) return 'macOS';
  if (/Windows NT/i.test(userAgent)) return 'Windows PC';
  if (/Linux/i.test(userAgent)) return 'Linux Machine';
  return 'Web Client';
}

export function getFileCategory(
  mimeType: string,
  filename: string
): FileMetadata['category'] {
  const ext = path.extname(filename).toLowerCase();

  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf' || ext === '.pdf') return 'pdf';
  if (
    [
      '.js',
      '.ts',
      '.jsx',
      '.tsx',
      '.json',
      '.html',
      '.css',
      '.py',
      '.go',
      '.rs',
      '.java',
      '.c',
      '.cpp',
      '.h',
      '.sh',
      '.bat',
      '.md',
      '.yml',
      '.yaml',
      '.xml',
      '.sql',
      '.env',
    ].includes(ext)
  ) {
    return 'code';
  }
  if (
    ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(ext) ||
    mimeType.includes('zip') ||
    mimeType.includes('compressed') ||
    mimeType.includes('archive')
  ) {
    return 'archive';
  }
  if (
    [
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.ppt',
      '.pptx',
      '.txt',
      '.rtf',
      '.csv',
    ].includes(ext)
  ) {
    return 'document';
  }

  return 'other';
}

function readMetadata(): FileMetadata[] {
  ensureDirs();
  try {
    const raw = fs.readFileSync(FILES_META_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeMetadata(data: FileMetadata[]): void {
  ensureDirs();
  fs.writeFileSync(FILES_META_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Retrieve all files accessible by client MAC.
 * If clientMac is provided:
 * - Returns public files (targetMac is unset or 'all')
 * - Returns files where clientMac is recipient (targetMac === clientMac)
 * - Returns files where clientMac is sender (uploaderMac === clientMac)
 */
export function getAllFiles(clientMac?: string): FileMetadata[] {
  const files = readMetadata();
  const existingFiles = files.filter((f) => {
    const filePath = path.join(UPLOADS_DIR, f.name);
    return fs.existsSync(filePath);
  });
  if (existingFiles.length !== files.length) {
    writeMetadata(existingFiles);
  }

  const sorted = existingFiles.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

  if (!clientMac) {
    return sorted;
  }

  const cleanClientMac = normalizeMac(clientMac).toUpperCase();

  return sorted.filter((file) => {
    // If file is not private / targeted to everyone
    if (!file.isPrivate || !file.targetMac || file.targetMac.toLowerCase() === 'all') {
      return true;
    }
    const cleanTargetMac = normalizeMac(file.targetMac).toUpperCase();
    const cleanUploaderMac = normalizeMac(file.uploaderMac).toUpperCase();

    // Check if client is target recipient or sender
    return cleanTargetMac === cleanClientMac || cleanUploaderMac === cleanClientMac;
  });
}

export function getFileById(
  id: string,
  clientMac?: string
): {
  metadata: FileMetadata | null;
  filePath: string | null;
  isForbidden?: boolean;
} {
  const allFiles = readMetadata();
  const file = allFiles.find((f) => f.id === id);
  if (!file) return { metadata: null, filePath: null };

  const filePath = path.join(UPLOADS_DIR, file.name);
  if (!fs.existsSync(filePath)) return { metadata: null, filePath: null };

  // Check 1-to-1 privacy access
  if (file.isPrivate && file.targetMac && file.targetMac.toLowerCase() !== 'all') {
    if (!clientMac) {
      return { metadata: file, filePath, isForbidden: true };
    }
    const cleanClientMac = normalizeMac(clientMac).toUpperCase();
    const cleanTargetMac = normalizeMac(file.targetMac).toUpperCase();
    const cleanUploaderMac = normalizeMac(file.uploaderMac).toUpperCase();

    if (cleanTargetMac !== cleanClientMac && cleanUploaderMac !== cleanClientMac) {
      return { metadata: file, filePath, isForbidden: true };
    }
  }

  return { metadata: file, filePath };
}

export async function saveUploadedFile(
  fileBuffer: Buffer,
  originalFilename: string,
  options?: {
    clientIp?: string;
    userAgent?: string;
    uploaderMac?: string;
    uploaderName?: string;
    targetMac?: string;
    targetName?: string;
  }
): Promise<FileMetadata> {
  ensureDirs();
  const id = crypto.randomUUID();
  const ext = path.extname(originalFilename);
  const safeBaseName = path
    .basename(originalFilename, ext)
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  const storedFilename = `${id}_${safeBaseName}${ext}`;
  const filePath = path.join(UPLOADS_DIR, storedFilename);

  await fs.promises.writeFile(filePath, fileBuffer);

  const detectedMime =
    mime.lookup(originalFilename) || 'application/octet-stream';
  const category = getFileCategory(detectedMime, originalFilename);

  const clientIp = options?.clientIp || '127.0.0.1';
  const userAgent = options?.userAgent || '';
  const uploaderMac = options?.uploaderMac ? normalizeMac(options.uploaderMac) : undefined;
  const targetMac = options?.targetMac && options.targetMac !== 'all' ? normalizeMac(options.targetMac) : undefined;
  const isPrivate = Boolean(targetMac && targetMac !== 'all');

  const metadata: FileMetadata = {
    id,
    name: storedFilename,
    originalName: originalFilename,
    size: fileBuffer.length,
    mimeType: detectedMime,
    category,
    uploadedAt: new Date().toISOString(),
    uploaderIp: clientIp,
    uploaderDevice: detectDevice(userAgent),
    uploaderMac,
    uploaderName: options?.uploaderName,
    targetMac,
    targetName: options?.targetName,
    isPrivate,
    downloadUrl: `/api/files/${id}`,
    previewUrl: `/api/files/${id}?preview=true`,
  };

  const files = readMetadata();
  files.unshift(metadata);
  writeMetadata(files);

  broadcastEvent('file:created', metadata);
  return metadata;
}

export async function deleteFileById(id: string, clientMac?: string): Promise<{ success: boolean; forbidden?: boolean }> {
  ensureDirs();
  const files = readMetadata();
  const target = files.find((f) => f.id === id);
  if (!target) return { success: false };

  // If private, only sender or target can delete
  if (target.isPrivate && target.targetMac && target.targetMac.toLowerCase() !== 'all') {
    if (clientMac) {
      const cleanClient = normalizeMac(clientMac).toUpperCase();
      const cleanTarget = normalizeMac(target.targetMac).toUpperCase();
      const cleanUploader = normalizeMac(target.uploaderMac).toUpperCase();
      if (cleanClient !== cleanTarget && cleanClient !== cleanUploader) {
        return { success: false, forbidden: true };
      }
    }
  }

  const filePath = path.join(UPLOADS_DIR, target.name);
  if (fs.existsSync(filePath)) {
    try {
      await fs.promises.unlink(filePath);
    } catch {
      // ignore
    }
  }

  const filtered = files.filter((f) => f.id !== id);
  writeMetadata(filtered);

  broadcastEvent('file:deleted', { id });
  return { success: true };
}

// Text / Note Sharing Store
export function getAllTexts(clientMac?: string): SharedText[] {
  ensureDirs();
  try {
    const raw = fs.readFileSync(TEXTS_FILE, 'utf-8');
    const texts: SharedText[] = JSON.parse(raw);
    const sorted = texts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (!clientMac) {
      return sorted;
    }

    const cleanClientMac = normalizeMac(clientMac).toUpperCase();

    return sorted.filter((text) => {
      if (!text.isPrivate || !text.targetMac || text.targetMac.toLowerCase() === 'all') {
        return true;
      }
      const cleanTargetMac = normalizeMac(text.targetMac).toUpperCase();
      const cleanCreatorMac = normalizeMac(text.creatorMac).toUpperCase();
      return cleanTargetMac === cleanClientMac || cleanCreatorMac === cleanClientMac;
    });
  } catch {
    return [];
  }
}

export function saveSharedText(
  content: string,
  title?: string,
  options?: {
    clientIp?: string;
    userAgent?: string;
    creatorMac?: string;
    creatorName?: string;
    targetMac?: string;
    targetName?: string;
  }
): SharedText {
  ensureDirs();
  const id = crypto.randomUUID();
  const clientIp = options?.clientIp || '127.0.0.1';
  const userAgent = options?.userAgent || '';
  const creatorMac = options?.creatorMac ? normalizeMac(options.creatorMac) : undefined;
  const targetMac = options?.targetMac && options.targetMac !== 'all' ? normalizeMac(options.targetMac) : undefined;
  const isPrivate = Boolean(targetMac && targetMac !== 'all');

  const textItem: SharedText = {
    id,
    title: title?.trim() || undefined,
    content,
    createdAt: new Date().toISOString(),
    creatorIp: clientIp,
    creatorDevice: detectDevice(userAgent),
    creatorMac,
    creatorName: options?.creatorName,
    targetMac,
    targetName: options?.targetName,
    isPrivate,
  };

  const texts = getAllTexts();
  texts.unshift(textItem);
  fs.writeFileSync(TEXTS_FILE, JSON.stringify(texts, null, 2), 'utf-8');

  broadcastEvent('text:created', textItem);
  return textItem;
}

export function deleteSharedText(id: string): boolean {
  ensureDirs();
  const texts = getAllTexts();
  const filtered = texts.filter((t) => t.id !== id);
  if (filtered.length === texts.length) return false;

  fs.writeFileSync(TEXTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  broadcastEvent('text:deleted', { id });
  return true;
}

export function getStorageStats(clientMac?: string): StorageStats {
  const files = getAllFiles(clientMac);
  const texts = getAllTexts(clientMac);
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  const privateFilesCount = files.filter((f) => f.isPrivate).length;
  const publicFilesCount = files.filter((f) => !f.isPrivate).length;

  return {
    totalFiles: files.length,
    totalBytes,
    formattedTotalSize: formatBytes(totalBytes),
    totalTexts: texts.length,
    privateFilesCount,
    publicFilesCount,
  };
}
