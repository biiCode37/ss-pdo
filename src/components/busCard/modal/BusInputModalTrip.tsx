import React from "react";
import { parseIndonesianNumber } from "@/utils/numberUtils";
import { MAX_TRIP_COUNT } from "@/utils/modals/busInput/busModalTypes";
import { TEXT_ALERTS } from "@/constants/texts";
import type { BusInputFormReturn } from "./useBusInputForm";
import { BusFormField } from "./fields/BusFormField";

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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <BusFormField
          ref={tripPergiInputRef}
          id="input-trip-pergi"
          label={tripPergiLabel}
          variant="hero"
          type="number"
          min="0"
          max={MAX_TRIP_COUNT}
          value={tripPergi}
          onChange={(e) => setTripPergi(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder="0"
        />

        <BusFormField
          id="input-trip-pulang"
          label={tripPulangLabel}
          variant="hero"
          type="number"
          min="0"
          max={MAX_TRIP_COUNT}
          value={tripPulang}
          onChange={(e) => setTripPulang(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder="0"
        />
      </div>

      <div
        style={{
          padding: "12px 14px",
          borderRadius: "12px",
          background: "var(--color-info-bg)",
          border: "1px solid var(--color-info-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>
          {TEXT_ALERTS.BUS_INPUT_MODAL.TOTAL_TRIP_LABEL}
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-info-fg)" }}>
            {totalRitasePP}
          </span>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
            {TEXT_ALERTS.BUS_INPUT_MODAL.TRIP_UNIT} (PP)
          </span>
        </div>
      </div>
    </div>
  );
};
