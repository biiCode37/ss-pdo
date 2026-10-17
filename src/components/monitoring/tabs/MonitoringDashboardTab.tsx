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
    <div className="monitoring-dashboard-tab">
      {/* 1. PDO Fleet Status Confirmation Progress Bar */}
      <div className="monitoring-card">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              marginTop: "2px",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isAllConfirmed ? (
              <CheckCircle2 size={19} style={{ color: "#10B981" }} />
            ) : (
              <ShieldAlert size={19} style={{ color: "#F59E0B" }} />
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              minWidth: 0,
              flex: 1,
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 700,
                margin: 0,
                color: "var(--text-primary)",
                lineHeight: 1.25,
              }}
            >
              {TEXT_MONITORING.DASHBOARD.PROGRESS_TITLE}
            </h3>
            <span
              style={{
                fontSize: "12.5px",
                fontWeight: 700,
                color: isAllConfirmed ? "#10B981" : "var(--accent-color, #3ECF8E)",
                lineHeight: 1.25,
              }}
            >
              {TEXT_MONITORING.DASHBOARD.PROGRESS_RATIO(
                confirmedRoutesCount,
                totalRoutes,
              )}
            </span>
          </div>
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
      <MonitoringToaBarChart routes={data.routes} date={data.date} />

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
