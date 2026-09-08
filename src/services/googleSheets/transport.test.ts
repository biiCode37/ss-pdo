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
} from './transport';
import { supabase } from '../supabase';

describe('transport adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTransportMode('auto');
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
});
