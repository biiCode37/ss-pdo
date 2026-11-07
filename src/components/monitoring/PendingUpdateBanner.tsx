// src/components/monitoring/PendingUpdateBanner.tsx
import { TEXT_MONITORING } from "@/constants/texts";

export function PendingUpdateBanner({ visible, onReload }: { visible: boolean; onReload: () => void }) {
  if (!visible) return null;
  return (
    <div className="ui-tone-panel submission-update-banner" role="status">
      <span>{TEXT_MONITORING.PENDING_UPDATE.MESSAGE}</span>
      <button type="button" className="ui-button ui-button--secondary" onClick={onReload}>
        {TEXT_MONITORING.PENDING_UPDATE.RELOAD}
      </button>
    </div>
  );
}
