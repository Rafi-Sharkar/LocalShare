import { eventBus } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial keepalive
      controller.enqueue(encoder.encode(': connected\n\n'));

      const listener = (eventData: unknown) => {
        try {
          const dataString = `data: ${JSON.stringify(eventData)}\n\n`;
          controller.enqueue(encoder.encode(dataString));
        } catch {
          // Stream might be closed
        }
      };

      eventBus.on('change', listener);

      // Send periodic heartbeat every 20 seconds to prevent proxy/browser timeout
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
          eventBus.off('change', listener);
        }
      }, 20000);

      // Cleanup when stream ends
      return () => {
        clearInterval(heartbeat);
        eventBus.off('change', listener);
      };
    },
    cancel() {
      // Stream canceled by client
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
