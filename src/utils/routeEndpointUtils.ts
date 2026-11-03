/**
 * Utilitas pembersih dan penyingkat nama titik pengendapan rute (Mobile-First).
 * Mengubah teks panjang dari header spreadsheet (seperti "TERM. TJ PRIOK - PEGANGSAAN II IGI", "PEGANGSAAN II IGI - TERM. TJ PRIOK")
 * menjadi label ringkas yang hemat ruang (misal: "Priok", "IGI", "Kp. Rambutan").
 */

function toTitleCase(str: string): string {
  return str.replace(/\b([a-zA-Z])([a-zA-Z]*)\b/g, (_match, first, rest) => {
    return first.toUpperCase() + rest.toLowerCase();
  });
}

/**
 * Membersihkan satu nama endpoint (lokasi tunggal).
 */
export function sanitizeEndpointName(rawName?: string, fallback: string = 'Titik'): string {
  if (!rawName || !rawName.trim()) {
    return fallback;
  }

  let cleaned = rawName.trim();

  // 1. Bersihkan prefiks operasional umum
  cleaned = cleaned
    .replace(/^(PENGENDAPAN\s+|TERMINAL\s+|TERM\.?\s*)/i, '')
    .replace(/^(STASIUN\s+|ST\.?\s*)/i, 'STASIUN_PREFIX_TOKEN_ ')
    .replace(/^(HALTE\s+)/i, '')
    .replace(/^(TRIP\s+)/i, '')
    .replace(/^(JL\.?\s+|JALAN\s+)/i, '');

  const upper = cleaned.toUpperCase().trim();

  // 2. Normalisasi kata kunci spesifik daerah operasional Transjakarta
  if (/\b(TANJUNG PRIOK|TJ\.?\s*PRIOK|PRIOK)\b/i.test(upper)) {
    return 'Priok';
  }
  if (/\b(PEGANGSAAN II IGI|PEGANGSAAN IGI|IGI)\b/i.test(upper)) {
    return 'IGI';
  }
  if (/\b(KAMPUNG RAMBUTAN|KP\.?\s*RAMBUTAN)\b/i.test(upper)) {
    return 'Kp. Rambutan';
  }
  if (/\b(LEBAK BULUS|LB\.?\s*BULUS)\b/i.test(upper)) {
    return 'Lebak Bulus';
  }
  if (/\b(RUSUN MARUNDA|MARUNDA)\b/i.test(upper)) {
    return 'Marunda';
  }
  if (/\b(ANCOL BARAT|ANCOL)\b/i.test(upper)) {
    return 'Ancol';
  }
  if (/\b(ASMI)\b/i.test(upper)) {
    return 'ASMI';
  }
  if (/\b(INDUSTRI RAYA|INDUSTRI)\b/i.test(upper)) {
    return 'Industri';
  }

  // 3. Normalisasi singkatan daerah umum
  cleaned = cleaned.replace(/\bKAMPUNG\b/i, 'Kp.');
  cleaned = cleaned.replace(/\bTANJUNG\b/i, 'Tj.');
  cleaned = cleaned.replace(/\bPEGANGSAAN\b/i, 'Pgg.');
  cleaned = cleaned.replace(/\bPONDOK\b/i, 'Pd.');
  cleaned = cleaned.replace(/\bLEBAK\b/i, 'Lb.');

  // 4. Konversi ke format Title Case yang rapi
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

/**
 * Memecah directional header string "ORIGIN - DESTINATION" menjadi nama origin pangkalan.
 */
function extractOriginFromDirectionalLabel(label?: string): { origin?: string; destination?: string } {
  if (!label || !label.trim()) return {};
  const trimmed = label.trim();

  // Pisahkan berdasarkan delimiter arah rute: " - ", "-", "–", "—", atau "/"
  const parts = trimmed.split(/\s*[-–—/]\s*/);
  if (parts.length >= 2) {
    return {
      origin: parts[0]?.trim(),
      destination: parts[1]?.trim(),
    };
  }
  return { origin: trimmed };
}

/**
 * Mengekstrak nama kedua endpoint pangkalan rute (A dan B) secara cerdas dan tahan banting.
 * Mendukung:
 * - Header directional spreadsheet: "TERM. TJ PRIOK - PEGANGSAAN II IGI" & "PEGANGSAAN II IGI - TERM. TJ PRIOK"
 * - Header tunggal: "TERM. TANJUNG PRIOK" & "PEGANGSAAN II IGI"
 * - Fallback nama rute: "TERM.TANJUNG PRIOK - PEGANGSAAN II IGI"
 */
export function extractEndpointNames(
  tripPergiLabel?: string,
  tripPulangLabel?: string,
  routeName?: string,
): RouteEndpoints {
  const pergiParsed = extractOriginFromDirectionalLabel(tripPergiLabel);
  const pulangParsed = extractOriginFromDirectionalLabel(tripPulangLabel);

  let rawA = pergiParsed.origin;
  let rawB = pulangParsed.origin;

  // Jika kedua label generik ("Trip Pergi" / "Trip Pulang") dan ada nama rute resmi
  const isGenericA = !rawA || /^(TRIP\s*PERGI|PERGI)$/i.test(rawA.trim());
  const isGenericB = !rawB || /^(TRIP\s*PULANG|PULANG)$/i.test(rawB.trim());

  if ((isGenericA || isGenericB) && routeName && routeName.trim()) {
    const routeParts = extractOriginFromDirectionalLabel(routeName);
    if (routeParts.origin) rawA = routeParts.origin;
    if (routeParts.destination) rawB = routeParts.destination;
  }

  let endpointA = sanitizeEndpointName(rawA, 'Titik A');
  let endpointB = sanitizeEndpointName(rawB, 'Titik B');

  // Invariant Safeguard: Pastikan endpointA dan endpointB TIDAK KEMBAR
  if (endpointA === endpointB && endpointA !== 'Titik A') {
    // Coba gunakan destination dari tripPergi jika ada
    if (pergiParsed.destination) {
      const altB = sanitizeEndpointName(pergiParsed.destination);
      if (altB && altB !== endpointA) {
        endpointB = altB;
      }
    } else if (pulangParsed.destination) {
      const altA = sanitizeEndpointName(pulangParsed.destination);
      if (altA && altA !== endpointB) {
        endpointA = altA;
      }
    }

    // Jika masih kembar, beri pembeda jelas
    if (endpointA === endpointB) {
      endpointA = `${endpointA} A`;
      endpointB = `${endpointB} B`;
    }
  }

  return {
    endpointA,
    endpointB,
  };
}
