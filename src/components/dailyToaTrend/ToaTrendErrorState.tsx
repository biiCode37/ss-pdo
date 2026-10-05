import React from "react";
import { AlertCircle } from "lucide-react";
import { TEXT_DASHBOARD } from "@/constants/texts";
import { ToaTrendHeader } from "./ToaTrendHeader";

interface ToaTrendErrorStateProps {
  effectiveMonthLabel: string;
  unitFilter?: string;
}

export const ToaTrendErrorState: React.FC<ToaTrendErrorStateProps> = ({
  effectiveMonthLabel,
  unitFilter,
}) => {
  return (
    <div
      className="analytics-card glass"
      style={{ position: "relative", overflow: "hidden" }}
    >
      <ToaTrendHeader
        effectiveMonthLabel={effectiveMonthLabel}
        unitFilter={unitFilter}
      />
      <div
        style={{
          padding: "14px 16px",
          borderRadius: "10px",
          background: "rgba(245, 158, 11, 0.08)",
          border: "1px solid rgba(245, 158, 11, 0.25)",
          color: "var(--warning-text, #d97706)",
          fontSize: "12.5px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginTop: "4px",
        }}
      >
        <AlertCircle size={16} style={{ flexShrink: 0 }} />
        <span>{TEXT_DASHBOARD.TOA_TREND.ERROR_MESSAGE}</span>
      </div>
    </div>
  );
};
