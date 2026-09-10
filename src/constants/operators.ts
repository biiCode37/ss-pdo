/**
 * Kamus Sentral Master Data Operator Mikrotrans Wilayah Utara
 * Single Source of Truth (SSOT) untuk penamaan dan standarisasi operator.
 */

export interface OperatorItem {
  code: string;
  shortName: string;
  fullName: string;
  isActive: boolean;
}

/**
 * Daftar Master Operator Resmi Wilayah Operasional Mikrotrans
 */
export const MASTER_OPERATORS: readonly OperatorItem[] = [
  {
    code: 'KLM',
    shortName: 'KOLAMAS JAYA',
    fullName: 'KOLAMAS JAYA (KLM)',
    isActive: true
  },
  {
    code: 'KWK',
    shortName: 'KOPERASI WAHANA KALPIKA',
    fullName: 'KOPERASI WAHANA KALPIKA (KWK)',
    isActive: true
  },
  {
    code: 'KWK AC',
    shortName: 'KOPERASI WAHANA KALPIKA',
    fullName: 'KOPERASI WAHANA KALPIKA (KWK) AC',
    isActive: true
  },
  {
    code: 'KMJ',
    shortName: 'KOMILET JAYA',
    fullName: 'KOMILET JAYA (KMJ)',
    isActive: true
  },
  {
    code: 'LSG',
    shortName: 'LESTARI SURYA GEMA PERSADA',
    fullName: 'LESTARI SURYA GEMA PERSADA (LSG)',
    isActive: true
  },
  {
    code: 'KJG',
    shortName: 'KOJANG',
    fullName: 'KOJANG (KJG)',
    isActive: true
  },
  {
    code: 'KMJ/KLM',
    shortName: 'KOMILET JAYA / KOLAMAS JAYA',
    fullName: 'KOMILET JAYA / KOLAMAS JAYA (KMJ/KLM)',
    isActive: true
  },
  {
    code: 'KMJ & KJG',
    shortName: 'KOMILET JAYA & KOJANG',
    fullName: 'KOMILET JAYA & KOJANG (KMJ & KJG)',
    isActive: true
  }
] as const;

/**
 * Mencari definisi operator berdasarkan kode atau nama.
 */
export function findOperator(codeOrName: string | undefined | null): OperatorItem | undefined {
  if (!codeOrName) return undefined;
  const raw = codeOrName.trim();
  const upper = raw.toUpperCase();

  // 1. Cek kecocokan kode eksak terlebih dahulu (case-insensitive)
  const exactCodeMatch = MASTER_OPERATORS.find((op) => op.code.toUpperCase() === upper);
  if (exactCodeMatch) return exactCodeMatch;

  // 2. Cek kecocokan KSO gabungan KMJ/KLM
  if (upper.includes('KMJ') && upper.includes('KLM')) {
    return MASTER_OPERATORS.find((op) => op.code === 'KMJ/KLM');
  }

  // 3. Cek kecocokan KSO gabungan KMJ & KJG
  if (upper.includes('KMJ') && upper.includes('KJG')) {
    return MASTER_OPERATORS.find((op) => op.code === 'KMJ & KJG');
  }

  // 3. Cek KWK AC spesifik
  if (upper.includes('KWK') && upper.includes('AC')) {
    return MASTER_OPERATORS.find((op) => op.code === 'KWK AC');
  }

  // 4. Cek kecocokan nama atau alias umum
  if (upper === 'KOLAMAS' || upper.includes('KOLAMAS')) {
    return MASTER_OPERATORS.find((op) => op.code === 'KLM');
  }
  if (upper.includes('WAHANA KALPIKA') || upper === 'KWK') {
    return MASTER_OPERATORS.find((op) => op.code === 'KWK');
  }
  if (upper.includes('KOMILET') || upper === 'KOMIDA' || upper === 'KMJ') {
    return MASTER_OPERATORS.find((op) => op.code === 'KMJ');
  }
  if (upper.includes('LESTARI SURYA') || upper === 'LSG') {
    return MASTER_OPERATORS.find((op) => op.code === 'LSG');
  }
  if (upper.includes('KOJANG') || upper === 'KJG') {
    return MASTER_OPERATORS.find((op) => op.code === 'KJG');
  }

  return undefined;
}

/**
 * Mendapatkan format nama resmi operator untuk laporan (cth: "KOLAMAS JAYA (KLM)").
 * Jika tidak ditemukan di master, mengembalikan string asli dengan anggun (graceful fallback).
 */
export function getOperatorOfficialName(codeOrName: string | undefined | null): string {
  if (!codeOrName) return '';
  const match = findOperator(codeOrName);
  return match ? match.fullName : codeOrName.trim();
}

/**
 * Mendapatkan seluruh daftar operator aktif untuk kebutuhan dropdown UI
 */
export function getAllActiveOperators(): readonly OperatorItem[] {
  return MASTER_OPERATORS.filter((op) => op.isActive);
}

/**
 * Memvalidasi apakah suatu kode operator terdaftar di master
 */
export function isValidOperatorCode(code: string): boolean {
  if (!code) return false;
  const upper = code.trim().toUpperCase();
  return MASTER_OPERATORS.some((op) => op.code.toUpperCase() === upper);
}
