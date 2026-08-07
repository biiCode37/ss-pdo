import type { Route, RouteSheet } from '../types/supabase';

// ponytail: regex tunggal untuk extract ID dari URL Google Sheets
const SPREADSHEET_URL_REGEX = /\/d\/([a-zA-Z0-9-_]+)/;

// ponytail: raw ID minimal 20 karakter alfanumerik/dash/underscore
const RAW_ID_REGEX = /^[a-zA-Z0-9-_]{20,}$/;

/**
 * Ekstrak spreadsheet ID dari berbagai format URL Google Sheets.
 * Mendukung URL standar, URL dengan query string/fragment, dan raw ID.
 *
 * @returns spreadsheet ID jika berhasil parse, null jika gagal.
 *          TIDAK mengembalikan input mentah (ISS-04 fix).
 */
export function extractSpreadsheetId(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;

  const trimmed = urlOrId.trim();
  if (trimmed === '') return null;

  // 1. Coba match URL pattern /d/<ID>
  const match = trimmed.match(SPREADSHEET_URL_REGEX);
  if (match?.[1]) return match[1];

  // 2. Cek apakah input adalah raw spreadsheet ID
  if (RAW_ID_REGEX.test(trimmed)) return trimmed;

  // 3. Gagal parse — return null, bukan input mentah
  return null;
}

/**
 * Cari route dan sheet dari daftar routes berdasarkan spreadsheet ID canonical.
 * Menggunakan extractSpreadsheetId() untuk normalisasi, BUKAN includes().
 */
export function matchRouteSheetById(
  routes: Route[],
  spreadsheetId: string
): { route: Route; sheet: RouteSheet } | null {
  const targetId = extractSpreadsheetId(spreadsheetId);
  if (!targetId) return null;

  for (const route of routes) {
    for (const sheet of route.route_sheets ?? []) {
      // Compare canonical ID dari kedua sumber: spreadsheet_id field dan sheet_url
      const idFromField = extractSpreadsheetId(sheet.spreadsheet_id);
      const idFromUrl = extractSpreadsheetId(sheet.sheet_url);

      if (idFromField === targetId || idFromUrl === targetId) {
        return { route, sheet };
      }
    }
  }

  return null;
}
