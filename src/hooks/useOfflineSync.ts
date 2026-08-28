import { useState, useEffect, useCallback, useRef } from 'react';
import type { BusData, HeaderMap } from '../services/googleSheets';
import { updateBusData, getBusRowData } from '../services/googleSheets';
import { normalizeFieldValue } from '../utils/numberUtils';

const QUEUE_STORAGE_KEY = 'PDO_SYNC_QUEUE';
const MAX_RETRIES = 5;

export interface SyncItem {
  id: string;
  sheetId: string;
  tabName: string;
  rowIndex: number;
  updates: Partial<BusData>;
  headerMap: HeaderMap;
  status: 'pending' | 'failed' | 'conflict';
  retryCount: number;
  originalSnapshot?: Partial<BusData>;
}

/** Baca antrean dari localStorage secara atomik */
function readQueueFromStorage(): SyncItem[] {
  const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    // Migrasi data lama yang belum punya retryCount/originalSnapshot
    return parsed.map((item: any) => ({
      ...item,
      retryCount: item.retryCount ?? 0,
      status: item.status ?? 'pending',
    }));
  } catch {
    return [];
  }
}

import { backupSyncQueue, logActivity } from '../services/routeService';
import { resolveRouteContext } from '../utils/auditLogContext';

/** Tulis antrean ke localStorage dengan try-catch guard (ISS-06 fix) */
function writeQueueToStorage(queue: SyncItem[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('[useOfflineSync] Gagal menulis antrean ke localStorage (Quota/Disabled?):', err);
  }
}

import { isAuthError, isNetworkError } from '../utils/errorClassifier';
export { isNetworkError };

/** Deteksi collision: bandingkan data server dengan snapshot asli secara ter-normalisasi pada kolom yang diubah */
function detectCollision(
  remoteData: Partial<BusData>,
  originalSnapshot: Partial<BusData>
): boolean {
  const snapshotKeys = Object.keys(originalSnapshot) as (keyof BusData)[];
  const fieldsToCheck: (keyof BusData)[] = snapshotKeys.length > 0
    ? snapshotKeys
    : [
        'toaShift1', 'manualShift1', 'manualShift2', 'totalToa',
        'kmAwal1', 'kmAkhir1', 'kmAwal2', 'kmAkhir2', 'keterangan'
      ];

  for (const field of fieldsToCheck) {
    const remoteNorm = normalizeFieldValue(remoteData[field]);
    const origNorm = normalizeFieldValue(originalSnapshot[field]);
    if (remoteNorm !== origNorm) {
      return true;
    }
  }
  return false;
}

export interface UseOfflineSyncOptions {
  onSyncSuccess?: (rowIndex: number, sheetId: string, tabName: string, updates: Partial<BusData>) => void;
  onAuthError?: () => void;
}

