/**
 * Utilitas untuk standardisasi dan parsing format Keterangan armada (BA.01-04, OFF, NP1/NP2, TO EVDAL).
 * Memastikan semua variasi penulisan input non-standar (misal: "BA01", "ba 1", "ba-02", "BA_03", dll.)
 * dinormalisasi secara otomatis menjadi format baku kanonik "BA.01", "BA.02", "BA.03", "BA.04".
 * Catatan "NP1" dan "NP2" distandarkan sebagai sub-pilihan dari "BA.02" ("BA.02 NP1", "BA.02 NP2").
 */

/**
 * Mendapatkan shift operasional default berdasarkan jam sistem:
 * - Sebelum jam 14:00 -> Shift 1
 * - Mulai jam 14:00 dan seterusnya -> Shift 2
 */
export function getCurrentOperationalShift(now: Date = new Date()): 1 | 2 {
  return now.getHours() >= 14 ? 2 : 1;
}

/**
 * Mendapatkan tab default untuk modal form "Semua Kolom":
 * - Sebelum jam 14:00 -> "shift1"
 * - Mulai jam 14:00 dan seterusnya -> "shift2"
 */
export function getDefaultModalTab(
  now: Date = new Date(),
  overrideShift?: 1 | 2
): "shift1" | "shift2" {
  const shift = overrideShift ?? getCurrentOperationalShift(now);
  return shift === 2 ? "shift2" : "shift1";
}

/**
 * Daftar singkatan/akronim umum armada & operasional yang dipertahankan dalam huruf kapital (Opsi B).
 */
export const FLEET_ACRONYMS = new Set([
  'AC',
  'TJ',
  'AP',
  'KSO',
  'OKB',
  'NP',
  'NP1',
  'NP2',
  'SIM',
  'KTP',
  'STNK',
  'KIR',
  'BBM',
  'SPBU',
  'GPS',
  'CCTV',
  'TAP',
  'TOA',
  'PP',
  'KM',
  'H-1',
  'H-7',
  'SGO',
  'SO',
  'TO',
  'EVDAL',
]);

/**
 * Mengubah string teks menjadi format Capitalize Each Word (Title Case)
 * dengan perlakuan cerdas terhadap akronim/singkatan operasional (Opsi B):
 * - Mengkapitalkan huruf pertama setiap kata
 * - Mempertahankan singkatan/akronim umum yang berhuruf kapital (seperti AC, TJ, AP, KSO, OKB, NP1, NP2, dll.)
 * - Menjaga kode unit armada berformat khusus (seperti "TJ-0123", "MB-01")
 */
export function toSmartTitleCase(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';

      const upperWord = word.toUpperCase();

      // 1. Cek jika kata terdaftar dalam daftar akronim operasional (misal: "ac" -> "AC", "okb" -> "OKB")
      if (FLEET_ACRONYMS.has(upperWord)) {
        return upperWord;
      }

      // 2. Cek jika kata adalah kode unit dengan tanda hubung/titik/angka (misal: "TJ-0123", "MB-01", "P-1")
      if (/^[A-Za-z]+[-._]\w+$/.test(word) || /^[A-Za-z]+\d+$/.test(word)) {
        return word.toUpperCase();
      }

      // 3. Kata reguler: kapital huruf pertama, sisanya lowercase
      const firstChar = word.charAt(0).toUpperCase();
      const rest = word.slice(1).toLowerCase();
      return `${firstChar}${rest}`;
    })
    .join(' ');
}

export interface KeteranganMultiTokens {
  isOkb: boolean;
  isRenop: boolean;
  baCode: '01' | '02' | '03' | '04' | null;
  isOff: boolean;
  isToEvdal: boolean;
  detail: string;
}

/**
 * Ekstraksi token-token preset (OKB, Renop, BA, OFF, TO EVDAL) dan detail teks bebas.
 * Mendukung pencatatan multi-select / multi-status secara non-destruktif.
 */
