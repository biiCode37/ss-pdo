// src/components/monitoring/readiness/useSubmissionReadiness.test.tsx
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// @ts-expect-error flag React act
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const handlers: Array<(p: { new: Record<string, unknown> }) => void> = [];
const mockChannel = {
  on: vi.fn((_e: string, _f: unknown, cb: (p: { new: Record<string, unknown> }) => void) => { handlers.push(cb); return mockChannel; }),
  subscribe: vi.fn(() => mockChannel),
};
vi.mock('@/services/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { channel: vi.fn(() => mockChannel), removeChannel: vi.fn() },
}));
vi.mock('@/services/submissionReadinessService', () => ({
  fetchActiveRoutes: vi.fn().mockResolvedValue([{ id: 1, route_code: 'JAK.01' }]),
  fetchReadinessByDate: vi.fn().mockResolvedValue([]),
  fetchConfirmationsInRange: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/services/regionalIngestionService', () => ({ getWibTodayString: () => '2026-11-07' }));

import { useSubmissionReadiness, READINESS_REALTIME_DEBOUNCE_MS } from './useSubmissionReadiness';
import * as svc from '@/services/submissionReadinessService';
import { supabase } from '@/services/supabase';

let latest: ReturnType<typeof useSubmissionReadiness> | null = null;
function Probe({ date, enabled }: { date: string; enabled: boolean }) {
  latest = useSubmissionReadiness(date, enabled);
  return null;
}

describe('useSubmissionReadiness', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    handlers.length = 0;
    container = document.createElement('div');
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    vi.useRealTimers();
  });

  it('tepat 3 request saat mount (rute, kelengkapan, konfirmasi)', async () => {
    await act(async () => { root.render(<Probe date="2026-11-07" enabled />); });
    expect(svc.fetchActiveRoutes).toHaveBeenCalledTimes(1);
    expect(svc.fetchReadinessByDate).toHaveBeenCalledTimes(1);
    expect(svc.fetchConfirmationsInRange).toHaveBeenCalledTimes(1);
    expect(svc.fetchConfirmationsInRange).toHaveBeenCalledWith('2026-10-31', '2026-11-07');
  });

  it('tidak memuat apa pun saat disabled', async () => {
    await act(async () => { root.render(<Probe date="2026-11-07" enabled={false} />); });
    expect(svc.fetchReadinessByDate).not.toHaveBeenCalled();
    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('pesan Realtime beruntun diredam 3 detik dan diterapkan tanpa request tambahan', async () => {
    await act(async () => { root.render(<Probe date="2026-11-07" enabled />); });
    const completeness = { v: 1, status: 'ok', fingerprint: 'x', counts: {}, issues: [], computedAt: '' };
    await act(async () => {
      for (let i = 0; i < 5; i++) handlers[0]({ new: { route_id: 1, route_code: 'JAK.01', date: '2026-11-07', completeness, last_synced_at: `t${i}` } });
    });
    expect(latest?.rows).toEqual([]);
    await act(async () => { vi.advanceTimersByTime(READINESS_REALTIME_DEBOUNCE_MS); });
    expect(latest?.rows).toEqual([{ route_id: 1, route_code: 'JAK.01', completeness, last_synced_at: 't4' }]);
    expect(svc.fetchReadinessByDate).toHaveBeenCalledTimes(1);
  });

  it('membersihkan channel saat unmount', async () => {
    await act(async () => { root.render(<Probe date="2026-11-07" enabled />); });
    act(() => root.unmount());
    expect(supabase.removeChannel).toHaveBeenCalledTimes(1);
    root = createRoot(container);
  });
});
