import type { Route } from '../types/supabase';

/**
 * Daftar Hari Libur Nasional Resmi Indonesia (fokus 2026 & tanggal tetap tahunan).
 * Format key: 'YYYY-MM-DD' atau 'MM-DD'
 */
const INDONESIA_HOLIDAYS_2026: Record<string, string> = {
  '2026-01-01': 'Tahun Baru 2026 Masehi',
  '2026-01-16': 'Isra Mikraj Nabi Muhammad SAW',
  '2026-02-17': 'Tahun Baru Imlek 2577 Kongzili',
  '2026-03-20': 'Hari Raya Idul Fitri 1447 H (Hari 1)',
  '2026-03-21': 'Hari Raya Idul Fitri 1447 H (Hari 2)',
  '2026-03-22': 'Hari Suci Nyepi (Tahun Baru Saka 1948)',
  '2026-04-03': 'Wafat Isa Almasih',
  '2026-04-05': 'Kebangkitan Isa Almasih (Paskah)',
  '2026-05-01': 'Hari Buruh Internasional',
  '2026-05-14': 'Kenaikan Isa Almasih',
  '2026-05-27': 'Hari Raya Idul Adha 1447 H',
  '2026-05-31': 'Hari Raya Waisak 2570 BE',
  '2026-06-01': 'Hari Lahir Pancasila',
  '2026-06-16': 'Tahun Baru Islam 1448 H',
  '2026-08-17': 'Hari Kemerdekaan Republik Indonesia',
  '2026-08-25': 'Maulid Nabi Muhammad SAW',
  '2026-12-25': 'Hari Raya Natal',
};

// Libur tetap tahunan (fallback jika tahun selain 2026 dibuka)
const ANNUAL_FIXED_HOLIDAYS: Record<string, string> = {
  '01-01': 'Tahun Baru Masehi',
  '05-01': 'Hari Buruh Internasional',
  '06-01': 'Hari Lahir Pancasila',
  '08-17': 'Hari Kemerdekaan Republik Indonesia',
  '12-25': 'Hari Raya Natal',
};

/**
 * Memeriksa apakah tanggal yang diberikan merupakan Hari Libur Nasional di Indonesia.
 */
export function isNationalHoliday(dateStr?: string | null): {
  isHoliday: boolean;
  holidayName?: string;
} {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isHoliday: false };
  }

  const trimmed = dateStr.trim();
  // 1. Cek kalender spesifik 2026
  if (INDONESIA_HOLIDAYS_2026[trimmed]) {
    return {
      isHoliday: true,
      holidayName: INDONESIA_HOLIDAYS_2026[trimmed],
    };
  }

  // 2. Cek libur tetap tahunan (MM-DD)
  const parts = trimmed.split('-');
  if (parts.length === 3) {
    const monthDay = `${parts[1]}-${parts[2]}`;
    if (ANNUAL_FIXED_HOLIDAYS[monthDay]) {
      return {
        isHoliday: true,
        holidayName: ANNUAL_FIXED_HOLIDAYS[monthDay],
      };
    }
  }

  return { isHoliday: false };
}

export type DayType = 'weekday' | 'saturday' | 'sunday' | 'holiday';

export interface DynamicRenopsResult {
  renops: number;
  dayType: DayType;
  label: string;
}

/**
 * Menghitung nilai target Renops dinamis berdasarkan rute dan tanggal aktif.
 * Memperhitungkan Hari Kerja (Senin-Jumat), Sabtu, Minggu, serta Libur Nasional.
 */
export function getRenopsForDate(
  route: Route | null | undefined,
  dateStr?: string | null
): DynamicRenopsResult {
  if (!dateStr || typeof dateStr !== 'string') {
    return {
      renops: route?.default_renops || 0,
      dayType: 'weekday',
      label: 'Hari Kerja',
    };
  }

  const defaultRenops = route?.default_renops || 0;
  const holidayCheck = isNationalHoliday(dateStr);

  // Parsing aman tanggal tanpa pergeseran zona waktu
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); // 0 = Minggu, 6 = Sabtu, 1-5 = Senin-Jumat

  // 1. Prioritas 1: Hari Libur Nasional
  if (holidayCheck.isHoliday) {
    return {
      renops: route?.renops_holiday ?? defaultRenops,
      dayType: 'holiday',
      label: holidayCheck.holidayName || 'Hari Libur Nasional',
    };
  }

  // 2. Prioritas 2: Khusus Hari Minggu
  if (dayOfWeek === 0) {
    return {
      renops: route?.renops_sunday ?? defaultRenops,
      dayType: 'sunday',
      label: 'Hari Minggu (Weekend)',
    };
  }

  // 3. Prioritas 3: Khusus Hari Sabtu
  if (dayOfWeek === 6) {
    return {
      renops: route?.renops_saturday ?? defaultRenops,
      dayType: 'saturday',
      label: 'Hari Sabtu (Weekend)',
    };
  }

  // 4. Default: Hari Kerja (Senin - Jumat)
  return {
    renops: route?.renops_weekday ?? defaultRenops,
    dayType: 'weekday',
    label: 'Hari Kerja (Senin - Jumat)',
  };
}
