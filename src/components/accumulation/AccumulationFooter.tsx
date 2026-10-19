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
  const startMonthName = MONTH_NAMES_ID[startMonth] || startMonth;
  const endMonthName = MONTH_NAMES_ID[endMonth] || endMonth;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Preview Badge */}
      <div
        style={{
          background: "rgba(56, 189, 248, 0.1)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          borderRadius: "10px",
          padding: "10px 14px",
          fontSize: "0.82rem",
          color: "var(--accent-color, #38bdf8)",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Layers size={14} style={{ flexShrink: 0 }} />
        <span>
          {TEXT_DASHBOARD.ACCUMULATION_SHEET.PREVIEW_RANGE_LABEL(
            safeStartDay,
            startMonthName,
            startYear,
            safeEndDay,
            endMonthName,
            endYear,
          )}
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
            fontSize: "0.8rem",
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
        onClick={handleApply}
        style={{
          width: "100%",
          minHeight: "44px",
          padding: "10px 16px",
          borderRadius: "12px",
          border: "none",
          background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "0.92rem",
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(14, 165, 233, 0.35)",
          transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {TEXT_DASHBOARD.ACCUMULATION_SHEET.APPLY_BTN}
      </button>

      {/* Tombol Reset Mode Akumulasi */}
      {isAccumulationActive && onResetAccumulation && (
        <button
          type="button"
          onClick={() => {
            onResetAccumulation();
            onDismiss();
          }}
          style={{
            width: "100%",
            minHeight: "40px",
            padding: "8px 14px",
            borderRadius: "12px",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
            background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
            color: "var(--text-secondary, #94a3b8)",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: "pointer",
            transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {TEXT_DASHBOARD.ACCUMULATION_SHEET.RESET_BTN}
        </button>
      )}
    </div>
  );
};
