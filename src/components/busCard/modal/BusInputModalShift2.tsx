import React, { useState } from "react";
import { MAX_TOA_VALUE } from "@/utils/modals/busInput/busModalTypes";
import { TEXT_ALERTS } from "@/constants/texts";
import type { BusInputFormReturn } from "./useBusInputForm";
import { AlertTriangle, Copy, ChevronDown, ChevronUp } from "lucide-react";

interface BusInputModalShift2Props {
  form: BusInputFormReturn;
}

export const BusInputModalShift2: React.FC<BusInputModalShift2Props> = ({
  form,
}) => {
  const {
    toaS2InputRef,
    totalToa,
    setTotalToa,
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
    kmLiveS2,
    toaLiveS2,
    handleCopyKmAkhir1ToAwal2,
    keterangan,
    setKeterangan,
    showKeterangan,
    setShowKeterangan,
    handleInputFocus,
    handleInputKeyDown,
  } = form;

  const [showKmAwalEdit, setShowKmAwalEdit] = useState(!kmAwal2);

  // Sync value between totalToa and toaShift2 input
  const displayToaValue = totalToa || toaShift2;
  const handleToaChange = (val: string) => {
    setTotalToa(val);
    setToaShift2(val);
  };

  const heroInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1.5px solid var(--card-border, rgba(255, 255, 255, 0.12))",
    background: "rgba(0, 0, 0, 0.35)",
    color: "var(--text-primary, #ededed)",
    fontSize: "1.15rem",
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
      {/* 1. Paket Pasangan Berdampingan: TOTAL TOA & KM Akhir S2 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        <div>
          <label
            htmlFor="input-toa-s2"
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--text-secondary, #8b8b8b)",
              display: "block",
              marginBottom: "6px",
            }}
          >
            {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOTAL_TOA}
          </label>
          <input
            ref={toaS2InputRef}
            id="input-toa-s2"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            max={MAX_TOA_VALUE}
            value={displayToaValue}
            onChange={(e) => handleToaChange(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.TOTAL_TOA}
            style={heroInputStyle}
          />
        </div>

        <div>
          <label
            htmlFor="input-km-akhir-2"
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--text-secondary, #8b8b8b)",
              display: "block",
              marginBottom: "6px",
            }}
          >
            {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AKHIR_S2}
          </label>
          <input
            id="input-km-akhir-2"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            disabled={form.isKmAkhir2Locked}
            value={kmAkhir2}
            onChange={(e) => setKmAkhir2(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={
              form.isKmAkhir2Locked
                ? TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_KM_LOCKED
                : TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AKHIR_2
            }
            style={{
              ...heroInputStyle,
              opacity: form.isKmAkhir2Locked ? 0.45 : 1,
              cursor: form.isKmAkhir2Locked ? "not-allowed" : "text",
              background: form.isKmAkhir2Locked
                ? "rgba(255, 255, 255, 0.03)"
                : heroInputStyle.background,
            }}
          />
        </div>
      </div>

      {/* 2. Live Feedback Box: Kalkulasi TOA S2 */}
      {toaLiveS2.formattedText && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            background:
              toaLiveS2.status === "invalid"
                ? "rgba(239, 68, 68, 0.12)"
                : "rgba(192, 132, 252, 0.1)",
            border: `1px solid ${
              toaLiveS2.status === "invalid"
                ? "rgba(239, 68, 68, 0.3)"
                : "rgba(192, 132, 252, 0.25)"
            }`,
            fontSize: "0.82rem",
            fontWeight: 600,
            color: toaLiveS2.status === "invalid" ? "#f87171" : "#c084fc",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {toaLiveS2.status === "invalid" && (
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          )}
          <span>{toaLiveS2.formattedText}</span>
        </div>
      )}

      {/* 3. Indikator Odometer S2 & Selisih Jarak Tempuh */}
      <div
        style={{
          padding: "10px 12px",
          borderRadius: "12px",
          background:
            kmLiveS2.status === "negative"
              ? "rgba(239, 68, 68, 0.12)"
              : kmLiveS2.status === "extreme"
                ? "rgba(245, 158, 11, 0.12)"
                : "rgba(192, 132, 252, 0.08)",
          border: `1px solid ${
            kmLiveS2.status === "negative"
              ? "rgba(239, 68, 68, 0.3)"
              : kmLiveS2.status === "extreme"
                ? "rgba(245, 158, 11, 0.3)"
                : "rgba(192, 132, 252, 0.2)"
          }`,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {/* Baris 1: Info Acuan KM Awal S2 & Aksi Salin/Ubah */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.82rem",
            flexWrap: "wrap",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ color: "var(--text-secondary, #8b8b8b)" }}>
              {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_REF_S2}
            </span>
            <span style={{ fontWeight: 700, color: "var(--text-primary, #ededed)" }}>
              {kmAwal2 || TEXT_ALERTS.BUS_INPUT_MODAL.NOT_FILLED_YET}
            </span>

            {/* Tombol Salin KM Akhir S1 (Full Digits) - Hanya jika KM Akhir S1 valid */}
            {form.isKmAkhir1Valid && (
              <button
                type="button"
                onClick={handleCopyKmAkhir1ToAwal2}
                title={TEXT_ALERTS.BUS_INPUT_MODAL.COPY_KM_TITLE}
                style={{
                  background: "rgba(56, 189, 248, 0.15)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  color: "#38bdf8",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Copy size={11} />
                <span>{TEXT_ALERTS.BUS_INPUT_MODAL.COPY_KM_AKHIR_S1_BTN}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowKmAwalEdit((prev) => !prev)}
            style={{
              background: "rgba(192, 132, 252, 0.15)",
              border: "1px solid rgba(192, 132, 252, 0.3)",
              borderRadius: "6px",
              color: "#c084fc",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              padding: "3px 8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              flexShrink: 0,
            }}
          >
            {showKmAwalEdit ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            <span>{showKmAwalEdit ? "Tutup" : "Ubah"}</span>
          </button>
        </div>

        {/* Baris 2: Badge Jarak Tempuh S2 (Anti-Tabrakan) */}
        {kmDistanceS2 !== null && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "6px",
              borderTop: "1px dashed var(--card-border, rgba(255, 255, 255, 0.08))",
              fontSize: "0.8rem",
            }}
          >
            <span style={{ color: "var(--text-secondary, #8b8b8b)" }}>
              {TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S2}
            </span>
            <span
              style={{
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "6px",
                background:
                  kmLiveS2.status === "negative"
                    ? "rgba(239, 68, 68, 0.2)"
                    : kmLiveS2.status === "extreme"
                      ? "rgba(245, 158, 11, 0.2)"
                      : "rgba(192, 132, 252, 0.15)",
                color:
                  kmLiveS2.status === "negative"
                    ? "#f87171"
                    : kmLiveS2.status === "extreme"
                      ? "#f59e0b"
                      : "#c084fc",
              }}
            >
              {kmDistanceS2} KM
            </span>
          </div>
        )}

        {/* Status Pesan Selisih Real-time S2 */}
        {kmLiveS2.formattedText && kmLiveS2.status !== "normal" && (
          <div
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: kmLiveS2.status === "negative" ? "#f87171" : "#f59e0b",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 8px",
              borderRadius: "6px",
              background:
                kmLiveS2.status === "negative"
                  ? "rgba(239, 68, 68, 0.1)"
                  : "rgba(245, 158, 11, 0.1)",
            }}
          >
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span>{kmLiveS2.formattedText}</span>
          </div>
        )}

        {/* Collapsible Edit KM Awal S2 */}
        {showKmAwalEdit && (
          <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px dashed var(--card-border, rgba(255, 255, 255, 0.08))" }}>
            <label
              htmlFor="input-km-awal-2"
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--text-secondary, #8b8b8b)",
                display: "block",
                marginBottom: "4px",
              }}
            >
              {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AWAL_S2}
            </label>
            <input
              id="input-km-awal-2"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              disabled={form.isKmAwal2Locked}
              value={kmAwal2}
              onChange={(e) => setKmAwal2(e.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              placeholder={
                form.isKmAwal2Locked
                  ? TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_KM_S2_LOCKED
                  : TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AWAL_2
              }
              style={{
                ...secondaryInputStyle,
                opacity: form.isKmAwal2Locked ? 0.45 : 1,
                cursor: form.isKmAwal2Locked ? "not-allowed" : "text",
                background: form.isKmAwal2Locked
                  ? "rgba(255, 255, 255, 0.03)"
                  : secondaryInputStyle.background,
              }}
            />
          </div>
        )}
      </div>

      {/* 4. Action Chips Bar (Manual S2 & Catatan) */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setShowManual2((prev) => !prev)}
          style={getChipStyle(showManual2)}
        >
          {showManual2
            ? `✓ ${TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S2}`
            : TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_MANUAL_S2}
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

      {/* 5. Collapsible Field: Manual Shift 2 */}
      {showManual2 && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
          }}
        >
          <label
            htmlFor="input-manual-s2"
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--text-secondary, #8b8b8b)",
              display: "block",
              marginBottom: "4px",
            }}
          >
            {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S2}
          </label>
          <input
            id="input-manual-s2"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            max={MAX_TOA_VALUE}
            value={manualShift2}
            onChange={(e) => setManualShift2(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_MANUAL_S2}
            style={secondaryInputStyle}
          />
        </div>
      )}

      {/* 6. Collapsible Field: Keterangan / Catatan Shift 2 */}
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
            htmlFor="input-shift2-keterangan"
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
            id="input-shift2-keterangan"
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
