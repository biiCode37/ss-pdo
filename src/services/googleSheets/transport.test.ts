// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSpreadsheets = {
  get: vi.fn(),
  values: {
    get: vi.fn(),
    batchGet: vi.fn(),
    batchUpdate: vi.fn(),
  },
  batchUpdate: vi.fn(),
};

const mockGapi = {
  client: {
    sheets: {
      spreadsheets: mockSpreadsheets,
    },
  },
};

vi.mock('../supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('./auth', () => ({
  withAuthRetry: vi.fn((fn) => fn()),
  ensureValidToken: vi.fn(),
  getGapi: vi.fn(() => mockGapi),
  getGoogleAccessToken: vi.fn(async () => 'google-token'),
}));

import {
  checkProxyHealth,
  setTransportMode,
  fetchSpreadsheetMeta,
  fetchSheetValues,
  fetchSheetValuesBatch,
  updateSheetValuesBatch,
  batchUpdateSpreadsheet,
  isUsingServiceAccount,
  PROXY_SESSION_STORAGE_KEY,
} from './transport';
import { supabase } from '../supabase';
import { getGoogleAccessToken } from './auth';

describe('transport adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTransportMode('auto');
    localStorage.clear();
  });

  it('menukar token Google dengan sesi proxy sekali lalu mengirimnya di setiap panggilan (BUG-SEC-205-01)', async () => {
    (supabase.functions.invoke as any).mockImplementation((_fnName: string, options: any) => {
      if (options.body.action === 'health') {
        return Promise.resolve({ data: { ok: true, configured: true }, error: null });
      }
      if (options.body.action === 'session') {
        return Promise.resolve({
          data: { sessionToken: 'SESSION-1', expiresAt: Date.now() + 12 * 3600 * 1000 },
          error: null,
        });
      }
      return Promise.resolve({ data: { values: [['ok']] }, error: null });
    });

    await fetchSheetValues('sheet123', 'A1:B2');
    await fetchSheetValues('sheet123', 'C1:D2');

    const calls = (supabase.functions.invoke as any).mock.calls;
    const sessionCalls = calls.filter((c: any[]) => c[1].body.action === 'session');
    expect(sessionCalls).toHaveLength(1);
    expect(sessionCalls[0][1].headers).toEqual({ 'x-google-token': 'google-token' });

    const valueCalls = calls.filter((c: any[]) => c[1].body.action === 'values.get');
    expect(valueCalls).toHaveLength(2);
    for (const c of valueCalls) {
      expect(c[1].headers).toEqual({ 'x-proxy-session': 'SESSION-1' });
    }
    expect(JSON.parse(localStorage.getItem(PROXY_SESSION_STORAGE_KEY) || '{}').sessionToken).toBe('SESSION-1');
  });

  it('memperbarui sesi sekali saat proxy menolak 401, lalu mengulang permintaan', async () => {
    localStorage.setItem(
      PROXY_SESSION_STORAGE_KEY,
      JSON.stringify({ sessionToken: 'OLD', expiresAt: Date.now() + 3600 * 1000 })
    );
    (supabase.functions.invoke as any).mockImplementation((_fnName: string, options: any) => {
      if (options.body.action === 'health') {
        return Promise.resolve({ data: { ok: true, configured: true }, error: null });
      }
      if (options.body.action === 'session') {
        return Promise.resolve({
          data: { sessionToken: 'NEW', expiresAt: Date.now() + 12 * 3600 * 1000 },
          error: null,
        });
      }
      if (options.headers?.['x-proxy-session'] === 'OLD') {
        return Promise.resolve({ data: null, error: { message: 'non-2xx', context: { status: 401 } } });
      }
      return Promise.resolve({ data: { values: [['fresh']] }, error: null });
    });

    const res = await fetchSheetValues('sheet123', 'A1:B2');
    expect(res.result.values[0][0]).toBe('fresh');
    const valueCalls = (supabase.functions.invoke as any).mock.calls.filter(
      (c: any[]) => c[1].body.action === 'values.get'
    );
    expect(valueCalls.map((c: any[]) => c[1].headers['x-proxy-session'])).toEqual(['OLD', 'NEW']);
  });

  it('memicu prompt re-auth bila sesi ditolak dan token Google tidak tersedia', async () => {
    localStorage.setItem(
      PROXY_SESSION_STORAGE_KEY,
      JSON.stringify({ sessionToken: 'OLD', expiresAt: Date.now() + 3600 * 1000 })
    );
    vi.mocked(getGoogleAccessToken).mockResolvedValueOnce(null);
    const onExpired = vi.fn();
    window.addEventListener('google-auth-expired', onExpired);
    (supabase.functions.invoke as any).mockImplementation((_fnName: string, options: any) => {
      if (options.body.action === 'health') {
        return Promise.resolve({ data: { ok: true, configured: true }, error: null });
      }
      return Promise.resolve({ data: null, error: { message: 'non-2xx', context: { status: 401 } } });
    });

    await expect(fetchSheetValues('sheet123', 'A1:B2')).rejects.toThrow();
    expect(onExpired).toHaveBeenCalledTimes(1);
    const valueCalls = (supabase.functions.invoke as any).mock.calls.filter(
      (c: any[]) => c[1].body.action === 'values.get'
    );
    expect(valueCalls).toHaveLength(1);
    window.removeEventListener('google-auth-expired', onExpired);
  });

  it('detects active proxy when Edge Function reports configured: true', async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: { ok: true, configured: true, client_email: 'service-bot@example.com' },
      error: null,
    });

    const status = await checkProxyHealth(true);
    expect(status.active).toBe(true);
    expect(status.clientEmail).toBe('service-bot@example.com');
    expect(isUsingServiceAccount()).toBe(true);
  });

  it('routes fetchSpreadsheetMeta to Edge Function when proxy is active', async () => {
    (supabase.functions.invoke as any).mockImplementation((_fnName: string, options: any) => {
      if (options.body.action === 'health') {
        return Promise.resolve({ data: { ok: true, configured: true }, error: null });
      }
      if (options.body.action === 'spreadsheets.get') {
        return Promise.resolve({
          data: { sheets: [{ properties: { title: 'Sheet1', sheetId: 0 } }] },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const res = await fetchSpreadsheetMeta('sheet123', 'sheets.properties');
    expect(res.result.sheets[0].properties.title).toBe('Sheet1');
    expect(supabase.functions.invoke).toHaveBeenCalledWith('sheets-proxy', expect.objectContaining({
      body: expect.objectContaining({ action: 'spreadsheets.get', spreadsheetId: 'sheet123' }),
    }));
  });

  it('routes fetchSheetValues to Edge Function when proxy is active', async () => {
    (supabase.functions.invoke as any).mockImplementation((_fnName: string, options: any) => {
      if (options.body.action === 'health') {
        return Promise.resolve({ data: { ok: true, configured: true }, error: null });
      }
      if (options.body.action === 'values.get') {
        return Promise.resolve({
          data: { values: [['Unit', 'TOA']] },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const res = await fetchSheetValues('sheet123', 'A1:B10');
    expect(res.result.values[0][0]).toBe('Unit');
  });

  it('routes batch operations to Edge Function when proxy is active', async () => {
    (supabase.functions.invoke as any).mockImplementation((_fnName: string, options: any) => {
      if (options.body.action === 'health') {
        return Promise.resolve({ data: { ok: true, configured: true }, error: null });
      }
      if (options.body.action === 'values.batchGet') {
        return Promise.resolve({
          data: { valueRanges: [{ values: [['50']] }] },
          error: null,
        });
      }
      if (options.body.action === 'values.batchUpdate') {
        return Promise.resolve({
          data: { totalUpdatedCells: 1 },
          error: null,
        });
      }
      if (options.body.action === 'batchUpdate') {
        return Promise.resolve({
          data: { replies: [] },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const batchGetRes = await fetchSheetValuesBatch('sheet123', ['1!A1:B10']);
    expect(batchGetRes.result.valueRanges[0].values[0][0]).toBe('50');

    const batchUpdateRes = await updateSheetValuesBatch('sheet123', {
      valueInputOption: 'USER_ENTERED',
      data: [{ range: '1!A1', values: [['100']] }],
    });
    expect(batchUpdateRes.result.totalUpdatedCells).toBe(1);

    const structuralRes = await batchUpdateSpreadsheet('sheet123', []);
    expect(structuralRes.result.replies).toBeDefined();
  });

  it('falls back to gapi when transport mode is client_oauth', async () => {
    setTransportMode('client_oauth');

    mockSpreadsheets.get.mockResolvedValue({
      result: { sheets: [] },
    });

    const res = await fetchSpreadsheetMeta('sheet123');
    expect(mockSpreadsheets.get).toHaveBeenCalledWith({ spreadsheetId: 'sheet123', fields: undefined });
    expect(res.result.sheets).toBeDefined();
  });

  it('throws friendly error when sheets-proxy returns SPREADSHEET_NOT_ALLOWED (403)', async () => {
    (supabase.functions.invoke as any).mockImplementation((_fnName: string, options: any) => {
      if (options.body.action === 'health') {
        return Promise.resolve({ data: { ok: true, configured: true }, error: null });
      }
      return Promise.resolve({
        data: {
          error: 'Akses ditolak: Spreadsheet ID tidak terdaftar dalam rute operasional resmi.',
          code: 'SPREADSHEET_NOT_ALLOWED',
        },
        error: null,
      });
    });

    await expect(fetchSpreadsheetMeta('unregistered_sheet_id')).rejects.toThrow(
      'Akses ditolak: Spreadsheet ID tidak terdaftar dalam rute operasional resmi.'
    );
  });
});
