import React from "react";
import type { RegionalMonitoringResult } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { MonitoringToaBarChart } from "./MonitoringToaBarChart";
import { MonitoringMacroKpiGrid } from "./MonitoringMacroKpiGrid";
import { MonitoringShiftSplitBar } from "./MonitoringShiftSplitBar";
import { MonitoringLeaderboard } from "./MonitoringLeaderboard";

export interface MonitoringDashboardTabProps {
  data: RegionalMonitoringResult;
  confirmedRoutesCount: number;
  totalRoutesCount: number;
  onSelectRoute?: (routeCode: string) => void;
}

export const MonitoringDashboardTab: React.FC<MonitoringDashboardTabProps> = ({
  data,
  confirmedRoutesCount,
  totalRoutesCount,
  onSelectRoute,
}) => {
  const totalRoutes = totalRoutesCount > 0 ? totalRoutesCount : 18;
  const progressPct = Math.min(
    100,
    Math.round((confirmedRoutesCount / totalRoutes) * 100),
  );
  const isAllConfirmed = confirmedRoutesCount >= totalRoutes;

  return (
    <div
      className="monitoring-dashboard-tab"
      style={{
        padding: "16px",
        maxWidth: "1200px",
        margin: "0 auto",
        paddingBottom: "84px", // Safe space for 64px bottom nav
      }}
    >
      {/* 1. PDO Fleet Status Confirmation Progress Bar */}
      <div
        className="monitoring-card"
        style={{
          background: "var(--card-bg, rgba(23, 23, 23, 0.7))",
          borderRadius: "16px",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isAllConfirmed ? (
              <CheckCircle2 size={18} style={{ color: "#10B981" }} />
            ) : (
              <ShieldAlert size={18} style={{ color: "#F59E0B" }} />
            )}
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 700,
                margin: 0,
                color: "var(--text-primary)",
              }}
            >
              {TEXT_MONITORING.DASHBOARD.PROGRESS_TITLE}
            </h3>
          </div>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 800,
              color: isAllConfirmed ? "#10B981" : "var(--accent-color, #3ECF8E)",
            }}
          >
            {TEXT_MONITORING.DASHBOARD.PROGRESS_RATIO(
              confirmedRoutesCount,
              totalRoutes,
            )}
          </span>
        </div>

        {/* Progress bar line */}
        <div
          style={{
            height: "10px",
            width: "100%",
            borderRadius: "6px",
            background: "var(--input-bg, rgba(255, 255, 255, 0.06))",
            overflow: "hidden",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: isAllConfirmed
                ? "linear-gradient(90deg, #10B981 0%, #059669 100%)"
                : "linear-gradient(90deg, #3ECF8E 0%, #10B981 100%)",
              borderRadius: "6px",
              transition: "width 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "var(--text-secondary)",
          }}
        >
          <span>
            {isAllConfirmed
              ? TEXT_MONITORING.DASHBOARD.PROGRESS_ALL_CONFIRMED
              : `${totalRoutes - confirmedRoutesCount} rute belum konfirmasi`}
          </span>
          <span style={{ fontWeight: 700 }}>{progressPct}%</span>
        </div>
      </div>

      {/* 2. 18-bar TOA Trend Chart */}
      <MonitoringToaBarChart routes={data.routes} />

      {/* 3. 4 Hero Macro KPI Cards */}
      <MonitoringMacroKpiGrid data={data} />

      {/* 4. Shift Split Bar */}
      <MonitoringShiftSplitBar data={data} />

      {/* 5. Top 3 & Bottom 3 Leaderboard */}
      <MonitoringLeaderboard
        routes={data.routes}
        onSelectRoute={onSelectRoute}
      />
    </div>
  );
};

export default MonitoringDashboardTab;
