import { supabase, isSupabaseConfigured } from './supabase';
import type { BusData } from './googleSheets/types';

// URL resmi Supabase Edge Function Webhook
const DEFAULT_WEBHOOK_URL =
  'https://sejttnsanzogsykmtwym.supabase.co/functions/v1/sheet-sync-webhook';

const WEBHOOK_URL =
  import.meta.env.VITE_SHEET_SYNC_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;

// Runtime session ID acak unik per jendela peranti/tab browser
let clientSessionId: string | null = null;

export function getClientSessionId(): string {
  if (!clientSessionId) {
    clientSessionId = `session_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
  }
  return clientSessionId;
}

interface PendingSync {
  timer: ReturnType<typeof setTimeout>;
  resolvers: Array<() => void>;
}

// Debounce map untuk pemicuan webhook per rute + tanggal
const syncEntries: Map<string, PendingSync> = new Map();

/**
 * Memicu Webhook Supabase Edge Function untuk sinkronisasi rute ke tabel `daily_route_reports`.
 * Berfungsi di latar belakang (non-blocking) dengan debounce ringan 1 detik untuk meredam pemanggilan beruntun.
 */
export async function triggerRealtimeSheetSync(
  routeCode: string,
  date?: string
): Promise<void> {
  if (!routeCode) return;

  const key = `${routeCode.toUpperCase()}_${date || 'default'}`;

  return new Promise<void>((resolve) => {
    const existing = syncEntries.get(key);
    if (existing) {
      clearTimeout(existing.timer);
      existing.resolvers.push(resolve);
      existing.timer = setTimeout(async () => {
        await executeSync(key, routeCode, date);
      }, 1000);
    } else {
      const entry: PendingSync = {
        resolvers: [resolve],
        timer: setTimeout(async () => {
          await executeSync(key, routeCode, date);
        }, 1000),
      };
      syncEntries.set(key, entry);
    }
  });
}

async function executeSync(key: string, routeCode: string, date?: string): Promise<void> {
  const entry = syncEntries.get(key);
  syncEntries.delete(key);

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routeCode,
        date,
      }),
    });
  } catch (err) {
    console.warn('[RealtimeSync] Gagal memicu Edge Function sheet-sync-webhook:', err);
  } finally {
    if (entry) {
      entry.resolvers.forEach((res) => {
        try {
          res();
        } catch {}
      });
    }
  }
}

/**
 * Menghasilkan nama channel unik yang valid untuk Supabase Realtime Broadcast.
 */
export function getBusSyncChannelName(sheetId: string, tabName: string): string {
  const cleanSheet = (sheetId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
  const cleanTab = (tabName || '').replace(/[^a-zA-Z0-9_-]/g, '');
  return `bus-sync-${cleanSheet}-${cleanTab}`;
}

export interface BusUpdateBroadcastPayload {
  sheetId: string;
  tabName: string;
  rowIndex: number;
  updates: Partial<BusData>;
  senderId?: string;
  timestamp?: number;
}

/**
 * Menyiarkan (broadcast) mutasi unit bus ke seluruh peranti yang sedang membuka rute & tab yang sama.
 */
export async function broadcastBusUpdate(
  payload: BusUpdateBroadcastPayload
): Promise<void> {
  if (!isSupabaseConfigured || !payload.sheetId || !payload.tabName) return;

  try {
    const channelName = getBusSyncChannelName(payload.sheetId, payload.tabName);
    const channel = supabase.channel(channelName);

    // Kirim pesan broadcast peer-to-peer tanpa menulis ke database
    await channel.send({
      type: 'broadcast',
      event: 'BUS_UPDATED',
      payload: {
        ...payload,
        senderId: getClientSessionId(),
        timestamp: Date.now(),
      },
    });
  } catch (err) {
    console.warn('[RealtimeSync] Gagal menyiarkan update bus broadcast:', err);
  }
}

/**
 * Berlangganan (subscribe) ke siaran perubahan kartu bus pada sheet & tab yang sedang dibuka.
 */
export function subscribeToBusUpdates(
  sheetId: string,
  tabName: string,
  onUpdate: (data: { rowIndex: number; updates: Partial<BusData> }) => void
): () => void {
  if (!isSupabaseConfigured || !sheetId || !tabName) {
    return () => {};
  }

  const channelName = getBusSyncChannelName(sheetId, tabName);
  const channel = supabase.channel(channelName);

  channel
    .on(
      'broadcast' as any,
      { event: 'BUS_UPDATED' },
      (event: any) => {
        const p = event?.payload as BusUpdateBroadcastPayload | undefined;
        if (!p) return;

        // Jangan terapkan jika perubahan berasal dari jendela/peranti sendiri (sudah di-update lokal secara optimistic)
        if (p.senderId === getClientSessionId()) return;

        if (typeof p.rowIndex === 'number' && p.updates) {
          onUpdate({
            rowIndex: p.rowIndex,
            updates: p.updates,
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
