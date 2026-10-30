import React, { useRef } from "react";
import type { HeaderMap } from "@/services/googleSheets";
import { MAX_TRIP_COUNT } from "@/utils/modals/busInput/busModalTypes";
import { parseIndonesianNumber } from "@/utils/numberUtils";
import { TEXT_ALERTS } from "@/constants/texts";
import type { BusInputFormReturn } from "../useBusInputForm";
import {
  singleFocusPrimaryInputStyle,
  getSingleFocusChipStyle,
  singleFocusLabelStyle,
} from "./singleFocusStyles";

export interface SingleFocusTripProps {
  form: BusInputFormReturn;
  headerMap?: HeaderMap;
}

export const SingleFocusTrip: React.FC<SingleFocusTripProps> = ({
  form,
  headerMap,
}) => {
  const {
    singlePrimaryInputRef,
    handleInputFocus,
    handleInputKeyDown,
    tripPergi,
    setTripPergi,
    tripPulang,
    setTripPulang,
    showKeterangan,
    setShowKeterangan,
  } = form;

  const tripPulangInputRef = useRef<HTMLInputElement>(null);

  const tripPergiLabel =
    headerMap?.tripPergiLabel || TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TRIP_PERGI;
  const tripPulangLabel =
    headerMap?.tripPulangLabel || TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TRIP_PULANG;

  // ponytail: 1 Ritase = 2 Trip (PP / Pulang-Pergi)
  const totalRitasePP = Number(
    (
      ((parseIndonesianNumber(tripPergi) || 0) +
        (parseIndonesianNumber(tripPulang) || 0)) /
      2
    ).toFixed(1),
  );

  const handleTripPergiKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (tripPulangInputRef.current) {
        tripPulangInputRef.current.focus();
        tripPulangInputRef.current.select();
      } else {
        handleInputKeyDown(e);
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Grid 2 Kolom untuk Trip Pergi & Trip Pulang */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        <div>
          <label htmlFor="single-input-tripPergi" style={singleFocusLabelStyle}>
            {tripPergiLabel}
          </label>
          <input
            ref={singlePrimaryInputRef}
            id="single-input-tripPergi"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            max={MAX_TRIP_COUNT}
            value={tripPergi}
            onChange={(e) => setTripPergi(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleTripPergiKeyDown}
            placeholder="0"
            style={{
              ...singleFocusPrimaryInputStyle,
              textAlign: "center",
              fontSize: "1.25rem",
            }}
          />
        </div>

        <div>
          <label htmlFor="single-input-tripPulang" style={singleFocusLabelStyle}>
            {tripPulangLabel}
          </label>
          <input
            ref={tripPulangInputRef}
            id="single-input-tripPulang"
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
            style={{
              ...singleFocusPrimaryInputStyle,
              textAlign: "center",
              fontSize: "1.25rem",
            }}
          />
        </div>
      </div>

      {/* Kalkulasi Live Total Ritase PP */}
      <div
        style={{
          padding: "10px 14px",
          borderRadius: "10px",
          background: "rgba(56, 189, 248, 0.08)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "0.82rem",
            color: "var(--text-secondary, #94a3b8)",
            fontWeight: 500,
          }}
        >
          {TEXT_ALERTS.BUS_INPUT_MODAL.TOTAL_TRIP_LABEL}
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span
            style={{
              fontSize: "1.2rem",
              fontWeight: 800,
              color: "var(--accent-color, #38bdf8)",
            }}
          >
            {totalRitasePP}
          </span>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--text-secondary, #94a3b8)",
            }}
          >
            {TEXT_ALERTS.BUS_INPUT_MODAL.TRIP_UNIT} (PP)
          </span>
        </div>
      </div>

      {/* Action Chip: + Catatan Operasional */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setShowKeterangan((prev) => !prev)}
          style={getSingleFocusChipStyle(showKeterangan)}
        >
          {showKeterangan
            ? TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_KETERANGAN
            : TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_KETERANGAN}
        </button>
      </div>
    </div>
  );
};
