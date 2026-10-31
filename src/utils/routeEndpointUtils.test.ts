import { describe, it, expect } from 'vitest';
import { sanitizeEndpointName, extractEndpointNames } from './routeEndpointUtils';

describe('routeEndpointUtils', () => {
  describe('sanitizeEndpointName', () => {
    it('mengembalikan fallback jika nama kosong atau undefined', () => {
      expect(sanitizeEndpointName(undefined, 'Titik A')).toBe('Titik A');
      expect(sanitizeEndpointName('', 'Titik A')).toBe('Titik A');
      expect(sanitizeEndpointName('   ', 'Titik B')).toBe('Titik B');
    });

    it('membersihkan awalan TERM. / TERMINAL', () => {
      expect(sanitizeEndpointName('TERM. TANJUNG PRIOK')).toBe('Priok');
      expect(sanitizeEndpointName('TERMINAL TANJUNG PRIOK')).toBe('Priok');
      expect(sanitizeEndpointName('TERMINAL KAMPUNG RAMBUTAN')).toBe('Kp. Rambutan');
    });

    it('menangani PEGANGSAAN II IGI menjadi IGI', () => {
      expect(sanitizeEndpointName('PEGANGSAAN II IGI')).toBe('IGI');
      expect(sanitizeEndpointName('PENGENDAPAN PEGANGSAAN II IGI')).toBe('IGI');
    });

    it('membersihkan awalan STASIUN / ST.', () => {
      expect(sanitizeEndpointName('STASIUN MANGGARAI')).toBe('St. Manggarai');
      expect(sanitizeEndpointName('ST. TANAH ABANG')).toBe('St. Tanah Abang');
    });

    it('membersihkan awalan TRIP PERGI / TRIP PULANG jika ada', () => {
      expect(sanitizeEndpointName('TRIP PERGI')).toBe('Pergi');
      expect(sanitizeEndpointName('TRIP PULANG')).toBe('Pulang');
    });
  });

  describe('extractEndpointNames', () => {
    it('mengekstrak nama endpoint A dan B dari label trip pergi dan pulang', () => {
      const result = extractEndpointNames('TERM. TANJUNG PRIOK', 'PEGANGSAAN II IGI');
      expect(result.endpointA).toBe('Priok');
      expect(result.endpointB).toBe('IGI');
    });

    it('menggunakan fallback jika label tidak ada', () => {
      const result = extractEndpointNames(undefined, undefined);
      expect(result.endpointA).toBe('Titik A');
      expect(result.endpointB).toBe('Titik B');
    });
  });
});
