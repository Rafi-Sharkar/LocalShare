import { EventEmitter } from 'events';

// Global event bus for broadcasting file and text updates across open tabs & devices
declare global {
  // eslint-disable-next-line no-var
  var __localshare_event_bus: EventEmitter | undefined;
}

if (!global.__localshare_event_bus) {
  global.__localshare_event_bus = new EventEmitter();
  // Allow high number of connected devices
  global.__localshare_event_bus.setMaxListeners(500);
}

export const eventBus = global.__localshare_event_bus;

export type EventType =
  | 'file:created'
  | 'file:deleted'
  | 'text:created'
  | 'text:deleted'
  | 'storage:updated';

export function broadcastEvent(type: EventType, data?: unknown) {
  eventBus.emit('change', { type, data, timestamp: Date.now() });
}
