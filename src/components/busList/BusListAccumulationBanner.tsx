import React from "react";
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
        background: "rgba(234, 179, 8, 0.15)",
        border: "1px solid rgba(234, 179, 8, 0.4)",
        color: "var(--warning-color, #eab308)",
        padding: "10px 14px",
        borderRadius: "12px",
        fontSize: "12.5px",
        fontWeight: 600,
        marginBottom: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "8px",
        boxShadow: "0 2px 8px rgba(234, 179, 8, 0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flex: 1,
          minWidth: "240px",
        }}
      >
        <span style={{ fontSize: "16px" }}>⚠️</span>
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
            background: "rgba(234, 179, 8, 0.2)",
            border: "1px solid rgba(234, 179, 8, 0.45)",
            color: "var(--warning-color, #eab308)",
            borderRadius: "8px",
            padding: "5px 12px",
            fontSize: "11.5px",
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {TEXT_DASHBOARD.ROUTE_SELECTOR.EXIT_ACCUMULATION} ➔
        </button>
      )}
    </div>
  );
};
