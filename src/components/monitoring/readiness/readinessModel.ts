// src/components/monitoring/readiness/readinessModel.ts
import { countCompletenessIssues, type RouteCompleteness } from '../../../../supabase/functions/_shared/completeness.ts';
import { shiftDateString } from '../../../../supabase/functions/_shared/submissionRules.ts';
import type { ActiveRoute, RouteReadinessRow, SubmissionConfirmation } from '@/services/submissionReadinessService';

// Tanggal fitur aktif di produksi (WIB). Tunggakan & tanggal default tidak menilai tanggal sebelumnya.
// Diisi ulang dengan tanggal deploy produksi di Task 10.
export const SUBMISSION_FEATURE_START_DATE = '2026-11-08';
export const BACKLOG_DAYS = 7;
const WATCHLIST_KEY_PREFIX = 'SS_SUBMISSION_WATCHLIST_';

export type RouteReadinessState =
  | 'JANGGAL' | 'BELUM_DIISI' | 'NO_DATA' | 'FORMAT_ERROR' | 'SEBAGIAN'
  | 'CHANGED_AFTER_CONFIRM' | 'READY_UNCONFIRMED' | 'CONFIRMED';

export interface RouteReadinessView {
  routeId: number;
  routeCode: string;
  completeness: RouteCompleteness | null;
  lastSyncedAt: string | null;
  confirmation: SubmissionConfirmation | null;
  state: RouteReadinessState;
  issueCount: number;
}

const STATE_ORDER: Record<RouteReadinessState, number> = {
  JANGGAL: 0, BELUM_DIISI: 1, NO_DATA: 1, FORMAT_ERROR: 1, SEBAGIAN: 2,
  CHANGED_AFTER_CONFIRM: 3, READY_UNCONFIRMED: 4, CONFIRMED: 5,
};

export function deriveRouteState(
  c: RouteCompleteness | null,
  confirmation: SubmissionConfirmation | null,
): RouteReadinessState {
  if (confirmation) {
    const current = c?.fingerprint || null;
    return current !== (confirmation.fingerprint_at_confirm || null) ? 'CHANGED_AFTER_CONFIRM' : 'CONFIRMED';
  }
  if (!c) return 'NO_DATA';
  if (c.status !== 'ok') return 'FORMAT_ERROR';
  if (c.counts.JANGGAL > 0) return 'JANGGAL';
  if (c.counts.BELUM_DIISI > 0) return 'BELUM_DIISI';
  if (c.counts.SEBAGIAN > 0) return 'SEBAGIAN';
  return 'READY_UNCONFIRMED';
}

export function buildReadinessViews(
  routes: ActiveRoute[],
  rows: RouteReadinessRow[],
  confirmations: SubmissionConfirmation[],
  date: string,
): RouteReadinessView[] {
  const rowByRoute = new Map(rows.map((r) => [r.route_id, r]));
  const confByRoute = new Map(confirmations.filter((c) => c.date === date).map((c) => [c.route_id, c]));
  return routes
    .map((route) => {
      const row = rowByRoute.get(route.id);
      const completeness = row?.completeness ?? null;
      const confirmation = confByRoute.get(route.id) ?? null;
      return {
        routeId: route.id,
        routeCode: route.route_code,
        completeness,
        lastSyncedAt: row?.last_synced_at ?? null,
        confirmation,
        state: deriveRouteState(completeness, confirmation),
        issueCount: countCompletenessIssues(completeness),
      };
    })
    .sort((a, b) =>
      STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
      a.routeCode.localeCompare(b.routeCode, 'id', { numeric: true }),
    );
}

export function summarizeViews(views: RouteReadinessView[]) {
  return {
    total: views.length,
    confirmed: views.filter((v) => v.state === 'CONFIRMED').length,
    janggal: views.filter((v) => v.state === 'JANGGAL').length,
    belumDiisi: views.filter((v) => v.state === 'BELUM_DIISI' || v.state === 'NO_DATA' || v.state === 'FORMAT_ERROR').length,
    sebagian: views.filter((v) => v.state === 'SEBAGIAN').length,
    changed: views.filter((v) => v.state === 'CHANGED_AFTER_CONFIRM').length,
  };
}

export function computeBacklog(params: {
  routes: ActiveRoute[];
  confirmations: SubmissionConfirmation[];
  todayWib: string;
  startDate: string;
  days: number;
}): Array<{ date: string; routeId: number; routeCode: string }> {
  const confirmed = new Set(params.confirmations.map((c) => `${c.date}#${c.route_id}`));
  const items: Array<{ date: string; routeId: number; routeCode: string }> = [];
  for (let i = 1; i <= params.days; i++) {
    const date = shiftDateString(params.todayWib, -i);
    if (date < params.startDate) break;
    for (const route of params.routes) {
      if (!confirmed.has(`${date}#${route.id}`)) items.push({ date, routeId: route.id, routeCode: route.route_code });
    }
  }
  return items;
}

export function pickDefaultDate(params: {
  todayWib: string;
  startDate: string;
  routes: ActiveRoute[];
  confirmations: SubmissionConfirmation[];
  watchlistYesterday: number[];
}): string {
  const yesterday = shiftDateString(params.todayWib, -1);
  if (yesterday < params.startDate) return params.todayWib;
  const targetIds = params.watchlistYesterday.length > 0 ? params.watchlistYesterday : params.routes.map((r) => r.id);
  const confirmed = new Set(params.confirmations.filter((c) => c.date === yesterday).map((c) => c.route_id));
  return targetIds.some((id) => !confirmed.has(id)) ? yesterday : params.todayWib;
}

export function readWatchlist(date: string): number[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY_PREFIX + date);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

export function writeWatchlist(date: string, routeIds: number[]): void {
  try {
    localStorage.setItem(WATCHLIST_KEY_PREFIX + date, JSON.stringify(routeIds));
  } catch {
    // storage diblokir: filter pantauan hanya berlaku di sesi ini
  }
}

