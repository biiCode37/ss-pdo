// src/components/monitoring/readiness/ReadinessBacklogBanner.tsx
import { useState } from "react";
import { TEXT_MONITORING } from "@/constants/texts";

const T = TEXT_MONITORING.SUBMISSION;

export function ReadinessBacklogBanner({
  items,
  onJump,
}: {
  items: Array<{ date: string; routeId: number; routeCode: string }>;
  onJump: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <section className="ui-tone-panel" data-tone="warning" aria-live="polite">
      <div className="submission-toolbar">
        <span>{T.BACKLOG_TITLE(items.length)}</span>
        <button type="button" className="ui-button ui-button--secondary" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? T.BACKLOG_HIDE : T.BACKLOG_SHOW}
        </button>
      </div>
      {open && (
        <ul className="submission-backlog-list">
          {items.map((it) => (
            <li key={`${it.date}-${it.routeId}`}>
              <button type="button" className="ui-option-btn" onClick={() => onJump(it.date)}>
                {T.BACKLOG_ITEM(it.routeCode, it.date)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
