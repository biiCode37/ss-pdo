/**
 * Kamus Sentral Master Data Operator Mikrotrans Wilayah Utara
 * Single Source of Truth (SSOT) untuk penamaan dan standarisasi operator.
 * Setiap entitas merepresentasikan 1 operator tunggal (1NF).
 */

export interface OperatorItem {
  code: string;
  shortName: string;
  isActive: boolean;
}

/**
 * Daftar Master Operator Resmi Wilayah Operasional Mikrotrans (Murni 1 Baris = 1 Operator)
 */
export const MASTER_OPERATORS: readonly OperatorItem[] = [
  {
    code: 'KLM',
    shortName: 'KOLAMAS JAYA',
    isActive: true
  },
  {
    code: 'KWK',
    shortName: 'KOPERASI WAHANA KALPIKA',
    isActive: true
  },
  {
    code: 'KWK AC',
    shortName: 'KOPERASI WAHANA KALPIKA',
    isActive: true
  },
  {
    code: 'KMJ',
    shortName: 'KOMILET JAYA',
    isActive: true
  },
  {
    code: 'LSG',
    shortName: 'LESTARI SURYA GEMA PERSADA',
    isActive: true
  },
  {
    code: 'KJG',
    shortName: 'KOJANG',
    isActive: true
  }
] as const;

/**
 * Mengombinasikan kode dan nama operator menjadi format lengkap: "{operator_name} ({operator_code})"
 */
export function formatOperatorFull(op: { operator_code?: string; operator_name?: string; code?: string; shortName?: string }): string {
  const code = op.operator_code || op.code || '';
  const name = op.operator_name || op.shortName || '';
  if (!name && !code) return '';
  if (!name) return code;
  if (!code) return name;
  if (code.toUpperCase() === 'KWK AC') return `${name} (KWK) AC`;
  return `${name} (${code})`;
}

/**
 * Memformat daftar operator (bisa 1 atau banyak/KSO) menjadi string tampilan
 */
export function formatOperatorsDisplay(
  operators?: Array<{ operator_code?: string; operator_name?: string; code?: string; shortName?: string }> | null
): string {
  if (!operators || operators.length === 0) return '';
  const formatted = operators.map(formatOperatorFull).filter(Boolean);
  return formatted.join(' & ');
}

/**
 * Mencari definisi operator tunggal berdasarkan kode atau nama.
 */
export function findOperator(codeOrName: string | undefined | null): OperatorItem | undefined {
  if (!codeOrName) return undefined;
  const raw = codeOrName.trim();
  const upper = raw.toUpperCase();

  // 1. Cek kecocokan kode eksak terlebih dahulu (case-insensitive)
  const exactCodeMatch = MASTER_OPERATORS.find((op) => op.code.toUpperCase() === upper);
  if (exactCodeMatch) return exactCodeMatch;

  // 2. Cek KWK AC spesifik
  if (upper.includes('KWK') && upper.includes('AC')) {
    return MASTER_OPERATORS.find((op) => op.code === 'KWK AC');
  }

  // 3. Cek kecocokan nama atau alias umum
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
 * Mendukung string kombinasi KSO seperti "KMJ/KLM" atau "KMJ & KJG" secara dinamis.
 */
export function getOperatorOfficialName(codeOrName: string | undefined | null): string {
  if (!codeOrName) return '';
  const raw = codeOrName.trim();

  // Jika berupa gabungan KSO dengan pemisah '/' atau '&'
  if (raw.includes('/') || raw.includes('&')) {
    const delimiter = raw.includes('&') ? '&' : '/';
    const parts = raw.split(delimiter).map((p) => p.trim());
    const resolved = parts.map((part) => {
      const match = findOperator(part);
      return match ? formatOperatorFull(match) : part;
    });
    return resolved.join(` ${delimiter} `);
  }

  const match = findOperator(raw);
  return match ? formatOperatorFull(match) : raw;
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
