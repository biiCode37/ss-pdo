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
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            width: `${s1Pct}%`,
            background: "linear-gradient(90deg, #F59E0B 0%, #D97706 100%)",
            transition: "width 0.3s ease",
          }}
          title={`Shift 1: ${s1Pct}%`}
        />
        <div
          style={{
            width: `${s2Pct}%`,
            background: "linear-gradient(90deg, #6366F1 0%, #4F46E5 100%)",
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
            background: "rgba(245, 158, 11, 0.06)",
            border: "1px solid rgba(245, 158, 11, 0.18)",
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
              <Sun size={15} style={{ color: "#F59E0B" }} />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#F59E0B",
                }}
              >
                {TEXT_MONITORING.DASHBOARD.SHIFT_SPLIT.SHIFT_1}
              </span>
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              {s1Pct}%
            </span>
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.3px",
            }}
          >
            {data.totalShift1.toLocaleString("id-ID")}{" "}
            <span style={{ fontSize: "11px", fontWeight: 500 }}>Pax</span>
          </div>
          <div
            style={{
              fontSize: "10px",
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
            background: "rgba(99, 102, 241, 0.06)",
            border: "1px solid rgba(99, 102, 241, 0.18)",
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
              <Moon size={15} style={{ color: "#818CF8" }} />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#818CF8",
                }}
              >
                {TEXT_MONITORING.DASHBOARD.SHIFT_SPLIT.SHIFT_2}
              </span>
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              {s2Pct}%
            </span>
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.3px",
            }}
          >
            {data.totalShift2.toLocaleString("id-ID")}{" "}
            <span style={{ fontSize: "11px", fontWeight: 500 }}>Pax</span>
          </div>
          <div
            style={{
              fontSize: "10px",
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
