export interface RouteWaData {
  no: number;
  routeCode: string;
  routeName: string;
  operatorName: string;
  isLooping: boolean;
  todayPassengers: number;
  yesterdayPassengers: number;
  lastWeekPassengers: number;
  targetHk: number;
  bestRecord: number;
  achievementKm: number; // KM / Bus
  kmBaku: number;
  renops: number;
  realops: number;
  trafficJamSpots: string[];
  operationalIssues: string;
  headwayFastest: number;
  headwaySlowest: number;
  // Shift breakdown
  toaShift1: number;
  manualShift1: number;
  totalShift1: number;
  toaShift2: number;
  manualShift2: number;
  totalShift2: number;
}

export interface RegionTotals {
  // Shift 1
  tomShift1: number;
  manualShift1: number;
  totalShift1: number;
  yesterdayShift1: number;
  lastWeekShift1: number;
  // Shift 2
  tomShift2: number;
  manualShift2: number;
  totalShift2: number;
  yesterdayShift2: number;
  lastWeekShift2: number;
  // Overall
  totalToday: number;
  totalTarget: number;
  totalYesterday: number;
  totalLastWeek: number;
}

const INDONESIAN_DAYS = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format angka bulat ke format ribuan Indonesia dengan titik (cth: 5077 -> "5.077")
 */
export function formatWaNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Math.round(val).toLocaleString('id-ID');
}

/**
 * Format angka desimal ke format Indonesia dengan koma (cth: 98.37 -> "98,37")
 */
export function formatWaDecimal(val: number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined || isNaN(val)) return (0).toFixed(decimals).replace('.', ',');
  return Number(val).toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Mendapatkan nama hari bahasa Indonesia kapital (cth: "RABU")
 */
export function getIndonesianDayName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return INDONESIAN_DAYS[d.getDay()] || 'SENIN';
}

/**
 * Mendapatkan format tanggal panjang bahasa Indonesia (cth: "2 September 2026")
 */
export function formatIndonesianFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDate();
  const month = INDONESIAN_MONTHS[d.getMonth()] || '';
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Menghasilkan teks laporan WhatsApp Format 1:
 * Laporan Jumlah Pelanggan & Pencapaian KM Harian
 */
export function generateWaReportFormat1(dateStr: string, routes: RouteWaData[]): string {
  const dayName = getIndonesianDayName(dateStr);
  const fullDate = formatIndonesianFullDate(dateStr);

  const lines: string[] = [
    'SELAMAT MALAM\t\t\t',
    '```Laporan JUMLAH PELANGGAN & PENCAPAIAN Rata2 Kilometer / Bus  HARIAN Mikrotrans Jak Lingko Wilayah Utara```\t\t\t',
    '```\t\t\t',
    `Hari   \t:\t${dayName}\t`,
    `Tanggal\t:\t${fullDate}\t`,
    'Shift  \t:\t1 & 2\t',
    '```\t\t\t',
    '\t\t\t'
  ];

  routes.forEach((r) => {
    const loopingSuffix = r.isLooping ? ' (_Looping_)' : '';
    const percentage = r.targetHk > 0 ? (r.todayPassengers / r.targetHk) * 100 : 0;

    lines.push(`*${r.no}. ${r.routeCode} | ${r.routeName}*${loopingSuffix}\`\`\`\t\t\t`);
    lines.push(`- ${r.operatorName}\t\t\t`);
    lines.push('\t\t\t');
    lines.push(`HARI INI\t:\t${formatWaNumber(r.todayPassengers)}\t`);
    lines.push(`KEMAREN\t:\t${formatWaNumber(r.yesterdayPassengers)}\t`);
    lines.push(`MINGGU LALU\t:\t${formatWaNumber(r.lastWeekPassengers)}\t`);
    lines.push(`TARGET  HK\t:\t${formatWaNumber(r.targetHk)}\t`);
    lines.push(`BEST RECORD\t:\t${formatWaNumber(r.bestRecord)}\t`);
    lines.push(`PERSENTASE\t:\t${formatWaDecimal(percentage, 2)}%\t`);
    lines.push(`PENCAPAIAN KM\t:\t${formatWaDecimal(r.achievementKm, 2)}\t`);
    lines.push(`KM BAKU\t:\t${formatWaDecimal(r.kmBaku, 3)}\t`);
    lines.push('\t\t\t');
    lines.push(`RENOPS   \t:\t${r.renops}\tUnit`);
    lines.push(`REALISASI\t:\t${r.realops}\tUnit`);
    lines.push('KENDALA  \t:\t\t');

    if (r.operationalIssues) {
      lines.push(`- ${r.operationalIssues}\t\t\t`);
    }

    if (r.trafficJamSpots && r.trafficJamSpots.length > 0) {
      lines.push('- TITIK KEMACETAN :\t\t\t');
      r.trafficJamSpots.forEach((spot, idx) => {
        lines.push(`${idx + 1}. ${spot}\t\t\t`);
      });
    } else {
      lines.push('- TITIK KEMACETAN :\t\t\t');
      lines.push('-\t\t\t');
    }

    lines.push('\t\t\t');
    lines.push(`-Headway tercepat\t:\t${r.headwayFastest}\t Menit`);
    lines.push(`-Headway terlama \t:\t${r.headwaySlowest}\tMenit`);
    lines.push('```\t\t\t');
    lines.push('\t\t\t');
  });

  lines.push('*_DEMIKIAN LAPORAN DIBUAT UNTUK DI KETAHUI PIMPINAN TERIMA KASIH_*');
  return lines.join('\n');
}

