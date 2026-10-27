import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getClientSessionId,
  getBusSyncChannelName,
  triggerRealtimeSheetSync,
  broadcastBusUpdate,
  subscribeToBusUpdates,
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
        body: JSON.stringify({ routeCode: 'JAK.60', date: '2026-10-24' }),
      })
    );

    vi.unstubAllGlobals();
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
