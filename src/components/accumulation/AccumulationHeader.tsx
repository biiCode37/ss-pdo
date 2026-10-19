import React from "react";
import { X, Layers } from "lucide-react";
import { TEXT_DASHBOARD } from "@/constants/texts";

interface AccumulationHeaderProps {
  onDismiss: () => void;
}

export const AccumulationHeader: React.FC<AccumulationHeaderProps> = ({
  onDismiss,
}) => {
  return (
    <>
      {/* Top Handle Bar for Touch Swipe Visual Indicator */}
      <div
        className="accumulation-sheet-handle"
        style={{
          display: "flex",
          justifyContent: "center",
          paddingBottom: "12px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "4px",
            borderRadius: "2px",
            background: "var(--card-border, rgba(255, 255, 255, 0.2))",
          }}
        />
      </div>

      {/* Header Bar: Icon, Title, and Dismiss Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
          marginBottom: "14px",
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
            <Layers size={18} />
          </div>
          <div>
            <h3
              id="accumulation-sheet-title"
              style={{
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "var(--text-primary, #ededed)",
                letterSpacing: "-0.01em",
              }}
            >
              {TEXT_DASHBOARD.ACCUMULATION_SHEET.TITLE}
            </h3>
            <span
              style={{
                fontSize: "0.76rem",
                color: "var(--text-secondary, #94a3b8)",
                fontWeight: 500,
              }}
            >
              {TEXT_DASHBOARD.ACCUMULATION_SHEET.DESC}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label={TEXT_DASHBOARD.ACCUMULATION_SHEET.CLOSE_MODAL_ARIA}
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
            color: "var(--text-secondary, #94a3b8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
            flexShrink: 0,
          }}
        >
          <X size={17} />
        </button>
      </div>
    </>
  );
};
