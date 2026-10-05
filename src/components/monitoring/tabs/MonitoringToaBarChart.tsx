import React, { useState, useMemo, useEffect, useRef } from "react";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";
import { BarChart3, ChevronDown } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isCollapsing, setIsCollapsing] = useState<boolean>(false);
  const [isBarsAnimated, setIsBarsAnimated] = useState<boolean>(false);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animasi masuk untuk bar saat pertama kali grafik ditampilkan
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBarsAnimated(true);
    }, 40);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup timer saat unmount
  useEffect(() => {
    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
    };
  }, []);

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

  // Urutkan rute dari jumlah penumpang tertinggi ke terendah
  const sortedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => {
      const valA = (a.toaShift1 || 0) + (a.toaShift2 || 0) || a.todayPassengers;
      const valB = (b.toaShift1 || 0) + (b.toaShift2 || 0) || b.todayPassengers;
      if (valB !== valA) return valB - valA;
      return a.routeCode.localeCompare(b.routeCode, undefined, { numeric: true });
    });
  }, [routes]);

  const topRoutes = useMemo(() => sortedRoutes.slice(0, 5), [sortedRoutes]);
  const extraRoutes = useMemo(() => sortedRoutes.slice(5), [sortedRoutes]);
  const shouldShowExtra = isExpanded || isCollapsing;

  const handleToggleExpand = () => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }

    if (!isExpanded) {
      setIsExpanded(true);
      setIsCollapsing(false);
    } else {
      setIsExpanded(false);
      setIsCollapsing(true);
      collapseTimerRef.current = setTimeout(() => {
        setIsCollapsing(false);
      }, 280);
    }
  };

  const renderRouteBar = (route: RegionalRouteItem, index: number) => {
    const totalToa = (route.toaShift1 || 0) + (route.toaShift2 || 0);
    const displayVal = totalToa > 0 ? totalToa : route.todayPassengers;
    const widthPct = maxPassengers > 0
      ? Math.round((displayVal / maxPassengers) * 100)
      : 0;
    const isSelected = selectedRoute?.routeCode === route.routeCode;
    const barWidth = isBarsAnimated ? `${widthPct}%` : "0%";
    const staggerDelay = isBarsAnimated ? `${Math.min(index * 35, 280)}ms` : "0ms";

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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          padding: "3px 6px",
          borderRadius: "6px",
          cursor: "pointer",
          background: isSelected
            ? "var(--input-bg, rgba(62, 207, 142, 0.1))"
            : "transparent",
          border: isSelected
            ? "1px solid var(--accent-color, #3ECF8E)"
            : "1px solid transparent",
          transition: "all 0.15s ease",
        }}
        title={TEXT_MONITORING.DASHBOARD.CHART_BAR_TITLE(
          route.routeCode,
          displayVal.toLocaleString("id-ID"),
        )}
      >
        {/* Route Code Label (Lengkap: JAK.XX) */}
        <span
          style={{
            width: "64px",
            minWidth: "64px",
            fontSize: "11.5px",
            fontWeight: isSelected ? 800 : 700,
            letterSpacing: "-0.2px",
            color: isSelected
              ? "var(--accent-color, #3ECF8E)"
              : "var(--text-primary)",
            whiteSpace: "nowrap",
            lineHeight: 1.2,
            opacity: isBarsAnimated ? 1 : 0.7,
            transition: "opacity 0.3s ease",
          }}
        >
          {route.routeCode}
        </span>

        {/* Slim Horizontal Bar Frame (Track & Fill dengan Stagger Animation) */}
        <div
          style={{
            flex: 1,
            height: "4px",
            background: "var(--card-border, rgba(255, 255, 255, 0.08))",
            borderRadius: "2px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "100%",
              width: barWidth,
              minWidth: displayVal > 0 && isBarsAnimated ? "3px" : "0px",
              borderRadius: "2px",
              background: isSelected
                ? "linear-gradient(90deg, #3ECF8E 0%, #10B981 100%)"
                : displayVal > 0
                  ? "linear-gradient(90deg, rgba(62, 207, 142, 0.85) 0%, #10B981 100%)"
                  : "transparent",
              boxShadow: isSelected
                ? "0 0 6px rgba(62, 207, 142, 0.5)"
                : "none",
              transition: "width 0.65s cubic-bezier(0.32, 0.72, 0, 1)",
              transitionDelay: staggerDelay,
              willChange: "width",
            }}
          />
        </div>

        {/* Full Passenger Count (Nilai Lengkap) */}
        <span
          style={{
            width: "54px",
            minWidth: "54px",
            textAlign: "right",
            fontSize: "11.5px",
            fontWeight: 700,
            color: isSelected
              ? "var(--accent-color, #3ECF8E)"
              : displayVal > 0
                ? "var(--text-primary)"
                : "var(--text-secondary)",
            whiteSpace: "nowrap",
            lineHeight: 1.2,
            opacity: isBarsAnimated ? 1 : 0.6,
            transition: "opacity 0.4s ease",
            transitionDelay: staggerDelay,
          }}
        >
          {displayVal.toLocaleString("id-ID")}
        </span>
      </div>
    );
  };

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

      {/* Horizontal Bar List Container - Compact Density */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          width: "100%",
        }}
      >
        {/* Top 5 Rute (Selalu Tampil) */}
        {topRoutes.map((route, index) => renderRouteBar(route, index))}

        {/* Extra Routes (Animasi Accordion Expand/Collapse) */}
        {shouldShowExtra && extraRoutes.length > 0 && (
          <div
            data-testid="toa-chart-extra-routes"
            className={isCollapsing ? "toa-accordion-exit" : "toa-accordion-enter"}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              width: "100%",
            }}
          >
            {extraRoutes.map((route, extraIdx) =>
              renderRouteBar(route, 5 + extraIdx),
            )}
          </div>
        )}
      </div>

      {/* Expand / Collapse Button */}
      {sortedRoutes.length > 5 && (
        <button
          type="button"
          data-testid="toa-chart-toggle-expand"
          onClick={handleToggleExpand}
          style={{
            marginTop: "8px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "8px",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
            background: "var(--input-bg, rgba(255, 255, 255, 0.04))",
            color: "var(--accent-color, #3ECF8E)",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <span>
            {isExpanded
              ? TEXT_MONITORING.DASHBOARD.CHART_COLLAPSE_BTN
              : TEXT_MONITORING.DASHBOARD.CHART_EXPAND_BTN(routes.length)}
          </span>
          <ChevronDown
            size={13}
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          />
        </button>
      )}
    </div>
  );
};

