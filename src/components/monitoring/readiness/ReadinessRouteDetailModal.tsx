// src/components/monitoring/readiness/ReadinessRouteDetailModal.tsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ModalShell } from "@/components/ui/ModalShell";
import { TEXT_MONITORING } from "@/constants/texts";
import { showErrorToast, showInfoToast, showSuccessToast } from "@/utils/alertUtils";
import { triggerRealtimeSheetSync } from "@/services/realtimeSyncService";
import {
  confirmRouteSubmission,
  ConfirmSubmissionError,
  type SubmissionConfirmation,
} from "@/services/submissionReadinessService";
import { REASON_MIN_LENGTH } from "../../../../supabase/functions/_shared/submissionRules.ts";
import { STATE_TONE } from "./ReadinessRouteCard";
import type { RouteReadinessView } from "./readinessModel";

const T = TEXT_MONITORING.SUBMISSION;

export function ReadinessRouteDetailModal({
  view, date, onClose, onConfirmed,
}: {
  view: RouteReadinessView | null;
  date: string;
  onClose: () => void;
  onConfirmed: (c: SubmissionConfirmation) => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setReason(""); }, [view?.routeId, date]);
  if (!view) return null;

  const c = view.completeness;
  const problems = c ? c.issues.filter((i) => i.status !== "WAJAR") : [];
  const wajarIssues = c ? c.issues.filter((i) => i.status === "WAJAR") : [];
  const hasIssues = problems.length > 0 || wajarIssues.length > 0;
  const needsReason = view.issueCount > 0;
  const canConfirm = !busy && (!needsReason || reason.trim().length >= REASON_MIN_LENGTH);

  const handleRecheck = () => {
    showInfoToast(T.RECHECK_SENT(view.routeCode));
    triggerRealtimeSheetSync(view.routeCode, date);
  };

  const handleConfirm = async () => {
    setBusy(true);
    try {
      const saved = await confirmRouteSubmission({ routeId: view.routeId, date, reason: needsReason ? reason : undefined });
      onConfirmed(saved);
      showSuccessToast(T.CONFIRM_SUCCESS(view.routeCode));
      onClose();
    } catch (err) {
      const code = err instanceof ConfirmSubmissionError ? err.code : "FAILED";
      showErrorToast(T.ERRORS[code] || T.ERRORS.FAILED);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell isOpen onClose={onClose} title={T.DETAIL_TITLE(view.routeCode)} id="submission-detail" backHandlerId="submission_detail"
      backdropClassName="modal-overlay submission-modal-backdrop" contentClassName="submission-modal">
      <div className="submission-modal__header">
        <div className="submission-modal__heading">
          <h2 className="submission-modal__title">{T.DETAIL_TITLE(view.routeCode)}</h2>
          <span className="ui-status" data-tone={STATE_TONE[view.state]}>{T.STATE[view.state]}</span>
        </div>
        <button
          type="button"
          className="ui-button ui-button--secondary submission-modal__close"
          aria-label={T.BTN_CLOSE}
          onClick={onClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="submission-modal__body">
        {!c && <p className="submission-modal__text">{T.DETAIL_NO_DATA}</p>}
        {c && c.status !== "ok" && <p className="submission-modal__text">{T.DETAIL_FORMAT_ERROR}</p>}
        {c && c.status === "ok" && problems.length === 0 && <p className="submission-modal__text">{T.DETAIL_NO_ISSUES}</p>}
        {c && c.status === "ok" && hasIssues && (
          <ul className="submission-issues">
            {problems.map((issue) => (
              <li key={issue.unit} className="submission-issue">
                <span className="submission-issue__unit">{issue.unit}</span>
                <span className="ui-status" data-tone={issue.status === "SEBAGIAN" ? "warning" : "error"}>
                  {issue.reason
                    ? T.ISSUE_REASON[issue.reason]
                    : issue.missing
                      ? T.ISSUE_MISSING(issue.missing.map((f) => T.FIELD[f]).join(", "))
                      : T.ISSUE_EMPTY}
                </span>
              </li>
            ))}
            {wajarIssues.map((issue) => {
              const fields = (issue.missing || []).map((f) => T.FIELD[f]).join(", ");
              return (
                <li key={issue.unit} className="submission-issue">
                  <span className="submission-issue__unit">{issue.unit}</span>
                  <span className="ui-status" data-tone="neutral">
                    {T.ISSUE_WAJAR(fields, issue.note ?? "")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="submission-modal__footer">
        {needsReason && (
          <label className="submission-reason">
            <span>{T.REASON_LABEL}</span>
            <textarea
              className="ui-input"
              rows={2}
              maxLength={300}
              value={reason}
              placeholder={T.REASON_PLACEHOLDER}
              onChange={(e) => setReason(e.target.value)}
            />
            <span className="submission-modal__text">{T.REASON_HINT(view.issueCount)}</span>
          </label>
        )}
        <div className="submission-actions">
          <button type="button" className="ui-button ui-button--secondary" onClick={handleRecheck}>{T.BTN_RECHECK}</button>
          <button type="button" className="ui-button ui-button--primary" disabled={!canConfirm} onClick={handleConfirm}>{T.BTN_CONFIRM}</button>
        </div>
      </div>
    </ModalShell>
  );
}
