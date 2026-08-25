import { NextResponse } from 'next/server';
import { getLocalNetworkInterfaces, getPrimaryNetworkAddress } from '@/lib/network';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const interfaces = getLocalNetworkInterfaces();
    const primaryIp = getPrimaryNetworkAddress();
    
    // Determine the host port from request or environment
    const url = new URL(request.url);
    const port = url.port || (process.env.PORT || '3000');
    
    const urls = interfaces.map((net) => ({
      name: net.name,
      address: net.address,
      url: `http://${net.address}:${port}`,
      isRecommended: net.isRecommended,
    }));

    return NextResponse.json({
      success: true,
      port,
      primaryIp,
      primaryUrl: `http://${primaryIp}:${port}`,
      interfaces: urls,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
