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
      {/* Top Handle Bar for Touch Swipe Down to Close */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingBottom: "16px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "4px",
            borderRadius: "2px",
            background: "var(--text-secondary)",
            opacity: 0.3,
          }}
        />
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Layers size={18} style={{ color: "var(--accent-color)" }} />
          <span
            style={{
              fontWeight: 700,
              fontSize: "16px",
              color: "var(--text-primary)",
            }}
          >
            {TEXT_DASHBOARD.ACCUMULATION_SHEET.TITLE}
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            padding: "4px",
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Deskripsi */}
      <p
        style={{
          fontSize: "12.5px",
          color: "var(--text-secondary)",
          margin: "0 0 16px",
          lineHeight: 1.4,
        }}
      >
        {TEXT_DASHBOARD.ACCUMULATION_SHEET.DESC}
      </p>
    </>
  );
};