export function useOfflineSync(options?: UseOfflineSyncOptions) {
  const [queue, setQueue] = useState<SyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Load initial queue
  useEffect(() => {
    setQueue(readQueueFromStorage());
  }, []);

  /**
   * Tambah item ke antrean — atomic read-modify-write (BUG-01 fix)
   * Jika baris yang sama sudah ada di antrean, ganti dengan data terbaru.
   * BUG-47: Side effect (localStorage write + backup network) dikeluarkan
   * dari setState updater — updater bisa di-invoke 2x oleh StrictMode,
   * menyebabkan backup ganda & race tulis storage.
   */
  const addToQueue = useCallback((
    item: Omit<SyncItem, 'id' | 'status' | 'retryCount'>
  ) => {
    // Baca langsung dari localStorage untuk menghindari data basi
    const currentQueue = readQueueFromStorage();
    const filtered = currentQueue.filter(
      q => !(q.sheetId === item.sheetId && q.tabName === item.tabName && q.rowIndex === item.rowIndex)
    );
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString() + Math.random().toString(36).substring(2, 7);

    const newItem: SyncItem = {
      ...item,
      id: uniqueId,
      status: 'pending',
      retryCount: 0,
    };
    const newQueue = [...filtered, newItem];
    writeQueueToStorage(newQueue);
    setQueue(newQueue);

    // ISS-06 FIX: Backup item antrean ke Supabase secara background jika memungkinkan
    const userEmail = localStorage.getItem('PDO_USER_EMAIL') || 'offline_user';
    backupSyncQueue({
      user_email: userEmail,
      spreadsheet_id: item.sheetId,
      tab_name: item.tabName,
      row_index: item.rowIndex,
      payload: item.updates,
      status: 'pending',
    }).catch(_e => {});
  }, []);

  /**
   * Proses antrean — atomic per-item (BUG-01), collision detection (BUG-02),
   * continue on non-auth error (BUG-03), onSyncSuccess callback (BUG-06)
   */
  const processQueue = useCallback(async () => {
    if (!navigator.onLine || isSyncingRef.current) return;

    const currentQueue = readQueueFromStorage();
    const pendingItems = currentQueue.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) return;

    isSyncingRef.current = true;
    setIsSyncing(true);

    for (const item of pendingItems) {
      try {
        // BUG-02: Collision detection di jalur antrean
        if (item.originalSnapshot) {
          const remoteData = await getBusRowData(item.sheetId, item.tabName, item.rowIndex, item.headerMap);
          if (detectCollision(remoteData, item.originalSnapshot)) {
            // Tandai sebagai conflict, JANGAN force-overwrite
            const freshQueue = readQueueFromStorage();
            const updated = freshQueue.map(q =>
              q.id === item.id ? { ...q, status: 'conflict' as const } : q
            );
            writeQueueToStorage(updated);
            setQueue(updated);
            continue; // Lanjut ke item berikutnya (BUG-03: tidak blocking)
          }
        }

        // Simpan ke Google Sheets
        await updateBusData(item.sheetId, item.tabName, item.rowIndex, item.updates, item.headerMap);

        // Telemetry: Log SYNC_OFFLINE_QUEUE
        const userEmail = localStorage.getItem('PDO_USER_EMAIL') || 'field_operator';
        const syncCtx = resolveRouteContext(item.sheetId, item.tabName);
        logActivity({
          user_email: userEmail,
          action: 'SYNC_OFFLINE_QUEUE',
          route_code: syncCtx.routeCode,
          details: {
            queueItemId: item.id,
            sheetId: item.sheetId,
            tabName: item.tabName,
            rowIndex: item.rowIndex,
            year: syncCtx.year,
            month: syncCtx.month,
            day: syncCtx.day,
          },
        }).catch(() => {});

        // BUG-01 FIX: Atomic remove — baca ulang localStorage SEKARANG, hapus HANYA item ini
        const freshQueue = readQueueFromStorage();
        const afterRemove = freshQueue.filter(q => q.id !== item.id);
        writeQueueToStorage(afterRemove);
        setQueue(afterRemove);

        // BUG-06: Notify Dashboard agar busData di-update
        if (optionsRef.current?.onSyncSuccess) {
          optionsRef.current.onSyncSuccess(item.rowIndex, item.sheetId, item.tabName, item.updates);
        }

        // Jeda sebelum item berikutnya (rate limit Google API)
        const remaining = afterRemove.filter(q => q.status === 'pending');
        if (remaining.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (err: any) {
        // Auth error: hentikan semua pemrosesan, beri tahu user
        if (isAuthError(err)) {
          if (optionsRef.current?.onAuthError) {
            optionsRef.current.onAuthError();
          }
          break;
        }

        // BUG-03: Non-auth error — increment retry, jangan blokir antrean
        const freshQueue = readQueueFromStorage();
        const newRetryCount = (item.retryCount || 0) + 1;

        if (newRetryCount >= MAX_RETRIES) {
          // Batas retry tercapai: tandai 'failed' (BUG-12 aktif)
          const updated = freshQueue.map(q =>
            q.id === item.id ? { ...q, status: 'failed' as const, retryCount: newRetryCount } : q
          );
          writeQueueToStorage(updated);
          setQueue(updated);
          continue;
        } else {
          // Increment retry counter. Retry berikutnya dijalankan oleh
          // scheduler periodik (45s) / event online — BUG-47: delay inline
          // dihapus karena hanya menghambat item antrean lain tanpa efek
          // (retryCount sudah persist; item tidak diproses ulang di loop ini).
          const updated = freshQueue.map(q =>
            q.id === item.id ? { ...q, retryCount: newRetryCount } : q
          );
          writeQueueToStorage(updated);
          setQueue(updated);
          continue;
        }
      }
    }

    isSyncingRef.current = false;
    setIsSyncing(false);
  }, []);

  /** Retry manual satu item yang berstatus 'failed' atau 'conflict' */
  const retryItem = useCallback((itemId: string) => {
    const currentQueue = readQueueFromStorage();
    const updated = currentQueue.map(q =>
      q.id === itemId ? { ...q, status: 'pending' as const, retryCount: 0 } : q
    );
    writeQueueToStorage(updated);
    setQueue(updated);
  }, []);

  /** Hapus satu item dari antrean (untuk item yang gagal permanen) */
  const removeItem = useCallback((itemId: string) => {
    const currentQueue = readQueueFromStorage();
    const updated = currentQueue.filter(q => q.id !== itemId);
    writeQueueToStorage(updated);
    setQueue(updated);
  }, []);

  /** BUG-22 FIX: Gunakan data server untuk item yang conflict dan update UI lokal */
  const resolveConflict = useCallback(async (itemId: string) => {
    const currentQueue = readQueueFromStorage();
    const item = currentQueue.find(q => q.id === itemId);
    if (item && optionsRef.current?.onSyncSuccess) {
      try {
        const remoteData = await getBusRowData(item.sheetId, item.tabName, item.rowIndex, item.headerMap);
        optionsRef.current.onSyncSuccess(item.rowIndex, item.sheetId, item.tabName, remoteData);
      } catch (err) {
        console.error("Failed to fetch server data on resolve conflict:", err);
      }
    }
    removeItem(itemId);
  }, [removeItem]);

  /** Force save item yang conflict */
  const forceConflictItem = useCallback((itemId: string) => {
    const currentQueue = readQueueFromStorage();
    const updated = currentQueue.map(q =>
      q.id === itemId
        ? { ...q, status: 'pending' as const, retryCount: 0, originalSnapshot: undefined }
        : q
    );
    writeQueueToStorage(updated);
    setQueue(updated);
  }, []);

  // Listen for online events
  useEffect(() => {
    window.addEventListener('online', processQueue);
    return () => window.removeEventListener('online', processQueue);
  }, [processQueue]);

  // BUG-24: Periodic retry scheduler for pending queue items
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        const currentQueue = readQueueFromStorage();
        const hasPending = currentQueue.some(item => item.status === 'pending');
        if (hasPending) {
          processQueue();
        }
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [processQueue]);

  // Initial attempt on load
  useEffect(() => {
    processQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return {
    queue,
    addToQueue,
    processQueue,
    isSyncing,
    retryItem,
    removeItem,
    resolveConflict,
    forceConflictItem,
  };
}
