import React from "react";
import { BarChart2, Calendar } from "lucide-react";
import { TEXT_DASHBOARD } from "@/constants/texts";

interface ToaTrendHeaderProps {
  effectiveMonthLabel: string;
  unitFilter?: string;
}

export const ToaTrendHeader: React.FC<ToaTrendHeaderProps> = ({
  effectiveMonthLabel,
  unitFilter,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "10px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div className="analytics-card-title">
          <BarChart2 size={18} />
          <span>{TEXT_DASHBOARD.TOA_TREND.TITLE}</span>
        </div>
        {unitFilter && (
          <div
            style={{
              fontSize: "11.5px",
              fontWeight: 600,
              color: "var(--accent-color)",
              paddingLeft: "24px",
            }}
          >
            {unitFilter}
          </div>
        )}
      </div>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <Calendar size={12} />
        {effectiveMonthLabel}
      </span>
    </div>
  );
};
