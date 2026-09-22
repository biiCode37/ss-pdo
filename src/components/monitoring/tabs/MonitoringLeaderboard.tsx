import React, { useMemo } from "react";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";
import { Trophy, AlertTriangle, Target } from "lucide-react";

interface MonitoringLeaderboardProps {
  routes: RegionalRouteItem[];
  onSelectRoute?: (routeCode: string) => void;
}

interface LeaderboardItemRowProps {
  route: RegionalRouteItem;
  rank: number;
  variant: "gold" | "emerald" | "red";
  onSelectRoute?: (routeCode: string) => void;
}

const LeaderboardItemRow: React.FC<LeaderboardItemRowProps> = ({
  route,
  rank,
  variant,
  onSelectRoute,
}) => {
  const pct =
    route.targetHk > 0
      ? ((route.todayPassengers / route.targetHk) * 100).toFixed(0)
      : "0";

  const medalColors = ["#F59E0B", "#94A3B8", "#B45309"];

  const isRed = variant === "red";
  const isEmerald = variant === "emerald";

  const rankBg = isRed
    ? "rgba(239, 68, 68, 0.15)"
    : medalColors[rank - 1] || "var(--card-border)";
  const rankColor = isRed ? "#EF4444" : "#000";

  const cardBg = isRed
    ? "rgba(239, 68, 68, 0.04)"
    : isEmerald
    ? "rgba(16, 185, 129, 0.04)"
    : "var(--input-bg, rgba(255, 255, 255, 0.03))";

  const cardBorder = isRed
    ? "1px solid rgba(239, 68, 68, 0.15)"
    : isEmerald
    ? "1px solid rgba(16, 185, 129, 0.15)"
    : "1px solid var(--card-border, rgba(255, 255, 255, 0.06))";

  const pctColor = isRed ? "#EF4444" : "#10B981";
  const pctBg = isRed ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)";

  return (
    <div
      className="leaderboard-item"
      onClick={() => onSelectRoute?.(route.routeCode)}
      style={{
        background: cardBg,
        border: cardBorder,
        cursor: onSelectRoute ? "pointer" : "default",
      }}
    >
      {/* Sisi Kiri: Rank + Kode Rute + Badge Persentase + Nama Rute */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minWidth: 0,
          flex: 1,
          marginRight: "6px",
        }}
      >
        <span
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: rankBg,
            color: rankColor,
            fontSize: "10.5px",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {rank}
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span
              style={{
                fontSize: "12.5px",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.25,
                minWidth: "48px",
                flexShrink: 0,
              }}
            >
              {route.routeCode}
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: pctColor,
                background: pctBg,
                padding: "1.5px 5px",
                borderRadius: "5px",
                display: "inline-flex",
                alignItems: "center",
                lineHeight: 1.2,
                flexShrink: 0,
              }}
            >
              {TEXT_MONITORING.DASHBOARD.LEADERBOARD.TARGET_PCT_ONLY(pct)}
            </span>
          </div>
          <span
            style={{
              fontSize: "10px",
              color: "var(--text-secondary)",
              lineHeight: 1.25,
              marginTop: "1.5px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {route.routeName}
          </span>
        </div>
      </div>

      {/* Sisi Kanan: Realisasi Pelanggan + Target Pelanggan */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.25,
            whiteSpace: "nowrap",
          }}
        >
          {TEXT_MONITORING.DASHBOARD.LEADERBOARD.PASSENGERS_COUNT(
            route.todayPassengers,
          )}
        </div>
        <div
          style={{
            fontSize: "10px",
            color: "var(--text-secondary)",
            lineHeight: 1.25,
            marginTop: "1.5px",
            whiteSpace: "nowrap",
          }}
        >
          {TEXT_MONITORING.DASHBOARD.LEADERBOARD.TARGET_LABEL(
            route.targetHk,
          )}
        </div>
      </div>
    </div>
  );
};

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

  // Top 3 by target achievement percentage
  const topAchievementRoutes = useMemo(() => {
    return [...routes]
      .sort((a, b) => {
        const pctA = a.targetHk > 0 ? a.todayPassengers / a.targetHk : 0;
        const pctB = b.targetHk > 0 ? b.todayPassengers / b.targetHk : 0;
        if (pctB !== pctA) {
          return pctB - pctA;
        }
        return b.todayPassengers - a.todayPassengers;
      })
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
    <div className="monitoring-card">
      <h3
        style={{
          fontSize: "14px",
          fontWeight: 700,
          margin: "0 0 14px 0",
          color: "var(--text-primary)",
        }}
      >
        {TEXT_MONITORING.DASHBOARD.LEADERBOARD.TITLE}
      </h3>

      <div className="monitoring-leaderboard-grid">
        {/* 1. Top 3 Pelanggan Terbanyak */}
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
            {topRoutes.map((route, idx) => (
              <LeaderboardItemRow
                key={route.routeCode}
                route={route}
                rank={idx + 1}
                variant="gold"
                onSelectRoute={onSelectRoute}
              />
            ))}
          </div>
        </div>

        {/* 2. Top 3 Capaian Tertinggi */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <Target size={15} style={{ color: "#10B981" }} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#10B981",
              }}
            >
              {TEXT_MONITORING.DASHBOARD.LEADERBOARD.TOP_ACHIEVEMENT}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {topAchievementRoutes.map((route, idx) => (
              <LeaderboardItemRow
                key={`achieve-${route.routeCode}`}
                route={route}
                rank={idx + 1}
                variant="emerald"
                onSelectRoute={onSelectRoute}
              />
            ))}
          </div>
        </div>

        {/* 3. 3 Rute Butuh Evaluasi */}
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
            {bottomRoutes.map((route, idx) => (
              <LeaderboardItemRow
                key={`bottom-${route.routeCode}`}
                route={route}
                rank={idx + 1}
                variant="red"
                onSelectRoute={onSelectRoute}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