export function extractKeteranganTokens(raw?: string | null): KeteranganMultiTokens {
  if (!raw || typeof raw !== 'string') {
    return { isOkb: false, isRenop: false, baCode: null, isOff: false, isToEvdal: false, detail: '' };
  }
  let trimmed = raw.trim();
  if (!trimmed || trimmed.toUpperCase() === 'SGO') {
    return { isOkb: false, isRenop: false, baCode: null, isOff: false, isToEvdal: false, detail: '' };
  }

  // Hilangkan prefix shift S1: atau S2: jika ada agar tidak mengotori detail
  trimmed = trimmed.replace(/^S[12]\s*[:.-]\s*/i, '').trim();

  const isOkb = /\bOKB\b/i.test(trimmed);
  const isRenop = /\bRENOP\b/i.test(trimmed);
  const isOff = /\bOFF\b/i.test(trimmed);
  const isToEvdal = /\bTO\s*[-._:/]?\s*EVDAL\b/i.test(trimmed);

  const baMatch = trimmed.match(/\bBA\s*[-._:/]?\s*0?([1-4])\b/i);
  const baCode = baMatch ? (('0' + baMatch[1]).slice(-2) as '01' | '02' | '03' | '04') : null;

  let detail = trimmed
    .replace(/\bOKB\b/gi, '')
    .replace(/\bRENOP\b/gi, '')
    .replace(/\bTO\s*[-._:/]?\s*EVDAL\b/gi, '')
    .replace(/\bOFF\b/gi, '')
    .replace(/\bBA\s*[-._:/]?\s*0?[1-4]\b/gi, '')
    .replace(/^[\s-:;,|/.]+/, '')
    .replace(/[\s-:;,|/.]+$/, '')
    .trim();

  // Khusus NP1 / NP2 jika terkait BA.02 atau berdiri sendiri
  if (/^NP\s*[-._:/]?\s*1$/i.test(detail)) {
    detail = 'NP1';
  } else if (/^NP\s*[-._:/]?\s*2$/i.test(detail)) {
    detail = 'NP2';
  } else if (detail) {
    detail = toSmartTitleCase(detail);
  }

  return { isOkb, isRenop, baCode, isOff, isToEvdal, detail };
}

/**
 * Merangkai token-token preset dan detail teks bebas menjadi string terstruktur baku.
 */
export function formatKeteranganTokens(tokens: KeteranganMultiTokens): string {
  const parts: string[] = [];

  // 1. Status lifecycle operasional awal (OKB / Renop)
  if (tokens.isOkb) parts.push('OKB');
  if (tokens.isRenop) parts.push('Renop');

  // 2. Kode kendala / jenis insiden
  if (tokens.baCode) {
    parts.push(`BA.${tokens.baCode}`);
  }
  if (tokens.isToEvdal) parts.push('TO EVDAL');
  if (tokens.isOff) parts.push('OFF');

  let cleanDetail = (tokens.detail || '').trim();
  if (tokens.baCode === '02' && cleanDetail) {
    if (/^NP\s*[-._:/]?\s*1$/i.test(cleanDetail)) {
      cleanDetail = 'NP1';
    } else if (/^NP\s*[-._:/]?\s*2$/i.test(cleanDetail)) {
      cleanDetail = 'NP2';
    } else {
      cleanDetail = toSmartTitleCase(cleanDetail);
    }
  } else if (cleanDetail) {
    cleanDetail = toSmartTitleCase(cleanDetail);
  }

  if (parts.length === 0) {
    return cleanDetail || '';
  }

  if (cleanDetail) {
    const lastPart = parts[parts.length - 1];
    // Khusus BA jika berada di posisi terakhir: "BA.02 NP1" atau "OKB - BA.02 NP1"
    if (lastPart.startsWith('BA.')) {
      const beforeBa = parts.slice(0, -1);
      const baWithDetail = `${lastPart} ${cleanDetail}`;
      if (beforeBa.length > 0) {
        return `${beforeBa.join(' - ')} - ${baWithDetail}`;
      }
      return baWithDetail;
    }

    return `${parts.join(' - ')} - ${cleanDetail}`;
  }

  return parts.join(' - ');
}

export interface ParsedKeterangan {
  prefix: string | null; // e.g. "BA.01", "BA.02", "BA.03", "BA.04"
  detail: string;        // e.g. "NP1", "NP2", "Rusak transmisi"
  isFixed: boolean;      // true if "OFF", "TO EVDAL"
  fixedValue: string | null;
  normalized: string;    // Full canonical string e.g. "BA.02 NP1" or "OFF"
}

