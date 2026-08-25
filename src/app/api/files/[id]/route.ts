import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getFileById, deleteFileById, getStorageStats } from '@/lib/storage';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const { metadata, filePath } = getFileById(id);

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
    const disposition = isPreview ? 'inline' : `attachment; filename="${encodeURIComponent(metadata.originalName)}"`;

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
    const { id } = params;
    const success = await deleteFileById(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'File not found or already deleted' },
        { status: 404 }
      );
    }

    const stats = getStorageStats();
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
