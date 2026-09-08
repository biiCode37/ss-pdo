import { describe, it, expect } from 'vitest';
import {
  generateWaReportFormat1,
  generateWaReportFormat2,
  formatWaNumber,
  formatWaDecimal,
  getIndonesianDayName,
  formatIndonesianFullDate,
  type RouteWaData,
  type RegionTotals
} from './waReportGenerator';

describe('waReportGenerator', () => {
  const sampleRoutes: RouteWaData[] = [
    {
      no: 1,
      routeCode: 'JAK 01',
      routeName: 'TG. PRIOK-PLUMPANG',
      operatorName: 'KOLAMAS (KLM)',
      isLooping: true,
      todayPassengers: 5077,
      yesterdayPassengers: 4937,
      lastWeekPassengers: 5189,
      targetHk: 5161,
      bestRecord: 5201,
      achievementKm: 179.87,
      kmBaku: 14.415,
      renops: 20,
      realops: 20,
      trafficJamSpots: ['Pasar Warakas', 'Jl. Warakas Raya', 'Jl. Yos Sudarso'],
      operationalIssues: '',
      headwayFastest: 2,
      headwaySlowest: 16,
      toaShift1: 1873,
      manualShift1: 0,
      totalShift1: 1873,
      toaShift2: 3204,
      manualShift2: 0,
      totalShift2: 3204
    },
    {
      no: 2,
      routeCode: 'JAK 05',
      routeName: 'SEMPER-ROROTAN',
      operatorName: 'KOPERASI WAHANA KALPIKA (KWK)',
      isLooping: true,
      todayPassengers: 6111,
      yesterdayPassengers: 6257,
      lastWeekPassengers: 5807,
      targetHk: 7315,
      bestRecord: 6384,
      achievementKm: 197.84,
      kmBaku: 30.897,
      renops: 33,
      realops: 33,
      trafficJamSpots: [
        'Jl Raya Cakung cilincing',
        'Jl Sungai landak (Persimpangan lestari)',
        'Jl Cilincing landak'
      ],
      operationalIssues: 'Realisasi berkurang',
      headwayFastest: 4,
      headwaySlowest: 12,
      toaShift1: 2700,
      manualShift1: 104,
      totalShift1: 2804,
      toaShift2: 3205,
      manualShift2: 102,
      totalShift2: 3307
    }
  ];

  const sampleTotals: RegionTotals = {
    tomShift1: 43398,
    manualShift1: 764,
    totalShift1: 44162,
    yesterdayShift1: 42703,
    lastWeekShift1: 44795,
    tomShift2: 56605,
    manualShift2: 1051,
    totalShift2: 57656,
    yesterdayShift2: 58730,
    lastWeekShift2: 57531,
    totalToday: 101818,
    totalTarget: 126399,
    totalYesterday: 101433,
    totalLastWeek: 102326
  };

  it('formats Indonesian numbers and decimals correctly', () => {
    expect(formatWaNumber(5077)).toBe('5.077');
    expect(formatWaNumber(101818)).toBe('101.818');
    expect(formatWaDecimal(179.87, 2)).toBe('179,87');
    expect(formatWaDecimal(14.415, 3)).toBe('14,415');
    expect(formatWaDecimal(98.372, 2)).toBe('98,37');
  });

  it('formats Indonesian dates correctly', () => {
    // 2026-09-02 is a Wednesday (RABU)
    expect(getIndonesianDayName('2026-09-02')).toBe('RABU');
    expect(formatIndonesianFullDate('2026-09-02')).toBe('2 September 2026');
  });

  it('generates Format 1 report matching Transjakarta standards', () => {
    const report = generateWaReportFormat1('2026-09-02', sampleRoutes);

    expect(report).toContain('SELAMAT MALAM');
    expect(report).toContain('Laporan JUMLAH PELANGGAN & PENCAPAIAN Rata2 Kilometer / Bus');
    expect(report).toContain('Hari   \t:\tRABU');
    expect(report).toContain('Tanggal\t:\t2 September 2026');
    expect(report).toContain('*1. JAK 01 | TG. PRIOK-PLUMPANG* (_Looping_)');
    expect(report).toContain('HARI INI\t:\t5.077');
    expect(report).toContain('KEMAREN\t:\t4.937');
    expect(report).toContain('TARGET  HK\t:\t5.161');
    expect(report).toContain('PERSENTASE\t:\t98,37%');
    expect(report).toContain('PENCAPAIAN KM\t:\t179,87');
    expect(report).toContain('KM BAKU\t:\t14,415');
    expect(report).toContain('RENOPS   \t:\t20\tUnit');
    expect(report).toContain('1. Pasar Warakas');
    expect(report).toContain('-Headway tercepat\t:\t2\t Menit');
    expect(report).toContain('-Headway terlama \t:\t16\tMenit');
    expect(report).toContain('*_DEMIKIAN LAPORAN DIBUAT UNTUK DI KETAHUI PIMPINAN TERIMA KASIH_*');
  });

  it('generates Format 2 report matching Transjakarta standards', () => {
    const report = generateWaReportFormat2('2026-09-02', sampleRoutes, sampleTotals);

    expect(report).toContain('*MIKROTRANS WILAYAH UTARA*');
    expect(report).toContain('PERIHAL  \t:\tLAPORAN PELANGGAN');
    expect(report).toContain('*01. JAK 01 | TG. PRIOK-PLUMPANG* (_LOOPING_)');
    expect(report).toContain('• SHIFT 1\t:\t1.873\t+\t0\t=\t1.873');
    expect(report).toContain('• SHIFT 2\t:\t3.204\t+\t0\t=\t3.204');
    expect(report).toContain('JUMLAH  \t:\t5.077');
    expect(report).toContain('*•Total Shift 1*');
    expect(report).toContain('TOM    \t:\t43.398');
    expect(report).toContain('TOTAL  \t:\t101.818');
    expect(report).toContain('TARGET \t:\t126.399');
    expect(report).toContain('```Demikian dilaporkan untuk diketahui Pimpinan.```');
  });

  it('handles empty / zero values without crashing', () => {
    const emptyRoute: RouteWaData = {
      no: 3,
      routeCode: 'JAK 120',
      routeName: 'JIS-MUARA ANGKE',
      operatorName: 'KWK AC',
      isLooping: true,
      todayPassengers: 0,
      yesterdayPassengers: 0,
      lastWeekPassengers: 0,
      targetHk: 2717,
      bestRecord: 2639,
      achievementKm: 0,
      kmBaku: 43.465,
      renops: 15,
      realops: 0,
      trafficJamSpots: [],
      operationalIssues: '',
      headwayFastest: 0,
      headwaySlowest: 0,
      toaShift1: 0,
      manualShift1: 0,
      totalShift1: 0,
      toaShift2: 0,
      manualShift2: 0,
      totalShift2: 0
    };

    const report1 = generateWaReportFormat1('2026-09-02', [emptyRoute]);
    expect(report1).toContain('*3. JAK 120 | JIS-MUARA ANGKE*');
    expect(report1).toContain('HARI INI\t:\t0');
    expect(report1).toContain('PERSENTASE\t:\t0,00%');

    const report2 = generateWaReportFormat2('2026-09-02', [emptyRoute], sampleTotals);
    expect(report2).toContain('*03. JAK 120 | JIS-MUARA ANGKE*');
    expect(report2).toContain('JUMLAH  \t:\t0');
  });
});
