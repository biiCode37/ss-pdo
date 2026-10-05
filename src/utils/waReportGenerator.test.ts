import { describe, it, expect } from 'vitest';
import {
  generateWaReportFormat1,
  generateWaReportFormat2,
  generateWaReportFormat3,
  getOperatorFullName,
  type RouteFleetReportItem,
  type RouteWaData,
  type RegionTotals
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

describe('waReportGenerator - Format 1 (Komprehensif)', () => {
  const mockRoutes: RouteWaData[] = [
    {
      no: 1,
      routeCode: 'JAK.01',
      routeName: 'TG. PRIOK - PLUMPANG',
      operatorName: 'KLM',
      isLooping: true,
      todayPassengers: 5077,
      yesterdayPassengers: 4937,
      lastWeekPassengers: 5189,
      targetHk: 5161,
      bestRecord: 5201,
      achievementKm: 178.05,
      kmBaku: 14.415,
      renops: 20,
      realops: 20,
      trafficJamSpots: ['Jl. Plumpang Raya'],
      operationalIssues: 'Lancar terkendali',
      headwayFastest: 3,
      headwaySlowest: 10,
      toaShift1: 1873,
      manualShift1: 0,
      totalShift1: 1873,
      toaShift2: 3204,
      manualShift2: 0,
      totalShift2: 3204,
    }
  ];

  it('generates Format 1 without tab characters and with correct monospace layout', () => {
    const report = generateWaReportFormat1('2026-09-02', mockRoutes);

    // Pastikan tidak ada tab (\t) liar yang merusak layout ponsel
    expect(report).not.toContain('\t');

    // Header checks
    expect(report).toContain('Hari    : RABU');
    expect(report).toContain('Tanggal : 2 September 2026');
    expect(report).toContain('Shift   : 1 & 2');

    // Route card checks
    expect(report).toContain('*01. JAK.01 | TG. PRIOK - PLUMPANG* (_Looping_)');
    expect(report).toContain('- KOLAMAS JAYA (KLM)');
    expect(report).toContain('HARI INI      : 5.077');
    expect(report).toContain('KEMARIN       : 4.937');
    expect(report).toContain('MINGGU LALU   : 5.189');
    expect(report).toContain('TARGET HK     : 5.161');
    expect(report).toContain('BEST RECORD   : 5.201');
    expect(report).toContain('PENCAPAIAN KM : 178,05');
    expect(report).toContain('KM BAKU       : 14,415');
    expect(report).toContain('RENOPS        : 20 Unit');
    expect(report).toContain('REALISASI     : 20 Unit');
    expect(report).toContain('KENDALA       : Lancar terkendali');
    expect(report).toContain('TITIK KEMACETAN:');
    expect(report).toContain('1. Jl. Plumpang Raya');
    expect(report).toContain('Headway Tercepat: 3 Menit');
    expect(report).toContain('Headway Terlama : 10 Menit');
  });
});

describe('waReportGenerator - Format 2 (Rincian Shift)', () => {
  const mockRoutes: RouteWaData[] = [
    {
      no: 1,
      routeCode: 'JAK.01',
      routeName: 'TG. PRIOK - PLUMPANG',
      operatorName: 'KLM',
      isLooping: true,
      todayPassengers: 5077,
      yesterdayPassengers: 4937,
      lastWeekPassengers: 5189,
      targetHk: 5161,
      bestRecord: 5201,
      achievementKm: 178.05,
      kmBaku: 14.415,
      renops: 20,
      realops: 20,
      trafficJamSpots: [],
      operationalIssues: '',
      headwayFastest: 3,
      headwaySlowest: 10,
      toaShift1: 1873,
      manualShift1: 0,
      totalShift1: 1873,
      toaShift2: 3204,
      manualShift2: 0,
      totalShift2: 3204,
    }
  ];

  const mockTotals: RegionTotals = {
    tomShift1: 39813,
    manualShift1: 204,
    totalShift1: 40017,
    yesterdayShift1: 38920,
    lastWeekShift1: 41200,
    tomShift2: 64120,
    manualShift2: 310,
    totalShift2: 64430,
    yesterdayShift2: 63800,
    lastWeekShift2: 65100,
    totalToday: 104447,
    totalTarget: 108500,
    totalYesterday: 102720,
    totalLastWeek: 106300,
  };

  it('generates Format 2 without tab characters and with neat column alignment', () => {
    const report = generateWaReportFormat2('2026-09-02', mockRoutes, mockTotals);

    // Pastikan bebas dari tab
    expect(report).not.toContain('\t');

    // Header checks
    expect(report).toContain('*MIKROTRANS WILAYAH UTARA*');
    expect(report).toContain('Selamat Malam Bapak / Ibu,');
    expect(report).toContain('HARI     : RABU');
    expect(report).toContain('TANGGAL  : 2 September 2026');

    // Route checks with monospace aligned columns
    expect(report).toContain('*01. JAK.01 | TG. PRIOK - PLUMPANG* (_LOOPING_)');
    expect(report).toContain('• SHIFT 1 :  1.873 +     0 =  1.873');
    expect(report).toContain('• SHIFT 2 :  3.204 +     0 =  3.204');
    expect(report).toContain('JUMLAH    : 5.077 Pelanggan');

    // Region Totals checks
    expect(report).toContain('*TOTAL WILAYAH JAKARTA UTARA*');
    expect(report).toContain('*• Total Shift 1*');
    expect(report).toContain('TOM         :  39.813');
    expect(report).toContain('MANUAL      :     204');
    expect(report).toContain('JUMLAH      :  40.017');
    expect(report).toContain('*• Total Shift 2*');
    expect(report).toContain('TOTAL       : 104.447');
    expect(report).toContain('TARGET      : 108.500');
  });
});
