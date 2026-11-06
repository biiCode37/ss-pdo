import React from "react";
import { TEXT_ALERTS } from "@/constants/texts";
import type { KmDistanceResult } from "@/utils/modals/busInput/busModalOdometer";

interface CrossDayKmIndicatorProps {
  live: KmDistanceResult;
  previousDayKmAkhir2?: string;
  dateLabel: string;
}

/**
 * Selisih realtime KM Awal S1 hari ini terhadap KM Akhir S2 hari sebelumnya.
 * Kasus negatif TIDAK dirender di sini: sudah ditangani kotak error lintas hari
 * (validateKmCrossDay + opsi "odometer direset") yang sekaligus menahan penyimpanan.
 */
export const CrossDayKmIndicator: React.FC<CrossDayKmIndicatorProps> = ({
  live,
  previousDayKmAkhir2,
  dateLabel,
}) => {
  if (!previousDayKmAkhir2 || live.diff === null) return null;
  if (live.status !== "normal" && live.status !== "extreme") return null;

  const isExtreme = live.status === "extreme";

  return (
    <div
      data-testid="cross-day-km-indicator"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
        padding: "6px 10px",
        borderRadius: "8px",
        background: isExtreme ? "var(--color-warning-bg)" : "var(--color-info-bg)",
        border: `1px solid ${isExtreme ? "var(--color-warning-border)" : "var(--color-info-border)"}`,
        fontSize: "0.78rem",
      }}
    >
      <span style={{ color: "var(--color-text-secondary)" }}>
        {TEXT_ALERTS.BUS_INPUT_MODAL.CROSS_DAY_DIFF_LABEL(dateLabel)}{" "}
        <span style={{ fontWeight: 600 }}>
          {TEXT_ALERTS.BUS_INPUT_MODAL.CROSS_DAY_DIFF_REF(previousDayKmAkhir2)}
        </span>
      </span>
      <span
        style={{
          fontWeight: 800,
          color: isExtreme ? "var(--color-warning-fg)" : "var(--color-info-fg)",
        }}
      >
        {TEXT_ALERTS.BUS_INPUT_MODAL.CROSS_DAY_DIFF_VALUE(live.diff.toFixed(1))}
      </span>
    </div>
  );
};
