import os from 'os';

export interface NetworkInterfaceInfo {
  name: string;
  address: string;
  family: string;
  internal: boolean;
  isRecommended?: boolean;
}

/**
 * Filter and score network interfaces to pick the real Wi-Fi / LAN IP
 */
export function getLocalNetworkInterfaces(): NetworkInterfaceInfo[] {
  const interfaces = os.networkInterfaces();
  const rawList: Array<NetworkInterfaceInfo & { score: number }> = [];

  for (const [name, netList] of Object.entries(interfaces)) {
    if (!netList) continue;

    for (const net of netList) {
      // IPv4 non-internal only
      if (net.family === 'IPv4' && !net.internal) {
        const ip = net.address;

        // Discard unroutable link-local and loopback addresses
        if (ip.startsWith('169.254.') || ip.startsWith('127.')) {
          continue;
        }

        const lowerName = name.toLowerCase();

        // Check if virtual adapter
        const isVirtual =
          /vethernet|hyper-v|wsl|docker|tailscale|zerotier|vmnet|virtualbox|vbox|bluetooth|loopback|teredo|isatap|npcap/i.test(
            lowerName
          );

        // Check if physical Wi-Fi / WLAN or Ethernet
        const isWifi = /wi-fi|wlan|wireless|airport|en0/i.test(lowerName);
        const isEthernet = /ethernet|lan|local area connection|eth0|en1/i.test(lowerName) && !isVirtual;

        // Check private subnet ranges (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        const isCommonHomeSubnet = ip.startsWith('192.168.') || ip.startsWith('10.');
        const isPrivateSubnet =
          isCommonHomeSubnet || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip);

        let score = 10;
        if (isWifi && isCommonHomeSubnet) score = 100;
        else if (isWifi && isPrivateSubnet) score = 90;
        else if (isEthernet && isCommonHomeSubnet) score = 80;
        else if (isEthernet && isPrivateSubnet) score = 70;
        else if (!isVirtual && isCommonHomeSubnet) score = 60;
        else if (!isVirtual && isPrivateSubnet) score = 50;
        else if (isVirtual) score = 5;

        rawList.push({
          name,
          address: ip,
          family: net.family,
          internal: net.internal,
          isRecommended: score >= 60,
          score,
        });
      }
    }
  }

  // Sort by highest score first
  rawList.sort((a, b) => b.score - a.score);

  return rawList.map(({ score, ...item }) => item);
}

export function getPrimaryNetworkAddress(): string {
  const list = getLocalNetworkInterfaces();
  if (list.length > 0) {
    return list[0].address;
  }
  return 'localhost';
}
