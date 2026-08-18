import { extractSpreadsheetId } from './sheetIdentity';

/**
 * Format string kode rute menjadi format baku JAK.<KODE> (UPPERCASE, alfanumerik saja setelah titik)
 */
export function formatRouteCode(rawInput: string): string {
  if (!rawInput) return '';

  // 1. Hilangkan spasi dan ubah ke uppercase
  const cleaned = rawInput.trim().toUpperCase().replace(/\s+/g, '');

  // 2. Normalisasi awalan JAK
  if (cleaned.startsWith('JAK')) {
    // Ambil sisa setelah 'JAK' dan buang karakter non-alfanumerik di awal sisa
    const afterJak = cleaned.substring(3).replace(/^[^A-Z0-9]+/, '');
    // Buang semua karakter non-alfanumerik dari bagian kode
    const codePart = afterJak.replace(/[^A-Z0-9]/g, '');
    return codePart ? `JAK.${codePart}` : 'JAK.';
  }

  // Jika tidak diawali JAK, bersihkan karakter non-alfanumerik lalu tambahkan JAK.
  const codePart = cleaned.replace(/[^A-Z0-9]/g, '');
  return codePart ? `JAK.${codePart}` : '';
}

/**
 * Validasi apakah kode rute sesuai format baku JAK.<KODE>
 */
export function validateRouteCode(code: string): { isValid: boolean; error?: string } {
  if (!code || !code.trim()) {
    return { isValid: false, error: 'Kode Rute wajib diisi (misal: JAK.76).' };
  }

  const trimmed = code.trim().toUpperCase();
  const regex = /^JAK\.[A-Z0-9]+$/;

  if (!regex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Format Kode Rute tidak valid. Wajib diawali "JAK." diikuti angka/huruf (contoh: JAK.115, JAK.76, JAK.78A).',
    };
  }

  return { isValid: true };
}

/**
 * Validasi URL / ID Google Sheets dan ekstrak spreadsheetId yang valid
 */
export function validateGoogleSheetsUrl(urlOrId: string): { isValid: boolean; spreadsheetId?: string; error?: string } {
  if (!urlOrId || !urlOrId.trim()) {
    return { isValid: false, error: 'Link Google Sheets wajib diisi.' };
  }

  const spreadsheetId = extractSpreadsheetId(urlOrId.trim());
  if (!spreadsheetId) {
    return {
      isValid: false,
      error: 'Link Google Sheets tidak valid. Pastikan Anda menyalin link spreadsheet Google Sheets yang benar.',
    };
  }

  return { isValid: true, spreadsheetId };
}

/**
 * Mengekstrak nama trayek dari label kolom trip
 */
export function extractRouteNameFromHeaders(tripPergiLabel?: string, tripPulangLabel?: string): string | null {
  if (tripPergiLabel && tripPergiLabel.trim() && !tripPergiLabel.toLowerCase().includes('trip pergi')) {
    return tripPergiLabel.trim();
  }
  if (tripPulangLabel && tripPulangLabel.trim() && !tripPulangLabel.toLowerCase().includes('trip pulang')) {
    return tripPulangLabel.trim();
  }
  return null;
}
