import os from 'os';

export interface NetworkInterfaceInfo {
  name: string;
  address: string;
  family: string;
  internal: boolean;
  isRecommended?: boolean;
}

export function getLocalNetworkInterfaces(): NetworkInterfaceInfo[] {
  const interfaces = os.networkInterfaces();
  const results: NetworkInterfaceInfo[] = [];

  for (const [name, netList] of Object.entries(interfaces)) {
    if (!netList) continue;

    for (const net of netList) {
      // We only care about IPv4 non-internal addresses
      if (net.family === 'IPv4' && !net.internal) {
        // Exclude virtual adapter patterns like docker, vEthernet, loopback if possible
        const isVirtual = /docker|vbox|vmnet|loopback|tailscale|wsl/i.test(name);
        const isWifiOrEthernet = /wi-fi|wlan|en|eth|ethernet|local area connection/i.test(name);

        results.push({
          name,
          address: net.address,
          family: net.family,
          internal: net.internal,
          isRecommended: isWifiOrEthernet && !isVirtual,
        });
      }
    }
  }

  // Sort so recommended Wi-Fi / Ethernet LAN appears first
  results.sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    return a.address.localeCompare(b.address);
  });

  return results;
}

export function getPrimaryNetworkAddress(): string {
  const list = getLocalNetworkInterfaces();
  if (list.length > 0) {
    return list[0].address;
  }
  return 'localhost';
}
