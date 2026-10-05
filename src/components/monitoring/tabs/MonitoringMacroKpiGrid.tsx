import React from "react";
import type { RegionalMonitoringResult } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";
import { Users, Repeat, Navigation, TrendingUp } from "lucide-react";

interface MonitoringMacroKpiGridProps {
  data: RegionalMonitoringResult;
}

export const MonitoringMacroKpiGrid: React.FC<MonitoringMacroKpiGridProps> = ({
  data,
}) => {
  const targetPct =
    data.totalTargetPassengers > 0
      ? ((data.totalTodayPassengers / data.totalTargetPassengers) * 100).toFixed(1)
      : "0.0";

  const paxPerBus =
    data.totalRealops > 0
      ? (data.totalTodayPassengers / data.totalRealops).toFixed(0)
      : "0";

  const paxPerKm =
    data.totalKm > 0
      ? (data.totalTodayPassengers / data.totalKm).toFixed(2)
      : "0.00";

  const kpis = [
    {
      id: "passengers",
      title: TEXT_MONITORING.DASHBOARD.MACRO_KPIS.PASSENGERS,
      value: data.totalTodayPassengers.toLocaleString("id-ID"),
      suffix: TEXT_MONITORING.DASHBOARD.MACRO_KPIS.PASSENGERS_SUFFIX,
      subtext: TEXT_MONITORING.DASHBOARD.MACRO_KPIS.TARGET_PCT(targetPct),
      subtextPositive: Number(targetPct) >= 100,
      icon: Users,
      color: "#3ECF8E",
      bgGradient: "rgba(62, 207, 142, 0.08)",
    },
    {
      id: "trips",
      title: TEXT_MONITORING.DASHBOARD.MACRO_KPIS.TRIPS,
      value: (data.totalTrips || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 }),
      suffix: TEXT_MONITORING.DASHBOARD.MACRO_KPIS.TRIPS_SUFFIX,
      subtext: `${(data.averageTripsPerBus || 0).toFixed(1)} ${TEXT_MONITORING.DASHBOARD.MACRO_KPIS.TRIPS_SUFFIX} ${TEXT_MONITORING.DASHBOARD.MACRO_KPIS.PER_BUS}`,
      subtextPositive: (data.averageTripsPerBus || 0) >= 6.5,
      icon: Repeat,
      color: "#38BDF8",
      bgGradient: "rgba(56, 189, 248, 0.08)",
    },
    {
      id: "distance",
      title: TEXT_MONITORING.DASHBOARD.MACRO_KPIS.DISTANCE,
      value: `${data.totalKm.toLocaleString("id-ID")}`,
      suffix: TEXT_MONITORING.DASHBOARD.MACRO_KPIS.DISTANCE_SUFFIX,
      subtext: `${data.averageKmPerBus.toFixed(1)} ${TEXT_MONITORING.DASHBOARD.MACRO_KPIS.DISTANCE_SUFFIX} ${TEXT_MONITORING.DASHBOARD.MACRO_KPIS.PER_BUS}`,
      subtextPositive: true,
      icon: Navigation,
      color: "#F59E0B",
      bgGradient: "rgba(245, 158, 11, 0.08)",
    },
    {
      id: "productivity",
      title: TEXT_MONITORING.DASHBOARD.MACRO_KPIS.PRODUCTIVITY,
      value: `${paxPerBus}`,
      suffix: TEXT_MONITORING.DASHBOARD.MACRO_KPIS.PRODUCTIVITY_SUFFIX,
      subtext: TEXT_MONITORING.DASHBOARD.MACRO_KPIS.SUBTEXT_PER_KM(paxPerKm),
      subtextPositive: Number(paxPerBus) >= 150,
      icon: TrendingUp,
      color: "#A855F7",
      bgGradient: "rgba(168, 85, 247, 0.08)",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "10px",
        marginBottom: "16px",
      }}
    >
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            className="monitoring-card"
            style={{
              background: "var(--card-bg, rgba(23, 23, 23, 0.7))",
              borderRadius: "14px",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              padding: "12px 14px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top row: icon & title */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                {kpi.title}
              </span>
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "8px",
                  background: kpi.bgGradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: kpi.color,
                }}
              >
                <Icon size={14} />
              </div>
            </div>

            {/* Value */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "4px",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "19px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.5px",
                }}
              >
                {kpi.value}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                {kpi.suffix}
              </span>
            </div>

            {/* Subtext */}
            <div
              style={{
                fontSize: "10.5px",
                fontWeight: 600,
                color: kpi.subtextPositive ? "#10B981" : "var(--text-secondary)",
              }}
            >
              {kpi.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
};
