import React, { useMemo } from "react";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";
import { Trophy, AlertTriangle } from "lucide-react";

interface MonitoringLeaderboardProps {
  routes: RegionalRouteItem[];
  onSelectRoute?: (routeCode: string) => void;
}

export const MonitoringLeaderboard: React.FC<MonitoringLeaderboardProps> = ({
  routes,
  onSelectRoute,
}) => {
  // Top 3 by todayPassengers
  const topRoutes = useMemo(() => {
    return [...routes]
      .sort((a, b) => b.todayPassengers - a.todayPassengers)
      .slice(0, 3);
  }, [routes]);

  // Bottom 3 by target achievement (or todayPassengers if target 0)
  const bottomRoutes = useMemo(() => {
    return [...routes]
      .sort((a, b) => {
        const pctA = a.targetHk > 0 ? a.todayPassengers / a.targetHk : a.todayPassengers;
        const pctB = b.targetHk > 0 ? b.todayPassengers / b.targetHk : b.todayPassengers;
        return pctA - pctB;
      })
      .slice(0, 3);
  }, [routes]);

  return (
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
      <h3
        style={{
          fontSize: "13.5px",
          fontWeight: 700,
          margin: "0 0 14px 0",
          color: "var(--text-primary)",
        }}
      >
        {TEXT_MONITORING.DASHBOARD.LEADERBOARD.TITLE}
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "16px",
        }}
      >
        {/* Top 3 Highest Ridership */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <Trophy size={15} style={{ color: "#F59E0B" }} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#F59E0B",
              }}
            >
              {TEXT_MONITORING.DASHBOARD.LEADERBOARD.TOP_3}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {topRoutes.map((route, idx) => {
              const pct =
                route.targetHk > 0
                  ? ((route.todayPassengers / route.targetHk) * 100).toFixed(0)
                  : "0";
              const medalColors = ["#F59E0B", "#94A3B8", "#B45309"];

              return (
                <div
                  key={route.routeCode}
                  onClick={() => onSelectRoute?.(route.routeCode)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                    border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                    cursor: onSelectRoute ? "pointer" : "default",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: medalColors[idx] || "var(--card-border)",
                        color: "#000",
                        fontSize: "11px",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          marginRight: "6px",
                        }}
                      >
                        {route.routeCode}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {route.routeName}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "12.5px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      {TEXT_MONITORING.DASHBOARD.LEADERBOARD.PASSENGERS_COUNT(
                        route.todayPassengers,
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#10B981",
                      }}
                    >
                      {TEXT_MONITORING.DASHBOARD.LEADERBOARD.TARGET_PCT_BADGE(
                        pct,
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom 3 Need Attention */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <AlertTriangle size={15} style={{ color: "#EF4444" }} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#EF4444",
              }}
            >
              {TEXT_MONITORING.DASHBOARD.LEADERBOARD.BOTTOM_3}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {bottomRoutes.map((route) => {
              const pct =
                route.targetHk > 0
                  ? ((route.todayPassengers / route.targetHk) * 100).toFixed(0)
                  : "0";

              return (
                <div
                  key={route.routeCode}
                  onClick={() => onSelectRoute?.(route.routeCode)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    background: "rgba(239, 68, 68, 0.04)",
                    border: "1px solid rgba(239, 68, 68, 0.15)",
                    cursor: onSelectRoute ? "pointer" : "default",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginRight: "6px",
                      }}
                    >
                      {route.routeCode}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {route.routeName}
                    </span>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "12.5px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      {TEXT_MONITORING.DASHBOARD.LEADERBOARD.PASSENGERS_COUNT(
                        route.todayPassengers,
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#EF4444",
                      }}
                    >
                      {TEXT_MONITORING.DASHBOARD.LEADERBOARD.TARGET_PCT_BADGE(
                        pct,
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
