import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mime from 'mime-types';
import { broadcastEvent } from './events';
import { FileMetadata, SharedText, StorageStats, formatBytes } from './types';

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
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS Device';
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

export function getAllFiles(): FileMetadata[] {
  const files = readMetadata();
  const existingFiles = files.filter((f) => {
    const filePath = path.join(UPLOADS_DIR, f.name);
    return fs.existsSync(filePath);
  });
  if (existingFiles.length !== files.length) {
    writeMetadata(existingFiles);
  }
  return existingFiles.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

export function getFileById(id: string): {
  metadata: FileMetadata | null;
  filePath: string | null;
} {
  const files = getAllFiles();
  const file = files.find((f) => f.id === id);
  if (!file) return { metadata: null, filePath: null };
  const filePath = path.join(UPLOADS_DIR, file.name);
  if (!fs.existsSync(filePath)) return { metadata: null, filePath: null };
  return { metadata: file, filePath };
}

export async function saveUploadedFile(
  fileBuffer: Buffer,
  originalFilename: string,
  clientIp = '127.0.0.1',
  userAgent = ''
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
    downloadUrl: `/api/files/${id}`,
    previewUrl: `/api/files/${id}?preview=true`,
  };

  const files = readMetadata();
  files.unshift(metadata);
  writeMetadata(files);

  broadcastEvent('file:created', metadata);
  return metadata;
}

export async function deleteFileById(id: string): Promise<boolean> {
  ensureDirs();
  const files = readMetadata();
  const target = files.find((f) => f.id === id);
  if (!target) return false;

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
  return true;
}

// Text / Note Sharing Store
export function getAllTexts(): SharedText[] {
  ensureDirs();
  try {
    const raw = fs.readFileSync(TEXTS_FILE, 'utf-8');
    const texts: SharedText[] = JSON.parse(raw);
    return texts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export function saveSharedText(
  content: string,
  title?: string,
  clientIp = '127.0.0.1',
  userAgent = ''
): SharedText {
  ensureDirs();
  const id = crypto.randomUUID();
  const textItem: SharedText = {
    id,
    title: title?.trim() || undefined,
    content,
    createdAt: new Date().toISOString(),
    creatorIp: clientIp,
    creatorDevice: detectDevice(userAgent),
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

export function getStorageStats(): StorageStats {
  const files = getAllFiles();
  const texts = getAllTexts();
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return {
    totalFiles: files.length,
    totalBytes,
    formattedTotalSize: formatBytes(totalBytes),
    totalTexts: texts.length,
  };
}
