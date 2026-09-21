import { Lock } from "lucide-react";
import { TEXT_FLEET_STATUS } from "@/constants/texts";
import type { BrushMode } from "./types";

interface FleetStatusToolbarProps {
  currentShift: 1 | 2;
  onSelectShift: (shift: 1 | 2) => void;
  activeBrush: BrushMode;
  onSelectBrush: (brush: BrushMode) => void;
  onSgoAll: () => void;
  isLocked?: boolean;
}

export function FleetStatusToolbar({
  currentShift,
  onSelectShift,
  activeBrush,
  onSelectBrush,
  onSgoAll,
  isLocked = false,
}: FleetStatusToolbarProps) {
  return (
    <div
      style={{
        padding: "12px 20px",
        borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
        backgroundColor: "rgba(255, 255, 255, 0.02)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Shift Toggle Tabs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px",
          background: "var(--input-bg, rgba(255, 255, 255, 0.04))",
          padding: "3px",
          borderRadius: "10px",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
        }}
      >
        <button
          type="button"
          onClick={() => onSelectShift(1)}
          style={{
            padding: "7px",
            borderRadius: "8px",
            border: "none",
            background: currentShift === 1 ? "var(--accent-color, #3ECF8E)" : "transparent",
            color: currentShift === 1 ? "#000" : "var(--text-secondary)",
            fontWeight: 700,
            fontSize: "12px",
            cursor: "pointer",
            transition: "all 0.18s ease",
          }}
        >
          {TEXT_FLEET_STATUS.MODAL.SHIFT_1_TAB}
        </button>
        <button
          type="button"
          onClick={() => onSelectShift(2)}
          style={{
            padding: "7px",
            borderRadius: "8px",
            border: "none",
            background: currentShift === 2 ? "var(--accent-color, #3ECF8E)" : "transparent",
            color: currentShift === 2 ? "#000" : "var(--text-secondary)",
            fontWeight: 700,
            fontSize: "12px",
            cursor: "pointer",
            transition: "all 0.18s ease",
          }}
        >
          {TEXT_FLEET_STATUS.MODAL.SHIFT_2_TAB}
        </button>
      </div>

      {/* Lock Banner if locked */}
      {isLocked && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            color: "#f87171",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          <Lock size={14} />
          <span>{TEXT_FLEET_STATUS.LOCK.LOCKED_BANNER(currentShift)}</span>
        </div>
      )}

      {/* Mode Pemilih Status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          flexWrap: "wrap",
          opacity: isLocked ? 0.45 : 1,
          pointerEvents: isLocked ? "none" : "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {/* Status SGO */}
          <button
            type="button"
            onClick={() => onSelectBrush("SGO")}
            disabled={isLocked}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 10px",
              borderRadius: "8px",
              border: activeBrush === "SGO" ? "1.5px solid #10b981" : "1px solid var(--border-color)",
              background: activeBrush === "SGO" ? "rgba(16, 185, 129, 0.2)" : "transparent",
              color: "#10b981",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: isLocked ? "not-allowed" : "pointer",
            }}
          >
            {TEXT_FLEET_STATUS.STATUS_CODES.SGO}
          </button>

          {/* Status OFF */}
          <button
            type="button"
            onClick={() => onSelectBrush("OFF")}
            disabled={isLocked}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 10px",
              borderRadius: "8px",
              border: activeBrush === "OFF" ? "1.5px solid #f59e0b" : "1px solid var(--border-color)",
              background: activeBrush === "OFF" ? "rgba(245, 158, 11, 0.2)" : "transparent",
              color: "#f59e0b",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: isLocked ? "not-allowed" : "pointer",
            }}
          >
            {TEXT_FLEET_STATUS.STATUS_CODES.OFF}
          </button>

          {/* Status TO */}
          <button
            type="button"
            onClick={() => onSelectBrush("TO")}
            disabled={isLocked}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 10px",
              borderRadius: "8px",
              border: activeBrush === "TO" ? "1.5px solid #ef4444" : "1px solid var(--border-color)",
              background: activeBrush === "TO" ? "rgba(239, 68, 68, 0.2)" : "transparent",
              color: "#ef4444",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: isLocked ? "not-allowed" : "pointer",
            }}
          >
            {TEXT_FLEET_STATUS.STATUS_CODES.TO}
          </button>

          {/* Status SO */}
          <button
            type="button"
            onClick={() => onSelectBrush("SO")}
            disabled={isLocked}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 10px",
              borderRadius: "8px",
              border: activeBrush === "SO" ? "1.5px solid #a855f7" : "1px solid var(--border-color)",
              background: activeBrush === "SO" ? "rgba(168, 85, 247, 0.2)" : "transparent",
              color: "#c084fc",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: isLocked ? "not-allowed" : "pointer",
            }}
          >
            {TEXT_FLEET_STATUS.STATUS_CODES.SO}
          </button>
        </div>

        {/* Quick Button: SGO Semua */}
        <button
          type="button"
          onClick={onSgoAll}
          disabled={isLocked}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            background: "rgba(16, 185, 129, 0.12)",
            color: "var(--success-color, #10b981)",
            fontSize: "11.5px",
            fontWeight: 700,
            cursor: isLocked ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <span>{TEXT_FLEET_STATUS.MODAL.SGO_ALL_BTN}</span>
        </button>
      </div>
    </div>
  );
}
