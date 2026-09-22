import React from "react";
import { parseIndonesianNumber } from "@/utils/numberUtils";
import { MAX_TRIP_COUNT } from "@/utils/modals/busInput/busModalTypes";
import { TEXT_ALERTS } from "@/constants/texts";
import type { BusInputFormReturn } from "./useBusInputForm";

interface BusInputModalTripProps {
  form: BusInputFormReturn;
  tripPergiLabel: string;
  tripPulangLabel: string;
}

export const BusInputModalTrip: React.FC<BusInputModalTripProps> = ({
  form,
  tripPergiLabel,
  tripPulangLabel,
}) => {
  const {
    tripPergiInputRef,
    tripPergi,
    setTripPergi,
    tripPulang,
    setTripPulang,
    handleInputFocus,
    handleInputKeyDown,
  } = form;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
    background: "rgba(0, 0, 0, 0.25)",
    color: "var(--text-main, #f8fafc)",
    fontSize: "0.95rem",
    boxSizing: "border-box",
  };

  // ponytail: 1 Ritase = 2 Trip (PP / Pulang-Pergi)
  const totalRitasePP = Number(
    (
      ((parseIndonesianNumber(tripPergi) || 0) +
        (parseIndonesianNumber(tripPulang) || 0)) /
      2
    ).toFixed(1),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <label
            htmlFor="input-trip-pergi"
            style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
          >
            {tripPergiLabel}
          </label>
          <input
            ref={tripPergiInputRef}
            id="input-trip-pergi"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            max={MAX_TRIP_COUNT}
            value={tripPergi}
            onChange={(e) => setTripPergi(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder="0"
            style={inputStyle}
          />
        </div>
        <div>
          <label
            htmlFor="input-trip-pulang"
            style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
          >
            {tripPulangLabel}
          </label>
          <input
            id="input-trip-pulang"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            max={MAX_TRIP_COUNT}
            value={tripPulang}
            onChange={(e) => setTripPulang(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder="0"
            style={inputStyle}
          />
        </div>
      </div>

      <div
        style={{
          padding: "10px 14px",
          borderRadius: "10px",
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary, #94a3b8)" }}>
          {TEXT_ALERTS.BUS_INPUT_MODAL.TOTAL_TRIP_LABEL}
        </span>
        <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#38bdf8" }}>
          {totalRitasePP} {TEXT_ALERTS.BUS_INPUT_MODAL.TRIP_UNIT}
        </span>
      </div>
    </div>
  );
};