/**
 * Normalisasi format keterangan menjadi format baku kanonik.
 * Berdampak langsung pada data yang disimpan ke Google Sheets (SS).
 */
export function normalizeKeterangan(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed || trimmed.toUpperCase() === 'SGO') return '';

  // Dukungan keterangan berbeda per shift (" | " atau "|")
  if (trimmed.includes('|')) {
    const parts = trimmed
      .split('|')
      .map(part => normalizeKeterangan(part.trim()))
      .filter(Boolean);

    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    if (parts[0] === parts[1] && (parts[0] === 'OFF' || parts[0] === 'TO EVDAL')) return parts[0];
    return parts.join(' | ');
  }

  // Deteksi dan normalisasi prefix shift "S1:" atau "S2:"
  const shiftMatch = trimmed.match(/^(S[12])\s*[:.-]\s*(.*)$/i);
  if (shiftMatch) {
    const shiftTag = shiftMatch[1].toUpperCase();
    const rest = shiftMatch[2].trim();
    if (!rest || rest.toUpperCase() === 'SGO') return '';
    const normRest = normalizeKeterangan(rest);
    return normRest ? `${shiftTag}: ${normRest}` : '';
  }

  const tokens = extractKeteranganTokens(trimmed);
  if (tokens.isOkb || tokens.isRenop || tokens.baCode || tokens.isOff || tokens.isToEvdal) {
    return formatKeteranganTokens(tokens);
  }

  // Standalone NP1 / NP2
  if (/^NP\s*[-._:/]?\s*1$/i.test(trimmed)) return 'NP1';
  if (/^NP\s*[-._:/]?\s*2$/i.test(trimmed)) return 'NP2';

  return toSmartTitleCase(trimmed);
}

/**
 * Memecah string keterangan menjadi komponen terstruktur untuk modal input & visualisasi badge.
 */

export function parseKeterangan(raw?: string | null): ParsedKeterangan {
  const normalized = normalizeKeterangan(raw);
  if (!normalized) {
    return {
      prefix: null,
      detail: '',
      isFixed: false,
      fixedValue: null,
      normalized: '',
    };
  }

  // Cek jika terdapat shift prefix (S1: atau S2:)
  const shiftMatch = normalized.match(/^(S[12]):\s*(.*)$/i);
  const core = shiftMatch ? shiftMatch[2].trim() : normalized;
  const upper = core.toUpperCase();

  // Cek Fixed Values (OFF, TO EVDAL, OKB, Renop)
  if (['OFF', 'TO EVDAL', 'OKB', 'RENOP'].includes(upper)) {
    return {
      prefix: null,
      detail: '',
      isFixed: true,
      fixedValue: upper === 'RENOP' ? 'Renop' : upper,
      normalized,
    };
  }

  // Cek BA Prefix (termasuk BA.02 NP1 / BA.02 NP2)
  const baMatch = core.match(/^(BA\.0[1-4])(?:\s*(.*))?$/i);
  if (baMatch) {
    return {
      prefix: baMatch[1].toUpperCase(),
      detail: baMatch[2] ? baMatch[2].trim() : '',
      isFixed: false,
      fixedValue: null,
      normalized,
    };
  }

  return {
    prefix: null,
    detail: core,
    isFixed: false,
    fixedValue: null,
    normalized,
  };
}

/**
 * Memfilter unit armada yang berhak disalin nilai KM Akhir Shift 1 ke KM Awal Shift 2.
 * Ketentuan:
 * 1. Unit wajib memiliki data KM Akhir Shift 1 (tidak kosong/undefined).
 * 2. Unit yang memiliki keterangan/catatan kendala (keterangan terisi) WAJIB DILEWATI (skip).
 */
export function filterBusesForKmCopy<T extends { kmAkhir1?: string; keterangan?: string }>(
  buses: T[]
): {
  eligibleBuses: T[];
  skippedWithNotesCount: number;
} {
  const eligibleBuses: T[] = [];
  let skippedWithNotesCount = 0;

  for (const b of buses) {
    const hasKmS1 =
      b.kmAkhir1 !== undefined &&
      b.kmAkhir1 !== null &&
      String(b.kmAkhir1).trim() !== "";

    if (!hasKmS1) continue;

    const hasNotes =
      b.keterangan !== undefined &&
      b.keterangan !== null &&
      String(b.keterangan).trim() !== "";

    if (hasNotes) {
      skippedWithNotesCount += 1;
    } else {
      eligibleBuses.push(b);
    }
  }

  return { eligibleBuses, skippedWithNotesCount };
}

