import React, { useState } from "react";
import { MAX_TOA_VALUE } from "@/utils/modals/busInput/busModalTypes";
import { TEXT_ALERTS, TEXT_COMMON } from "@/constants/texts";
import { validateKmCrossDay } from "@/utils/modals/busInput/busModalValidation";
import type { BusInputFormReturn } from "./useBusInputForm";
import { AlertTriangle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { BusFormField } from "./fields/BusFormField";
import { CrossDayKmIndicator } from "./fields/CrossDayKmIndicator";
import { ShiftOptionChip } from "./fields/ShiftOptionChip";
import { KeteranganPresetBar } from "./notes/KeteranganPresetBar";
import { normalizeKeterangan } from "@/utils/keteranganUtils";

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
    keteranganS1,
    setKeteranganS1,
    showKeterangan,
    setShowKeterangan,
    handleInputFocus,
    handleInputKeyDown,
  } = form;

  // Jika KM Awal S1 belum tersimpan di sheet (masih kosong atau hanya berisi 3 digit prefill),
  // buka form input KM Awal S1 secara default agar petugas langsung melihat dan melengkapi angka.
  const previousDateLabel =
    form.previousDayDateLabel || TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_PREVIOUS_DAY;

  const crossDayErrorS1 = React.useMemo(() => {
    if (!form.previousDayKmAkhir2 || form.bypassOdometerReset) return null;
    return validateKmCrossDay(
      kmAwal1,
      form.previousDayKmAkhir2,
      TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_1,
      previousDateLabel,
      form.bypassOdometerReset,
    );
  }, [kmAwal1, form.previousDayKmAkhir2, previousDateLabel, form.bypassOdometerReset]);

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
          hasError={kmLiveS1.status === "negative"}
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
              ? "var(--color-error-bg)"
              : kmLiveS1.status === "extreme"
                ? "var(--color-warning-bg)"
                : "var(--color-info-bg)",
          border: `1px solid ${
            kmLiveS1.status === "negative"
              ? "var(--color-error-border)"
              : kmLiveS1.status === "extreme"
                ? "var(--color-warning-border)"
                : "var(--color-info-border)"
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
            fontSize: "13px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ color: "var(--color-text-secondary)" }}>
              {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_REF_S1}
            </span>
            <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
              {kmAwal1 || TEXT_ALERTS.BUS_INPUT_MODAL.NOT_FILLED_YET}
            </span>
            {form.previousDayKmAkhir2 && !isKmAwalSaved && (
              <span
                style={{
                  fontSize: "12px",
                  padding: "2px 6px",
                  borderRadius: "8px",
                  background: "var(--color-warning-bg)",
                  color: "var(--color-warning-fg)",
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
              background: "var(--color-info-bg)",
              border: "1px solid var(--color-info-border)",
              borderRadius: "8px",
              color: "var(--color-link)",
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

        {/* Selisih realtime KM Awal S1 vs KM Akhir S2 hari sebelumnya */}
        <CrossDayKmIndicator
          live={form.kmLiveCrossDay}
          previousDayKmAkhir2={form.previousDayKmAkhir2}
          dateLabel={previousDateLabel}
        />

        {/* Baris 2: Badge Jarak Tempuh yang Proporsional (Anti-Tabrakan) */}
        {kmDistanceS1 !== null && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "6px",
              borderTop: "1px dashed var(--color-border-subtle)",
              fontSize: "13px",
            }}
          >
            <span style={{ color: "var(--color-text-secondary)" }}>
              {TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S1}
            </span>
            <span
              style={{
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "8px",
                background:
                  kmLiveS1.status === "negative"
                    ? "var(--color-error-bg)"
                    : kmLiveS1.status === "extreme"
                      ? "var(--color-warning-bg)"
                      : "var(--color-info-bg)",
                color:
                  kmLiveS1.status === "negative"
                    ? "var(--color-error-fg)"
                    : kmLiveS1.status === "extreme"
                      ? "var(--color-warning-fg)"
                      : "var(--color-link)",
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
              fontSize: "12px",
              fontWeight: 600,
              color: kmLiveS1.status === "negative" ? "var(--color-error-fg)" : "var(--color-warning-fg)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 8px",
              borderRadius: "8px",
              background:
                kmLiveS1.status === "negative"
                  ? "var(--color-error-bg)"
                  : "var(--color-warning-bg)",
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{kmLiveS1.formattedText}</span>
          </div>
        )}

        {/* Collapsible Edit KM Awal S1 */}
        {showKmAwalEdit && (
          <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px dashed var(--color-border-subtle)" }}>
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

            {crossDayErrorS1 && !form.smartRolloverSuggestion && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "var(--color-error-bg)",
                  border: "1px solid var(--color-error-border)",
                  fontSize: "12px",
                  color: "var(--color-error-fg)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{crossDayErrorS1}</span>
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    color: "var(--color-text-secondary)",
                    fontSize: "12px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.bypassOdometerReset}
                    onChange={(e) =>
                      form.handleToggleBypassOdometerReset(e.target.checked)
                    }
                    style={{ accentColor: "var(--color-action-primary-bg)" }}
                  />
                  <span>
                    {TEXT_ALERTS.BUS_INPUT_MODAL.BYPASS_ODOMETER_RESET_LABEL}
                  </span>
                </label>
              </div>
            )}

            {form.smartRolloverSuggestion && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  background: "var(--color-warning-bg)",
                  border: "1px solid var(--color-warning-border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--color-warning-fg)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                  }}
                >
                  <Sparkles size={16} />
                  <span>{TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_DETECTED_TITLE}</span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
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
                    borderRadius: "8px",
                    background: "var(--color-warning-fg)",
                    color: "var(--color-text-secondary)",
                    fontWeight: 700,
                    fontSize: "12px",
                    border: "none",
                    cursor: "pointer",
                    marginTop: "2px",
                  }}
                >
                  <Sparkles size={16} />
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
            background: "var(--color-surface-subtle)",
            border: "1px solid var(--color-border-subtle)",
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
            background: "var(--color-surface-subtle)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <KeteranganPresetBar
            value={keteranganS1}
            onChange={setKeteranganS1}
            shift={1}
            shiftLabel={TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS.LABEL_SHIFT1_NOTE}
          />
          <textarea
            id="input-shift1-keterangan"
            rows={2}
            value={keteranganS1}
            onChange={(e) => setKeteranganS1(e.target.value)}
            onBlur={() => setKeteranganS1(normalizeKeterangan(keteranganS1))}
            onFocus={handleInputFocus}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.NOTES_DETAIL_PLACEHOLDER}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "12px",
              border: "1px solid var(--color-border-subtle)",
              background: "var(--color-surface-subtle)",
              color: "var(--color-text-primary)",
              fontSize: "16px",
              boxSizing: "border-box",
              resize: "none",
              fontFamily: "inherit",
            }}
            aria-label={TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS.LABEL_SHIFT1_NOTE}
          />
        </div>
      )}
    </div>
  );
};
