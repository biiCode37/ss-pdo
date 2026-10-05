import { memo } from "react";
import { Gauge, Users, UserCheck, Bus } from "lucide-react";
import type { AnalyticsSummary } from "../utils/analytics";
import { safeFormatNumber } from "../utils/numberUtils";
import { TEXT_DASHBOARD } from "../constants/texts";

interface Props {
  summary: AnalyticsSummary;
  dateBadge?: string;
}

function KPICardComponent({ summary, dateBadge }: Props) {
  // ponytail: reuse centralized safeFormatNumber instead of duplicate inline formatters
  const formatInt = (val: number) => safeFormatNumber(val);
  const formatRaw = (val: number) =>
    safeFormatNumber(val, 0, { maximumFractionDigits: 10 });

  return (
    <div className="analytics-card glass">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          gap: "8px",
        }}
      >
        <div className="analytics-card-title">
          <Gauge size={18} />
          <span>{TEXT_DASHBOARD.KPIS.TITLE}</span>
        </div>
        {dateBadge && (
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "monospace",
              color: "var(--accent-color)",
              background: "rgba(62, 207, 142, 0.12)",
              border: "1px solid rgba(62, 207, 142, 0.25)",
              padding: "3px 8px",
              borderRadius: "6px",
              whiteSpace: "nowrap",
              letterSpacing: "0.5px",
            }}
          >
            {dateBadge}
          </span>
        )}
      </div>

      <div className="analytics-grid-2">
        <div className="analytics-stat-box">
          <div className="analytics-stat-label">
            <Gauge size={14} style={{ color: "var(--success-color)" }} />
            <span>{TEXT_DASHBOARD.KPIS.TOTAL_KM}</span>
          </div>
          <div
            className="analytics-stat-value"
            style={{ color: "var(--success-color)" }}
          >
            {formatRaw(summary.totalKm)}{" "}
            <span style={{ fontSize: "12px", fontWeight: 400 }}>{TEXT_DASHBOARD.KPIS.TOTAL_KM_UNIT}</span>
          </div>
        </div>

        <div className="analytics-stat-box">
          <div className="analytics-stat-label">
            <Users size={14} style={{ color: "var(--accent-color)" }} />
            <span>{TEXT_DASHBOARD.KPIS.TOA_PASSENGERS}</span>
          </div>
          <div
            className="analytics-stat-value"
            style={{ color: "var(--accent-color)" }}
          >
            {formatInt(summary.totalPassengers)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginTop: "14px",
          paddingTop: "12px",
          borderTop: "1px solid var(--card-border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "13px",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--text-secondary)",
            }}
          >
            <Bus size={16} style={{ color: "var(--accent-color)" }} />
            <span>{TEXT_DASHBOARD.KPIS.KM_PER_BUS}</span>
          </span>
          <b
            style={{
              color: "var(--text-primary)",
              wordBreak: "break-all",
              textAlign: "right",
            }}
          >
            {formatRaw(summary.kmPerBus)} {TEXT_DASHBOARD.KPIS.TOTAL_KM_UNIT}
          </b>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "13px",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--text-secondary)",
            }}
          >
            <UserCheck size={16} style={{ color: "var(--success-color)" }} />
            <span>{TEXT_DASHBOARD.KPIS.PASSENGERS_PER_KM}</span>
          </span>
          <b
            style={{
              color: "var(--text-primary)",
              wordBreak: "break-all",
              textAlign: "right",
            }}
          >
            {formatRaw(summary.passengersPerKm)}
          </b>
        </div>
      </div>
    </div>
  );
}

export const KPICard = memo(KPICardComponent);
