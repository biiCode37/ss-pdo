import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CURRENT_CACHE_VERSION,
  checkAndMigrateCache,
  getRoutesFromCache,
  findSheetInRoutes,
  getRouteCodeForSheet,
  getMonthYearForSheet,
} from './cacheUtils';
import type { Route } from '../types/supabase';

// Mock localStorage in test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('cacheUtils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockRoutes: Route[] = [
    {
      id: 1,
      uuid: 'route-1',
      route_code: 'R01',
      route_name: 'Blok M - Kota',
      is_active: true,
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
      route_sheets: [
        {
          id: 101,
          uuid: 'sheet-101',
          route_id: 1,
          month: 8,
          year: 2026,
          sheet_url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
          spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
          tab_name: 'PDO',
          created_at: '2026-08-01T00:00:00Z',
          updated_at: '2026-08-01T00:00:00Z',
        },
      ],
    },
    {
      id: 2,
      uuid: 'route-2',
      route_code: 'R02',
      route_name: 'Pulo Gadung - Harmoni',
      is_active: true,
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
      route_sheets: [
        {
          id: 102,
          uuid: 'sheet-102',
          route_id: 2,
          month: 7,
          year: 2026,
          sheet_url: 'https://docs.google.com/spreadsheets/d/2ABC123xyz456789012345/edit',
          spreadsheet_id: '2ABC123xyz456789012345',
          tab_name: 'PDO',
          created_at: '2026-07-01T00:00:00Z',
          updated_at: '2026-07-01T00:00:00Z',
        },
      ],
    },
  ];

  describe('checkAndMigrateCache', () => {
    it('clears volatile route cache and updates version when cache version mismatches', () => {
      localStorage.setItem('PDO_APP_CACHE_VERSION', '5');
      localStorage.setItem('PDO_CACHE_ROUTES', JSON.stringify(mockRoutes));
      localStorage.setItem('GAPI_ACCESS_TOKEN', 'token-data');

      checkAndMigrateCache();

      expect(localStorage.getItem('PDO_APP_CACHE_VERSION')).toBe(CURRENT_CACHE_VERSION);
      expect(localStorage.getItem('PDO_CACHE_ROUTES')).toBeNull();
      // Auth token must NOT be cleared!
      expect(localStorage.getItem('GAPI_ACCESS_TOKEN')).toBe('token-data');
    });

    it('retains cache when version matches', () => {
      localStorage.setItem('PDO_APP_CACHE_VERSION', CURRENT_CACHE_VERSION);
      localStorage.setItem('PDO_CACHE_ROUTES', JSON.stringify(mockRoutes));

      checkAndMigrateCache();

      expect(localStorage.getItem('PDO_CACHE_ROUTES')).toBe(JSON.stringify(mockRoutes));
    });
  });

  describe('getRoutesFromCache', () => {
    it('returns parsed routes from localStorage', () => {
      localStorage.setItem('PDO_CACHE_ROUTES', JSON.stringify(mockRoutes));
      expect(getRoutesFromCache()).toEqual(mockRoutes);
    });

    it('returns empty array when cache is empty or corrupted', () => {
      expect(getRoutesFromCache()).toEqual([]);

      localStorage.setItem('PDO_CACHE_ROUTES', '{corrupted_json');
      expect(getRoutesFromCache()).toEqual([]);
    });
  });

  describe('findSheetInRoutes', () => {
    it('finds route and sheet by full spreadsheet URL', () => {
      const result = findSheetInRoutes(mockRoutes, 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit');
      expect(result).not.toBeNull();
      expect(result?.route.route_code).toBe('R01');
      expect(result?.sheet.month).toBe(8);
    });

    it('finds route and sheet by spreadsheet ID', () => {
      const result = findSheetInRoutes(mockRoutes, '2ABC123xyz456789012345');
      expect(result).not.toBeNull();
      expect(result?.route.route_code).toBe('R02');
      expect(result?.sheet.month).toBe(7);
    });

    it('returns null for non-matching sheet URL or ID', () => {
      const result = findSheetInRoutes(mockRoutes, 'unknown-sheet-id');
      expect(result).toBeNull();
    });
  });

  describe('getRouteCodeForSheet & getMonthYearForSheet', () => {
    beforeEach(() => {
      localStorage.setItem('PDO_CACHE_ROUTES', JSON.stringify(mockRoutes));
    });

    it('returns correct route_code from cache', () => {
      expect(getRouteCodeForSheet('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')).toBe('R01');
      expect(getRouteCodeForSheet('2ABC123xyz456789012345')).toBe('R02');
      expect(getRouteCodeForSheet('unknown')).toBe('');
    });

    it('returns correct month and year for sheet', () => {
      expect(getMonthYearForSheet('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')).toEqual({
        month: 8,
        year: 2026,
      });
      expect(getMonthYearForSheet('2ABC123xyz456789012345')).toEqual({
        month: 7,
        year: 2026,
      });
    });

    it('falls back to current month and year when sheet is not found', () => {
      const now = new Date();
      expect(getMonthYearForSheet('non-existent')).toEqual({
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
    });
  });
});
