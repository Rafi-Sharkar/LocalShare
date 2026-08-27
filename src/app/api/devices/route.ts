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

/**
 * Determine whether this request is coming from the local machine
 */
function isLocalRequest(ip: string): boolean {
  const cleanIp = ip.replace(/^::ffff:/, '').trim();
  return cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost';
}

/**
 * Resolve the client's MAC address.
 * - Always trust the client-provided MAC header (client generates a stable MAC in localStorage).
 * - Only fall back to ARP resolution for localhost/loopback connections (same-machine browser).
 */
async function resolveClientMac(
  request: NextRequest,
  ip: string,
  bodyMac?: string | null
): Promise<string> {
  // 1. Prefer explicit MAC from header or body
  const headerMac = request.headers.get('x-device-mac') || request.nextUrl.searchParams.get('mac');

  if (bodyMac && isValidMac(bodyMac)) {
    return normalizeMac(bodyMac);
  }
  if (headerMac && isValidMac(headerMac)) {
    return normalizeMac(headerMac);
  }

  // 2. For local requests only, fall back to server MAC resolution
  if (isLocalRequest(ip)) {
    return await resolveMacFromIp(ip);
  }

  // 3. For remote requests with no MAC provided, generate a deterministic one from IP
  // This is a fallback — clients should always provide their MAC
  return await resolveMacFromIp(ip);
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';

    const mac = await resolveClientMac(request, ip);

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

    const mac = await resolveClientMac(request, ip, body.mac);

    const device = registerDeviceHeartbeat({
      mac,
      ip,
      name: body.name,
      userAgent,
    });

    const activeList = getActiveDevices();
    const serverMac = getServerMacAddress();

    return NextResponse.json({
      success: true,
      myDevice: {
        ...device,
        isCurrentDevice: true,
      },
      serverMac,
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
