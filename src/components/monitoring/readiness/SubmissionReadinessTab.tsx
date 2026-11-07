// src/components/monitoring/readiness/SubmissionReadinessTab.tsx
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ListChecks } from "lucide-react";
import { TEXT_MONITORING } from "@/constants/texts";
import { useSubmissionReadiness } from "./useSubmissionReadiness";
import {
  BACKLOG_DAYS, SUBMISSION_FEATURE_START_DATE, buildReadinessViews, computeBacklog, filterViewsByProblem,
  pickDefaultDate, readWatchlist, summarizeViews, writeWatchlist, type ProblemFilter, type RouteReadinessView,
} from "./readinessModel";
import { shiftDateString } from "../../../../supabase/functions/_shared/submissionRules.ts";
import { ReadinessRouteCard } from "./ReadinessRouteCard";
import { ReadinessRouteDetailModal } from "./ReadinessRouteDetailModal";
import { ReadinessBacklogBanner } from "./ReadinessBacklogBanner";
import { WatchlistModal } from "./WatchlistModal";

const T = TEXT_MONITORING.SUBMISSION;
export type ReadinessSegment = "kelengkapan" | "armada";

export function SubmissionReadinessTab({
  selectedDate, onSelectDate, segment, onSegmentChange, armadaContent, onRegisterReload,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  segment: ReadinessSegment;
  onSegmentChange: (s: ReadinessSegment) => void;
  armadaContent: ReactNode;
  onRegisterReload?: (fn: () => void) => void;
}) {
  const readiness = useSubmissionReadiness(selectedDate, segment === "kelengkapan");
  const [watchlist, setWatchlist] = useState<number[]>(() => readWatchlist(selectedDate));
  const [onlyWatchlist, setOnlyWatchlist] = useState(false);
  const [problemFilter, setProblemFilter] = useState<ProblemFilter>("all");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detail, setDetail] = useState<RouteReadinessView | null>(null);
  const defaultAppliedRef = useRef(false);

  useEffect(() => { setWatchlist(readWatchlist(selectedDate)); }, [selectedDate]);
  useEffect(() => { onRegisterReload?.(() => { void readiness.reload(); }); }, [onRegisterReload, readiness.reload]);

  // Tanggal default (sekali per mount): kemarin bila rute pantauan/semua rute kemarin belum tuntas
  useEffect(() => {
    if (defaultAppliedRef.current || readiness.loading || readiness.routes.length === 0) return;
    defaultAppliedRef.current = true;
    if (selectedDate !== readiness.todayWib) return;
    const target = pickDefaultDate({
      todayWib: readiness.todayWib,
      startDate: SUBMISSION_FEATURE_START_DATE,
      routes: readiness.routes,
      confirmations: readiness.confirmations,
      watchlistYesterday: readWatchlist(shiftDateString(readiness.todayWib, -1)),
    });
    if (target !== selectedDate) onSelectDate(target);
  }, [readiness.loading, readiness.routes, readiness.confirmations, readiness.todayWib, selectedDate, onSelectDate]);

  const views = useMemo(
    () => buildReadinessViews(readiness.routes, readiness.rows, readiness.confirmations, selectedDate),
    [readiness.routes, readiness.rows, readiness.confirmations, selectedDate],
  );
  const summary = summarizeViews(views);
  // Bila kategori yang difilter menjadi 0 (chip-nya hilang), kembali ke semua rute agar tidak terjebak daftar kosong
  const problemCounts: Record<ProblemFilter, number> = {
    all: 1,
    janggal: summary.janggal,
    belum: summary.belumDiisi,
    changed: summary.changed,
  };
  const activeProblemFilter: ProblemFilter = problemCounts[problemFilter] > 0 ? problemFilter : "all";
  const filteredByWatchlist = onlyWatchlist && watchlist.length > 0 ? views.filter((v) => watchlist.includes(v.routeId)) : views;
  const visibleViews = filterViewsByProblem(filteredByWatchlist, activeProblemFilter);
  const backlog = useMemo(
    () => computeBacklog({
      routes: readiness.routes, confirmations: readiness.confirmations, todayWib: readiness.todayWib,
      startDate: SUBMISSION_FEATURE_START_DATE, days: BACKLOG_DAYS,
    }),
    [readiness.routes, readiness.confirmations, readiness.todayWib],
  );

  return (
    <div className="submission-tab">
      <div className="ui-segmented" role="tablist">
        <button type="button" className="ui-segmented-btn" aria-pressed={segment === "kelengkapan"} onClick={() => onSegmentChange("kelengkapan")}>
          {T.SEGMENT_COMPLETENESS}
        </button>
        <button type="button" className="ui-segmented-btn" aria-pressed={segment === "armada"} onClick={() => onSegmentChange("armada")}>
          {T.SEGMENT_FLEET}
        </button>
      </div>

      {segment === "armada" ? armadaContent : (
        <>
          <ReadinessBacklogBanner items={backlog} onJump={onSelectDate} />
          {readiness.error && <p className="ui-tone-panel" data-tone="error" role="alert">{T.LOAD_FAILED}</p>}
          <div className="ui-segmented ui-segmented--inline">
            <button type="button" className="ui-segmented-btn" aria-pressed={!onlyWatchlist} onClick={() => setOnlyWatchlist(false)}>{T.FILTER_ALL}</button>
            <button type="button" className="ui-segmented-btn" aria-pressed={onlyWatchlist} onClick={() => setOnlyWatchlist(true)}>{T.FILTER_WATCHLIST(watchlist.length)}</button>
          </div>
          <div className="submission-control-bar">
            <span className="submission-control-bar__summary">{T.SUMMARY(summary.confirmed, summary.total)}</span>
            {summary.janggal > 0 && (
              <button
                type="button"
                className="ui-chip-btn ui-chip-btn--error"
                aria-pressed={activeProblemFilter === "janggal"}
                onClick={() => setProblemFilter(activeProblemFilter === "janggal" ? "all" : "janggal")}
              >
                {T.SUMMARY_JANGGAL(summary.janggal)}
              </button>
            )}
            {summary.belumDiisi > 0 && (
              <button
                type="button"
                className="ui-chip-btn ui-chip-btn--error"
                aria-pressed={activeProblemFilter === "belum"}
                onClick={() => setProblemFilter(activeProblemFilter === "belum" ? "all" : "belum")}
              >
                {T.SUMMARY_BELUM(summary.belumDiisi)}
              </button>
            )}
            {summary.changed > 0 && (
              <button
                type="button"
                className="ui-chip-btn ui-chip-btn--warning"
                aria-pressed={activeProblemFilter === "changed"}
                onClick={() => setProblemFilter(activeProblemFilter === "changed" ? "all" : "changed")}
              >
                {T.SUMMARY_CHANGED(summary.changed)}
              </button>
            )}
            <button
              type="button"
              className="ui-button ui-button--secondary submission-control-bar__pick-btn"
              aria-label={T.PICK_ROUTES}
              onClick={() => setPickerOpen(true)}
            >
              <ListChecks size={20} aria-hidden="true" />
            </button>
          </div>
          {onlyWatchlist && watchlist.length === 0 && <p className="submission-modal__text">{T.EMPTY_WATCHLIST}</p>}
          <ul className="submission-list">
            {visibleViews.map((v) => <ReadinessRouteCard key={v.routeId} view={v} onOpen={setDetail} />)}
          </ul>
          <WatchlistModal isOpen={pickerOpen} routes={readiness.routes} selected={watchlist} onClose={() => setPickerOpen(false)}
            onSave={(ids) => { setWatchlist(ids); writeWatchlist(selectedDate, ids); }} />
          <ReadinessRouteDetailModal
            view={detail ? views.find((v) => v.routeId === detail.routeId) ?? detail : null}
            date={selectedDate}
            onClose={() => setDetail(null)}
            onConfirmed={readiness.applyConfirmation}
          />
        </>
      )}
    </div>
  );
}
