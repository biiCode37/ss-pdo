import { memo } from "react";
import { Gauge, Users, UserCheck, Bus, Activity } from "lucide-react";
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
          <Activity size={18} style={{ color: "var(--accent-color)" }} />
          <span>{TEXT_DASHBOARD.KPIS.TITLE}</span>
        </div>
        {dateBadge && (
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              fontFamily: "monospace",
              color: "var(--accent-color)",
              background: "rgba(62, 207, 142, 0.12)",
              border: "1px solid rgba(62, 207, 142, 0.25)",
              padding: "2px 8px",
              borderRadius: "6px",
              whiteSpace: "nowrap",
              letterSpacing: "0.5px",
            }}
          >
            {dateBadge}
          </span>
        )}
      </div>

      <div className="kpi-executive-grid">
        {/* Cell 1: Total KM */}
        <div className="kpi-metric-card">
          <div className="kpi-metric-head">
            <span className="kpi-metric-label">
              <Gauge size={13} style={{ color: "var(--success-color)" }} />
              {TEXT_DASHBOARD.KPIS.TOTAL_KM}
            </span>
          </div>
          <div className="kpi-metric-value-row">
            <span className="kpi-metric-value" style={{ color: "var(--success-color)" }}>
              {formatRaw(summary.totalKm)}
            </span>
            <span className="kpi-metric-unit">{TEXT_DASHBOARD.KPIS.TOTAL_KM_UNIT}</span>
          </div>
        </div>

        {/* Cell 2: Total Pelanggan TOA */}
        <div className="kpi-metric-card">
          <div className="kpi-metric-head">
            <span className="kpi-metric-label">
              <Users size={13} style={{ color: "var(--accent-color)" }} />
              {TEXT_DASHBOARD.KPIS.TOA_PASSENGERS}
            </span>
          </div>
          <div className="kpi-metric-value-row">
            <span className="kpi-metric-value" style={{ color: "var(--accent-color)" }}>
              {formatInt(summary.totalPassengers)}
            </span>
            <span className="kpi-metric-unit">{TEXT_DASHBOARD.UNIT_CARD.PNP_UNIT}</span>
          </div>
        </div>

        {/* Cell 3: KM per Bus */}
        <div className="kpi-metric-card">
          <div className="kpi-metric-head">
            <span className="kpi-metric-label">
              <Bus size={13} style={{ color: "#38bdf8" }} />
              {TEXT_DASHBOARD.KPIS.KM_PER_BUS_LABEL}
            </span>
          </div>
          <div className="kpi-metric-value-row">
            <span className="kpi-metric-value" style={{ color: "#38bdf8" }}>
              {formatRaw(summary.kmPerBus)}
            </span>
            <span className="kpi-metric-unit">{TEXT_DASHBOARD.KPIS.BUS_UNIT}</span>
          </div>
        </div>

        {/* Cell 4: Pelanggan per KM */}
        <div className="kpi-metric-card">
          <div className="kpi-metric-head">
            <span className="kpi-metric-label">
              <UserCheck size={13} style={{ color: "#a78bfa" }} />
              {TEXT_DASHBOARD.KPIS.PASSENGERS_PER_KM_LABEL}
            </span>
          </div>
          <div className="kpi-metric-value-row">
            <span className="kpi-metric-value" style={{ color: "#a78bfa" }}>
              {formatRaw(summary.passengersPerKm)}
            </span>
            <span className="kpi-metric-unit">{TEXT_DASHBOARD.KPIS.RATIO_UNIT}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const KPICard = memo(KPICardComponent);
