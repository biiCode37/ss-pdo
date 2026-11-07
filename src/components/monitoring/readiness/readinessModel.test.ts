// src/components/monitoring/readiness/readinessModel.test.ts
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildReadinessViews,
  computeBacklog,
  deriveRouteState,
  filterViewsByProblem,
  pickDefaultDate,
  readWatchlist,
  summarizeViews,
  writeWatchlist,
} from './readinessModel';
import type { RouteCompleteness } from '../../../../supabase/functions/_shared/completeness.ts';
import type { SubmissionConfirmation } from '@/services/submissionReadinessService';

const comp = (over: Partial<RouteCompleteness['counts']> = {}, fingerprint = 'aaaa0001'): RouteCompleteness => ({
  v: 1, computedAt: '2026-11-07T14:00:00.000Z', status: 'ok',
  counts: { LENGKAP: 10, DIKECUALIKAN: 0, BELUM_DIISI: 0, JANGGAL: 0, SEBAGIAN: 0, ...over },
  issues: [], fingerprint,
});
const conf = (routeId: number, date: string, fingerprint: string | null = 'aaaa0001'): SubmissionConfirmation => ({
  route_id: routeId, route_code: `JAK.${routeId}`, date, confirmed_by: 'k@x.id',
  confirmed_at: '2026-11-07T14:30:00Z', issues_at_confirm: 0, reason: null, fingerprint_at_confirm: fingerprint,
});

describe('deriveRouteState', () => {
  it('memetakan setiap kondisi', () => {
    expect(deriveRouteState(null, null)).toBe('NO_DATA');
    expect(deriveRouteState({ ...comp(), status: 'header_not_found' }, null)).toBe('FORMAT_ERROR');
    expect(deriveRouteState(comp({ JANGGAL: 1, BELUM_DIISI: 1 }), null)).toBe('JANGGAL');
    expect(deriveRouteState(comp({ BELUM_DIISI: 2 }), null)).toBe('BELUM_DIISI');
    expect(deriveRouteState(comp({ SEBAGIAN: 1 }), null)).toBe('SEBAGIAN');
    expect(deriveRouteState(comp(), null)).toBe('READY_UNCONFIRMED');
    expect(deriveRouteState(comp(), conf(1, '2026-11-07'))).toBe('CONFIRMED');
    expect(deriveRouteState(comp({}, 'bbbb0002'), conf(1, '2026-11-07'))).toBe('CHANGED_AFTER_CONFIRM');
    expect(deriveRouteState(null, conf(1, '2026-11-07', null))).toBe('CONFIRMED');
  });
});

describe('buildReadinessViews & summarizeViews', () => {
  it('menyertakan rute tanpa data dan mengurutkan dari yang paling butuh perhatian', () => {
    const routes = [{ id: 1, route_code: 'JAK.01' }, { id: 2, route_code: 'JAK.02' }, { id: 3, route_code: 'JAK.10' }];
    const rows = [
      { route_id: 1, route_code: 'JAK.01', completeness: comp(), last_synced_at: null },
      { route_id: 3, route_code: 'JAK.10', completeness: comp({ JANGGAL: 1 }), last_synced_at: null },
    ];
    const views = buildReadinessViews(routes, rows, [conf(1, '2026-11-07'), conf(2, '2026-11-06')], '2026-11-07');
    expect(views.map((v) => [v.routeCode, v.state])).toEqual([
      ['JAK.10', 'JANGGAL'], ['JAK.02', 'NO_DATA'], ['JAK.01', 'CONFIRMED'],
    ]);
    expect(views.find((v) => v.routeCode === 'JAK.02')?.issueCount).toBe(1);
    expect(summarizeViews(views)).toEqual({ total: 3, confirmed: 1, janggal: 1, belumDiisi: 1, sebagian: 0, changed: 0 });
  });
});

describe('computeBacklog', () => {
  it('hanya tanggal sebelum hari ini, dalam 7 hari, dan tidak sebelum tanggal fitur aktif', () => {
    const routes = [{ id: 1, route_code: 'JAK.01' }, { id: 2, route_code: 'JAK.02' }];
    const backlog = computeBacklog({
      routes, todayWib: '2026-11-10', startDate: '2026-11-08', days: 7,
      confirmations: [conf(1, '2026-11-09'), conf(1, '2026-11-08'), conf(2, '2026-11-08')],
    });
    expect(backlog).toEqual([{ date: '2026-11-09', routeId: 2, routeCode: 'JAK.02' }]);
  });
});

describe('pickDefaultDate', () => {
  const routes = [{ id: 1, route_code: 'JAK.01' }, { id: 2, route_code: 'JAK.02' }];
  it('kemarin bila rute (pantauan atau semua) kemarin belum seluruhnya dikonfirmasi', () => {
    expect(pickDefaultDate({ todayWib: '2026-11-10', startDate: '2026-11-01', routes, confirmations: [conf(1, '2026-11-09')], watchlistYesterday: [] }))
      .toBe('2026-11-09');
    expect(pickDefaultDate({ todayWib: '2026-11-10', startDate: '2026-11-01', routes, confirmations: [conf(1, '2026-11-09')], watchlistYesterday: [1] }))
      .toBe('2026-11-10');
  });
  it('hari ini bila kemarin sebelum tanggal fitur aktif', () => {
    expect(pickDefaultDate({ todayWib: '2026-11-08', startDate: '2026-11-08', routes, confirmations: [], watchlistYesterday: [] }))
      .toBe('2026-11-08');
  });
});

describe('watchlist', () => {
  beforeEach(() => localStorage.clear());
  it('menyimpan per tanggal dan tahan data rusak', () => {
    writeWatchlist('2026-11-07', [3, 1]);
    expect(readWatchlist('2026-11-07')).toEqual([3, 1]);
    expect(readWatchlist('2026-11-08')).toEqual([]);
    localStorage.setItem('SS_SUBMISSION_WATCHLIST_2026-11-09', '{rusak');
    expect(readWatchlist('2026-11-09')).toEqual([]);
  });
});

describe('filterViewsByProblem', () => {
  const routes = [
    { id: 1, route_code: 'JAK.01' },
    { id: 2, route_code: 'JAK.02' },
    { id: 3, route_code: 'JAK.03' },
    { id: 4, route_code: 'JAK.04' },
    { id: 5, route_code: 'JAK.05' },
  ];
  const rows = [
    { route_id: 1, route_code: 'JAK.01', completeness: comp({ JANGGAL: 1 }), last_synced_at: null },
    { route_id: 2, route_code: 'JAK.02', completeness: comp({ BELUM_DIISI: 1 }), last_synced_at: null },
    { route_id: 3, route_code: 'JAK.03', completeness: null, last_synced_at: null },
    { route_id: 4, route_code: 'JAK.04', completeness: comp({}, 'bbbb0002'), last_synced_at: null },
    { route_id: 5, route_code: 'JAK.05', completeness: comp(), last_synced_at: null },
  ];
  const views = buildReadinessViews(routes, rows, [conf(4, '2026-11-07')], '2026-11-07');

  it('memfilter rute berdasarkan problemFilter untuk keempat nilai', () => {
    expect(filterViewsByProblem(views, 'all')).toHaveLength(5);
    expect(filterViewsByProblem(views, 'janggal').map((v) => v.routeCode)).toEqual(['JAK.01']);
    expect(filterViewsByProblem(views, 'belum').map((v) => v.routeCode)).toEqual(['JAK.02', 'JAK.03']);
    expect(filterViewsByProblem(views, 'changed').map((v) => v.routeCode)).toEqual(['JAK.04']);
  });
});

