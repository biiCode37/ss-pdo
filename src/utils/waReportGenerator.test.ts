import { describe, it, expect } from 'vitest';
import {
  generateWaReportFormat3,
  getOperatorFullName,
  type RouteFleetReportItem
} from './waReportGenerator';

describe('waReportGenerator - Format 3 (Status Kesiapan Armada)', () => {
  it('maps operator codes to official full names correctly', () => {
    expect(getOperatorFullName('KLM')).toBe('KOLAMAS JAYA (KLM)');
    expect(getOperatorFullName('KWK')).toBe('KOPERASI WAHANA KALPIKA (KWK)');
    expect(getOperatorFullName('KWK AC')).toBe('KOPERASI WAHANA KALPIKA (KWK) AC');
    expect(getOperatorFullName('KMJ')).toBe('KOMILET JAYA (KMJ)');
    expect(getOperatorFullName('LSG')).toBe('LESTARI SURYA GEMA PERSADA (LSG)');
    expect(getOperatorFullName('KJG')).toBe('KOJANG (KJG)');
    expect(getOperatorFullName('KMJ/KLM')).toBe('KOMILET JAYA (KMJ) / KOLAMAS JAYA (KLM)');
    expect(getOperatorFullName('OTHER')).toBe('OTHER');
  });

  it('generates executive modern format for shift 1 with complete status', () => {
    const mockRoutes: RouteFleetReportItem[] = [
      {
        no: 1,
        routeCode: 'JAK.01',
        routeName: 'TANJUNG PRIOK - PLUMPANG',
        operatorName: 'KLM',
        renops: 16,
        realops: 16,
        nonSgoUnits: []
      },
      {
        no: 2,
        routeCode: 'JAK.15',
        routeName: 'TANJUNG PRIOK - BULAK TURI',
        operatorName: 'KWK',
        renops: 18,
        realops: 18,
        nonSgoUnits: [
          { unit: 'KWK-015-021', note: 'OFF', isOff: true }
        ]
      }
    ];

    const report = generateWaReportFormat3('2026-09-10', 1, mockRoutes);

    // Header assertions
    expect(report).toContain('*LAPORAN STATUS KESIAPAN ARMADA*');
    expect(report).toContain('*MIKROTRANS WILAYAH UTARA*');
    expect(report).toContain('*SHIFT :* 1 (Pagi)');
    expect(report).toContain('━━━━━━━━━━━━━━━━━━━');

    // Executive Summary assertions
    expect(report).toContain('*RINGKASAN STATUS KESIAPAN ARMADA*');
    expect(report).toContain('Target SGO      : 34 Unit');
    expect(report).toContain('Realisasi Ops   : 34 Unit');
    expect(report).toContain('Tidak Ops       : 0 Unit');
    expect(report).toContain('Ketercapaian    : 100,0%');
    expect(report).toContain('Status Rute     : 2 Lengkap | 0 Kurang');

    // Route Detail assertions
    expect(report).toContain('*01. JAK.01 | TANJUNG PRIOK - PLUMPANG*');
    expect(report).toContain('- KOLAMAS JAYA (KLM)');
    expect(report).toContain('Status        : LENGKAP ✅');

    expect(report).toContain('*02. JAK.15 | TANJUNG PRIOK - BULAK TURI*');
    expect(report).toContain('- KOPERASI WAHANA KALPIKA (KWK)');
    expect(report).toContain('*Unit Libur (OFF):*');
    expect(report).toContain('- KWK-015-021 : OFF');

    // Closing
    expect(report).toContain('_Demikian laporan status kesiapan armada dibuat untuk diketahui pimpinan. Terima kasih._');
  });

  it('generates correct report for Shift 2 with non-SGO breakdown and incomplete status', () => {
    const mockRoutes: RouteFleetReportItem[] = [
      {
        no: 1,
        routeCode: 'JAK.87',
        routeName: 'TANJUNG PRIOK - IGI',
        operatorName: 'LSG',
        renops: 15,
        realops: 13,
        nonSgoUnits: [
          { unit: 'LSG-087-004', note: 'NP', isOff: false },
          { unit: 'LSG-087-009', note: 'TO.EVDAL', isOff: false },
          { unit: 'LSG-087-015', note: 'OFF', isOff: true }
        ]
      }
    ];

    const report = generateWaReportFormat3('2026-09-10', 2, mockRoutes);

    expect(report).toContain('*SHIFT :* 2 (Siang)');
    expect(report).toContain('*01. JAK.87 | TANJUNG PRIOK - IGI*');
    expect(report).toContain('- LESTARI SURYA GEMA PERSADA (LSG)');
    expect(report).toContain('Target SGO    : 15 Unit');
    expect(report).toContain('Realisasi Ops : 13 Unit');
    expect(report).toContain('Tidak Ops     : 2 Unit');
    expect(report).toContain('Status        : TIDAK LENGKAP ✖️');

    // Rincian tidak ops
    expect(report).toContain('*Rincian Tidak Ops:*');
    expect(report).toContain('- LSG-087-004 : NP');
    expect(report).toContain('- LSG-087-009 : TO.EVDAL');

    // Unit Libur
    expect(report).toContain('*Unit Libur (OFF):*');
    expect(report).toContain('- LSG-087-015 : OFF');

    // Summary counts
    expect(report).toContain('Status Rute     : 0 Lengkap | 1 Kurang');
  });

  it('omits Unit Libur section when there are no OFF units', () => {
    const mockRoutes: RouteFleetReportItem[] = [
      {
        no: 1,
        routeCode: 'JAK.01',
        routeName: 'PRIOK - PLUMPANG',
        operatorName: 'KLM',
        renops: 10,
        realops: 9,
        nonSgoUnits: [
          { unit: 'TJ-001', note: 'Per Patah', isOff: false }
        ]
      }
    ];

    const report = generateWaReportFormat3('2026-09-10', 1, mockRoutes);

    expect(report).toContain('*Rincian Tidak Ops:*');
    expect(report).toContain('- TJ-001 : Per Patah');
    expect(report).not.toContain('*Unit Libur (OFF):*');
  });

  it('handles route without routeName gracefully', () => {
    const mockRoutes: RouteFleetReportItem[] = [
      {
        no: 1,
        routeCode: 'JAK.01',
        operatorName: 'KLM',
        renops: 10,
        realops: 10,
        nonSgoUnits: []
      }
    ];

    const report = generateWaReportFormat3('2026-09-10', 1, mockRoutes);

    expect(report).toContain('*01. JAK.01*');
    expect(report).toContain('- KOLAMAS JAYA (KLM)');
  });
});
