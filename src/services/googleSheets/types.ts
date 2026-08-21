import type { GoogleColor } from '../../utils/sheetColorUtils';
export type { GoogleColor };

export interface HeaderMap {
  [key: string]: any;
}

export interface BusData {
  rowIndex: number; // 1-based index in the sheet
  unit: string;
  tripPergi?: string;
  tripPulang?: string;
  toaShift1: string;
  toaShift2: string;
  manualShift1: string;
  manualShift2: string;
  totalToa: string;
  kmAwal1: string;
  kmAkhir1: string;
  kmAwal2: string;
  kmAkhir2: string;
  keterangan: string;
  originalRow: string[];
}

/** Hasil validasi auth — ISS-01 fix */
export interface AuthResult {
  authenticated: boolean;
  reason?: 'no_flag' | 'no_token' | 'token_invalid' | 'token_expired' | 'needs_reauth';
}

export interface SpreadsheetInspectionResult {
  success: boolean;
  routeName?: string;
  tabNames: string[];
  message?: string;
}

export interface MonthlyToaTrendItem {
  day: string;
  totalToa: number;
}
