import os from 'os';
import { exec } from 'child_process';
import util from 'util';
import crypto from 'crypto';
import { Device, normalizeMac } from './types';
import { broadcastEvent } from './events';

const execAsync = util.promisify(exec);

// In-memory active devices map: mac -> Device
const activeDevices = new Map<string, Device>();

// Cache for IP to MAC mappings to avoid excessive ARP queries
const arpCache = new Map<string, { mac: string; timestamp: number }>();
const ARP_CACHE_TTL = 30000; // 30 seconds

/**
 * Get all server network interfaces and their real hardware MAC addresses
 */
export function getServerInterfaces() {
  const interfaces = os.networkInterfaces();
  const list: Array<{ name: string; ip: string; mac: string; isRecommended: boolean }> = [];

  for (const [name, netList] of Object.entries(interfaces)) {
    if (!netList) continue;
    for (const net of netList) {
      if (net.family === 'IPv4' && !net.internal) {
        const isVirtual = /docker|vbox|vmnet|loopback|tailscale|wsl/i.test(name);
        const isWifiOrEth = /wi-fi|wlan|en|eth|ethernet|local area connection/i.test(name);
        list.push({
          name,
          ip: net.address,
          mac: normalizeMac(net.mac),
          isRecommended: isWifiOrEth && !isVirtual,
        });
      }
    }
  }

  list.sort((a, b) => (a.isRecommended === b.isRecommended ? 0 : a.isRecommended ? -1 : 1));
  return list;
}

/**
 * Get primary server MAC address
 */
export function getServerMacAddress(): string {
  const list = getServerInterfaces();
  if (list.length > 0 && list[0].mac && list[0].mac !== '00:00:00:00:00:00') {
    return list[0].mac;
  }
  // Fallback server MAC based on hostname
  return generateDeterministicMac(`server-${os.hostname()}`);
}

/**
 * Resolve client IP address to MAC address using OS ARP cache or network interfaces
 */
export async function resolveMacFromIp(ip: string): Promise<string> {
  const cleanIp = ip.replace(/^::ffff:/, '').trim();

  // 1. Check if it's localhost / loopback or the server's own IP
  if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost') {
    return getServerMacAddress();
  }

  const serverInterfaces = getServerInterfaces();
  const matchedInterface = serverInterfaces.find((i) => i.ip === cleanIp);
  if (matchedInterface && matchedInterface.mac) {
    return matchedInterface.mac;
  }

  // 2. Check ARP cache
  const cached = arpCache.get(cleanIp);
  if (cached && Date.now() - cached.timestamp < ARP_CACHE_TTL) {
    return cached.mac;
  }

  // 3. Query OS ARP table
  try {
    const isWindows = process.platform === 'win32';
    const isLinux = process.platform === 'linux';
    const isDarwin = process.platform === 'darwin';

    let macFound: string | null = null;

    if (isWindows) {
      // Windows arp -a <ip>
      const { stdout } = await execAsync(`arp -a ${cleanIp}`).catch(() => ({ stdout: '' }));
      // Match lines like: 192.168.1.105    aa-bb-cc-dd-ee-ff     dynamic
      const match = stdout.match(/([0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2}[-:][0-9a-fA-F]{2})/i);
      if (match) {
        macFound = normalizeMac(match[1]);
      }
    } else if (isLinux || isDarwin) {
      const cmd = isLinux ? `ip neigh show ${cleanIp} || arp -an` : `arp -an`;
      const { stdout } = await execAsync(cmd).catch(() => ({ stdout: '' }));
      const match = stdout.match(/([0-9a-fA-F]{1,2}[:-][0-9a-fA-F]{1,2}[:-][0-9a-fA-F]{1,2}[:-][0-9a-fA-F]{1,2}[:-][0-9a-fA-F]{1,2}[:-][0-9a-fA-F]{1,2})/i);
      if (match) {
        macFound = normalizeMac(match[1]);
      }
    }

    if (macFound && macFound !== '00:00:00:00:00:00' && macFound !== 'FF:FF:FF:FF:FF:FF') {
      arpCache.set(cleanIp, { mac: macFound, timestamp: Date.now() });
      return macFound;
    }
  } catch {
    // ARP lookup failed or restricted in environment
  }

  // 4. Fallback: generate stable pseudo-MAC for this IP
  const fallbackMac = generateDeterministicMac(`device-ip-${cleanIp}`);
  return fallbackMac;
}

/**
 * Generate a valid locally administered unicast MAC address from a seed string
 */
export function generateDeterministicMac(seed: string): string {
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  // Format as XX:XX:XX:XX:XX:XX with 2nd least significant bit of 1st byte set (locally administered)
  // and least significant bit 0 (unicast): e.g. 02:XX:XX:XX:XX:XX
  const bytes = [
    '02',
    hash.substring(2, 4),
    hash.substring(4, 6),
    hash.substring(6, 8),
    hash.substring(8, 10),
    hash.substring(10, 12),
  ];
  return bytes.join(':').toUpperCase();
}

/**
 * Extract friendly OS name from user agent
 */
export function detectDeviceOS(userAgent?: string | null): string {
  if (!userAgent) return 'Unknown Device';
  if (/iPhone/i.test(userAgent)) return 'iOS (iPhone)';
  if (/iPad/i.test(userAgent)) return 'iPadOS';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/Macintosh|Mac OS X/i.test(userAgent)) return 'macOS';
  if (/Windows NT/i.test(userAgent)) return 'Windows PC';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'Web Device';
}

/**
 * Extract default friendly device name from OS and IP
 */
export function getDefaultDeviceName(osName: string, ip: string): string {
  const cleanIp = ip.replace(/^::ffff:/, '').trim();
  const lastOctet = cleanIp.split('.').pop() || '1';
  return `${osName} (${lastOctet})`;
}

/**
 * Register or update device presence in the active LAN registry
 */
export function registerDeviceHeartbeat(params: {
  mac: string;
  ip: string;
  name?: string;
  userAgent?: string;
}): Device {
  const cleanMac = normalizeMac(params.mac);
  const cleanIp = params.ip.replace(/^::ffff:/, '').trim();
  const osName = detectDeviceOS(params.userAgent);
  const now = new Date().toISOString();

  const existing = activeDevices.get(cleanMac);
  const deviceName = params.name?.trim() || existing?.name || getDefaultDeviceName(osName, cleanIp);

  const device: Device = {
    mac: cleanMac,
    ip: cleanIp,
    name: deviceName,
    os: osName,
    userAgent: params.userAgent || '',
    lastSeen: now,
    isOnline: true,
  };

  activeDevices.set(cleanMac, device);
  broadcastEvent('device:updated', { device });

  return device;
}

/**
 * Get all active devices on the LAN (cleaned up if inactive > 90 seconds)
 */
export function getActiveDevices(): Device[] {
  const now = Date.now();
  const result: Device[] = [];

  for (const [mac, device] of activeDevices.entries()) {
    const lastSeenTime = new Date(device.lastSeen).getTime();
    const isOnline = now - lastSeenTime < 90000; // active within 90s

    if (now - lastSeenTime > 300000) {
      // remove dead devices after 5 minutes
      activeDevices.delete(mac);
      continue;
    }

    result.push({
      ...device,
      isOnline,
    });
  }

  // Sort: online first, then by lastSeen desc
  return result.sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
  });
}

/**
 * Get device by MAC
 */
export function getDeviceByMac(mac: string): Device | undefined {
  const cleanMac = normalizeMac(mac);
  return activeDevices.get(cleanMac);
}
