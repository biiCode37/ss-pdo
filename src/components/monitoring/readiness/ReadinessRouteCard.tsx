// src/components/monitoring/readiness/ReadinessRouteCard.tsx
import { TEXT_MONITORING } from "@/constants/texts";
import type { RouteReadinessState, RouteReadinessView } from "./readinessModel";

const T = TEXT_MONITORING.SUBMISSION;
export const STATE_TONE: Record<RouteReadinessState, "error" | "warning" | "info" | "success" | "neutral"> = {
  JANGGAL: "error", BELUM_DIISI: "error", NO_DATA: "neutral", FORMAT_ERROR: "error",
  SEBAGIAN: "warning", CHANGED_AFTER_CONFIRM: "warning", READY_UNCONFIRMED: "info", CONFIRMED: "success",
};

export function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}

export function ReadinessRouteCard({ view, onOpen }: { view: RouteReadinessView; onOpen: (v: RouteReadinessView) => void }) {
  const c = view.completeness;
  const total = c ? Object.values(c.counts).reduce((a, b) => a + b, 0) : 0;
  const lengkap = c ? c.counts.LENGKAP + c.counts.DIKECUALIKAN : 0;
  return (
    <li>
      <button type="button" className="submission-card" onClick={() => onOpen(view)}>
        <span className="submission-card__head">
          <span className="submission-card__code">{view.routeCode}</span>
          <span className="ui-status" data-tone={STATE_TONE[view.state]}>{T.STATE[view.state]}</span>
        </span>
        {c && c.status === "ok" && <span className="submission-card__meta">{T.UNIT_COUNTS(lengkap, total)}</span>}
        {view.lastSyncedAt && <span className="submission-card__meta">{T.UPDATED_AT(formatTime(view.lastSyncedAt))}</span>}
        {view.confirmation && (
          <span className="submission-card__meta">
            {T.CONFIRMED_BY(view.confirmation.confirmed_by.split("@")[0], formatTime(view.confirmation.confirmed_at))}
          </span>
        )}
      </button>
    </li>
  );
}
