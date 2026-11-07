// src/components/monitoring/readiness/useSubmissionReadiness.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/services/supabase';
import { getWibTodayString } from '@/services/regionalIngestionService';
import {
  fetchActiveRoutes,
  fetchConfirmationsInRange,
  fetchReadinessByDate,
  type ActiveRoute,
  type RouteReadinessRow,
  type SubmissionConfirmation,
} from '@/services/submissionReadinessService';
import { shiftDateString } from '../../../../supabase/functions/_shared/submissionRules.ts';
import { BACKLOG_DAYS } from './readinessModel';

export const READINESS_REALTIME_DEBOUNCE_MS = 3000;

export function useSubmissionReadiness(selectedDate: string, enabled: boolean) {
  const [routes, setRoutes] = useState<ActiveRoute[]>([]);
  const [rows, setRows] = useState<RouteReadinessRow[]>([]);
  const [confirmations, setConfirmations] = useState<SubmissionConfirmation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const todayWib = getWibTodayString();
  const rangeStart = [shiftDateString(todayWib, -BACKLOG_DAYS), selectedDate].sort()[0];
  const rangeEnd = [todayWib, selectedDate].sort()[1];
  const isFetchingRef = useRef(false);

  const reload = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const [r, rr, cc] = await Promise.all([
        fetchActiveRoutes(),
        fetchReadinessByDate(selectedDate),
        fetchConfirmationsInRange(rangeStart, rangeEnd),
      ]);
      setRoutes(r);
      setRows(rr);
      setConfirmations(cc);
      setError(false);
    } catch (err) {
      console.warn('[SubmissionReadiness] Gagal memuat:', err);
      setError(true);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [selectedDate, rangeStart, rangeEnd]);

  const reloadRef = useRef(reload);
  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  useEffect(() => {
    if (enabled) reloadRef.current();
  }, [enabled, reload]);

  // Realtime: payload sudah membawa nilai terbaru, sehingga diterapkan di tempat tanpa request.
  useEffect(() => {
    if (!enabled) return;
    const pendingRows = new Map<number, RouteReadinessRow>();
    const pendingConfs = new Map<number, SubmissionConfirmation>();
    let timer: ReturnType<typeof setTimeout> | null = null;
    let hadDisconnect = false;

    const flush = () => {
      timer = null;
      if (pendingRows.size > 0) {
        const updates = new Map(pendingRows);
        pendingRows.clear();
        setRows((prev) => {
          const next = prev.filter((r) => !updates.has(r.route_id));
          return [...next, ...updates.values()];
        });
      }
      if (pendingConfs.size > 0) {
        const updates = new Map(pendingConfs);
        pendingConfs.clear();
        setConfirmations((prev) => [
          ...prev.filter((c) => !(c.date === selectedDate && updates.has(c.route_id))),
          ...updates.values(),
        ]);
      }
    };
    const schedule = () => {
      if (!timer) timer = setTimeout(flush, READINESS_REALTIME_DEBOUNCE_MS);
    };

    const channel = supabase
      .channel(`submission-readiness-${selectedDate}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_route_reports', filter: `date=eq.${selectedDate}` },
        (payload: { new: Record<string, unknown> }) => {
          const n = payload.new;
          if (!n || typeof n.route_id !== 'number') return;
          pendingRows.set(n.route_id, {
            route_id: n.route_id,
            route_code: String(n.route_code ?? ''),
            completeness: (n.completeness ?? null) as RouteReadinessRow['completeness'],
            last_synced_at: (n.last_synced_at ?? null) as string | null,
          });
          schedule();
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'route_submission_confirmations', filter: `date=eq.${selectedDate}` },
        (payload: { new: Record<string, unknown> }) => {
          const n = payload.new as unknown as SubmissionConfirmation;
          if (!n || typeof n.route_id !== 'number') return;
          pendingConfs.set(n.route_id, n);
          schedule();
        })
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') hadDisconnect = true;
        else if (status === 'SUBSCRIBED' && hadDisconnect) {
          hadDisconnect = false;
          reloadRef.current(); // tersambung lagi: muat ulang sekali agar tidak ada event yang terlewat
        }
      });

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [enabled, selectedDate]);

  const applyConfirmation = useCallback((c: SubmissionConfirmation) => {
    setConfirmations((prev) => [...prev.filter((x) => !(x.date === c.date && x.route_id === c.route_id)), c]);
  }, []);

  return { routes, rows, confirmations, todayWib, loading, error, reload, applyConfirmation };
}
