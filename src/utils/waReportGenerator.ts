import { TEXT_WA_REPORT } from '../constants/texts';
import { getOperatorOfficialName } from '../constants/operators';
import type { FleetUnitStatusDetail } from '../types/supabase';

export interface RouteFleetReportItem {
  no: number;
  routeCode: string;
  routeName?: string;
  operatorName: string;
  renops: number; // Target SGO
  realops: number; // Realisasi Ops
  nonSgoUnits?: FleetUnitStatusDetail[];
}

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
    `${TEXT_WA_REPORT.TEMPLATE.GREETING}`,
    `*${TEXT_WA_REPORT.TEMPLATE.FORMAT_1_TITLE}*`,
    '```',
    `Hari    : ${dayName}`,
    `Tanggal : ${fullDate}`,
    'Shift   : 1 & 2',
    '```',
    ''
  ];

  routes.forEach((r) => {
    const paddedNo = String(r.no).padStart(2, '0');
    const loopingSuffix = r.isLooping ? ' (_Looping_)' : '';
    const percentage = r.targetHk > 0 ? (r.todayPassengers / r.targetHk) * 100 : 0;

    lines.push(`*${paddedNo}. ${r.routeCode} | ${r.routeName}*${loopingSuffix}`);
    lines.push(`- ${getOperatorFullName(r.operatorName)}`);
    lines.push('```');
    lines.push(`HARI INI      : ${formatWaNumber(r.todayPassengers)}`);
    lines.push(`KEMARIN       : ${formatWaNumber(r.yesterdayPassengers)}`);
    lines.push(`MINGGU LALU   : ${formatWaNumber(r.lastWeekPassengers)}`);
    lines.push(`TARGET HK     : ${formatWaNumber(r.targetHk)}`);
    lines.push(`BEST RECORD   : ${formatWaNumber(r.bestRecord)}`);
    lines.push(`PERSENTASE    : ${formatWaDecimal(percentage, 2)}%`);
    lines.push(`PENCAPAIAN KM : ${formatWaDecimal(r.achievementKm, 2)}`);
    lines.push(`KM BAKU       : ${formatWaDecimal(r.kmBaku, 3)}`);
    lines.push('');
    lines.push(`RENOPS        : ${r.renops} Unit`);
    lines.push(`REALISASI     : ${r.realops} Unit`);
    lines.push(`KENDALA       : ${r.operationalIssues ? r.operationalIssues : '-'}`);
    lines.push('TITIK KEMACETAN:');
    if (r.trafficJamSpots && r.trafficJamSpots.length > 0) {
      r.trafficJamSpots.forEach((spot, idx) => {
        lines.push(`${idx + 1}. ${spot}`);
      });
    } else {
      lines.push('-');
    }
    lines.push('');
    lines.push(`Headway Tercepat: ${r.headwayFastest} Menit`);
    lines.push(`Headway Terlama : ${r.headwaySlowest} Menit`);
    lines.push('```');
    lines.push('');
  });

  lines.push(TEXT_WA_REPORT.TEMPLATE.CLOSING_FORMAT_1);
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
    `*${TEXT_WA_REPORT.TEMPLATE.REGION_NAME}*`,
    '```',
    `${TEXT_WA_REPORT.TEMPLATE.GREETING_FORMAL}`,
    'Izin Melaporkan Hasil Operasi Angkutan Mikrotrans Wilayah Jakarta Utara',
    `HARI     : ${dayName}`,
    `TANGGAL  : ${fullDate}`,
    `PERIHAL  : LAPORAN PELANGGAN`,
    'SHIFT    : 1 & 2',
    'FORMAT   : [TOA] + [MANUAL] = JUMLAH PELANGGAN',
    '```',
    '━━━━━━━━━━━━━━━━━━━━━━━━━',
    ''
  ];

  routes.forEach((r) => {
    const paddedNo = String(r.no).padStart(2, '0');
    const loopingSuffix = r.isLooping ? ' (_LOOPING_)' : '';

    const s1Toa = formatWaNumber(r.toaShift1).padStart(6, ' ');
    const s1Man = formatWaNumber(r.manualShift1).padStart(5, ' ');
    const s1Tot = formatWaNumber(r.totalShift1).padStart(6, ' ');

    const s2Toa = formatWaNumber(r.toaShift2).padStart(6, ' ');
    const s2Man = formatWaNumber(r.manualShift2).padStart(5, ' ');
    const s2Tot = formatWaNumber(r.totalShift2).padStart(6, ' ');

    lines.push(`*${paddedNo}. ${r.routeCode} | ${r.routeName}*${loopingSuffix}`);
    lines.push('```');
    lines.push(`• SHIFT 1 : ${s1Toa} + ${s1Man} = ${s1Tot}`);
    lines.push(`• SHIFT 2 : ${s2Toa} + ${s2Man} = ${s2Tot}`);
    lines.push('───────────────────────────────────');
    lines.push(`JUMLAH    : ${formatWaNumber(r.todayPassengers)} Pelanggan`);
    lines.push('```');
    lines.push('');
  });

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`*${TEXT_WA_REPORT.TEMPLATE.TOTAL_REGION_TITLE}*`);
  lines.push('');
  lines.push(`*${TEXT_WA_REPORT.TEMPLATE.SHIFT_1_TOTAL}*`);
  lines.push('```');
  lines.push(`TOM         : ${formatWaNumber(totals.tomShift1).padStart(7, ' ')}`);
  lines.push(`MANUAL      : ${formatWaNumber(totals.manualShift1).padStart(7, ' ')}`);
  lines.push(`JUMLAH      : ${formatWaNumber(totals.totalShift1).padStart(7, ' ')}`);
  lines.push(`KEMARIN     : ${formatWaNumber(totals.yesterdayShift1).padStart(7, ' ')}`);
  lines.push(`MINGGU LALU : ${formatWaNumber(totals.lastWeekShift1).padStart(7, ' ')}`);
  lines.push('```');
  lines.push('');
  lines.push(`*${TEXT_WA_REPORT.TEMPLATE.SHIFT_2_TOTAL}*`);
  lines.push('```');
  lines.push(`TOM         : ${formatWaNumber(totals.tomShift2).padStart(7, ' ')}`);
  lines.push(`MANUAL      : ${formatWaNumber(totals.manualShift2).padStart(7, ' ')}`);
  lines.push(`JUMLAH      : ${formatWaNumber(totals.totalShift2).padStart(7, ' ')}`);
  lines.push(`KEMARIN     : ${formatWaNumber(totals.yesterdayShift2).padStart(7, ' ')}`);
  lines.push(`MINGGU LALU : ${formatWaNumber(totals.lastWeekShift2).padStart(7, ' ')}`);
  lines.push('');
  lines.push(`TOTAL       : ${formatWaNumber(totals.totalToday).padStart(7, ' ')}`);
  lines.push(`TARGET      : ${formatWaNumber(totals.totalTarget).padStart(7, ' ')}`);
  lines.push(`KEMARIN     : ${formatWaNumber(totals.totalYesterday).padStart(7, ' ')}`);
  lines.push(`MINGGU LALU : ${formatWaNumber(totals.totalLastWeek).padStart(7, ' ')}`);
  lines.push('```');
  lines.push('');
  lines.push(TEXT_WA_REPORT.TEMPLATE.CLOSING_FORMAT_2);

  return lines.join('\n');
}

