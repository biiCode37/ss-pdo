import React from "react";
import { TEXT_DASHBOARD } from "@/constants/texts";

export const ToaTrendLegend: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        marginBottom: "8px",
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--text-secondary)",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "var(--total-color, #4ade80)",
          }}
        />
        {TEXT_DASHBOARD.TOA_TREND.LEGEND_UP}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "var(--orange-color, #fb923c)",
          }}
        />
        {TEXT_DASHBOARD.TOA_TREND.LEGEND_SLIGHT_DOWN}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "var(--danger-color, #f43f5e)",
          }}
        />
        {TEXT_DASHBOARD.TOA_TREND.LEGEND_DRASTIC_DOWN}
      </span>
    </div>
  );
};
