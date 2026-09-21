import React, { useState, useMemo } from "react";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";
import { BarChart3 } from "lucide-react";

interface MonitoringToaBarChartProps {
  routes: RegionalRouteItem[];
}

export const MonitoringToaBarChart: React.FC<MonitoringToaBarChartProps> = ({
  routes,
}) => {
  const [selectedRoute, setSelectedRoute] = useState<RegionalRouteItem | null>(
    null,
  );

  const maxPassengers = useMemo(() => {
    const max = Math.max(...routes.map((r) => r.todayPassengers), 0);
    return max > 0 ? max : 1;
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BarChart3
            size={18}
            style={{ color: "var(--accent-color, #3ECF8E)" }}
          />
          <div>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 700,
                margin: 0,
                color: "var(--text-primary)",
              }}
            >
              {TEXT_MONITORING.DASHBOARD.CHART_TITLE}
            </h3>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              {TEXT_MONITORING.DASHBOARD.CHART_SUBTITLE}
            </p>
          </div>
        </div>
      </div>

      {/* Selected Route Tooltip Detail Box */}
      {selectedRoute && (
        <div
          data-testid="toa-chart-tooltip"
          style={{
            background: "var(--input-bg, rgba(255, 255, 255, 0.06))",
            border: "1px solid var(--accent-color, #3ECF8E)",
            borderRadius: "12px",
            padding: "10px 14px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 800,
                color: "var(--accent-color, #3ECF8E)",
                marginRight: "6px",
              }}
            >
              {selectedRoute.routeCode}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "var(--text-primary)",
                fontWeight: 600,
              }}
            >
              {selectedRoute.routeName}
            </span>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-secondary)",
                marginTop: "2px",
              }}
            >
              Shift 1: {selectedRoute.totalShift1.toLocaleString("id-ID")} •
              Shift 2: {selectedRoute.totalShift2.toLocaleString("id-ID")}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              {selectedRoute.todayPassengers.toLocaleString("id-ID")}{" "}
              <span style={{ fontSize: "11px", fontWeight: 500 }}>
                Pelanggan
              </span>
            </div>
            <div
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                color:
                  selectedRoute.targetHk > 0 &&
                  selectedRoute.todayPassengers >= selectedRoute.targetHk
                    ? "#10B981"
                    : "#F59E0B",
              }}
            >
              {selectedRoute.targetHk > 0
                ? `${((selectedRoute.todayPassengers / selectedRoute.targetHk) * 100).toFixed(1)}% dari Target`
                : "Target 0"}
            </div>
          </div>
        </div>
      )}

      {/* Bar Chart Container */}
      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "6px",
          height: "160px",
          overflowX: "auto",
          paddingBottom: "8px",
          paddingTop: "14px",
        }}
      >
        {routes.map((route) => {
          const heightPct = Math.max(
            8,
            Math.round((route.todayPassengers / maxPassengers) * 100),
          );
          const isSelected = selectedRoute?.routeCode === route.routeCode;

          return (
            <div
              key={route.routeCode}
              data-testid={`toa-bar-${route.routeCode}`}
              onClick={() =>
                setSelectedRoute(
                  isSelected ? null : route,
                )
              }
              style={{
                flex: "1 0 32px",
                minWidth: "28px",
                maxWidth: "46px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                cursor: "pointer",
                position: "relative",
              }}
              title={`${route.routeCode}: ${route.todayPassengers.toLocaleString("id-ID")} Pelanggan`}
            >
              {/* Value indicator above bar */}
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: isSelected
                    ? "var(--accent-color, #3ECF8E)"
                    : "var(--text-secondary)",
                  marginBottom: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                {route.todayPassengers >= 1000
                  ? `${(route.todayPassengers / 1000).toFixed(1)}k`
                  : route.todayPassengers}
              </span>

              {/* Bar Fill */}
              <div
                style={{
                  width: "100%",
                  height: `${heightPct}%`,
                  borderRadius: "6px 6px 2px 2px",
                  background: isSelected
                    ? "linear-gradient(180deg, #3ECF8E 0%, #10B981 100%)"
                    : "linear-gradient(180deg, rgba(62, 207, 142, 0.75) 0%, rgba(16, 185, 129, 0.4) 100%)",
                  boxShadow: isSelected
                    ? "0 0 12px rgba(62, 207, 142, 0.5)"
                    : "none",
                  transition: "all 0.2s ease",
                }}
              />

              {/* Route Code Label */}
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: isSelected ? 800 : 600,
                  color: isSelected
                    ? "var(--accent-color, #3ECF8E)"
                    : "var(--text-primary)",
                  marginTop: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                {route.routeCode.replace("JAK.", "J.")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
