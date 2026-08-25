import { NextRequest, NextResponse } from 'next/server';
import { getAllFiles, saveUploadedFile, getStorageStats } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const files = getAllFiles();
    const stats = getStorageStats();
    return NextResponse.json({
      success: true,
      files,
      stats,
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
      // Fallback check for single 'file' field
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

    // Extract client IP and user agent
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    const savedResults = [];

    for (const file of uploadedFiles) {
      if (!file.name || file.size === 0) continue;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const saved = await saveUploadedFile(
        buffer,
        file.name,
        clientIp,
        userAgent
      );
      savedResults.push(saved);
    }

    const stats = getStorageStats();

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
