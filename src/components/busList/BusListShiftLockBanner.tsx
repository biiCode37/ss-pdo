import React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { TEXT_FLEET_STATUS } from "@/constants/texts";

interface BusListShiftLockBannerProps {
  activeShift?: 1 | 2;
  onOpenFleetStatus?: () => void;
}

export const BusListShiftLockBanner: React.FC<BusListShiftLockBannerProps> = ({
  activeShift = 1,
  onOpenFleetStatus,
}) => {
  return (
    <div
      className="shift-lock-banner"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "8px",
        padding: "10px 14px",
        borderRadius: "12px",
        background: "rgba(245, 158, 11, 0.12)",
        border: "1px solid rgba(245, 158, 11, 0.35)",
        color: "var(--warning-text, #f59e0b)",
        marginBottom: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flex: "1 1 auto",
        }}
      >
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        <span
          style={{ fontSize: "12px", fontWeight: 600, lineHeight: 1.35 }}
        >
          {TEXT_FLEET_STATUS.MODAL.LOCK_BANNER_MESSAGE(activeShift || 1)}
        </span>
      </div>
      {onOpenFleetStatus && (
        <button
          type="button"
          onClick={onOpenFleetStatus}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "5px 12px",
            borderRadius: "8px",
            background: "rgba(245, 158, 11, 0.22)",
            border: "1px solid rgba(245, 158, 11, 0.45)",
            color: "inherit",
            fontSize: "11.5px",
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <span>{TEXT_FLEET_STATUS.ALERT_BAR.ACTION_BTN}</span>
          <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
};