/**
 * Helper untuk membersihkan nilai keterangan per shift.
 * Teks 'SGO' atau string kosong dianggap berstatus SGO (kosong di SSOT).
 * Menghilangkan prefix "S1:" atau "S2:" yang mungkin sudah menempel agar tidak berulang.
 */
export function cleanShiftNote(val?: string | null): string {
  if (!val || typeof val !== 'string') return '';
  let trimmed = val.trim();
  if (!trimmed || trimmed.toUpperCase() === 'SGO') return '';

  // Bersihkan prefix S1: atau S2: yang sudah menempel agar tidak duplikasi
  trimmed = trimmed.replace(/^S[12]\s*[:.-]\s*/i, '').trim();
  if (!trimmed || trimmed.toUpperCase() === 'SGO') return '';

  return normalizeKeterangan(trimmed);
}

/**
 * Menggabungkan keterangan Shift 1 dan Shift 2 dengan pembeda "S1: " dan "S2: ".
 * - Jika kedua shift kosong / SGO: kembalikan ""
 * - Jika hanya Shift 1 yang berketerangan: kembalikan "S1: ${note1}"
 * - Jika hanya Shift 2 yang berketerangan: kembalikan "S2: ${note2}"
 * - Jika kedua shift memiliki keterangan identik dan status penuh (OFF / TO EVDAL):
 *   kembalikan status kanonik tanpa prefix (misal "OFF")
 * - Jika kedua shift memiliki catatan operasional: gabungkan "S1: ${note1} | S2: ${note2}"
 */
export function combineShiftKeterangan(
  s1?: string | null,
  s2?: string | null
): string {
  const note1 = cleanShiftNote(s1);
  const note2 = cleanShiftNote(s2);

  if (!note1 && !note2) return '';
  if (note1 && !note2) return `S1: ${note1}`;
  if (!note1 && note2) return `S2: ${note2}`;

  if (note1 === note2 && (note1 === 'OFF' || note1 === 'TO EVDAL')) {
    return note1;
  }

  return `S1: ${note1} | S2: ${note2}`;
}

/**
 * Memecah string keterangan yang tersimpan menjadi keterangan per shift (Shift 1 & Shift 2).
 */
export function splitShiftKeterangan(combined?: string | null): {
  s1: string;
  s2: string;
} {
  if (!combined || typeof combined !== 'string') {
    return { s1: '', s2: '' };
  }

  const trimmed = combined.trim();
  if (!trimmed || trimmed.toUpperCase() === 'SGO') {
    return { s1: '', s2: '' };
  }

  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map((p) => p.trim());
    let s1 = '';
    let s2 = '';
    let hasExplicitShift = false;

    for (const part of parts) {
      if (/^S1\s*[:.-]\s*/i.test(part)) {
        s1 = cleanShiftNote(part);
        hasExplicitShift = true;
      } else if (/^S2\s*[:.-]\s*/i.test(part)) {
        s2 = cleanShiftNote(part);
        hasExplicitShift = true;
      }
    }

    if (hasExplicitShift) {
      return { s1, s2 };
    }

    // Jika tidak ada label S1/S2 eksplisit, gunakan urutan posisional (bagian 0 = Shift 1, bagian 1 = Shift 2)
    return {
      s1: cleanShiftNote(parts[0]),
      s2: cleanShiftNote(parts[1]),
    };
  }

  // Cek jika ada awalan S1: atau S2: pada string tunggal
  if (/^S1\s*[:.-]\s*/i.test(trimmed)) {
    return { s1: cleanShiftNote(trimmed), s2: '' };
  }

  if (/^S2\s*[:.-]\s*/i.test(trimmed)) {
    return { s1: '', s2: cleanShiftNote(trimmed) };
  }

  const single = cleanShiftNote(trimmed);
  if (!single) {
    return { s1: '', s2: '' };
  }

  // Khusus NP1: spesifik untuk Shift 1 saja
  if (/\bNP1\b/i.test(single)) {
    return { s1: single, s2: '' };
  }

  // Khusus NP2, OKB, dan Renop: spesifik untuk Shift 2 saja
  if (/\bNP2\b/i.test(single) || /^(?:OKB|Renop)$/i.test(single)) {
    return { s1: '', s2: single };
  }

  return { s1: single, s2: single };
}

