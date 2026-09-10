import { memo } from "react";
import { Sun, Moon } from "lucide-react";
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
        {/* ponytail: clean title without redundant Sun icon (Shift 1 & 2 semantic icons preserved inside) */}
        <div className="analytics-card-title">
          <span>{TEXT_DASHBOARD.SHIFT_COMPARISON.TITLE}</span>
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
        {/* Shift 1 */}
        <div className="shift-box">
          <div
            className="shift-header"
            style={{ color: "var(--orange-color)" }}
          >
            <Sun size={16} />
            <span>{TEXT_DASHBOARD.SHIFT_COMPARISON.SHIFT_1}</span>
          </div>
          <div className="shift-row">
            <span>{TEXT_DASHBOARD.SHIFT_COMPARISON.TOA_LABEL}</span>
            <b>{formatInt(summary.totalToaShift1)}</b>
          </div>
          <div className="shift-row">
            <span>{TEXT_DASHBOARD.SHIFT_COMPARISON.MANUAL_LABEL}</span>
            <b
              style={{
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
            <span>{formatInt(summary.totalShift1)}</span>
          </div>
        </div>

        {/* Shift 2 */}
        <div className="shift-box">
          <div className="shift-header" style={{ color: "#a78bfa" }}>
            <Moon size={16} />
            <span>{TEXT_DASHBOARD.SHIFT_COMPARISON.SHIFT_2}</span>
          </div>
          <div className="shift-row">
            <span>{TEXT_DASHBOARD.SHIFT_COMPARISON.TOA_LABEL}</span>
            <b>{formatInt(summary.totalToaShift2)}</b>
          </div>
          <div className="shift-row">
            <span>{TEXT_DASHBOARD.SHIFT_COMPARISON.MANUAL_LABEL}</span>
            <b
              style={{
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
            <span>{formatInt(summary.totalShift2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ShiftComparisonCard = memo(ShiftComparisonCardComponent);
