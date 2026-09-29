import React from "react";
import { Sparkles } from "lucide-react";
import { TEXT_ALERTS } from "@/constants/texts";

export interface SingleFocusKmRolloverBannerProps {
  suggestion: {
    suggestedKm: string;
    diff: number;
  };
  onApply: () => void;
}

export const SingleFocusKmRolloverBanner: React.FC<SingleFocusKmRolloverBannerProps> = ({
  suggestion,
  onApply,
}) => {
  return (
    <div
      style={{
        marginTop: "8px",
        padding: "10px 12px",
        borderRadius: "10px",
        background: "var(--warning-badge-bg, rgba(245, 158, 11, 0.12))",
        border: "1px solid var(--warning-color, rgba(245, 158, 11, 0.35))",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <div
        style={{
          fontSize: "0.8rem",
          color: "var(--warning-banner-title, #9a3412)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontWeight: 700,
        }}
      >
        <Sparkles size={14} />
        <span>{TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_DETECTED_TITLE}</span>
      </div>
      <div
        style={{
          fontSize: "0.76rem",
          color: "var(--warning-banner-text, var(--text-primary, #171717))",
          lineHeight: 1.4,
        }}
      >
        {TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_SUGGESTION_TEXT(
          suggestion.suggestedKm,
          suggestion.diff,
        )}
      </div>
      <button
        type="button"
        onClick={onApply}
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "4px 10px",
          borderRadius: "6px",
          background: "var(--warning-color, #d97706)",
          color: "var(--warning-btn-text, #0f172a)",
          fontWeight: 700,
          fontSize: "0.78rem",
          border: "none",
          cursor: "pointer",
          marginTop: "2px",
        }}
      >
        <Sparkles size={13} />
        <span>
          {TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_APPLY_BTN(
            suggestion.suggestedKm,
          )}
        </span>
      </button>
    </div>
  );
};
