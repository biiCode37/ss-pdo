import type { Route, RouteSheet } from '../types/supabase';
import { extractSpreadsheetId } from './sheetIdentity';

export const CURRENT_CACHE_VERSION = '6';
const CACHE_VERSION_KEY = 'PDO_APP_CACHE_VERSION';
const CACHE_ROUTES_KEY = 'PDO_CACHE_ROUTES';

/**
 * Checks cache version on startup and migrates/cleans obsolete volatile caches.
 * Preserves authentication credentials, theme, and offline queue.
 * // ponytail: version check prevents runtime crashes when schema/data structures change across versions
 */
export function checkAndMigrateCache(): void {
  try {
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    if (storedVersion !== CURRENT_CACHE_VERSION) {
      // Clear volatile route cache so fresh structures can be fetched from Supabase
      localStorage.removeItem(CACHE_ROUTES_KEY);
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
    }
  } catch (err) {
    console.warn('[CacheUtils] Error migrating cache version:', err);
  }
}

/**
 * Safely parses and retrieves routes from localStorage cache.
 * Returns empty array if not found or corrupted.
 */
export function getRoutesFromCache(): Route[] {
  try {
    const cached = localStorage.getItem(CACHE_ROUTES_KEY);
    if (!cached) return [];
    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[CacheUtils] Corrupt routes cache found, returning empty array:', err);
    return [];
  }
}

export interface SheetMatchResult {
  route: Route;
  sheet: RouteSheet;
}

/**
 * Finds a matching sheet and its parent route from the routes list by sheet URL or Sheet ID.
 */
export function findSheetInRoutes(routes: Route[], sheetUrlOrId: string): SheetMatchResult | null {
  if (!routes || !Array.isArray(routes) || !sheetUrlOrId) return null;
  const targetId = extractSpreadsheetId(sheetUrlOrId);
  const targetUrl = sheetUrlOrId.trim().toLowerCase();

  for (const r of routes) {
    if (r.route_sheets && Array.isArray(r.route_sheets)) {
      for (const s of r.route_sheets) {
        const sUrl = (s.sheet_url || '').trim().toLowerCase();
        const sId = extractSpreadsheetId(sUrl) || extractSpreadsheetId(s.spreadsheet_id);

        if (
          (targetId && sId && targetId === sId) ||
          (targetUrl && sUrl && (sUrl === targetUrl || targetUrl.includes(sUrl) || sUrl.includes(targetUrl)))
        ) {
          return { route: r, sheet: s };
        }
      }
    }
  }
  return null;
}

/**
 * Helper to get route_code for a sheet URL or ID from routes cache.
 */
export function getRouteCodeForSheet(sheetUrlOrId: string): string {
  const routes = getRoutesFromCache();
  const match = findSheetInRoutes(routes, sheetUrlOrId);
  return match?.route?.route_code || '';
}

/**
 * Helper to get active month and year for a sheet URL from routes cache.
 */
export function getMonthYearForSheet(sheetUrlOrId: string): { month: number; year: number } {
  const routes = getRoutesFromCache();
  const match = findSheetInRoutes(routes, sheetUrlOrId);
  if (match) {
    return {
      month: match.sheet.month,
      year: match.sheet.year,
    };
  }
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}
