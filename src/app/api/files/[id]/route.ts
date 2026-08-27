import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getFileById, deleteFileById, getStorageStats } from '@/lib/storage';
import { resolveMacFromIp } from '@/lib/devices';
import { normalizeMac, isValidMac } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ip = getClientIp(request);
    const headerMac = request.headers.get('x-device-mac') || request.nextUrl.searchParams.get('mac');
    let clientMac = headerMac && isValidMac(headerMac) ? normalizeMac(headerMac) : '';
    if (!clientMac) {
      clientMac = await resolveMacFromIp(ip);
    }

    const { metadata, filePath, isForbidden } = getFileById(id, clientMac);

    if (isForbidden) {
      return new NextResponse('Access Denied: This is a private 1-to-1 file targeted to another MAC address.', {
        status: 403,
      });
    }

    if (!metadata || !filePath) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileStat = await fs.promises.stat(filePath);
    const fileStream = fs.createReadStream(filePath);

    // Convert node stream to web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
    });

    const isPreview = request.nextUrl.searchParams.get('preview') === 'true';
    const disposition = isPreview
      ? 'inline'
      : `attachment; filename="${encodeURIComponent(metadata.originalName)}"`;

    return new NextResponse(webStream as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': metadata.mimeType || 'application/octet-stream',
        'Content-Length': fileStat.size.toString(),
        'Content-Disposition': disposition,
        'Cache-Control': 'public, max-age=3600',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    return new NextResponse((error as Error).message, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const ip = getClientIp(request);
    const headerMac = request.headers.get('x-device-mac') || request.nextUrl.searchParams.get('mac');
    let clientMac = headerMac && isValidMac(headerMac) ? normalizeMac(headerMac) : '';
    if (!clientMac) {
      clientMac = await resolveMacFromIp(ip);
    }

    const result = await deleteFileById(id, clientMac);

    if (result.forbidden) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to delete this 1-to-1 file.' },
        { status: 403 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'File not found or already deleted' },
        { status: 404 }
      );
    }

    const stats = getStorageStats(clientMac);
    return NextResponse.json({
      success: true,
      deletedId: id,
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
