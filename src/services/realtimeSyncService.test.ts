import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getClientSessionId,
  getBusSyncChannelName,
  triggerRealtimeSheetSync,
  broadcastBusUpdate,
  subscribeToBusUpdates,
  recheckRoutesCompleteness,
  RECHECK_ALL_CONCURRENCY,
  RECHECK_ALL_COOLDOWN_MS,
} from './realtimeSyncService';
import { supabase } from './supabase';

vi.mock('./supabase', () => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    send: vi.fn().mockResolvedValue('ok'),
  };
  return {
    isSupabaseConfigured: true,
    supabase: {
      channel: vi.fn(() => mockChannel),
      removeChannel: vi.fn(),
    },
  };
});

describe('realtimeSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates a consistent runtime client session ID', () => {
    const id1 = getClientSessionId();
    const id2 = getClientSessionId();
    expect(id1).toBeTruthy();
    expect(id1).toBe(id2);
  });

  it('sanitizes and formats channel name correctly', () => {
    const channelName = getBusSyncChannelName('sheet-123/special!@#', '24');
    expect(channelName).toContain('bus-sync-');
    expect(channelName).not.toContain('!');
    expect(channelName).not.toContain('/');
    expect(channelName).toContain('24');
  });

  it('triggers sheet sync webhook with debounce', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    // Call twice rapidly with same route
    const p1 = triggerRealtimeSheetSync('JAK.60', '2026-10-24');
    const p2 = triggerRealtimeSheetSync('JAK.60', '2026-10-24');

    expect(fetchMock).not.toHaveBeenCalled();

    // Fast-forward debounce timer
    vi.advanceTimersByTime(1100);
    await Promise.all([p1, p2]);

    // Should only be called ONCE due to debounce
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('sheet-sync-webhook'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          apikey: expect.any(String),
          Authorization: expect.stringContaining('Bearer '),
        }),
        body: JSON.stringify({ routeCode: 'JAK.60', date: '2026-10-24' }),
      })
    );

    vi.unstubAllGlobals();
  });

  it('menurunkan URL webhook dari VITE_SUPABASE_URL agar ikut proyek aktif (BUG-MIG-202-01)', async () => {
    vi.stubEnv('VITE_SHEET_SYNC_WEBHOOK_URL', '');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://projekbaru.supabase.co/');
    vi.resetModules();
    const mod = await import('./realtimeSyncService');
    expect(mod.WEBHOOK_URL).toBe('https://projekbaru.supabase.co/functions/v1/sheet-sync-webhook');
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('memakai VITE_SHEET_SYNC_WEBHOOK_URL bila diisi eksplisit', async () => {
    vi.stubEnv('VITE_SHEET_SYNC_WEBHOOK_URL', 'https://override.example/hook');
    vi.resetModules();
    const mod = await import('./realtimeSyncService');
    expect(mod.WEBHOOK_URL).toBe('https://override.example/hook');
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('broadcasts bus update via supabase channel', async () => {
    const mockChannel = supabase.channel('test');

    await broadcastBusUpdate({
      sheetId: 'sheet-xyz-123',
      tabName: '24',
      rowIndex: 5,
      updates: { toaShift1: '150' },
    });

    expect(mockChannel.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'broadcast',
        event: 'BUS_UPDATED',
        payload: expect.objectContaining({
          sheetId: 'sheet-xyz-123',
          tabName: '24',
          rowIndex: 5,
          updates: { toaShift1: '150' },
          senderId: getClientSessionId(),
        }),
      })
    );
  });

  it('subscribes to bus updates and filters out updates from self', () => {
    let capturedHandler: any = null;
    const mockChannel = {
      on: vi.fn((_type, _filter, handler) => {
        capturedHandler = handler;
        return mockChannel;
      }),
      subscribe: vi.fn(),
    };
    (supabase.channel as any).mockReturnValue(mockChannel);

    const onUpdateMock = vi.fn();
    const unsubscribe = subscribeToBusUpdates('sheet-xyz-123', '24', onUpdateMock);

    expect(supabase.channel).toHaveBeenCalledWith(
      expect.stringContaining('bus-sync-')
    );
    expect(mockChannel.on).toHaveBeenCalled();
    expect(mockChannel.subscribe).toHaveBeenCalled();

    // 1. Simulate update from self -> MUST IGNORE
    capturedHandler({
      payload: {
        senderId: getClientSessionId(),
        rowIndex: 5,
        updates: { toaShift1: '200' },
      },
    });
    expect(onUpdateMock).not.toHaveBeenCalled();

    // 2. Simulate update from another device -> MUST APPLY
    capturedHandler({
      payload: {
        senderId: 'other-device-session-999',
        rowIndex: 5,
        updates: { toaShift1: '250' },
      },
    });
    expect(onUpdateMock).toHaveBeenCalledWith({
      rowIndex: 5,
      updates: { toaShift1: '250' },
    });

    // Clean up
    unsubscribe();
    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });
});

