import { Loader2 } from "lucide-react";
import { TEXT_FLEET_STATUS } from "@/constants/texts";

interface FleetStatusFooterProps {
  currentShift: 1 | 2;
  summaryCounts: { sgo: number; off: number; to: number };
  isSaving: boolean;
  onConfirm: () => void;
}

export function FleetStatusFooter({
  currentShift,
  summaryCounts,
  isSaving,
  onConfirm,
}: FleetStatusFooterProps) {
  return (
    <div
      style={{
        padding: "14px 20px calc(18px + env(safe-area-inset-bottom, 14px)) 20px",
        borderTop: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
        backgroundColor: "var(--bg-card, #171717)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Summary Pills */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "6px",
          fontSize: "12px",
          fontWeight: 700,
        }}
      >
        <span style={{ color: "#10b981" }}>SGO: {summaryCounts.sgo}</span>
        <span style={{ color: "#f59e0b" }}>OFF: {summaryCounts.off}</span>
        <span style={{ color: "#ef4444" }}>T.O: {summaryCounts.to}</span>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={isSaving}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "12px",
          border: "none",
          background: "var(--accent-color, #3ECF8E)",
          color: "#000",
          fontWeight: 800,
          fontSize: "14px",
          cursor: isSaving ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          boxShadow: "0 4px 14px rgba(62, 207, 142, 0.35)",
          transition: "all 0.18s ease",
        }}
      >
        {isSaving ? (
          <>
            <Loader2 className="spinner" size={18} />
            <span>{TEXT_FLEET_STATUS.MODAL.SAVING}</span>
          </>
        ) : (
          <span>{TEXT_FLEET_STATUS.MODAL.CONFIRM_APPLY_SHIFT(currentShift)}</span>
        )}
      </button>
    </div>
  );
}
