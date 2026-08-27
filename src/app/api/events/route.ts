import { eventBus } from '@/lib/events';
import { getActiveDevices } from '@/lib/devices';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  // Extract client MAC from query param (optional, for logging/association)
  const url = new URL(request.url);
  const _clientMac = url.searchParams.get('mac') || '';

  // We need to store references for cleanup in cancel()
  let listener: ((eventData: unknown) => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial keepalive
      controller.enqueue(encoder.encode(': connected\n\n'));

      // Immediately push current active device list so newly-connected clients
      // learn about all currently registered peers
      try {
        const activeDevices = getActiveDevices();
        if (activeDevices.length > 0) {
          const initialPayload = {
            type: 'device:updated',
            data: {
              device: null,
              activeDevices,
            },
            timestamp: Date.now(),
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(initialPayload)}\n\n`)
          );
        }
      } catch {
        // Ignore errors pushing initial state
      }

      listener = (eventData: unknown) => {
        try {
          const dataString = `data: ${JSON.stringify(eventData)}\n\n`;
          controller.enqueue(encoder.encode(dataString));
        } catch {
          // Stream might be closed
        }
      };

      eventBus.on('change', listener);

      // Send periodic heartbeat every 20 seconds to prevent proxy/browser timeout
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          // Stream closed — will be cleaned up in cancel()
        }
      }, 20000);
    },
    cancel() {
      // Proper cleanup when stream is closed by client
      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = null;
      }
      if (listener) {
        eventBus.off('change', listener);
        listener = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
