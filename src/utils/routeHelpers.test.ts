import { describe, it, expect } from 'vitest';
import { flattenRoutes } from './routeHelpers';
import type { Route } from '../types/supabase';

describe('routeHelpers - flattenRoutes', () => {
  it('flattens routes with multiple sheets properly', () => {
    const mockRoutes = [
      {
        id: 1,
        route_code: 'JAK.117',
        route_name: 'Terminal Tanah Abang',
        route_sheets: [
          {
            id: 101,
            route_id: 1,
            year: 2026,
            month: 8,
            spreadsheet_id: 'sheet-117-aug',
            sheet_url: 'https://docs.google.com/spreadsheets/d/sheet-117-aug/edit',
          },
          {
            id: 102,
            route_id: 1,
            year: 2026,
            month: 9,
            spreadsheet_id: 'sheet-117-sep',
            sheet_url: 'https://docs.google.com/spreadsheets/d/sheet-117-sep/edit',
          },
        ],
      },
      {
        id: 2,
        route_code: 'JAK.118',
        route_name: 'Kota Tua',
        route_sheets: [
          {
            id: 201,
            route_id: 2,
            year: 2026,
            month: 9,
            spreadsheet_id: 'sheet-118-sep',
            sheet_url: 'https://docs.google.com/spreadsheets/d/sheet-118-sep/edit',
          },
        ],
      },
    ] as unknown as Route[];

    const flat = flattenRoutes(mockRoutes);
    expect(flat).toHaveLength(3);
    expect(flat[0].routeCode).toBe('JAK.117');
    expect(flat[0].sheet.month).toBe(8);
    expect(flat[1].routeCode).toBe('JAK.117');
    expect(flat[1].sheet.month).toBe(9);
    expect(flat[2].routeCode).toBe('JAK.118');
    expect(flat[2].sheet.month).toBe(9);
  });

  it('handles empty routes and routes without route_sheets safely', () => {
    const emptyRoutes = [
      {
        id: 99,
        route_code: 'JAK.999',
        route_name: 'Rute Tanpa Sheet',
        route_sheets: [],
      },
    ] as unknown as Route[];

    const flat = flattenRoutes(emptyRoutes);
    expect(flat).toEqual([]);
  });
});
