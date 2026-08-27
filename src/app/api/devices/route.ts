import { NextRequest, NextResponse } from 'next/server';
import {
  resolveMacFromIp,
  registerDeviceHeartbeat,
  getActiveDevices,
  detectDeviceOS,
  getDefaultDeviceName,
  getServerMacAddress,
} from '@/lib/devices';
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
    const userAgent = request.headers.get('user-agent') || '';
    const headerMac = request.headers.get('x-device-mac') || request.nextUrl.searchParams.get('mac');

    let mac = '';
    if (headerMac && isValidMac(headerMac)) {
      mac = normalizeMac(headerMac);
    } else {
      mac = await resolveMacFromIp(ip);
    }

    const osName = detectDeviceOS(userAgent);
    const defaultName = getDefaultDeviceName(osName, ip);

    // Register / refresh heartbeat
    const myDevice = registerDeviceHeartbeat({
      mac,
      ip,
      name: defaultName,
      userAgent,
    });

    const activeList = getActiveDevices();
    const serverMac = getServerMacAddress();

    return NextResponse.json({
      success: true,
      myDevice: {
        ...myDevice,
        isCurrentDevice: true,
      },
      serverMac,
      activeDevices: activeList.map((d) => ({
        ...d,
        isCurrentDevice: d.mac === myDevice.mac,
      })),
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
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';
    const body = await request.json().catch(() => ({}));

    let mac = body.mac;
    if (!mac || !isValidMac(mac)) {
      mac = await resolveMacFromIp(ip);
    } else {
      mac = normalizeMac(mac);
    }

    const device = registerDeviceHeartbeat({
      mac,
      ip,
      name: body.name,
      userAgent,
    });

    const activeList = getActiveDevices();

    return NextResponse.json({
      success: true,
      myDevice: {
        ...device,
        isCurrentDevice: true,
      },
      activeDevices: activeList.map((d) => ({
        ...d,
        isCurrentDevice: d.mac === device.mac,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
