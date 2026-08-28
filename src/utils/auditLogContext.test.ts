import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveRouteContext } from './auditLogContext';

vi.mock('./cacheUtils', () => ({
  getRoutesFromCache: vi.fn(() => [
    {
      id: 1,
      uuid: 'route-1',
      route_code: 'M-01',
      route_name: 'Rute M-01',
      is_active: true,
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
      route_sheets: [
        {
          id: 11,
          uuid: 'sheet-11',
          route_id: 1,
          year: 2026,
          month: 8,
          spreadsheet_id: 'sheet-abc',
          sheet_url: 'https://docs.google.com/spreadsheets/d/sheet-abc/edit',
          tab_name: 'PDO',
          created_at: '2026-08-01T00:00:00Z',
          updated_at: '2026-08-01T00:00:00Z',
        },
      ],
    },
  ]),
  findSheetInRoutes: vi.fn((routes, sheetId) => {
    for (const route of routes) {
      for (const sheet of route.route_sheets || []) {
        if (sheet.spreadsheet_id === sheetId) return { route, sheet };
      }
    }
    return null;
  }),
}));

describe('resolveRouteContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves route code and period from sheet id', () => {
    expect(resolveRouteContext('sheet-abc', '12')).toEqual({
      routeCode: 'M-01',
      year: 2026,
      month: 8,
      day: 12,
    });
  });

  it('omits day when tab name is not numeric', () => {
    expect(resolveRouteContext('sheet-abc', 'PDO')).toEqual({
      routeCode: 'M-01',
      year: 2026,
      month: 8,
    });
  });

  it('returns empty object for unknown sheet', () => {
    expect(resolveRouteContext('missing-sheet', '1')).toEqual({});
  });
});
