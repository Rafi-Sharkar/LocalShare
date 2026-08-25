import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTexts,
  saveSharedText,
  deleteSharedText,
  getStorageStats,
} from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const texts = getAllTexts();
    return NextResponse.json({
      success: true,
      texts,
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
    const body = await request.json();
    const { content, title } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    const saved = saveSharedText(content, title, clientIp, userAgent);
    const stats = getStorageStats();

    return NextResponse.json({
      success: true,
      text: saved,
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing text id' },
        { status: 400 }
      );
    }

    const success = deleteSharedText(id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Text note not found' },
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
