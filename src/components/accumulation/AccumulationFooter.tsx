import React from "react";
import { Layers } from "lucide-react";
import { TEXT_DASHBOARD, TEXT_COMMON } from "@/constants/texts";

const MONTH_NAMES_ID = TEXT_COMMON.MONTHS;

interface AccumulationFooterProps {
  safeStartDay: number;
  startMonth: number;
  startYear: number;
  safeEndDay: number;
  endMonth: number;
  endYear: number;
  rangeError: string | null;
  handleApply: () => void;
  isAccumulationActive?: boolean;
  onResetAccumulation?: () => void;
  onDismiss: () => void;
}

export const AccumulationFooter: React.FC<AccumulationFooterProps> = ({
  safeStartDay,
  startMonth,
  startYear,
  safeEndDay,
  endMonth,
  endYear,
  rangeError,
  handleApply,
  isAccumulationActive,
  onResetAccumulation,
  onDismiss,
}) => {
  return (
    <>
      {/* Preview Badge */}
      <div
        style={{
          background: "rgba(62, 207, 142, 0.1)",
          border: "1px solid rgba(62, 207, 142, 0.25)",
          borderRadius: "10px",
          padding: "10px 14px",
          marginBottom: "16px",
          fontSize: "12.5px",
          color: "var(--accent-color)",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Layers size={14} style={{ flexShrink: 0 }} />
        <span>
          Rentang: {safeStartDay} {MONTH_NAMES_ID[startMonth] || startMonth}{" "}
          {startYear} — {safeEndDay} {MONTH_NAMES_ID[endMonth] || endMonth}{" "}
          {endYear}
        </span>
      </div>

      {/* Error Validasi Rentang */}
      {rangeError && (
        <div
          role="alert"
          style={{
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            borderRadius: "10px",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "12.5px",
            color: "var(--danger-color, #ef4444)",
            fontWeight: 600,
          }}
        >
          ⚠️ {rangeError}
        </div>
      )}

      {/* Tombol Apply */}
      <button
        type="button"
        className="btn"
        onClick={handleApply}
        style={{
          width: "100%",
          padding: "12px",
          fontWeight: 700,
          fontSize: "14px",
        }}
      >
        {TEXT_DASHBOARD.ACCUMULATION_SHEET.APPLY_BTN}
      </button>

      {/* Tombol Reset Mode Akumulasi (ACC-17-01) */}
      {isAccumulationActive && onResetAccumulation && (
        <button
          type="button"
          onClick={() => {
            onResetAccumulation();
            onDismiss();
          }}
          style={{
            width: "100%",
            padding: "11px",
            fontWeight: 600,
            fontSize: "13px",
            marginTop: "8px",
            background: "transparent",
            border: "1px solid var(--card-border)",
            borderRadius: "10px",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          {TEXT_DASHBOARD.ACCUMULATION_SHEET.RESET_BTN}
        </button>
      )}
    </>
  );
};
