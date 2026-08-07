import { describe, it, expect } from 'vitest';
import { extractSpreadsheetId, matchRouteSheetById } from './sheetIdentity';
import type { Route } from '../types/supabase';

describe('extractSpreadsheetId', () => {
  it('extracts ID from standard Google Sheets URL', () => {
    const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit';
    expect(extractSpreadsheetId(url)).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms');
  });

  it('extracts ID from URL with query string', () => {
    const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit?usp=sharing';
    expect(extractSpreadsheetId(url)).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms');
  });

  it('extracts ID from URL with fragment', () => {
    const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit#gid=0';
    expect(extractSpreadsheetId(url)).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms');
  });

  it('accepts raw spreadsheet ID (long alphanumeric)', () => {
    const rawId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms';
    expect(extractSpreadsheetId(rawId)).toBe(rawId);
  });

  it('accepts raw ID with dashes and underscores', () => {
    const rawId = '1Bxi-MVs0_XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2up';
    expect(extractSpreadsheetId(rawId)).toBe(rawId);
  });

  it('returns null for short/invalid string', () => {
    expect(extractSpreadsheetId('abc')).toBeNull();
    expect(extractSpreadsheetId('12345')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractSpreadsheetId('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(extractSpreadsheetId('   ')).toBeNull();
  });

  it('returns null for non-sheets URL', () => {
    expect(extractSpreadsheetId('https://example.com/page')).toBeNull();
  });
});

describe('matchRouteSheetById', () => {
  const mockRoutes: Route[] = [
    {
      id: 1,
      uuid: 'r1',
      route_code: 'JAK.76',
      route_name: 'Jakarta 76',
      is_active: true,
      created_at: '',
      updated_at: '',
      route_sheets: [
        {
          id: 10,
          uuid: 's1',
          route_id: 1,
          year: 2026,
          month: 8,
          spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
          sheet_url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit',
          tab_name: 'PDO',
          created_at: '',
          updated_at: '',
        },
      ],
    },
    {
      id: 2,
      uuid: 'r2',
      route_code: 'BDG.12',
      route_name: 'Bandung 12',
      is_active: true,
      created_at: '',
      updated_at: '',
      route_sheets: [
        {
          id: 20,
          uuid: 's2',
          route_id: 2,
          year: 2026,
          month: 7,
          spreadsheet_id: 'AAAABBBBCCCCDDDDEEEEFFFFGGGG',
          sheet_url: 'https://docs.google.com/spreadsheets/d/AAAABBBBCCCCDDDDEEEEFFFFGGGG/edit',
          tab_name: 'PDO',
          created_at: '',
          updated_at: '',
        },
      ],
    },
  ];

  it('finds match by spreadsheet ID', () => {
    const result = matchRouteSheetById(mockRoutes, '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms');
    expect(result).not.toBeNull();
    expect(result!.route.route_code).toBe('JAK.76');
    expect(result!.sheet.id).toBe(10);
  });

  it('finds match by full URL', () => {
    const result = matchRouteSheetById(
      mockRoutes,
      'https://docs.google.com/spreadsheets/d/AAAABBBBCCCCDDDDEEEEFFFFGGGG/edit?usp=sharing'
    );
    expect(result).not.toBeNull();
    expect(result!.route.route_code).toBe('BDG.12');
  });

  it('returns null when no match', () => {
    const result = matchRouteSheetById(mockRoutes, 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZ');
    expect(result).toBeNull();
  });

  it('returns null for invalid input', () => {
    expect(matchRouteSheetById(mockRoutes, '')).toBeNull();
    expect(matchRouteSheetById(mockRoutes, 'abc')).toBeNull();
  });

  it('handles routes without sheets gracefully', () => {
    const routesNoSheets: Route[] = [
      { id: 3, uuid: 'r3', route_code: 'X', route_name: 'X', is_active: true, created_at: '', updated_at: '' },
    ];
    expect(matchRouteSheetById(routesNoSheets, '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms')).toBeNull();
  });
});
