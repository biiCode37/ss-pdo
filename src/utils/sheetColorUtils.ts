export interface GoogleColor {
  red: number;
  green: number;
  blue: number;
}

/**
 * Menentukan warna latar belakang sel baris di Google Sheets berdasarkan status Keterangan:
 * - BA.01 s/d BA.04, NP1, NP2: Skyblue (Biru Muda)
 * - OFF: Kuning (Yellow)
 * - TO EVDAL: Merah (Red)
 * - Lainnya / Kosong: Putih (Reset Color)
 */
export const getKeteranganColor = (keterangan?: string): GoogleColor | null => {
  if (!keterangan || !keterangan.trim()) return null;
  const upper = keterangan.trim().toUpperCase();

  // 1. OFF -> Kuning (Yellow)
  if (/^OFF(?:\s*\(.*\))?$/i.test(upper) || upper.includes("OFF")) {
    return { red: 1.0, green: 0.95, blue: 0.3 };
  }

  // 2. TO EVDAL -> Merah (Red)
  if (/TO\s*[-.]?\s*EVDAL/i.test(upper) || upper.includes("EVDAL")) {
    return { red: 0.95, green: 0.35, blue: 0.35 };
  }

  // 3. BA.01 - BA.04, NP1, NP2 -> Skyblue (Biru Muda)
  if (
    /BA\.0[1-4]/i.test(upper) ||
    /NP\s*[-.]?\s*[12]/i.test(upper) ||
    upper.includes("BA.01") ||
    upper.includes("BA.02") ||
    upper.includes("BA.03") ||
    upper.includes("BA.04") ||
    upper.includes("NP1") ||
    upper.includes("NP2")
  ) {
    return { red: 0.53, green: 0.81, blue: 0.98 };
  }

  // 4. Catatan Bebas / Keterangan Lainnya -> Hijau Muda (Light Green)
  return { red: 0.56, green: 0.93, blue: 0.56 };
};

/**
 * Menghitung batas kolom akhir baris (inklusif hingga kolom Total Kilometer Shift 2)
 */
export const getRowEndCol = (headerMap: Record<string, any>): number => {
  if (headerMap.totalKmShift2 !== undefined && headerMap.totalKmShift2 !== -1) {
    return headerMap.totalKmShift2 + 1;
  }
  if (headerMap.totalKmShift1 !== undefined && headerMap.totalKmShift1 !== -1) {
    return headerMap.totalKmShift1 + 2;
  }
  if (headerMap.kmAkhir2 !== undefined && headerMap.kmAkhir2 !== -1) {
    return headerMap.kmAkhir2 + 3; // kmAkhir2 + Total KM S1 + Total KM S2
  }
  const allValidCols = Object.values(headerMap).filter(
    (v): v is number => typeof v === "number" && v >= 0,
  );
  return allValidCols.length > 0 ? Math.max(...allValidCols) + 3 : 23;
};
