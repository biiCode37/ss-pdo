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
  modeLabel?: string;
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
        paddingBottom: "12px",
        borderBottom: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.1))",
            color: "var(--accent-color, #38bdf8)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Bus size={18} />
        </div>
        <h2
          id={`bus-modal-title-${formId}`}
          style={{
            fontSize: "1.15rem",
            fontWeight: 800,
            margin: 0,
            color: "var(--text-primary, #ededed)",
            letterSpacing: "-0.01em",
          }}
        >
          {unit}
        </h2>
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
              padding: "6px 10px",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
              background: isExpandedAll
                ? "rgba(56, 189, 248, 0.15)"
                : "rgba(255, 255, 255, 0.05)",
              color: isExpandedAll
                ? "var(--accent-color, #38bdf8)"
                : "var(--text-secondary, #8b8b8b)",
              cursor: "pointer",
              transition: "all 0.15s cubic-bezier(0.32, 0.72, 0, 1)",
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
          id="btn-toggle-satset"
          onClick={onToggleSatset}
          title={TEXT_ALERTS.BUS_INPUT_MODAL.SATSET_TOOLTIP}
          aria-label={TEXT_ALERTS.BUS_INPUT_MODAL.SATSET_LABEL}
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            border: isSatset
              ? "1px solid rgba(245, 158, 11, 0.5)"
              : "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
            background: isSatset
              ? "rgba(245, 158, 11, 0.15)"
              : "rgba(255, 255, 255, 0.05)",
            color: isSatset ? "#f59e0b" : "var(--text-secondary, #8b8b8b)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.15s cubic-bezier(0.32, 0.72, 0, 1)",
            flexShrink: 0,
          }}
        >
          <Zap size={16} fill={isSatset ? "#f59e0b" : "none"} />
        </button>

        <button
          type="button"
          onClick={onDismiss}
          aria-label={TEXT_ALERTS.BUS_INPUT_MODAL.MODAL_CLOSE_ARIA}
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
            color: "var(--text-secondary, #8b8b8b)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 0.15s ease",
            flexShrink: 0,
          }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
