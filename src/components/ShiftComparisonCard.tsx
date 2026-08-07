import { Sun, Moon } from "lucide-react";
import type { AnalyticsSummary } from "../utils/analytics";

interface Props {
  summary: AnalyticsSummary;
  dateBadge?: string;
}

export function ShiftComparisonCard({ summary, dateBadge }: Props) {
  const formatInt = (val: number) =>
    (isNaN(val) || val === undefined || val === null ? 0 : val).toLocaleString(
      "id-ID",
    );

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
          <Sun size={18} />
          <span>Komparasi Pelanggan</span>
        </div>
        {dateBadge && (
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "monospace",
              color: "var(--accent-color)",
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
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
            <span>SHIFT 1</span>
          </div>
          <div className="shift-row">
            <span>TOA:</span>
            <b>{formatInt(summary.totalToaShift1)}</b>
          </div>
          <div className="shift-row">
            <span>Manual:</span>
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
            <span>Total:</span>
            <span>{formatInt(summary.totalShift1)}</span>
          </div>
        </div>

        {/* Shift 2 */}
        <div className="shift-box">
          <div className="shift-header" style={{ color: "#a78bfa" }}>
            <Moon size={16} />
            <span>SHIFT 2</span>
          </div>
          <div className="shift-row">
            <span>TOA:</span>
            <b>{formatInt(summary.totalToaShift2)}</b>
          </div>
          <div className="shift-row">
            <span>Manual:</span>
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
            <span>Total:</span>
            <span>{formatInt(summary.totalShift2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
