import React, { useState } from "react";
import { MAX_TOA_VALUE } from "@/utils/modals/busInput/busModalTypes";
import { TEXT_ALERTS, TEXT_COMMON } from "@/constants/texts";
import { parseIndonesianNumber } from "@/utils/numberUtils";
import type { BusInputFormReturn } from "./useBusInputForm";
import { AlertTriangle, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { BusFormField } from "./fields/BusFormField";
import { ToaShiftComparison } from "./fields/ToaShiftComparison";
import { ShiftOptionChip } from "./fields/ShiftOptionChip";
import { KeteranganPresetBar } from "./notes/KeteranganPresetBar";
import { normalizeKeterangan } from "@/utils/keteranganUtils";

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
    keteranganS2,
    setKeteranganS2,
    showKeterangan,
    setShowKeterangan,
    handleInputFocus,
    handleInputKeyDown,
  } = form;

  const [showKmAwalEdit, setShowKmAwalEdit] = useState(!kmAwal2);

  const crossShiftErrorS2 = React.useMemo(() => {
    if (!form.isKmAkhir1Valid || !form.kmAkhir1 || !kmAwal2 || kmAwal2.trim().length <= 3) return null;
    const numAkhir1 = parseIndonesianNumber(form.kmAkhir1, NaN);
    const numAwal2 = parseIndonesianNumber(kmAwal2, NaN);
    if (!isNaN(numAkhir1) && !isNaN(numAwal2) && numAwal2 < numAkhir1) {
      return TEXT_ALERTS.BUS_INPUT_MODAL.KM_AWAL_S2_LESS_THAN_KM_AKHIR_S1(kmAwal2, form.kmAkhir1);
    }
    return null;
  }, [form.isKmAkhir1Valid, form.kmAkhir1, kmAwal2]);

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
        <BusFormField
          ref={toaS2InputRef}
          id="input-toa-s2"
          label={TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOTAL_TOA}
          variant="hero"
          type="number"
          min="0"
          max={MAX_TOA_VALUE}
          hasError={toaLiveS2.status === "invalid"}
          value={totalToa}
          onChange={(e) => setTotalToa(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.TOTAL_TOA}
        />

        <BusFormField
          id="input-km-akhir-2"
          label={TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AKHIR_S2}
          variant="hero"
          disabled={form.isKmAkhir2Locked}
          hasError={kmLiveS2.status === "negative"}
          value={kmAkhir2}
          onChange={(e) => setKmAkhir2(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder={
            form.isKmAkhir2Locked
              ? TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_KM_LOCKED
              : TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AKHIR_2
          }
        />
      </div>

      {/* 2. Pembanding realtime TOA S1 vs TOA S2 (= Total TOA − TOA S1), hanya tampilan */}
      <ToaShiftComparison toaShift1={form.toaShift1} live={toaLiveS2} />

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
            fontSize: "13px",
            flexWrap: "wrap",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ color: "var(--text-secondary, #94a3b8)" }}>
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
                  color: "var(--color-link)",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Copy size={16} />
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
              borderRadius: "8px",
              color: "var(--color-shift-2-fg)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              padding: "4px 8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              flexShrink: 0,
            }}
          >
            {showKmAwalEdit ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>{showKmAwalEdit ? TEXT_COMMON.BUTTONS.CLOSE : TEXT_COMMON.BUTTONS.EDIT}</span>
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
              fontSize: "13px",
            }}
          >
            <span style={{ color: "var(--text-secondary, #94a3b8)" }}>
              {TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S2}
            </span>
            <span
              style={{
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "8px",
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
              fontSize: "12px",
              fontWeight: 600,
              color: kmLiveS2.status === "negative" ? "var(--color-error-fg)" : "var(--color-warning-fg)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 8px",
              borderRadius: "8px",
              background:
                kmLiveS2.status === "negative"
                  ? "var(--color-error-bg)"
                  : "var(--color-warning-bg)",
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{kmLiveS2.formattedText}</span>
          </div>
        )}

        {/* Collapsible Edit KM Awal S2 */}
        {showKmAwalEdit && (
          <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px dashed var(--card-border, rgba(255, 255, 255, 0.08))" }}>
            <BusFormField
              id="input-km-awal-2"
              label={TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AWAL_S2}
              variant="secondary"
              disabled={form.isKmAwal2Locked}
              hasError={Boolean(crossShiftErrorS2)}
              value={kmAwal2}
              onChange={(e) => setKmAwal2(e.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              placeholder={
                form.isKmAwal2Locked
                  ? TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_KM_S2_LOCKED
                  : TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AWAL_2
              }
            />

            {crossShiftErrorS2 && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  fontSize: "12px",
                  color: "var(--color-error-fg)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{crossShiftErrorS2}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Action Chips Bar (Manual S2 & Catatan) */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <ShiftOptionChip
          isActive={showManual2}
          onToggle={() => setShowManual2((prev) => !prev)}
          label={
            showManual2
              ? TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_LABEL(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S2)
              : TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_MANUAL_S2
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
          <BusFormField
            id="input-manual-s2"
            label={TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S2}
            variant="secondary"
            type="number"
            min="0"
            max={MAX_TOA_VALUE}
            value={manualShift2}
            onChange={(e) => setManualShift2(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_MANUAL_S2}
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
          <KeteranganPresetBar
            value={keteranganS2}
            onChange={setKeteranganS2}
            shift={2}
            shiftLabel={TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS.LABEL_SHIFT2_NOTE}
          />
          <textarea
            id="input-shift2-keterangan"
            rows={2}
            value={keteranganS2}
            onChange={(e) => setKeteranganS2(e.target.value)}
            onBlur={() => setKeteranganS2(normalizeKeterangan(keteranganS2))}
            onFocus={handleInputFocus}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.NOTES_DETAIL_PLACEHOLDER}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "12px",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
              background: "var(--input-bg, rgba(0, 0, 0, 0.25))",
              color: "var(--text-primary, #ededed)",
              fontSize: "16px",
              boxSizing: "border-box",
              resize: "none",
              fontFamily: "inherit",
            }}
            aria-label={TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS.LABEL_SHIFT2_NOTE}
          />
        </div>
      )}
    </div>
  );
};