/**
 * Menghasilkan teks laporan WhatsApp Format 2:
 * Laporan Pelanggan Rincian Shift [TOA] + [MANUAL] = JUMLAH
 */
export function generateWaReportFormat2(
  dateStr: string,
  routes: RouteWaData[],
  totals: RegionTotals
): string {
  const dayName = getIndonesianDayName(dateStr);
  const fullDate = formatIndonesianFullDate(dateStr);

  const lines: string[] = [
    '*MIKROTRANS WILAYAH UTARA*\t\t\t\t\t\t',
    '```\t\t\t\t\t\t',
    'SELAMAT MALAM\t\t\t\t\t\t',
    `HARI     \t:\t${dayName}\t\t\t\t`,
    `TANGGAL  \t:\t${fullDate}\t\t\t\t`,
    'PERIHAL  \t:\tLAPORAN PELANGGAN\t\t\t\t',
    'SHIFT    \t:\t1 & 2\t\t\t\t',
    'FORMAT   \t:\t[TOA]+[MANUAL]=JUMLAH PELANGGAN\t\t\t\t',
    '```\t\t\t\t\t\t',
    '=============================\t\t\t\t\t\t',
    '\t\t\t\t\t\t'
  ];

  routes.forEach((r) => {
    const paddedNo = String(r.no).padStart(2, '0');
    const loopingSuffix = r.isLooping ? ' (_LOOPING_)' : '';

    lines.push(`*${paddedNo}. ${r.routeCode} | ${r.routeName}*${loopingSuffix}\t\t\t\t\t\t`);
    lines.push('```\t\t\t\t\t\t');
    lines.push(
      `• SHIFT 1\t:\t${formatWaNumber(r.toaShift1)}\t+\t${formatWaNumber(r.manualShift1)}\t=\t${formatWaNumber(r.totalShift1)}`
    );
    lines.push(
      `• SHIFT 2\t:\t${formatWaNumber(r.toaShift2)}\t+\t${formatWaNumber(r.manualShift2)}\t=\t${formatWaNumber(r.totalShift2)}`
    );
    lines.push('____________________________+\t\t\t\t\t\t');
    lines.push(`JUMLAH  \t:\t${formatWaNumber(r.todayPassengers)}\t\t\t\t`);
    lines.push('```\t\t\t\t\t\t');
  });

  lines.push('=========================\t\t\t\t\t\t');
  lines.push('\t\t\t\t\t\t');
  lines.push('*•Total Shift 1*\t\t\t\t\t\t');
  lines.push('```\t\t\t\t\t\t');
  lines.push(`TOM    \t:\t${formatWaNumber(totals.tomShift1)}\t\t\t\t`);
  lines.push(`MANUAL \t:\t${formatWaNumber(totals.manualShift1)}\t\t\t\t`);
  lines.push(`JUMLAH \t:\t${formatWaNumber(totals.totalShift1)}\t\t\t\t`);
  lines.push(`KEMARIN\t:\t${formatWaNumber(totals.yesterdayShift1)}\t\t\t\t`);
  lines.push(`MINGGU LALU\t:\t${formatWaNumber(totals.lastWeekShift1)}\t\t\t\t`);
  lines.push('```\t\t\t\t\t\t');
  lines.push('*•Total Shift 2*\t\t\t\t\t\t');
  lines.push('```\t\t\t\t\t\t');
  lines.push(`TOM    \t:\t${formatWaNumber(totals.tomShift2)}\t\t\t\t`);
  lines.push(`MANUAL \t:\t${formatWaNumber(totals.manualShift2)}\t\t\t\t`);
  lines.push(`JUMLAH \t:\t${formatWaNumber(totals.totalShift2)}\t\t\t\t`);
  lines.push(`KEMARIN\t:\t${formatWaNumber(totals.yesterdayShift2)}\t\t\t\t`);
  lines.push(`MINGGU LALU\t:\t${formatWaNumber(totals.lastWeekShift2)}\t\t\t\t`);
  lines.push('\t\t\t\t\t\t');
  lines.push(`TOTAL  \t:\t${formatWaNumber(totals.totalToday)}\t\t\t\t`);
  lines.push(`TARGET \t:\t${formatWaNumber(totals.totalTarget)}\t\t\t\t`);
  lines.push(`KEMARIN\t:\t${formatWaNumber(totals.totalYesterday)}\t\t\t\t`);
  lines.push(`MINGGU LALU\t:\t${formatWaNumber(totals.totalLastWeek)}\t\t\t\t`);
  lines.push('```\t\t\t\t\t\t');
  lines.push('\t\t\t\t\t\t');
  lines.push('```Demikian dilaporkan untuk diketahui Pimpinan.```');

  return lines.join('\n');
}

/**
 * Membuka WhatsApp secara langsung dengan teks terisi
 */
export function openWhatsApp(text: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
