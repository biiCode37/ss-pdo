import React from "react";
import { Bus, Columns, Zap, X } from "lucide-react";
import { TEXT_ALERTS } from "@/constants/texts";

interface BusInputModalHeaderProps {
  unit: string;
  formId: string;
  isSingleColumnEligible: boolean;
  isExpandedAll: boolean;
  onToggleExpandedAll: () => void;
  isSatset: boolean;
  onToggleSatset: () => void;
  onDismiss: () => void;
}

export const BusInputModalHeader: React.FC<BusInputModalHeaderProps> = ({
  unit,
  formId,
  isSingleColumnEligible,
  isExpandedAll,
  onToggleExpandedAll,
  isSatset,
  onToggleSatset,
  onDismiss,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "14px",
        borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "var(--color-primary-bg, rgba(59, 130, 246, 0.15))",
            color: "var(--color-primary, #38bdf8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bus size={20} />
        </div>
        <div>
          <h2
            id={`bus-modal-title-${formId}`}
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--text-main, #f8fafc)",
              letterSpacing: "-0.01em",
            }}
          >
            Unit {unit}
          </h2>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary, #94a3b8)",
            }}
          >
            {TEXT_ALERTS.BUS_INPUT_MODAL.SUBTITLE}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {isSingleColumnEligible && (
          <button
            type="button"
            onClick={onToggleExpandedAll}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 10px",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background: isExpandedAll
                ? "rgba(56, 189, 248, 0.15)"
                : "rgba(255, 255, 255, 0.04)",
              color: isExpandedAll
                ? "var(--accent-color, #38bdf8)"
                : "var(--text-secondary, #94a3b8)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Columns size={13} />
            <span>
              {isExpandedAll
                ? TEXT_ALERTS.BUS_INPUT_MODAL.SWITCH_TO_SINGLE_FOCUS
                : TEXT_ALERTS.BUS_INPUT_MODAL.SWITCH_TO_FULL_FORM}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleSatset}
          title={TEXT_ALERTS.BUS_INPUT_MODAL.SATSET_TOOLTIP}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 10px",
            borderRadius: "9999px",
            fontSize: "0.75rem",
            fontWeight: 600,
            border: "1px solid",
            borderColor: isSatset
              ? "var(--accent-color, #38bdf8)"
              : "rgba(255, 255, 255, 0.1)",
            background: isSatset
              ? "rgba(56, 189, 248, 0.15)"
              : "rgba(255, 255, 255, 0.04)",
            color: isSatset
              ? "var(--accent-color, #38bdf8)"
              : "var(--text-secondary, #94a3b8)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Zap size={13} fill={isSatset ? "currentColor" : "none"} />
          <span>Satset</span>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          aria-label={TEXT_ALERTS.BUS_INPUT_MODAL.MODAL_CLOSE_ARIA}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.06)",
            border: "none",
            color: "var(--text-secondary, #94a3b8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
