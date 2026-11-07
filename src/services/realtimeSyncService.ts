import { supabase, isSupabaseConfigured } from './supabase';
import type { BusData } from './googleSheets/types';

// URL Edge Function webhook diturunkan dari proyek aktif (VITE_SUPABASE_URL) agar ikut berpindah saat migrasi proyek;
// URL lama yang di-hardcode membuat sinkron produksi tetap menembak proyek lama setelah migrasi 6 Nov 2026 (BUG-MIG-202-01)
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');

export const WEBHOOK_URL =
  import.meta.env.VITE_SHEET_SYNC_WEBHOOK_URL || `${SUPABASE_URL}/functions/v1/sheet-sync-webhook`;

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
  if (!routeCode || !isSupabaseConfigured) return;

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

/** Satu panggilan webhook sheet-sync; true bila server menjawab sukses (termasuk "skipped" karena cooldown server). */
async function postSheetSync(routeCode: string, date?: string): Promise<boolean> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(anonKey
          ? {
              apikey: anonKey,
              Authorization: 'Bearer ' + anonKey,
            }
          : {}),
      },
      body: JSON.stringify({
        routeCode,
        date,
      }),
    });
    return Boolean(res?.ok);
  } catch (err) {
    console.warn('[RealtimeSync] Gagal memicu Edge Function sheet-sync-webhook:', err);
    return false;
  }
}

async function executeSync(key: string, routeCode: string, date?: string): Promise<void> {
  const entry = syncEntries.get(key);
  syncEntries.delete(key);

  try {
    await postSheetSync(routeCode, date);
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

// Cek ulang semua rute (refact_227): tiap rute = 1 Edge Function + 1 baca Google Sheets + beberapa log,
// jadi dibatasi 3 request bersamaan dan jeda 2 menit antar-penekanan.
export const RECHECK_ALL_CONCURRENCY = 3;
export const RECHECK_ALL_COOLDOWN_MS = 2 * 60 * 1000;
// ponytail: jeda disimpan di memori modul (hilang saat halaman dimuat ulang); cukup selama webhook punya cooldown server 3 dtk per rute.
let lastRecheckAllAt = 0;
let recheckAllInFlight = false;

export type RecheckAllResult =
  | { status: 'done'; total: number; failed: number }
  | { status: 'cooldown'; remainingMs: number }
  | { status: 'busy' }
  | { status: 'offline' };

/**
 * Membaca ulang kelengkapan beberapa rute sekaligus lewat webhook sheet-sync (tanggal eksplisit).
 * Hasilnya sampai ke layar lewat Realtime/reload pemanggil; fungsi ini hanya melaporkan progres dan jumlah gagal.
 */
export async function recheckRoutesCompleteness(
  routeCodes: string[],
  date: string,
  onProgress?: (done: number, total: number) => void,
): Promise<RecheckAllResult> {
  if (recheckAllInFlight) return { status: 'busy' };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { status: 'offline' };
  const elapsed = Date.now() - lastRecheckAllAt;
  if (lastRecheckAllAt > 0 && elapsed < RECHECK_ALL_COOLDOWN_MS) {
    return { status: 'cooldown', remainingMs: RECHECK_ALL_COOLDOWN_MS - elapsed };
  }

  const codes = [...new Set(routeCodes.filter(Boolean))];
  const total = codes.length;
  if (!isSupabaseConfigured || total === 0) return { status: 'done', total, failed: 0 };

  recheckAllInFlight = true;
  lastRecheckAllAt = Date.now();
  onProgress?.(0, total); // umpan balik seketika sebelum rute pertama selesai
  let next = 0;
  let done = 0;
  let failed = 0;
  const worker = async () => {
    while (next < total) {
      const code = codes[next++];
      if (!(await postSheetSync(code, date))) failed++;
      done++;
      onProgress?.(done, total);
    }
  };
  try {
    await Promise.all(Array.from({ length: Math.min(RECHECK_ALL_CONCURRENCY, total) }, worker));
  } finally {
    recheckAllInFlight = false;
  }
  return { status: 'done', total, failed };
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
