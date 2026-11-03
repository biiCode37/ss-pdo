import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getWibDateParts,
  formatBackupFileName,
  generateBackupManifest,
  fetchActiveRouteSheets,
  downloadSpreadsheetAsXlsx,
} from '../run-backup.mjs';

describe('Backup Engine Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('computes correct WIB (UTC+7) date parts regardless of runner timezone', () => {
    // UTC 2026-11-01 19:30:00 -> WIB 2026-11-02 02:30:00
    const testDate = new Date('2026-11-01T19:30:00Z');
    const wib = getWibDateParts(testDate);
    expect(wib.year).toBe(2026);
    expect(wib.month).toBe(11);
    expect(wib.day).toBe(2);
    expect(wib.dateString).toBe('2026-11-02');
  });

  it('formats standardized backup filename with timestamp', () => {
    const filename = formatBackupFileName('2026-11-02', '020000');
    expect(filename).toBe('SS_PDO_BACKUP_2026-11-02_020000.zip');
  });

  it('generates valid backup manifest with metadata', () => {
    const manifest = generateBackupManifest({
      dateStr: '2026-11-02',
      timestampIso: '2026-11-02T02:00:00.000Z',
      hasDatabaseDump: true,
      routesBackedUp: [
        { routeCode: 'JAK.01', sheetId: 'sheet-01', sizeBytes: 15420 },
        { routeCode: 'JAK.60', sheetId: 'sheet-60', sizeBytes: 18230 },
      ],
    });

    expect(manifest.version).toBe('1.0.0');
    expect(manifest.date).toBe('2026-11-02');
    expect(manifest.databaseDumpPresent).toBe(true);
    expect(manifest.totalRoutes).toBe(2);
    expect(manifest.routes[0].routeCode).toBe('JAK.01');
    expect(manifest.routes[1].routeCode).toBe('JAK.60');
  });

  it('fetches active route sheets dynamically from Supabase REST endpoint', async () => {
    const mockSupabaseResponse = [
      {
        spreadsheet_id: 'sheet-jak01',
        year: 2026,
        month: 11,
        routes: { route_code: 'JAK.01' },
      },
      {
        spreadsheet_id: 'sheet-jak60',
        year: 2026,
        month: 11,
        routes: { route_code: 'JAK.60' },
      },
    ];

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSupabaseResponse,
    });

    const routes = await fetchActiveRouteSheets({
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
      year: 2026,
      month: 11,
      fetchImpl: mockFetch as any,
    });

    expect(routes).toHaveLength(2);
    expect(routes[0]).toEqual({ routeCode: 'JAK.01', sheetId: 'sheet-jak01' });
    expect(routes[1]).toEqual({ routeCode: 'JAK.60', sheetId: 'sheet-jak60' });
  });

  it('downloads spreadsheet as xlsx binary buffer from Google Drive API', async () => {
    const mockArrayBuffer = new TextEncoder().encode('mock-xlsx-binary-data').buffer;
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => mockArrayBuffer,
    });

    const buffer = await downloadSpreadsheetAsXlsx({
      sheetId: 'sheet-jak60',
      accessToken: 'google-token-123',
      fetchImpl: mockFetch as any,
    });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.toString()).toBe('mock-xlsx-binary-data');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('https://www.googleapis.com/drive/v3/files/sheet-jak60/export'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer google-token-123',
        }),
      })
    );
  });
});
