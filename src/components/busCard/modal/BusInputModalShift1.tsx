import React, { useState } from "react";
import { MAX_TOA_VALUE } from "@/utils/modals/busInput/busModalTypes";
import { TEXT_ALERTS, TEXT_COMMON } from "@/constants/texts";
import type { BusInputFormReturn } from "./useBusInputForm";
import { AlertTriangle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { BusFormField } from "./fields/BusFormField";
import { ShiftOptionChip } from "./fields/ShiftOptionChip";

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

  // Jika KM Awal S1 belum tersimpan di sheet (masih kosong atau hanya berisi 3 digit prefill),
  // buka form input KM Awal S1 secara default agar petugas langsung melihat dan melengkapi angka.
  const isKmAwalSaved = Boolean(
    form.bus?.kmAwal1 && form.bus.kmAwal1.trim().length >= 4,
  );
  const [showKmAwalEdit, setShowKmAwalEdit] = useState(!isKmAwalSaved);

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
        <BusFormField
          ref={toaS1InputRef}
          id="input-toa-s1"
          label={TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S1}
          variant="hero"
          type="number"
          min="0"
          max={MAX_TOA_VALUE}
          value={toaShift1}
          onChange={(e) => setToaShift1(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.TOA_S1}
        />

        <BusFormField
          id="input-km-akhir-1"
          label={TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AKHIR_S1}
          variant="hero"
          disabled={form.isKmAkhir1Locked}
          value={kmAkhir1}
          onChange={(e) => setKmAkhir1(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder={
            form.isKmAkhir1Locked
              ? TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_KM_LOCKED
              : TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AKHIR_1
          }
        />
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
          gap: "8px",
        }}
      >
        {/* Baris 1: Info Acuan KM Awal S1 & Tombol Ubah */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.82rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ color: "var(--text-secondary, #8b8b8b)" }}>
              {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_REF_S1}
            </span>
            <span style={{ fontWeight: 700, color: "var(--text-primary, #ededed)" }}>
              {kmAwal1 || TEXT_ALERTS.BUS_INPUT_MODAL.NOT_FILLED_YET}
            </span>
            {form.previousDayKmAkhir2 && !isKmAwalSaved && (
              <span
                style={{
                  fontSize: "0.72rem",
                  padding: "1px 6px",
                  borderRadius: "6px",
                  background: "rgba(245, 158, 11, 0.15)",
                  color: "#f59e0b",
                  fontWeight: 600,
                }}
              >
                {TEXT_ALERTS.BUS_INPUT_MODAL.PREFILL_DYNAMIC(
                  form.previousDayKmAkhir2,
                  form.previousDayDateLabel || TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_PREVIOUS_DAY,
                )}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowKmAwalEdit((prev) => !prev)}
            style={{
              background: "rgba(56, 189, 248, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              borderRadius: "6px",
              color: "var(--accent-color, #38bdf8)",
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
            <span>{showKmAwalEdit ? TEXT_COMMON.BUTTONS.CLOSE : TEXT_COMMON.BUTTONS.EDIT}</span>
          </button>
        </div>

        {/* Baris 2: Badge Jarak Tempuh yang Proporsional (Anti-Tabrakan) */}
        {kmDistanceS1 !== null && (
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
              {TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S1}
            </span>
            <span
              style={{
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "6px",
                background:
                  kmLiveS1.status === "negative"
                    ? "rgba(239, 68, 68, 0.2)"
                    : kmLiveS1.status === "extreme"
                      ? "rgba(245, 158, 11, 0.2)"
                      : "rgba(56, 189, 248, 0.15)",
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

        {/* Status Pesan Selisih Real-time */}
        {kmLiveS1.formattedText && kmLiveS1.status !== "normal" && (
          <div
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: kmLiveS1.status === "negative" ? "#f87171" : "#f59e0b",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 8px",
              borderRadius: "6px",
              background:
                kmLiveS1.status === "negative"
                  ? "rgba(239, 68, 68, 0.1)"
                  : "rgba(245, 158, 11, 0.1)",
            }}
          >
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span>{kmLiveS1.formattedText}</span>
          </div>
        )}

        {/* Collapsible Edit KM Awal S1 */}
        {showKmAwalEdit && (
          <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px dashed var(--card-border, rgba(255, 255, 255, 0.08))" }}>
            <BusFormField
              id="input-km-awal-1"
              label={TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AWAL_S1}
              variant="secondary"
              value={kmAwal1}
              onChange={(e) => setKmAwal1(e.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AWAL_1}
            />

            {form.smartRolloverSuggestion && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "rgba(245, 158, 11, 0.12)",
                  border: "1px solid rgba(245, 158, 11, 0.35)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                  }}
                >
                  <Sparkles size={14} />
                  <span>{TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_DETECTED_TITLE}</span>
                </div>
                <div style={{ fontSize: "0.76rem", color: "var(--text-secondary, #cbd5e1)", lineHeight: 1.4 }}>
                  {TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_SUGGESTION_TEXT(
                    form.smartRolloverSuggestion.suggestedKm,
                    form.smartRolloverSuggestion.diff,
                  )}
                </div>
                <button
                  type="button"
                  onClick={form.handleApplyRollover}
                  style={{
                    alignSelf: "flex-start",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "#f59e0b",
                    color: "#000",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    border: "none",
                    cursor: "pointer",
                    marginTop: "2px",
                  }}
                >
                  <Sparkles size={13} />
                  <span>{TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_APPLY_BTN(form.smartRolloverSuggestion.suggestedKm)}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Action Chips Bar (Manual & Catatan) */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <ShiftOptionChip
          isActive={showManual1}
          onToggle={() => setShowManual1((prev) => !prev)}
          label={
            showManual1
              ? TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_LABEL(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S1)
              : TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_MANUAL_S1
          }
        />

        <ShiftOptionChip
          isActive={Boolean(showKeterangan)}
          onToggle={() => setShowKeterangan?.((prev) => !prev)}
          label={
            showKeterangan
              ? TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_LABEL(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_NOTES)
              : TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_KETERANGAN
          }
        />
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
          <BusFormField
            id="input-manual-s1"
            label={TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S1}
            variant="secondary"
            type="number"
            min="0"
            max={MAX_TOA_VALUE}
            value={manualShift1}
            onChange={(e) => setManualShift1(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_MANUAL_S1}
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
              width: "100%",
              padding: "10px 12px",
              borderRadius: "12px",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
              background: "var(--input-bg, rgba(0, 0, 0, 0.25))",
              color: "var(--text-primary, #ededed)",
              fontSize: "0.95rem",
              boxSizing: "border-box",
              resize: "none",
              fontFamily: "inherit",
            }}
          />
        </div>
      )}
    </div>
  );
};
