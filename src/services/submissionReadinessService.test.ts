// src/services/submissionReadinessService.test.ts
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn();
const builder = { select: vi.fn(), eq: vi.fn(), gte: vi.fn(), lte: vi.fn(), order: vi.fn() };
vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { from: vi.fn(() => builder), functions: { invoke: (...a: unknown[]) => invoke(...a) } },
}));
vi.mock('./googleSheets/transport', () => ({
  getProxySession: vi.fn(async (force?: boolean) => (force ? 'NEW' : 'OLD')),
  clearProxySession: vi.fn(),
}));

import { confirmRouteSubmission, ConfirmSubmissionError, fetchConfirmationsInRange } from './submissionReadinessService';
import { supabase } from './supabase';

describe('submissionReadinessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    builder.select.mockReturnValue(builder);
    builder.gte.mockReturnValue(builder);
    builder.lte.mockResolvedValue({ data: [{ route_id: 1 }], error: null });
  });

  it('fetchConfirmationsInRange memakai 1 request dengan rentang tanggal', async () => {
    const rows = await fetchConfirmationsInRange('2026-10-31', '2026-11-07');
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith('route_submission_confirmations');
    expect(builder.gte).toHaveBeenCalledWith('date', '2026-10-31');
    expect(builder.lte).toHaveBeenCalledWith('date', '2026-11-07');
    expect(rows).toEqual([{ route_id: 1 }]);
  });

  it('mengirim sesi proxy dan mengembalikan konfirmasi', async () => {
    invoke.mockResolvedValueOnce({ data: { ok: true, confirmation: { route_id: 1 } }, error: null });
    const c = await confirmRouteSubmission({ routeId: 1, date: '2026-11-07' });
    expect(c).toEqual({ route_id: 1 });
    expect(invoke).toHaveBeenCalledWith('route-confirmation', {
      body: { routeId: 1, date: '2026-11-07' },
      headers: { 'x-proxy-session': 'OLD' },
    });
  });

  it('memperbarui sesi sekali saat PROXY_SESSION_INVALID lalu mengulang', async () => {
    const err401 = { context: { json: async () => ({ code: 'PROXY_SESSION_INVALID' }) } };
    invoke
      .mockResolvedValueOnce({ data: null, error: err401 })
      .mockResolvedValueOnce({ data: { ok: true, confirmation: { route_id: 2 } }, error: null });
    const c = await confirmRouteSubmission({ routeId: 2, date: '2026-11-07' });
    expect(c).toEqual({ route_id: 2 });
    expect(invoke.mock.calls[1][1].headers).toEqual({ 'x-proxy-session': 'NEW' });
  });

  it('melempar kode error dari server', async () => {
    invoke.mockResolvedValueOnce({ data: null, error: { context: { json: async () => ({ code: 'REASON_REQUIRED' }) } } });
    await expect(confirmRouteSubmission({ routeId: 1, date: '2026-11-07' })).rejects.toMatchObject({ code: 'REASON_REQUIRED' });
  });

  it('menolak saat offline tanpa memanggil server', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    try {
      await expect(confirmRouteSubmission({ routeId: 1, date: '2026-11-07' })).rejects.toBeInstanceOf(ConfirmSubmissionError);
      expect(invoke).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    }
  });
});

