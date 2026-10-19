import React from "react";
import { AlertTriangle } from "lucide-react";
import { TEXT_DASHBOARD } from "@/constants/texts";

interface BusListAccumulationBannerProps {
  accRange?: {
    startDay?: number;
    startMonth?: number;
    startYear?: number;
    endDay?: number;
    endMonth?: number;
    endYear?: number;
  } | null;
  onExitAccumulation?: () => void;
}

export const BusListAccumulationBanner: React.FC<BusListAccumulationBannerProps> = ({
  accRange,
  onExitAccumulation,
}) => {
  const sDay = accRange?.startDay ?? 1;
  const eDay = accRange?.endDay ?? new Date().getDate();
  const dateRangeText =
    accRange?.startMonth &&
    accRange?.endMonth &&
    (accRange.startMonth !== accRange.endMonth ||
      accRange.startYear !== accRange.endYear)
      ? `${sDay}/${accRange.startMonth} - ${eDay}/${accRange.endMonth}`
      : `${sDay} - ${eDay}`;

  return (
    <div
      style={{
        background: "rgba(245, 158, 11, 0.12)",
        border: "1px solid rgba(245, 158, 11, 0.35)",
        color: "var(--warning-text, #f59e0b)",
        padding: "10px 14px",
        borderRadius: "12px",
        fontSize: "0.8rem",
        fontWeight: 600,
        marginBottom: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flex: 1,
          minWidth: "220px",
        }}
      >
        <AlertTriangle size={16} style={{ color: "var(--warning-color, #f59e0b)", flexShrink: 0 }} />
        <span>
          Rekap Akumulasi (Tgl {dateRangeText}) aktif.{" "}
          {TEXT_DASHBOARD.BUS_LIST.ACCUMULATION_LOCKED}
        </span>
      </div>
      {onExitAccumulation && (
        <button
          type="button"
          onClick={onExitAccumulation}
          style={{
            height: "32px",
            background: "rgba(245, 158, 11, 0.18)",
            border: "1px solid rgba(245, 158, 11, 0.45)",
            color: "var(--warning-text, #f59e0b)",
            borderRadius: "8px",
            padding: "0 12px",
            fontSize: "0.75rem",
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          <span>{TEXT_DASHBOARD.ROUTE_SELECTOR.EXIT_ACCUMULATION}</span>
          <span>➔</span>
        </button>
      )}
    </div>
  );
};
