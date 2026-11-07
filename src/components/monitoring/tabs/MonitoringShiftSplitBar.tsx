import React from "react";
import type { RegionalMonitoringResult } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";
import { Sun, Moon } from "lucide-react";

interface MonitoringShiftSplitBarProps {
  data: RegionalMonitoringResult;
}

export const MonitoringShiftSplitBar: React.FC<MonitoringShiftSplitBarProps> = ({
  data,
}) => {
  const total = data.totalShift1 + data.totalShift2 || 1;
  const s1Pct = Math.round((data.totalShift1 / total) * 100);
  const s2Pct = 100 - s1Pct;

  return (
    <div className="monitoring-card">
      <h3
        style={{
          fontSize: "14px",
          fontWeight: 700,
          margin: "0 0 12px 0",
          color: "var(--text-primary)",
        }}
      >
        {TEXT_MONITORING.DASHBOARD.SHIFT_SPLIT.TITLE}
      </h3>

      {/* Split Bar Container */}
      <div
        style={{
          height: "14px",
          width: "100%",
          borderRadius: "8px",
          overflow: "hidden",
          display: "flex",
          backgroundColor: "var(--color-surface-subtle)",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            width: `${s1Pct}%`,
            background: "var(--color-shift-1-fg)",
            transition: "width 0.3s ease",
          }}
          title={`Shift 1: ${s1Pct}%`}
        />
        <div
          style={{
            width: `${s2Pct}%`,
            background: "var(--color-shift-2-fg)",
            transition: "width 0.3s ease",
          }}
          title={`Shift 2: ${s2Pct}%`}
        />
      </div>

      {/* Shift Details (2 Columns) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        {/* Shift 1 */}
        <div
          style={{
            background: "var(--color-shift-1-bg)",
            border: "1px solid var(--color-shift-1-border)",
            borderRadius: "12px",
            padding: "10px 12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Sun size={15} style={{ color: "var(--color-shift-1-fg)" }} />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--color-shift-1-fg)",
                }}
              >
                {TEXT_MONITORING.DASHBOARD.SHIFT_SPLIT.SHIFT_1}
              </span>
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {s1Pct}%
            </span>
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.3px",
            }}
          >
            {data.totalShift1.toLocaleString("id-ID")}{" "}
            <span style={{ fontSize: "12px", fontWeight: 500 }}>
              {TEXT_MONITORING.DASHBOARD.SHIFT_SPLIT.UNIT_LABEL}
            </span>
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              marginTop: "2px",
            }}
          >
            {TEXT_MONITORING.DASHBOARD.SHIFT_SPLIT.DETAIL_PASSENGERS(
              data.tomShift1,
              data.manualShift1,
            )}
          </div>
        </div>

        {/* Shift 2 */}
        <div
          style={{
            background: "var(--color-shift-2-bg)",
            border: "1px solid var(--color-shift-2-border)",
            borderRadius: "12px",
            padding: "10px 12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Moon size={15} style={{ color: "var(--color-shift-2-fg)" }} />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--color-shift-2-fg)",
                }}
              >
                {TEXT_MONITORING.DASHBOARD.SHIFT_SPLIT.SHIFT_2}
              </span>
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {s2Pct}%
            </span>
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.3px",
            }}
          >
            {data.totalShift2.toLocaleString("id-ID")}{" "}
            <span style={{ fontSize: "12px", fontWeight: 500 }}>
              {TEXT_MONITORING.DASHBOARD.SHIFT_SPLIT.UNIT_LABEL}
            </span>
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              marginTop: "2px",
            }}
          >
            {TEXT_MONITORING.DASHBOARD.SHIFT_SPLIT.DETAIL_PASSENGERS(
              data.tomShift2,
              data.manualShift2,
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