/**
 * Mengecek apakah catatan keterangan mengindikasikan status armada OFF
 * (kata "OFF" utuh, baik dengan prefix shift S1:/S2:, tanda kurung, maupun catatan tambahan).
 * Mencegah false-positive pada kata yang mengandung substring seperti "OFFICER".
 */
export function isUnitOff(raw?: string | null): boolean {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;

  // 1. Jika memuat pemisah shift (|), evaluasi tiap bagian shift
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map((p) => p.trim());
    return parts.some((part) => isUnitOff(part));
  }

  // 2. Cek keberadaan kata OFF utuh
  return /\bOFF\b/i.test(trimmed);
}

/**
 * Mengecek apakah catatan keterangan mengindikasikan status armada T.O / TO
 * (hanya keterangan [T.O EVDAL / TO EVDAL / TO / T.O], variasi pemisah atau strip keterangan,
 * serta prefix shift S1:/S2:).
 * Mencegah false-positive pada kata umum operasional seperti "RADIATOR", "TEMPERATUR", "MOTOR", "TOA", dll.
 */
export function isUnitTo(raw?: string | null): boolean {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;

  // 1. Jika memuat pemisah shift (|), evaluasi tiap bagian shift
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map((p) => p.trim());
    return parts.some((part) => isUnitTo(part));
  }

  // 2. Cek variasi TO EVDAL / T.O EVDAL / TO-EVDAL / T.O. EVDAL
  if (/\bT\.?O\.?\s*[-._:/]?\s*EVDAL\b/i.test(trimmed)) {
    return true;
  }

  // 3. Cek status murni T.O / TO (standalone atau dengan prefix shift S1:/S2:, prefix BA, tanda kurung, atau strip)
  // Contoh: "TO", "T.O", "T.O.", "S1: TO", "S2: T.O", "TO (SANKSI)", "T.O - CADANGAN", "BA.02 - TO", "BA.02 - T.O"
  if (/^(?:S[12]\s*[:.-]\s*)?(?:BA\s*[-._:/]?\s*0?[1-4]\s*[-–—/]\s*)?T\.?O\.?(?:\s*\(.*\)|\s*[-–—].*)?$/i.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Mengecek apakah catatan keterangan mengindikasikan status armada OFF atau TO EVDAL
 * (baik status murni, variasi penulisan, dengan prefix shift S1:/S2:, maupun catatan gabungan).
 * Unit dengan status ini tidak beroperasi sehingga harus dikecualikan dari target bar progres.
 */
export function isUnitOffOrToEvdal(raw?: string | null): boolean {
  return isUnitOff(raw) || isUnitTo(raw);
}

/**
 * Mengecek apakah catatan keterangan memiliki informasi operasional tambahan
 * yang perlu ditampilkan di bagian catatan kartu.
 * Mengembalikan false jika catatan hanya berupa status armada tetap murni ("OFF", "T.O", "TO", "TO EVDAL", "SO", "SGO")
 * yang sudah ditampilkan secara eksplisit melalui badge status di header kartu,
 * sehingga mencegah tampilan redundan dan menjaga kerapian kartu.
 */
export function hasMeaningfulNote(raw?: string | null): boolean {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;

  const PURE_STATUS_REGEX = /^(?:S[12]:\s*)?(?:OFF|T\.?O(?:\s*EVDAL)?|SO|SGO)$/i;

  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map((p) => p.trim());
    return parts.some((part) => {
      if (!part) return false;
      const normalized = normalizeKeterangan(part).trim();
      return !PURE_STATUS_REGEX.test(normalized) && !PURE_STATUS_REGEX.test(part);
    });
  }

  const normalized = normalizeKeterangan(trimmed).trim();
  if (PURE_STATUS_REGEX.test(normalized) || PURE_STATUS_REGEX.test(trimmed)) {
    return false;
  }

  return true;
}