/**
 * Mengubah kode operator menjadi nama resmi yang lengkap (menggunakan Master Operators).
 */
export function getOperatorFullName(operatorCodeOrName: string): string {
  return getOperatorOfficialName(operatorCodeOrName);
}

/**
 * Menghasilkan teks laporan WhatsApp Format 3 (Status Kesiapan Armada Per Shift)
 * dengan format Executive Modern, ringkasan wilayah di atas, dan rincian unit non-SGO.
 */
export function generateWaReportFormat3(
  dateStr: string,
  shift: 1 | 2,
  routes: RouteFleetReportItem[]
): string {
  const dayRaw = getIndonesianDayName(dateStr);
  const dayTitle = dayRaw.charAt(0) + dayRaw.slice(1).toLowerCase();
  const fullDate = formatIndonesianFullDate(dateStr);
  const shiftName = shift === 1 ? 'Pagi' : 'Siang';
  const divider = '━━━━━━━━━━━━━━━━━━━';

  // Kalkulasi agregat wilayah
  const totalSgo = routes.reduce((sum, r) => sum + (r.renops || 0), 0);
  const totalRealops = routes.reduce((sum, r) => sum + (r.realops || 0), 0);
  const totalTidakOps = Math.max(0, totalSgo - totalRealops);
  const percentage = totalSgo > 0 ? ((totalRealops / totalSgo) * 100).toFixed(1).replace('.', ',') : '0,0';

  let lengkapCount = 0;
  let kurangCount = 0;

  routes.forEach((r) => {
    const routeTidakOps = Math.max(0, (r.renops || 0) - (r.realops || 0));
    if (routeTidakOps === 0) {
      lengkapCount++;
    } else {
      kurangCount++;
    }
  });

  const lines: string[] = [
    TEXT_WA_REPORT.TEMPLATE.FORMAT_3_HEADER(dayTitle, fullDate, shift, shiftName),
    divider,
    `*${TEXT_WA_REPORT.TEMPLATE.FORMAT_3_SUMMARY_TITLE}*`,
    '```',
    `Target SGO      : ${totalSgo} Unit`,
    `Realisasi Ops   : ${totalRealops} Unit`,
    `Tidak Ops       : ${totalTidakOps} Unit`,
    `Ketercapaian    : ${percentage}%`,
    `Status Rute     : ${lengkapCount} Lengkap | ${kurangCount} Kurang`,
    '```',
    divider,
    `*${TEXT_WA_REPORT.TEMPLATE.FORMAT_3_ROUTE_DETAIL_TITLE}*`,
  ];

  routes.forEach((r) => {
    const paddedNo = String(r.no).padStart(2, '0');
    const operator = getOperatorFullName(r.operatorName);
    const routeTidakOps = Math.max(0, (r.renops || 0) - (r.realops || 0));
    const isLengkap = routeTidakOps === 0;
    const routeTitle = `*${paddedNo}. ${r.routeCode}${r.routeName ? ` | ${r.routeName}` : ''}*`;

    lines.push('');
    lines.push(routeTitle);
    lines.push(`- ${operator}`);
    lines.push('```');
    lines.push(`Target SGO    : ${r.renops} Unit`);
    lines.push(`Realisasi Ops : ${r.realops} Unit`);
    lines.push(`Tidak Ops     : ${routeTidakOps} Unit`);
    lines.push(`Status        : ${isLengkap ? 'LENGKAP ✅' : 'TIDAK LENGKAP ✖️'}`);
    lines.push('```');

    // Filter unit non-SGO
    const allNonSgo = r.nonSgoUnits || [];
    const kendalaUnits = allNonSgo.filter((u) => !u.isOff);
    const offUnits = allNonSgo.filter((u) => u.isOff);

    if (kendalaUnits.length > 0) {
      lines.push('*Rincian Tidak Ops:*');
      kendalaUnits.forEach((u) => {
        lines.push(`- ${u.unit} : ${u.note}`);
      });
    }

    if (offUnits.length > 0) {
      lines.push(TEXT_WA_REPORT.TEMPLATE.FORMAT_3_OFF_SUBHEADER);
      offUnits.forEach((u) => {
        lines.push(`- ${u.unit} : ${u.note}`);
      });
    }

    lines.push(divider);
  });

  lines.push('');
  lines.push(TEXT_WA_REPORT.TEMPLATE.FORMAT_3_CLOSING);

  return lines.join('\n');
}

/**
 * Membuka WhatsApp secara langsung dengan teks terisi
 */
export function openWhatsApp(text: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
