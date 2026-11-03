import { describe, it, expect } from 'vitest';
import { sanitizeEndpointName, extractEndpointNames } from './routeEndpointUtils';

describe('routeEndpointUtils', () => {
  describe('sanitizeEndpointName', () => {
    it('mengembalikan fallback jika nama kosong atau undefined', () => {
      expect(sanitizeEndpointName(undefined, 'Titik A')).toBe('Titik A');
      expect(sanitizeEndpointName('', 'Titik A')).toBe('Titik A');
      expect(sanitizeEndpointName('   ', 'Titik B')).toBe('Titik B');
    });

    it('membersihkan awalan TERM. / TERMINAL / JL. / PENGENDAPAN', () => {
      expect(sanitizeEndpointName('TERM. TANJUNG PRIOK')).toBe('Priok');
      expect(sanitizeEndpointName('TERM. TJ PRIOK')).toBe('Priok');
      expect(sanitizeEndpointName('TERMINAL TANJUNG PRIOK')).toBe('Priok');
      expect(sanitizeEndpointName('TERMINAL KAMPUNG RAMBUTAN')).toBe('Kp. Rambutan');
      expect(sanitizeEndpointName('JL. INDUSTRI RAYA')).toBe('Industri');
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
    it('mengekstrak nama endpoint dari directional spreadsheet header JAK.115', () => {
      const result = extractEndpointNames(
        'TERM. TJ PRIOK - PEGANGSAAN II IGI',
        'PEGANGSAAN II IGI - TERM. TJ PRIOK'
      );
      expect(result.endpointA).toBe('Priok');
      expect(result.endpointB).toBe('IGI');
    });

    it('mengekstrak nama endpoint dari directional header JAK.15 (Tanjung Priok - Marunda)', () => {
      const result = extractEndpointNames(
        'TANJUNG PRIOK - RUSUN MARUNDA',
        'RUSUN MARUNDA - TANJUNG PRIOK'
      );
      expect(result.endpointA).toBe('Priok');
      expect(result.endpointB).toBe('Marunda');
    });

    it('mengekstrak nama endpoint dari directional header JAK.76 (Industri - ASMI)', () => {
      const result = extractEndpointNames(
        'JL. INDUSTRI RAYA - ASMI',
        'ASMI - JL. INDUSTRI RAYA'
      );
      expect(result.endpointA).toBe('Industri');
      expect(result.endpointB).toBe('ASMI');
    });

    it('mengekstrak nama endpoint dari directional header JAK.88 (Tanjung Priok - Ancol Barat)', () => {
      const result = extractEndpointNames(
        'TANJUNG PRIOK - ANCOL BARAT',
        'ANCOL BARAT - TANJUNG PRIOK'
      );
      expect(result.endpointA).toBe('Priok');
      expect(result.endpointB).toBe('Ancol');
    });

    it('mengekstrak nama endpoint A dan B dari label single header jika sudah bersih', () => {
      const result = extractEndpointNames('TERM. TANJUNG PRIOK', 'PEGANGSAAN II IGI');
      expect(result.endpointA).toBe('Priok');
      expect(result.endpointB).toBe('IGI');
    });

    it('menggunakan fallback routeName jika label adalah generik Trip Pergi / Pulang', () => {
      const result = extractEndpointNames(
        'Trip Pergi',
        'Trip Pulang',
        'TERM.TANJUNG PRIOK - PEGANGSAAN II IGI'
      );
      expect(result.endpointA).toBe('Priok');
      expect(result.endpointB).toBe('IGI');
    });

    it('menggunakan fallback default jika seluruh argumen undefined', () => {
      const result = extractEndpointNames(undefined, undefined);
      expect(result.endpointA).toBe('Titik A');
      expect(result.endpointB).toBe('Titik B');
    });

    it('mencegah nama endpoint kembar dengan membedakan via suffix A/B jika benar-benar identik', () => {
      const result = extractEndpointNames('LOKASI SAMA', 'LOKASI SAMA');
      expect(result.endpointA).not.toBe(result.endpointB);
    });
  });
});
