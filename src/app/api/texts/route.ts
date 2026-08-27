import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTexts,
  saveSharedText,
  deleteSharedText,
  getStorageStats,
} from '@/lib/storage';
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

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const headerMac = request.headers.get('x-device-mac') || request.nextUrl.searchParams.get('mac');
    let clientMac = headerMac && isValidMac(headerMac) ? normalizeMac(headerMac) : '';
    if (!clientMac) {
      clientMac = await resolveMacFromIp(ip);
    }

    const texts = getAllTexts(clientMac);
    return NextResponse.json({
      success: true,
      texts,
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
    const body = await request.json();
    const { content, title, targetMac: targetMacRaw, targetName, creatorName } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';

    const creatorMacRaw = body.creatorMac || request.headers.get('x-device-mac');
    let creatorMac = creatorMacRaw && isValidMac(creatorMacRaw) ? normalizeMac(creatorMacRaw) : '';
    if (!creatorMac) {
      creatorMac = await resolveMacFromIp(clientIp);
    }

    const targetMac = targetMacRaw && targetMacRaw !== 'all' && isValidMac(targetMacRaw)
      ? normalizeMac(targetMacRaw)
      : undefined;

    const saved = saveSharedText(content, title, {
      clientIp,
      userAgent,
      creatorMac,
      creatorName,
      targetMac,
      targetName,
    });

    const stats = getStorageStats(creatorMac);

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

    const ip = getClientIp(request);
    const clientMac = await resolveMacFromIp(ip);
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
