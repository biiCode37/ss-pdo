import React, { useState } from "react";
import { MAX_TOA_VALUE } from "@/utils/modals/busInput/busModalTypes";
import { TEXT_ALERTS } from "@/constants/texts";
import type { BusInputFormReturn } from "./useBusInputForm";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

interface BusInputModalShift1Props {
  form: BusInputFormReturn;
}

export const BusInputModalShift1: React.FC<BusInputModalShift1Props> = ({
  form,
}) => {
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
    kmLiveS1,
    keterangan,
    setKeterangan,
    showKeterangan,
    setShowKeterangan,
    handleInputFocus,
    handleInputKeyDown,
  } = form;

  const [showKmAwalEdit, setShowKmAwalEdit] = useState(!kmAwal1);

  const heroInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "14px",
    border: "1.5px solid var(--card-border, rgba(255, 255, 255, 0.12))",
    background: "rgba(0, 0, 0, 0.35)",
    color: "var(--text-primary, #ededed)",
    fontSize: "1.25rem",
    fontWeight: 800,
    boxSizing: "border-box",
    textAlign: "left",
  };

  const secondaryInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
    background: "rgba(0, 0, 0, 0.25)",
    color: "var(--text-primary, #ededed)",
    fontSize: "0.95rem",
    boxSizing: "border-box",
  };

  const getChipStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "6px 12px",
    borderRadius: "9999px",
    fontSize: "0.78rem",
    fontWeight: 600,
    border: "1px solid",
    borderColor: isActive
      ? "var(--accent-color, #38bdf8)"
      : "var(--card-border, rgba(255, 255, 255, 0.1))",
    background: isActive
      ? "rgba(56, 189, 248, 0.15)"
      : "rgba(255, 255, 255, 0.04)",
    color: isActive
      ? "var(--accent-color, #38bdf8)"
      : "var(--text-secondary, #8b8b8b)",
    cursor: "pointer",
    transition: "all 0.15s cubic-bezier(0.32, 0.72, 0, 1)",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* 1. Paket Pasangan Berdampingan: TOA S1 & KM Akhir S1 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        <div>
          <label
            htmlFor="input-toa-s1"
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--text-secondary, #8b8b8b)",
              display: "block",
              marginBottom: "6px",
            }}
          >
            {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S1}
          </label>
          <input
            ref={toaS1InputRef}
            id="input-toa-s1"
            type="number"
            inputMode="numeric"
            min="0"
            max={MAX_TOA_VALUE}
            value={toaShift1}
            onChange={(e) => setToaShift1(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.TOA_S1}
            style={heroInputStyle}
          />
        </div>

        <div>
          <label
            htmlFor="input-km-akhir-1"
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--text-secondary, #8b8b8b)",
              display: "block",
              marginBottom: "6px",
            }}
          >
            {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AKHIR_S1}
          </label>
          <input
            id="input-km-akhir-1"
            type="text"
            inputMode="numeric"
            value={kmAkhir1}
            onChange={(e) => setKmAkhir1(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AKHIR_1}
            style={heroInputStyle}
          />
        </div>
      </div>

      {/* 2. Indikator Odometer Real-time & Selisih Jarak Tempuh */}
      <div
        style={{
          padding: "10px 12px",
          borderRadius: "12px",
          background:
            kmLiveS1.status === "negative"
              ? "rgba(239, 68, 68, 0.12)"
              : kmLiveS1.status === "extreme"
                ? "rgba(245, 158, 11, 0.12)"
                : "rgba(56, 189, 248, 0.08)",
          border: `1px solid ${
            kmLiveS1.status === "negative"
              ? "rgba(239, 68, 68, 0.3)"
              : kmLiveS1.status === "extreme"
                ? "rgba(245, 158, 11, 0.3)"
                : "rgba(56, 189, 248, 0.2)"
          }`,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.82rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "var(--text-secondary, #8b8b8b)" }}>
              {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_REF_S1}
            </span>
            <span style={{ fontWeight: 700, color: "var(--text-primary, #ededed)" }}>
              {kmAwal1 || TEXT_ALERTS.BUS_INPUT_MODAL.NOT_FILLED_YET}
            </span>
            <button
              type="button"
              onClick={() => setShowKmAwalEdit((prev) => !prev)}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent-color, #38bdf8)",
                fontSize: "0.75rem",
                cursor: "pointer",
                padding: "2px 4px",
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              {showKmAwalEdit ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              <span>{showKmAwalEdit ? "Tutup" : "Ubah"}</span>
            </button>
          </div>

          {kmDistanceS1 !== null && (
            <div style={{ fontSize: "0.85rem", fontWeight: 800 }}>
              <span style={{ color: "var(--text-secondary, #8b8b8b)", marginRight: "4px" }}>
                {TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S1}
              </span>
              <span
                style={{
                  color:
                    kmLiveS1.status === "negative"
                      ? "#f87171"
                      : kmLiveS1.status === "extreme"
                        ? "#f59e0b"
                        : "#38bdf8",
                }}
              >
                {kmDistanceS1} KM
              </span>
            </div>
          )}
        </div>

        {/* Status Pesan Selisih Real-time */}
        {kmLiveS1.formattedText && kmLiveS1.status !== "normal" && (
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: kmLiveS1.status === "negative" ? "#f87171" : "#f59e0b",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span>{kmLiveS1.formattedText}</span>
          </div>
        )}

        {/* Collapsible Edit KM Awal S1 */}
        {showKmAwalEdit && (
          <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px dashed var(--card-border, rgba(255, 255, 255, 0.08))" }}>
            <label
              htmlFor="input-km-awal-1"
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--text-secondary, #8b8b8b)",
                display: "block",
                marginBottom: "4px",
              }}
            >
              {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AWAL_S1}
            </label>
            <input
              id="input-km-awal-1"
              type="text"
              inputMode="numeric"
              value={kmAwal1}
              onChange={(e) => setKmAwal1(e.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AWAL_1}
              style={secondaryInputStyle}
            />
          </div>
        )}
      </div>

      {/* 3. Action Chips Bar (Manual & Catatan) */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setShowManual1((prev) => !prev)}
          style={getChipStyle(showManual1)}
        >
          {showManual1
            ? `✓ ${TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S1}`
            : TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_MANUAL_S1}
        </button>

        <button
          type="button"
          onClick={() => setShowKeterangan?.((prev) => !prev)}
          style={getChipStyle(Boolean(showKeterangan))}
        >
          {showKeterangan
            ? `✓ ${TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_NOTES}`
            : TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_KETERANGAN}
        </button>
      </div>

      {/* 4. Collapsible Field: Manual Shift 1 */}
      {showManual1 && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
          }}
        >
          <label
            htmlFor="input-manual-s1"
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--text-secondary, #8b8b8b)",
              display: "block",
              marginBottom: "4px",
            }}
          >
            {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S1}
          </label>
          <input
            id="input-manual-s1"
            type="number"
            inputMode="numeric"
            min="0"
            max={MAX_TOA_VALUE}
            value={manualShift1}
            onChange={(e) => setManualShift1(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_MANUAL_S1}
            style={secondaryInputStyle}
          />
        </div>
      )}

      {/* 5. Collapsible Field: Keterangan / Catatan Shift 1 */}
      {showKeterangan && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
          }}
        >
          <label
            htmlFor="input-shift1-keterangan"
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--text-secondary, #8b8b8b)",
              display: "block",
              marginBottom: "4px",
            }}
          >
            {TEXT_ALERTS.BUS_INPUT_MODAL.NOTES_DETAIL_LABEL}
          </label>
          <textarea
            id="input-shift1-keterangan"
            rows={2}
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.NOTES_DETAIL_PLACEHOLDER}
            style={{
              ...secondaryInputStyle,
              resize: "none",
              fontFamily: "inherit",
            }}
          />
        </div>
      )}
    </div>
  );
};