describe('recheckRoutesCompleteness (cek ulang semua rute)', () => {
  // Waktu sistem dimajukan per test agar jeda antar-penekanan (state modul) tidak saling memengaruhi
  let clock = Date.UTC(2026, 10, 8, 10, 0, 0);
  beforeEach(() => {
    clock += 10 * 60 * 1000;
    vi.useFakeTimers();
    vi.setSystemTime(clock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('memicu webhook tepat sekali per rute (tanpa duplikat) dengan tanggal eksplisit dan melaporkan progres', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const progress: Array<[number, number]> = [];

    const result = await recheckRoutesCompleteness(['JAK.01', 'JAK.02', 'JAK.01', 'JAK.03'], '2026-11-07', (d, t) => progress.push([d, t]));

    expect(result).toEqual({ status: 'done', total: 3, failed: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const bodies = fetchMock.mock.calls.map((c) => JSON.parse(c[1].body));
    expect(bodies).toEqual([
      { routeCode: 'JAK.01', date: '2026-11-07' },
      { routeCode: 'JAK.02', date: '2026-11-07' },
      { routeCode: 'JAK.03', date: '2026-11-07' },
    ]);
    expect(progress[0]).toEqual([0, 3]);
    expect(progress[progress.length - 1]).toEqual([3, 3]);
  });

  it(`membatasi paling banyak ${RECHECK_ALL_CONCURRENCY} request webhook berjalan bersamaan`, async () => {
    let active = 0;
    let peak = 0;
    const fetchMock = vi.fn(async () => {
      active++;
      peak = Math.max(peak, active);
      await Promise.resolve();
      await Promise.resolve();
      active--;
      return { ok: true };
    });
    vi.stubGlobal('fetch', fetchMock);
    const codes = Array.from({ length: 18 }, (_, i) => `JAK.${String(i + 1).padStart(2, '0')}`);

    const result = await recheckRoutesCompleteness(codes, '2026-11-08');

    expect(fetchMock).toHaveBeenCalledTimes(18);
    expect(peak).toBe(RECHECK_ALL_CONCURRENCY);
    expect(result).toEqual({ status: 'done', total: 18, failed: 0 });
  });

  it('menghitung rute yang gagal (HTTP error atau jaringan) tanpa menghentikan rute lain', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockRejectedValueOnce(new Error('network'));
    vi.stubGlobal('fetch', fetchMock);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await recheckRoutesCompleteness(['A', 'B', 'C'], '2026-11-08');

    expect(result).toEqual({ status: 'done', total: 3, failed: 2 });
    warn.mockRestore();
  });

  it('menolak penekanan ulang selama jeda 2 menit tanpa request apa pun, lalu boleh lagi setelah jeda lewat', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await recheckRoutesCompleteness(['A'], '2026-11-08');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(30_000);
    const blocked = await recheckRoutesCompleteness(['A'], '2026-11-08');
    expect(blocked).toEqual({ status: 'cooldown', remainingMs: RECHECK_ALL_COOLDOWN_MS - 30_000 });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(RECHECK_ALL_COOLDOWN_MS);
    const again = await recheckRoutesCompleteness(['A'], '2026-11-08');
    expect(again.status).toBe('done');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('mengabaikan penekanan kedua saat cek ulang semua masih berjalan (in-flight guard)', async () => {
    let release: () => void = () => {};
    const fetchMock = vi.fn(() => new Promise((resolve) => { release = () => resolve({ ok: true }); }));
    vi.stubGlobal('fetch', fetchMock);

    const first = recheckRoutesCompleteness(['A'], '2026-11-08');
    const second = await recheckRoutesCompleteness(['A'], '2026-11-08');
    expect(second).toEqual({ status: 'busy' });

    release();
    await expect(first).resolves.toEqual({ status: 'done', total: 1, failed: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('tidak mengirim request dan tidak memulai jeda saat perangkat offline', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('navigator', { onLine: false });

    expect(await recheckRoutesCompleteness(['A'], '2026-11-08')).toEqual({ status: 'offline' });
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubGlobal('navigator', { onLine: true });
    expect((await recheckRoutesCompleteness(['A'], '2026-11-08')).status).toBe('done');
  });
});
