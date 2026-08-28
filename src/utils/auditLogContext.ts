import { getRoutesFromCache, findSheetInRoutes } from './cacheUtils';

export interface RouteContext {
  routeCode?: string;
  year?: number;
  month?: number;
  day?: number;
}

function parseNumericTab(tabName: string): number | null {
  if (!tabName) return null;
  const trimmed = String(tabName).trim();
  if (!/^\d{1,2}$/.test(trimmed)) return null;
  const day = Number(trimmed);
  return day >= 1 && day <= 31 ? day : null;
}

export function resolveRouteContext(sheetId: string, tabName?: string): RouteContext {
  const match = findSheetInRoutes(getRoutesFromCache(), sheetId);
  if (!match) return {};

  const { route: matchRoute, sheet: matchSheet } = match;
  const context: RouteContext = {
    routeCode: matchRoute.route_code,
    year: matchSheet.year,
    month: matchSheet.month,
  };

  if (tabName) {
    const day = parseNumericTab(tabName);
    if (day !== null) {
      context.day = day;
    }
  }

  return context;
}