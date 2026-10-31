/**
 * Utilitas pembersih dan penyingkat nama titik pengendapan rute (Mobile-First).
 * Mengubah teks panjang dari header spreadsheet (seperti "TERM. TANJUNG PRIOK", "PEGANGSAAN II IGI")
 * menjadi label ringkas yang hemat ruang (misal: "Priok", "IGI", "Kp. Rambutan").
 */

function toTitleCase(str: string): string {
  return str.replace(/\b([a-zA-Z])([a-zA-Z]*)\b/g, (_match, first, rest) => {
    return first.toUpperCase() + rest.toLowerCase();
  });
}

export function sanitizeEndpointName(rawName?: string, fallback: string = 'Titik'): string {
  if (!rawName || !rawName.trim()) {
    return fallback;
  }

  const trimmed = rawName.trim();
  const upper = trimmed.toUpperCase();

  // Khusus kasus umum rute Mikrotrans Jakarta (e.g. Tanjung Priok, IGI)
  if (upper.includes('TANJUNG PRIOK') || upper.includes('TJ. PRIOK')) {
    return 'Priok';
  }
  if (upper.includes('IGI')) {
    return 'IGI';
  }

  // 1. Bersihkan prefiks operasional umum
  let cleaned = trimmed
    .replace(/^(PENGENDAPAN\s+|TERMINAL\s+|TERM\.\s*)/i, '')
    .replace(/^(STASIUN\s+|ST\.\s*)/i, 'STASIUN_PREFIX_TOKEN_ ')
    .replace(/^(HALTE\s+)/i, '')
    .replace(/^(TRIP\s+)/i, '');

  // 2. Normalisasi singkatan daerah umum
  cleaned = cleaned.replace(/\bKAMPUNG\b/i, 'Kp.');
  cleaned = cleaned.replace(/\bTANJUNG\b/i, 'Tj.');
  cleaned = cleaned.replace(/\bPEGANGSAAN\b/i, 'Pgg.');
  cleaned = cleaned.replace(/\bPONDOK\b/i, 'Pd.');
  cleaned = cleaned.replace(/\bLEBAK\b/i, 'Lb.');

  // 3. Konversi ke format Title Case yang rapi
  cleaned = toTitleCase(cleaned);

  // Kembalikan token stasiun jika ada
  cleaned = cleaned.replace(/STASIUN_PREFIX_TOKEN_/i, 'St.');
  cleaned = cleaned.trim();

  return cleaned || fallback;
}

export interface RouteEndpoints {
  endpointA: string;
  endpointB: string;
}

export function extractEndpointNames(
  tripPergiLabel?: string,
  tripPulangLabel?: string,
): RouteEndpoints {
  return {
    endpointA: sanitizeEndpointName(tripPergiLabel, 'Titik A'),
    endpointB: sanitizeEndpointName(tripPulangLabel, 'Titik B'),
  };
}
