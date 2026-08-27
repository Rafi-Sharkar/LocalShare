import { NextRequest, NextResponse } from 'next/server';
import { getAllFiles, saveUploadedFile, getStorageStats } from '@/lib/storage';
import { resolveMacFromIp } from '@/lib/devices';
import { normalizeMac, isValidMac } from '@/lib/types';

export const dynamic = 'force-dynamic';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

/**
 * Resolve client MAC: trust client-provided header first, ARP fallback only for localhost.
 */
async function resolveClientMac(request: NextRequest, ip: string, formDataMac?: string | null): Promise<string> {
  // Prefer explicit MAC from form data, then header, then query param
  if (formDataMac && isValidMac(formDataMac)) {
    return normalizeMac(formDataMac);
  }
  const headerMac = request.headers.get('x-device-mac') || request.nextUrl.searchParams.get('mac');
  if (headerMac && isValidMac(headerMac)) {
    return normalizeMac(headerMac);
  }
  // Fallback to ARP resolution
  return await resolveMacFromIp(ip);
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const clientMac = await resolveClientMac(request, ip);

    const files = getAllFiles(clientMac);
    const stats = getStorageStats(clientMac);

    return NextResponse.json({
      success: true,
      files,
      stats,
      clientMac,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const uploadedFiles = formData.getAll('files') as File[];

    if (!uploadedFiles || uploadedFiles.length === 0) {
      const singleFile = formData.get('file') as File | null;
      if (singleFile) {
        uploadedFiles.push(singleFile);
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';

    // Direct 1-to-1 recipient & sender parameters
    const targetMacRaw = formData.get('targetMac') as string | null;
    const targetName = (formData.get('targetName') as string) || undefined;
    const uploaderMacRaw = (formData.get('uploaderMac') as string) || request.headers.get('x-device-mac');
    const uploaderName = (formData.get('uploaderName') as string) || undefined;

    const uploaderMac = await resolveClientMac(request, clientIp, uploaderMacRaw);

    const targetMac = targetMacRaw && targetMacRaw !== 'all' && isValidMac(targetMacRaw)
      ? normalizeMac(targetMacRaw)
      : undefined;

    const savedResults = [];

    for (const file of uploadedFiles) {
      if (!file.name || file.size === 0) continue;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const saved = await saveUploadedFile(buffer, file.name, {
        clientIp,
        userAgent,
        uploaderMac,
        uploaderName,
        targetMac,
        targetName,
      });
      savedResults.push(saved);
    }

    const stats = getStorageStats(uploaderMac);

    return NextResponse.json({
      success: true,
      uploadedCount: savedResults.length,
      files: savedResults,
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
