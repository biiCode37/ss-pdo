import type { Route, RouteSheet } from '../types/supabase';

/** Flatten supabase routes ke daftar sheet dengan route info */
export interface FlatRouteSheet {
  routeId: number;
  routeCode: string;
  routeName: string;
  sheet: RouteSheet;
}

export function flattenRoutes(routes: Route[]): FlatRouteSheet[] {
  const result: FlatRouteSheet[] = [];
  for (const r of routes) {
    for (const s of r.route_sheets || []) {
      result.push({
        routeId: r.id,
        routeCode: r.route_code,
        routeName: r.route_name,
        sheet: s,
      });
    }
  }
  return result;
}
