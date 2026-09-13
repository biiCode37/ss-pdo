import React from "react";
import { Award, TrendingDown, Zap } from "lucide-react";
import { safeFormatNumber } from "@/utils/numberUtils";
import { TEXT_DASHBOARD } from "@/constants/texts";
import type { TrendItem } from "./types";

interface ToaExecutiveStatsProps {
  peakItem?: TrendItem;
  lowestItem?: TrendItem;
  avgToa: number;
}

export const ToaExecutiveStats: React.FC<ToaExecutiveStatsProps> = ({
  peakItem,
  lowestItem,
  avgToa,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "8px",
        marginBottom: "14px",
      }}
    >
      {/* Tertinggi (Peak) Card */}
      <div
        style={{
          background: "var(--total-bg)",
          border: "1px solid var(--total-border)",
          borderRadius: "10px",
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Award size={12} style={{ color: "var(--total-color)" }} />
          {TEXT_DASHBOARD.TOA_TREND.PEAK_LABEL}
        </span>
        <span
          className="tabular-nums"
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--total-color)",
            lineHeight: "1.2",
          }}
        >
          {peakItem ? safeFormatNumber(peakItem.totalToa) : "0"}
        </span>
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          {TEXT_DASHBOARD.TOA_TREND.DATE_PREFIX}{peakItem ? peakItem.day : "-"}
        </span>
      </div>

      {/* Terendah (Min) Card */}
      <div
        style={{
          background: "var(--danger-badge-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: "10px",
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <TrendingDown size={12} style={{ color: "var(--danger-text)" }} />
          {TEXT_DASHBOARD.TOA_TREND.LOWEST_LABEL}
        </span>
        <span
          className="tabular-nums"
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--danger-text)",
            lineHeight: "1.2",
          }}
        >
          {lowestItem ? safeFormatNumber(lowestItem.totalToa) : "0"}
        </span>
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          {TEXT_DASHBOARD.TOA_TREND.DATE_PREFIX}{lowestItem ? lowestItem.day : "-"}
        </span>
      </div>

      {/* Rata-rata (Avg) Card */}
      <div
        style={{
          background: "var(--info-badge-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: "10px",
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Zap size={12} style={{ color: "var(--info-text)" }} />
          {TEXT_DASHBOARD.TOA_TREND.AVG_LABEL}
        </span>
        <span
          className="tabular-nums"
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--info-text)",
            lineHeight: "1.2",
          }}
        >
          {safeFormatNumber(avgToa)}
        </span>
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          {TEXT_DASHBOARD.TOA_TREND.AVG_UNIT}
        </span>
      </div>
    </div>
  );
};
