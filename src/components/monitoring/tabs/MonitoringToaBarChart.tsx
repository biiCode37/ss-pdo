import React, { useState, useMemo } from "react";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";
import { BarChart3 } from "lucide-react";
import { formatIndonesianDaySlashDate } from "../monitoringUtils";

interface MonitoringToaBarChartProps {
  routes: RegionalRouteItem[];
  date?: string;
}

export const MonitoringToaBarChart: React.FC<MonitoringToaBarChartProps> = ({
  routes,
  date,
}) => {
  const [selectedRoute, setSelectedRoute] = useState<RegionalRouteItem | null>(
    null,
  );

  const formattedDate = useMemo(() => {
    return date ? formatIndonesianDaySlashDate(date) : undefined;
  }, [date]);

  const maxPassengers = useMemo(() => {
    const max = Math.max(
      ...routes.map((r) => {
        const toa = (r.toaShift1 || 0) + (r.toaShift2 || 0);
        return toa > 0 ? toa : r.todayPassengers;
      }),
      0,
    );
    return max > 0 ? max : 1;
  }, [routes]);

  return (
    <div className="monitoring-card">
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
              {TEXT_MONITORING.DASHBOARD.CHART_SUBTITLE(formattedDate)}
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
              {TEXT_MONITORING.DASHBOARD.CHART_TOOLTIP_SHIFT(
                selectedRoute.toaShift1 || 0,
                selectedRoute.toaShift2 || 0,
              )}
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
              {((selectedRoute.toaShift1 || 0) + (selectedRoute.toaShift2 || 0) || selectedRoute.todayPassengers).toLocaleString("id-ID")}{" "}
              <span style={{ fontSize: "11px", fontWeight: 500 }}>
                {TEXT_MONITORING.DASHBOARD.CHART_TOA_UNIT}
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
                ? TEXT_MONITORING.DASHBOARD.CHART_TARGET_PCT(
                    ((selectedRoute.todayPassengers / selectedRoute.targetHk) * 100).toFixed(1),
                  )
                : TEXT_MONITORING.DASHBOARD.CHART_TARGET_ZERO}
            </div>
          </div>
        </div>
      )}

      {/* Bar Chart Container - 1 Frame Zero Horizontal Scroll */}
      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "2px",
          height: "165px",
          width: "100%",
          overflow: "hidden",
          paddingBottom: "4px",
          paddingTop: "14px",
          boxSizing: "border-box",
        }}
      >
        {routes.map((route) => {
          const totalToa = (route.toaShift1 || 0) + (route.toaShift2 || 0);
          const displayVal = totalToa > 0 ? totalToa : route.todayPassengers;
          const heightPct = Math.max(
            6,
            Math.round((displayVal / maxPassengers) * 100),
          );
          const isSelected = selectedRoute?.routeCode === route.routeCode;
          // Hapus inisial "JAK." dan "J." dari kode rute
          const cleanRouteCode = route.routeCode.replace(/^(JAK|J)\.?/i, "").trim();

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
                flex: "1 1 0",
                minWidth: 0,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                cursor: "pointer",
                position: "relative",
              }}
              title={TEXT_MONITORING.DASHBOARD.CHART_BAR_TITLE(
                route.routeCode,
                displayVal.toLocaleString("id-ID"),
              )}
            >
              {/* Value indicator above bar */}
              <span
                style={{
                  fontSize: "7.5px",
                  fontWeight: 700,
                  letterSpacing: "-0.4px",
                  color: isSelected
                    ? "var(--accent-color, #3ECF8E)"
                    : "var(--text-secondary)",
                  marginBottom: "3px",
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                  textAlign: "center",
                }}
              >
                {displayVal >= 1000
                  ? `${(displayVal / 1000).toFixed(1)}k`
                  : displayVal > 0 ? `${displayVal}` : "-"}
              </span>

              {/* Bar Fill */}
              <div
                style={{
                  width: "100%",
                  maxWidth: "18px",
                  height: `${heightPct}%`,
                  borderRadius: "4px 4px 1px 1px",
                  background: isSelected
                    ? "linear-gradient(180deg, #3ECF8E 0%, #10B981 100%)"
                    : displayVal > 0
                      ? "linear-gradient(180deg, rgba(62, 207, 142, 0.8) 0%, rgba(16, 185, 129, 0.45) 100%)"
                      : "rgba(255, 255, 255, 0.08)",
                  boxShadow: isSelected
                    ? "0 0 10px rgba(62, 207, 142, 0.6)"
                    : "none",
                  transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
                }}
              />

              {/* Route Code Label (Tanpa 'JAK.' / 'J.') */}
              <span
                style={{
                  fontSize: cleanRouteCode.length > 3 ? "7px" : "8px",
                  fontWeight: isSelected ? 800 : 700,
                  letterSpacing: "-0.3px",
                  color: isSelected
                    ? "var(--accent-color, #3ECF8E)"
                    : "var(--text-primary)",
                  marginTop: "5px",
                  whiteSpace: "nowrap",
                  lineHeight: 1.1,
                  textAlign: "center",
                }}
              >
                {cleanRouteCode}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
