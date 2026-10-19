import { memo } from "react";
import { Sun, Moon, Split } from "lucide-react";
import type { AnalyticsSummary } from "../utils/analytics";
import { safeFormatNumber } from "../utils/numberUtils";
import { TEXT_DASHBOARD } from "../constants/texts";

interface Props {
  summary: AnalyticsSummary;
  dateBadge?: string;
}

function ShiftComparisonCardComponent({ summary, dateBadge }: Props) {
  // ponytail: reuse centralized safeFormatNumber instead of duplicate inline formatters
  const formatInt = (val: number) => safeFormatNumber(val);

  const totalBothShifts = summary.totalShift1 + summary.totalShift2;
  const pctS1 = totalBothShifts > 0 ? Math.round((summary.totalShift1 / totalBothShifts) * 100) : 50;
  const pctS2 = totalBothShifts > 0 ? 100 - pctS1 : 50;

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
          <Split size={18} style={{ color: "var(--orange-color)" }} />
          <span>{TEXT_DASHBOARD.SHIFT_COMPARISON.TITLE}</span>
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

      {totalBothShifts > 0 && (
        <div className="shift-ratio-container">
          <div className="shift-ratio-labels">
            <span style={{ color: "var(--orange-color)" }}>
              {TEXT_DASHBOARD.SHIFT_COMPARISON.SHIFT_1_SHARE(pctS1)}
            </span>
            <span style={{ color: "#a78bfa" }}>
              {TEXT_DASHBOARD.SHIFT_COMPARISON.SHIFT_2_SHARE(pctS2)}
            </span>
          </div>
          <div
            className="shift-ratio-track"
            role="progressbar"
            aria-valuenow={pctS1}
            aria-valuemin={0}
            aria-valuemax={100}
            title={TEXT_DASHBOARD.SHIFT_COMPARISON.RATIO_LABEL}
          >
            <div className="shift-ratio-fill-s1" style={{ width: `${pctS1}%` }} />
            <div className="shift-ratio-fill-s2" style={{ width: `${pctS2}%` }} />
          </div>
        </div>
      )}

      <div className="analytics-grid-2">
        {/* Shift 1 */}
        <div className="shift-box">
          <div
            className="shift-header"
            style={{
              color: "var(--orange-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Sun size={15} />
              <span>{TEXT_DASHBOARD.SHIFT_COMPARISON.SHIFT_1}</span>
            </div>
            {totalBothShifts > 0 && (
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: "6px",
                  background: "rgba(249, 115, 22, 0.12)",
                  border: "1px solid rgba(249, 115, 22, 0.25)",
                }}
              >
                {pctS1}%
              </span>
            )}
          </div>
          <div className="shift-row">
            <span>{TEXT_DASHBOARD.SHIFT_COMPARISON.TOA_LABEL}</span>
            <b style={{ fontVariantNumeric: "tabular-nums" }}>{formatInt(summary.totalToaShift1)}</b>
          </div>
          <div className="shift-row">
            <span>{TEXT_DASHBOARD.SHIFT_COMPARISON.MANUAL_LABEL}</span>
            <b
              style={{
                fontVariantNumeric: "tabular-nums",
                color:
                  summary.totalManualShift1 > 0
                    ? "var(--warning-color)"
                    : "inherit",
              }}
            >
              {formatInt(summary.totalManualShift1)}
            </b>
          </div>
          <div className="shift-total">
            <span>{TEXT_DASHBOARD.SHIFT_COMPARISON.TOTAL_LABEL}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatInt(summary.totalShift1)}</span>
          </div>
        </div>

        {/* Shift 2 */}
        <div className="shift-box">
          <div
            className="shift-header"
            style={{
              color: "#a78bfa",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Moon size={15} />
              <span>{TEXT_DASHBOARD.SHIFT_COMPARISON.SHIFT_2}</span>
            </div>
            {totalBothShifts > 0 && (
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: "6px",
                  background: "rgba(167, 139, 250, 0.12)",
                  border: "1px solid rgba(167, 139, 250, 0.25)",
                }}
              >
                {pctS2}%
              </span>
            )}
          </div>
          <div className="shift-row">
            <span>{TEXT_DASHBOARD.SHIFT_COMPARISON.TOA_LABEL}</span>
            <b style={{ fontVariantNumeric: "tabular-nums" }}>{formatInt(summary.totalToaShift2)}</b>
          </div>
          <div className="shift-row">
            <span>{TEXT_DASHBOARD.SHIFT_COMPARISON.MANUAL_LABEL}</span>
            <b
              style={{
                fontVariantNumeric: "tabular-nums",
                color:
                  summary.totalManualShift2 > 0
                    ? "var(--warning-color)"
                    : "inherit",
              }}
            >
              {formatInt(summary.totalManualShift2)}
            </b>
          </div>
          <div className="shift-total">
            <span>{TEXT_DASHBOARD.SHIFT_COMPARISON.TOTAL_LABEL}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatInt(summary.totalShift2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ShiftComparisonCard = memo(ShiftComparisonCardComponent);
