import { Platform } from 'react-native';

/**
 * MES-style real-time sync using Server-Sent Events (SSE).
 *
 * Architecture:
 *  - A lightweight Node server (server.js) runs on the LAN.
 *  - Field agents POST events to /api/events.
 *  - The admin dashboard opens an SSE connection to GET /api/events
 *    and receives every event in real time.
 *  - Shared data is read/written via /api/data/:key so both admin
 *    (localhost) and agents (LAN IP) share the same data store.
 *
 * This works across different origins because everything goes through
 * the same HTTP server — no localStorage sharing required.
 */

export interface SyncEvent {
  id?: string;
  type: 'visit_picked' | 'visit_checked_in' | 'visit_completed' | 'visit_cancelled' | 'data_changed';
  message: string;
  agentName: string;
  clientName: string;
  visitId: string;
  ts?: number;
}

// Resolve the API base URL — always the same host/port the page was served from
function getApiBase(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return '';
}

// ── SSE listener management ───────────────────────────────────────
let eventSource: EventSource | null = null;
let listeners: Array<(evt: SyncEvent) => void> = [];

/**
 * Connect to the SSE stream from the sync server.
 * Call this once on app mount. Returns a cleanup function.
 */
export function initCrossTabSync(): () => void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return () => {};

  const base = getApiBase();
  if (!base) return () => {};

  try {
    eventSource = new EventSource(`${base}/api/events`);
    eventSource.onmessage = (e) => {
      try {
        const evt: SyncEvent = JSON.parse(e.data);
        listeners.forEach((fn) => fn(evt));
      } catch { /* ignore bad data */ }
    };
    eventSource.onerror = () => {
      // Auto-reconnect is built into EventSource — nothing to do
    };
  } catch {
    // SSE not available
  }

  return () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

/**
 * Subscribe to real-time events. Returns unsubscribe function.
 */
export function onSyncEvent(fn: (evt: SyncEvent) => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

/**
 * Push an event to the sync server (agent → server → admin).
 * Non-blocking fire-and-forget.
 */
export function pushSyncEvent(evt: SyncEvent) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const base = getApiBase();
  if (!base) return;

  fetch(`${base}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evt),
  }).catch(() => { /* network error — silent */ });
}

/**
 * Notify the server that data has changed (generic broadcast).
 * Kept for backward compatibility with existing store calls.
 */
export function broadcastChange(keys: string[]) {
  pushSyncEvent({
    type: 'data_changed',
    message: `Data updated: ${keys.join(', ')}`,
    agentName: '',
    clientName: '',
    visitId: '',
  });
}

// ── Shared data store helpers (replace AsyncStorage for sync) ─────

/**
 * Read a value from the shared server data store.
 */
export async function syncGet(key: string): Promise<string | null> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const base = getApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/data/${encodeURIComponent(key)}`);
    const json = await res.json();
    return json.value;
  } catch {
    return null;
  }
}

/**
 * Write a value to the shared server data store.
 */
export async function syncSet(key: string, value: string): Promise<void> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const base = getApiBase();
  if (!base) return;
  try {
    await fetch(`${base}/api/data/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  } catch { /* silent */ }
}

/**
 * Remove a key from the shared server data store.
 */
export async function syncRemove(key: string): Promise<void> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const base = getApiBase();
  if (!base) return;
  try {
    await fetch(`${base}/api/data/${encodeURIComponent(key)}`, { method: 'DELETE' });
  } catch { /* silent */ }
}
