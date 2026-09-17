import React from "react";
import { MAX_TOA_VALUE } from "@/utils/modals/busInput/busModalTypes";
import { TEXT_ALERTS } from "@/constants/texts";
import type { BusInputFormReturn } from "./useBusInputForm";

interface BusInputModalShift1Props {
  form: BusInputFormReturn;
}

export const BusInputModalShift1: React.FC<BusInputModalShift1Props> = ({ form }) => {
  const {
    toaS1InputRef,
    toaShift1,
    setToaShift1,
    showManual1,
    setShowManual1,
    manualShift1,
    setManualShift1,
    kmAwal1,
    setKmAwal1,
    kmAkhir1,
    setKmAkhir1,
    kmDistanceS1,
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
            htmlFor="input-toa-s1"
            style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
          >
            {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S1}
          </label>
          <input
            ref={toaS1InputRef}
            id="input-toa-s1"
            type="number"
            min="0"
            max={MAX_TOA_VALUE}
            value={toaShift1}
            onChange={(e) => setToaShift1(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.TOA_S1}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-secondary, #94a3b8)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showManual1}
              onChange={(e) => setShowManual1(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <span>{TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_HAS_MANUAL_S1}</span>
          </label>

          {showManual1 && (
            <input
              type="number"
              min="0"
              max={MAX_TOA_VALUE}
              value={manualShift1}
              onChange={(e) => setManualShift1(e.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_MANUAL_S1}
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
            htmlFor="input-km-awal-1"
            style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
          >
            {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AWAL_S1}
          </label>
          <input
            id="input-km-awal-1"
            type="text"
            value={kmAwal1}
            onChange={(e) => setKmAwal1(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AWAL_1}
            style={inputStyle}
          />
        </div>
        <div>
          <label
            htmlFor="input-km-akhir-1"
            style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
          >
            {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AKHIR_S1}
          </label>
          <input
            id="input-km-akhir-1"
            type="text"
            value={kmAkhir1}
            onChange={(e) => setKmAkhir1(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AKHIR_1}
            style={inputStyle}
          />
        </div>
      </div>

      {kmDistanceS1 !== null && (
        <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", fontSize: "0.82rem", display: "flex", justifyContent: "space-between", color: "var(--text-main, #f8fafc)" }}>
          <span>{TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S1}</span>
          <span style={{ fontWeight: 700, color: "#38bdf8" }}>{kmDistanceS1} KM</span>
        </div>
      )}
    </div>
  );
};
