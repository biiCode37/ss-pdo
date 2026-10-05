import React from "react";
import type { RegionalMonitoringResult } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";
import { formatNumber, formatDecimal } from "./monitoringUtils";

interface MonitoringKpiCardsProps {
  data: RegionalMonitoringResult;
  overallArmadaPct: number;
}

export const MonitoringKpiCards: React.FC<MonitoringKpiCardsProps> = ({
  data,
  overallArmadaPct,
}) => {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "12px",
      }}
    >
      {/* Card 1: Armada Wilayah */}
      <div
        style={{
          background: "var(--card-bg, rgba(23, 23, 23, 0.85))",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
          borderRadius: "16px",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "6px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "var(--text-secondary, #8b8b8b)",
            letterSpacing: "0.4px",
          }}
        >
          {TEXT_MONITORING.KPI.FLEET_LABEL}
        </span>
        <div
          style={{
            fontSize: "20px",
            fontWeight: 800,
            color: "var(--text-primary, #ededed)",
          }}
        >
          {data.totalRealops} / {data.totalRenops}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--text-secondary)",
              marginLeft: "4px",
            }}
          >
            {TEXT_MONITORING.KPI.FLEET_UNIT}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11.5px",
            paddingTop: "4px",
          }}
        >
          <span
            style={{
              color: "var(--accent-color, #3ECF8E)",
              fontWeight: 700,
            }}
          >
            {TEXT_MONITORING.KPI.FLEET_PCT(formatDecimal(overallArmadaPct, 1))}
          </span>
          <span style={{ color: "var(--text-secondary)" }}>
            {TEXT_MONITORING.KPI.FLEET_BREAKDOWN(
              data.totalRealops,
              data.totalRealops,
            )}
          </span>
        </div>
      </div>

      {/* Card 2: Total Pelanggan */}
      <div
        style={{
          background: "var(--card-bg, rgba(23, 23, 23, 0.85))",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
          borderRadius: "16px",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "6px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "var(--text-secondary, #8b8b8b)",
            letterSpacing: "0.4px",
          }}
        >
          {TEXT_MONITORING.KPI.PASSENGER_LABEL}
        </span>
        <div
          className="tabular-nums"
          style={{
            fontSize: "20px",
            fontWeight: 800,
            color: "var(--accent-color, #3ECF8E)",
          }}
        >
          {formatNumber(data.totalTodayPassengers)}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--text-secondary)",
              marginLeft: "4px",
            }}
          >
            {TEXT_MONITORING.KPI.PASSENGER_UNIT}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11.5px",
            paddingTop: "4px",
            color: "var(--text-secondary)",
          }}
        >
          <span>
            S1:{" "}
            <strong
              className="tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {formatNumber(data.totalShift1)}
            </strong>
          </span>
          <span>
            S2:{" "}
            <strong
              className="tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {formatNumber(data.totalShift2)}
            </strong>
          </span>
        </div>
      </div>

      {/* Card 3: Total KM Tempuh */}
      <div
        style={{
          background: "var(--card-bg, rgba(23, 23, 23, 0.85))",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
          borderRadius: "16px",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "6px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "var(--text-secondary, #8b8b8b)",
            letterSpacing: "0.4px",
          }}
        >
          {TEXT_MONITORING.KPI.KM_LABEL}
        </span>
        <div
          className="tabular-nums"
          style={{ fontSize: "20px", fontWeight: 800, color: "#38bdf8" }}
        >
          {formatDecimal(data.totalKm, 1)}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--text-secondary)",
              marginLeft: "4px",
            }}
          >
            {TEXT_MONITORING.KPI.KM_UNIT}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11.5px",
            paddingTop: "4px",
            color: "var(--text-secondary)",
          }}
        >
          <span>{TEXT_MONITORING.KPI.KM_AVG_LABEL}</span>
          <span
            className="tabular-nums"
            style={{ fontWeight: 700, color: "var(--text-primary)" }}
          >
            {formatDecimal(data.averageKmPerBus, 1)} km
          </span>
        </div>
      </div>

      {/* Card 4: Distribusi Shift */}
      <div
        style={{
          background: "var(--card-bg, rgba(23, 23, 23, 0.85))",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
          borderRadius: "16px",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "6px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "var(--text-secondary, #8b8b8b)",
            letterSpacing: "0.4px",
          }}
        >
          {TEXT_MONITORING.KPI.SHIFT_DISTRIBUTION}
        </span>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12.5px",
            fontWeight: 600,
          }}
        >
          <span style={{ color: "var(--text-secondary)" }}>
            {TEXT_MONITORING.KPI.SHIFT_1_ROW}
          </span>
          <span style={{ color: "#38bdf8" }}>
            {formatNumber(data.totalShift1)} (
            {formatDecimal(
              (data.totalShift1 / (data.totalTodayPassengers || 1)) * 100,
              0,
            )}
            %)
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12.5px",
            fontWeight: 600,
          }}
        >
          <span style={{ color: "var(--text-secondary)" }}>
            {TEXT_MONITORING.KPI.SHIFT_2_ROW}
          </span>
          <span style={{ color: "#c084fc" }}>
            {formatNumber(data.totalShift2)} (
            {formatDecimal(
              (data.totalShift2 / (data.totalTodayPassengers || 1)) * 100,
              0,
            )}
            %)
          </span>
        </div>
      </div>
    </section>
  );
};
