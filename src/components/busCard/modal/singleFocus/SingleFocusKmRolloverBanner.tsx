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
        borderRadius: "12px",
        background: "var(--warning-badge-bg)",
        border: "1px solid var(--color-warning-fg)",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          color: "var(--warning-banner-title)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontWeight: 700,
        }}
      >
        <Sparkles size={16} />
        <span>{TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_DETECTED_TITLE}</span>
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "var(--warning-banner-text)",
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
          padding: "6px 12px",
          borderRadius: "8px",
          background: "var(--color-warning-fg)",
          color: "var(--warning-btn-text)",
          fontWeight: 700,
          fontSize: "12px",
          border: "none",
          cursor: "pointer",
          marginTop: "2px",
        }}
      >
        <Sparkles size={16} />
        <span>
          {TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_APPLY_BTN(
            suggestion.suggestedKm,
          )}
        </span>
      </button>
    </div>
  );
};
