import { describe, it, expect } from 'vitest';
import { compareRouteCodes, sortRoutesByCode } from './routeSorting';

describe('routeSorting utility', () => {
  describe('compareRouteCodes', () => {
    it('mengurutkan kode rute secara natural numeric (JAK.05 < JAK.15 < JAK.115)', () => {
      expect(compareRouteCodes('JAK.01', 'JAK.05')).toBeLessThan(0);
      expect(compareRouteCodes('JAK.05', 'JAK.15')).toBeLessThan(0);
      expect(compareRouteCodes('JAK.15', 'JAK.29')).toBeLessThan(0);
      expect(compareRouteCodes('JAK.29', 'JAK.115')).toBeLessThan(0);
      expect(compareRouteCodes('JAK.115', 'JAK.15')).toBeGreaterThan(0);
    });

    it('menangani format spasi maupun titik (JAK 01 vs JAK.01)', () => {
      const list = ['JAK.15', 'JAK 05', 'JAK.01', 'JAK 115', 'JAK.29'];
      list.sort(compareRouteCodes);
      expect(list).toEqual(['JAK.01', 'JAK 05', 'JAK.15', 'JAK.29', 'JAK 115']);
    });

    it('menangani rute dengan sufiks huruf (JAK.01A vs JAK.01B)', () => {
      expect(compareRouteCodes('JAK.01A', 'JAK.01B')).toBeLessThan(0);
      expect(compareRouteCodes('JAK.01B', 'JAK.01A')).toBeGreaterThan(0);
    });

    it('menangani string kosong, null, dan undefined dengan aman', () => {
      expect(compareRouteCodes('', '')).toBe(0);
      expect(compareRouteCodes(null, null)).toBe(0);
      expect(compareRouteCodes(undefined, undefined)).toBe(0);
      expect(compareRouteCodes('JAK.01', '')).toBeLessThan(0);
      expect(compareRouteCodes('', 'JAK.01')).toBeGreaterThan(0);
      expect(compareRouteCodes(null, 'JAK.01')).toBeGreaterThan(0);
    });
  });

  describe('sortRoutesByCode', () => {
    it('mengurutkan array objek dengan properti routeCode (frontend schema)', () => {
      const input = [
        { routeCode: 'JAK.115', name: 'Rute 115' },
        { routeCode: 'JAK.01', name: 'Rute 01' },
        { routeCode: 'JAK.29', name: 'Rute 29' },
        { routeCode: 'JAK.15', name: 'Rute 15' },
        { routeCode: 'JAK.05', name: 'Rute 05' },
      ];

      const sorted = sortRoutesByCode(input);
      expect(sorted.map((r) => r.routeCode)).toEqual([
        'JAK.01',
        'JAK.05',
        'JAK.15',
        'JAK.29',
        'JAK.115',
      ]);
    });

    it('mengurutkan array objek dengan properti route_code (database schema)', () => {
      const input = [
        { route_code: 'JAK.118', id: 5 },
        { route_code: 'JAK.02', id: 1 },
        { route_code: 'JAK.10', id: 2 },
        { route_code: 'JAK.112', id: 4 },
        { route_code: 'JAK.30', id: 3 },
      ];

      const sorted = sortRoutesByCode(input);
      expect(sorted.map((r) => r.route_code)).toEqual([
        'JAK.02',
        'JAK.10',
        'JAK.30',
        'JAK.112',
        'JAK.118',
      ]);
    });

    it('mendukung custom accessor function', () => {
      const input = [
        { data: { code: 'JAK.90' } },
        { data: { code: 'JAK.01' } },
        { data: { code: 'JAK.115' } },
      ];

      const sorted = sortRoutesByCode(input, (item) => item.data.code);
      expect(sorted.map((r) => r.data.code)).toEqual([
        'JAK.01',
        'JAK.90',
        'JAK.115',
      ]);
    });

    it('tidak memutasi array asli (non-mutating/pure function)', () => {
      const original = [{ routeCode: 'JAK.115' }, { routeCode: 'JAK.01' }];
      const sorted = sortRoutesByCode(original);
      expect(original[0].routeCode).toBe('JAK.115');
      expect(sorted[0].routeCode).toBe('JAK.01');
    });

    it('menangani array kosong atau single item dengan aman', () => {
      expect(sortRoutesByCode([])).toEqual([]);
      expect(sortRoutesByCode(null as any)).toEqual([]);
      expect(sortRoutesByCode([{ routeCode: 'JAK.01' }])).toEqual([
        { routeCode: 'JAK.01' },
      ]);
    });
  });
});
