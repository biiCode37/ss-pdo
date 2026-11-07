import React from "react";
import { Columns, Zap, X } from "lucide-react";
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
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <h2
          id={`bus-modal-title-${formId}`}
          style={{
            fontSize: "18px",
            fontWeight: 700,
            margin: 0,
            color: "var(--color-text-primary)",
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
              gap: "6px",
              height: "34px",
              padding: "0 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 600,
              border: isExpandedAll
                ? "1px solid var(--color-info-border)"
                : "1px solid var(--color-border-subtle)",
              background: isExpandedAll
                ? "var(--color-info-bg)"
                : "var(--color-surface-subtle)",
              color: isExpandedAll
                ? "var(--color-link)"
                : "var(--color-text-secondary)",
              cursor: "pointer",
              transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            <Columns size={16} />
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
            borderRadius: "12px",
            border: isSatset
              ? "1px solid var(--color-warning-border)"
              : "1px solid var(--color-border-subtle)",
            background: isSatset
              ? "var(--color-warning-bg)"
              : "var(--color-surface-subtle)",
            color: isSatset ? "var(--color-warning-fg)" : "var(--color-text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
            flexShrink: 0,
          }}
        >
          <Zap size={16} fill={isSatset ? "var(--color-warning-fg)" : "none"} />
        </button>

        <button
          type="button"
          onClick={onDismiss}
          aria-label={TEXT_ALERTS.BUS_INPUT_MODAL.MODAL_CLOSE_ARIA}
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "12px",
            background: "var(--color-surface-subtle)",
            border: "1px solid var(--color-border-subtle)",
            color: "var(--color-text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
