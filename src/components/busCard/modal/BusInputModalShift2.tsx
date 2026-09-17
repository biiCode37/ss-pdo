import React from "react";
import { MAX_TOA_VALUE } from "@/utils/modals/busInput/busModalTypes";
import { TEXT_ALERTS } from "@/constants/texts";
import type { BusInputFormReturn } from "./useBusInputForm";

interface BusInputModalShift2Props {
  form: BusInputFormReturn;
}

export const BusInputModalShift2: React.FC<BusInputModalShift2Props> = ({ form }) => {
  const {
    toaS2InputRef,
    toaShift2,
    setToaShift2,
    showManual2,
    setShowManual2,
    manualShift2,
    setManualShift2,
    kmAwal2,
    setKmAwal2,
    kmAkhir2,
    setKmAkhir2,
    kmDistanceS2,
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
        <div>
          <label
            htmlFor="input-toa-s2"
            style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
          >
            TOA Shift 2
          </label>
          <input
            ref={toaS2InputRef}
            id="input-toa-s2"
            type="number"
            min="0"
            max={MAX_TOA_VALUE}
            value={toaShift2}
            onChange={(e) => setToaShift2(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder="Contoh: 180"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-secondary, #94a3b8)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showManual2}
              onChange={(e) => setShowManual2(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <span>{TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_HAS_MANUAL_S2}</span>
          </label>

          {showManual2 && (
            <input
              type="number"
              min="0"
              max={MAX_TOA_VALUE}
              value={manualShift2}
              onChange={(e) => setManualShift2(e.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_MANUAL_S2}
              style={{
                ...inputStyle,
                marginTop: "6px",
                fontSize: "0.9rem",
              }}
            />
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <label
            htmlFor="input-km-awal-2"
            style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
          >
            {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AWAL_S2}
          </label>
          <input
            id="input-km-awal-2"
            type="text"
            value={kmAwal2}
            onChange={(e) => setKmAwal2(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AWAL_2}
            style={inputStyle}
          />
        </div>
        <div>
          <label
            htmlFor="input-km-akhir-2"
            style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
          >
            {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AKHIR_S2}
          </label>
          <input
            id="input-km-akhir-2"
            type="text"
            value={kmAkhir2}
            onChange={(e) => setKmAkhir2(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AKHIR_2}
            style={inputStyle}
          />
        </div>
      </div>

      {kmDistanceS2 !== null && (
        <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", fontSize: "0.82rem", display: "flex", justifyContent: "space-between", color: "var(--text-main, #f8fafc)" }}>
          <span>{TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S2}</span>
          <span style={{ fontWeight: 700, color: "#38bdf8" }}>{kmDistanceS2} KM</span>
        </div>
      )}
    </div>
  );
};
