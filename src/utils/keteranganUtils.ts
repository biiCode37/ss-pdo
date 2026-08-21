/**
 * Utilitas untuk standardisasi dan parsing format Keterangan armada (BA.01-04, OFF, NP1/NP2, TO EVDAL).
 * Memastikan semua variasi penulisan input non-standar (misal: "BA01", "ba 1", "ba-02", "BA_03", dll.)
 * dinormalisasi secara otomatis menjadi format baku kanonik "BA.01", "BA.02", "BA.03", "BA.04".
 * Catatan "NP1" dan "NP2" distandarkan sebagai sub-pilihan dari "BA.02" ("BA.02 NP1", "BA.02 NP2").
 */

export interface ParsedKeterangan {
  prefix: string | null; // e.g. "BA.01", "BA.02", "BA.03", "BA.04"
  detail: string;        // e.g. "NP1", "NP2", "Rusak transmisi"
  isFixed: boolean;      // true if "OFF", "TO EVDAL"
  fixedValue: string | null;
  normalized: string;    // Full canonical string e.g. "BA.02 NP1" or "OFF"
}

/**
 * Regex untuk mendeteksi seluruh variasi penulisan BA 01 s/d 04:
 * Mendukung: "BA01", "ba01", "BA 1", "ba-1", "BA.01", "BA_02", "ba:03", "BA/4", dll.
 */
const BA_PATTERN = /^\s*BA\s*[-._:/]?\s*0?([1-4])\b(?:\s*[-:]?\s*(.*))?$/i;

/**
 * Normalisasi format keterangan menjadi format baku kanonik.
 * Berdampak langsung pada data yang disimpan ke Google Sheets (SS).
 */
export function normalizeKeterangan(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // 1. Cek variasi BA.01 s/d BA.04
  const baMatch = trimmed.match(BA_PATTERN);
  if (baMatch) {
    const digit = baMatch[1]; // '1', '2', '3', atau '4'
    const prefix = `BA.0${digit}`;
    let detail = baMatch[2] ? baMatch[2].trim() : '';

    // Khusus BA.02: rapikan detail jika berisi variasi penulisan NP1 / NP2
    if (digit === '2' && detail) {
      if (/^NP\s*[-._:/]?\s*1$/i.test(detail)) {
        detail = 'NP1';
      } else if (/^NP\s*[-._:/]?\s*2$/i.test(detail)) {
        detail = 'NP2';
      }
    }
    return detail ? `${prefix} ${detail}` : prefix;
  }

  // 2. Cek variasi preset tetap (Fixed Values) & Migrasi NP1/NP2 ke BA.02
  const upper = trimmed.toUpperCase();
  if (upper === 'OFF' || /^OFF(?:\s*\(.*\))?$/i.test(trimmed)) {
    return 'OFF';
  }
  if (/^NP\s*[-._:/]?\s*1$/i.test(trimmed)) {
    return 'BA.02 NP1';
  }
  if (/^NP\s*[-._:/]?\s*2$/i.test(trimmed)) {
    return 'BA.02 NP2';
  }
  if (/^TO\s*[-._:/]?\s*EVDAL$/i.test(trimmed)) {
    return 'TO EVDAL';
  }

  return trimmed;
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

  // Cek Fixed Values (OFF, TO EVDAL)
  const upper = normalized.toUpperCase();
  if (['OFF', 'TO EVDAL'].includes(upper)) {
    return {
      prefix: null,
      detail: '',
      isFixed: true,
      fixedValue: upper,
      normalized: upper,
    };
  }

  // Cek BA Prefix (termasuk BA.02 NP1 / BA.02 NP2)
  const baMatch = normalized.match(/^(BA\.0[1-4])(?:\s*(.*))?$/i);
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
    detail: normalized,
    isFixed: false,
    fixedValue: null,
    normalized,
  };
}
