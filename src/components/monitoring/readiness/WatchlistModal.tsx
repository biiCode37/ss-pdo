// src/components/monitoring/readiness/WatchlistModal.tsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ModalShell } from "@/components/ui/ModalShell";
import { TEXT_MONITORING } from "@/constants/texts";
import type { ActiveRoute } from "@/services/submissionReadinessService";

const T = TEXT_MONITORING.SUBMISSION;

export function WatchlistModal({
  isOpen, routes, selected, onClose, onSave,
}: {
  isOpen: boolean;
  routes: ActiveRoute[];
  selected: number[];
  onClose: () => void;
  onSave: (ids: number[]) => void;
}) {
  const [draft, setDraft] = useState<number[]>(selected);
  useEffect(() => { if (isOpen) setDraft(selected); }, [isOpen, selected]);
  const toggle = (id: number) => setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={T.WATCHLIST_TITLE} id="submission-watchlist" backHandlerId="submission_watchlist"
      backdropClassName="modal-overlay submission-modal-backdrop" contentClassName="submission-modal">
      <div className="submission-modal__header">
        <h2 className="submission-modal__title">{T.WATCHLIST_TITLE}</h2>
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
        <div className="submission-watchlist">
          {routes.map((r) => (
            <button
              key={r.id}
              type="button"
              className="ui-option-btn"
              aria-pressed={draft.includes(r.id)}
              onClick={() => toggle(r.id)}
            >
              {r.route_code}
            </button>
          ))}
        </div>
      </div>
      <div className="submission-modal__footer">
        <div className="submission-actions">
          <button type="button" className="ui-button ui-button--secondary" onClick={onClose}>{T.BTN_CLOSE}</button>
          <button type="button" className="ui-button ui-button--primary" onClick={() => { onSave(draft); onClose(); }}>{T.WATCHLIST_SAVE}</button>
        </div>
      </div>
    </ModalShell>
  );
}
