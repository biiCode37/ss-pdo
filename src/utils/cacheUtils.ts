import type { Route, RouteSheet } from '../types/supabase';
import { matchRouteSheetById } from './sheetIdentity';

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

export type SheetMatchResult = {
  route: Route;
  sheet: RouteSheet;
};

// ponytail: consolidate duplicate findSheetInRoutes onto canonical matchRouteSheetById (SSOT)
export const findSheetInRoutes = matchRouteSheetById;

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
