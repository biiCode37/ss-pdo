import React from "react";
import { AlertTriangle } from "lucide-react";
import { TEXT_ALERTS } from "@/constants/texts";
import { parseIndonesianNumber } from "@/utils/numberUtils";
import type { ToaLiveResult } from "@/utils/modals/busInput/busModalOdometer";

interface ToaShiftComparisonProps {
  toaShift1: string;
  live: ToaLiveResult;
}

/**
 * Pembanding realtime TOA Shift 1 vs TOA Shift 2 (= Total TOA − TOA Shift 1) saat mengisi Total TOA.
 * Hanya tampilan: kolom "TOA SHIFT 2" di sheet berisi rumus dan tidak pernah dikirim (lihat busInputPayload).
 */
export const ToaShiftComparison: React.FC<ToaShiftComparisonProps> = ({
  toaShift1,
  live,
}) => {
  const hasS1 = toaShift1.trim() !== "";
  const s1Display = hasS1
    ? String(parseIndonesianNumber(toaShift1, 0))
    : TEXT_ALERTS.BUS_INPUT_MODAL.NOT_FILLED_YET;
  const isInvalid = live.status === "invalid";
  const s2Display =
    live.status === "valid" && live.s2 !== null
      ? String(live.s2)
      : TEXT_ALERTS.BUS_INPUT_MODAL.TOA_COMPARE_EMPTY;

  const cell = (label: string, value: string, testId: string, isError = false) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        padding: "6px 10px",
        borderRadius: "8px",
        background: "var(--color-surface-subtle)",
        border: `1px solid ${isError ? "var(--color-error-border)" : "var(--color-border-subtle)"}`,
      }}
    >
      <span style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>{label}</span>
      <span
        data-testid={testId}
        style={{
          fontSize: "0.95rem",
          fontWeight: 800,
          color: isError ? "var(--color-error-fg)" : "var(--color-text-primary)",
        }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div
      role="group"
      aria-label={TEXT_ALERTS.BUS_INPUT_MODAL.TOA_COMPARE_ARIA}
      style={{ display: "flex", flexDirection: "column", gap: "6px" }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {cell(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S1, s1Display, "toa-compare-s1")}
        {cell(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S2_AUTO, s2Display, "toa-compare-s2", isInvalid)}
      </div>
      {isInvalid && live.formattedText && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 10px",
            borderRadius: "8px",
            background: "var(--color-error-bg)",
            border: "1px solid var(--color-error-border)",
            color: "var(--color-error-fg)",
            fontSize: "0.78rem",
            fontWeight: 600,
          }}
        >
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          <span>{live.formattedText}</span>
        </div>
      )}
    </div>
  );
};
