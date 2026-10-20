import React, { useMemo } from "react";
import { Copy, AlertTriangle } from "lucide-react";
import { TEXT_ALERTS } from "@/constants/texts";
import { validateKmCrossDay } from "@/utils/modals/busInput/busModalValidation";
import { parseIndonesianNumber } from "@/utils/numberUtils";
import type { BusInputFormReturn } from "../useBusInputForm";
import {
  singleFocusPrimaryInputStyle,
  getSingleFocusChipStyle,
  singleFocusSubInputStyle,
  singleFocusLabelStyle,
  singleFocusHelperTextStyle,
  singleFocusDistanceBadgeStyle,
  singleFocusCopyBtnStyle,
} from "./singleFocusStyles";
import { SingleFocusKmRolloverBanner } from "./SingleFocusKmRolloverBanner";

export interface SingleFocusKmShift2Props {
  form: BusInputFormReturn;
  currentCategory: string;
}

export const SingleFocusKmShift2: React.FC<SingleFocusKmShift2Props> = ({
  form,
  currentCategory,
}) => {
  const {
    singlePrimaryInputRef,
    handleInputFocus,
    handleInputKeyDown,
    kmAkhir1,
    kmAwal2,
    setKmAwal2,
    kmAkhir2,
    setKmAkhir2,
    showKmAkhir2InSingle,
    setShowKmAkhir2InSingle,
    kmDistanceS2,
    kmLiveS2,
    showKeterangan,
    setShowKeterangan,
  } = form;

  const previousDateLabel =
    form.previousDayDateLabel || TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_PREVIOUS_DAY;

  // Cross-shift validation realtime: KM Awal S2 tidak boleh lebih kecil dari KM Akhir S1
  const crossShiftError = useMemo(() => {
    if (!form.isKmAkhir1Valid || !kmAkhir1 || !kmAwal2 || kmAwal2.trim().length <= 3) return null;
    const numAkhir1 = parseIndonesianNumber(kmAkhir1, NaN);
    const numAwal2 = parseIndonesianNumber(kmAwal2, NaN);
    if (!isNaN(numAkhir1) && !isNaN(numAwal2) && numAwal2 < numAkhir1) {
      return TEXT_ALERTS.BUS_INPUT_MODAL.KM_AWAL_S2_LESS_THAN_KM_AKHIR_S1(kmAwal2, kmAkhir1);
    }
    return null;
  }, [form.isKmAkhir1Valid, kmAkhir1, kmAwal2]);

  // Cross-day validation realtime untuk Shift 2 jika Shift 1 kosong murni (Skenario B)
  const crossDayErrorS2 = useMemo(() => {
    if (!form.previousDayKmAkhir2 || form.bypassOdometerReset) return null;
    const hasShift1 =
      (form.bus.kmAwal1 && form.bus.kmAwal1.trim() !== "") ||
      (form.kmAwal1 && form.kmAwal1.trim().length > 3);
    if (hasShift1) return null;

    return validateKmCrossDay(
      kmAwal2,
      form.previousDayKmAkhir2,
      TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_2,
      previousDateLabel,
      form.bypassOdometerReset,
    );
  }, [form.bus.kmAwal1, form.kmAwal1, kmAwal2, form.previousDayKmAkhir2, previousDateLabel, form.bypassOdometerReset]);

  // KM AWAL 2
  if (currentCategory === "kmAwal2") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
            <label htmlFor="single-input-kmAwal2" style={singleFocusLabelStyle}>
              {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AWAL_S2}
            </label>
            {form.isKmAkhir1Valid && kmAkhir1 && (
              <button
                type="button"
                onClick={form.handleCopyKmAkhir1ToAwal2}
                style={singleFocusCopyBtnStyle}
              >
                <Copy size={11} style={{ display: "inline", marginRight: "4px" }} />
                <span>{TEXT_ALERTS.BUS_INPUT_MODAL.COPY_KM_AKHIR_S1_ACTION(kmAkhir1)}</span>
              </button>
            )}
          </div>
          <input
            ref={singlePrimaryInputRef}
            id="single-input-kmAwal2"
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
              ...singleFocusPrimaryInputStyle,
              opacity: form.isKmAwal2Locked ? 0.45 : 1,
              cursor: form.isKmAwal2Locked ? "not-allowed" : "text",
              border: crossShiftError
                ? "1.5px solid #ef4444"
                : singleFocusPrimaryInputStyle.border,
              background: form.isKmAwal2Locked
                ? "var(--card-border, rgba(0, 0, 0, 0.04))"
                : crossShiftError
                  ? "rgba(239, 68, 68, 0.08)"
                  : singleFocusPrimaryInputStyle.background,
            }}
          />

          {form.smartRolloverSuggestion && (
            <SingleFocusKmRolloverBanner
              suggestion={form.smartRolloverSuggestion}
              onApply={form.handleApplyRollover}
            />
          )}

          {crossShiftError && (
            <div
              style={{
                marginTop: "8px",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                fontSize: "0.78rem",
                color: "#f87171",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span>{crossShiftError}</span>
            </div>
          )}

          {crossDayErrorS2 && !form.smartRolloverSuggestion && (
            <div
              style={{
                marginTop: "8px",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                fontSize: "0.78rem",
                color: "#f87171",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <span>{crossDayErrorS2}</span>
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  color: "var(--text-secondary, #cbd5e1)",
                  fontSize: "0.75rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.bypassOdometerReset}
                  onChange={(e) =>
                    form.handleToggleBypassOdometerReset(e.target.checked)
                  }
                  style={{ accentColor: "#c084fc" }}
                />
                <span>
                  {TEXT_ALERTS.BUS_INPUT_MODAL.BYPASS_ODOMETER_RESET_LABEL}
                </span>
              </label>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={form.isKmAkhir2Locked}
            onClick={() => {
              if (!form.isKmAkhir2Locked) {
                setShowKmAkhir2InSingle((prev) => !prev);
              }
            }}
            title={
              form.isKmAkhir2Locked
                ? TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_KM_LOCKED
                : undefined
            }
            style={getSingleFocusChipStyle(showKmAkhir2InSingle, form.isKmAkhir2Locked)}
          >
            {showKmAkhir2InSingle
              ? TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_KM_AKHIR_2
              : TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_KM_AKHIR_2}
          </button>
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

        {showKmAkhir2InSingle && (
          <div>
            <label
              htmlFor="single-input-kmAkhir2-sub"
              style={{
                ...singleFocusHelperTextStyle,
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AKHIR_S2}
            </label>
            <input
              id="single-input-kmAkhir2-sub"
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
                ...singleFocusSubInputStyle(form.isKmAkhir2Locked),
                border: kmLiveS2.status === "negative"
                  ? "1px solid #ef4444"
                  : singleFocusSubInputStyle(form.isKmAkhir2Locked).border,
                background: kmLiveS2.status === "negative" ? "rgba(239, 68, 68, 0.08)" : undefined,
              }}
            />
          </div>
        )}

        {/* Realtime Distance & Error Badges untuk sub-input */}
        {kmLiveS2.status === "negative" && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "#f87171",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{kmLiveS2.formattedText}</span>
          </div>
        )}

        {kmLiveS2.status === "extreme" && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{kmLiveS2.formattedText}</span>
          </div>
        )}

        {kmLiveS2.status !== "negative" && kmLiveS2.status !== "extreme" && kmDistanceS2 !== null && (
          <div style={singleFocusDistanceBadgeStyle(true)}>
            <span>{TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S2}</span>
            <span style={{ fontWeight: 700, color: "var(--shift2-color, #7e22ce)" }}>
              {TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_VALUE_KM(kmDistanceS2)}
            </span>
          </div>
        )}
      </div>
    );
  }

  // KM AKHIR 2
  if (currentCategory === "kmAkhir2") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
            <label htmlFor="single-input-kmAkhir2" style={singleFocusLabelStyle}>
              {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AKHIR_S2}
            </label>
            {kmAwal2 && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary, #6b7280)",
                  background: "var(--input-bg, rgba(0, 0, 0, 0.04))",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  border: "1px solid var(--card-border, rgba(0, 0, 0, 0.08))",
                }}
              >
                {TEXT_ALERTS.BUS_INPUT_MODAL.REF_KM_AWAL_S2(kmAwal2)}
              </span>
            )}
          </div>
          <input
            ref={singlePrimaryInputRef}
            id="single-input-kmAkhir2"
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
              ...singleFocusPrimaryInputStyle,
              opacity: form.isKmAkhir2Locked ? 0.45 : 1,
              cursor: form.isKmAkhir2Locked ? "not-allowed" : "text",
              border: kmLiveS2.status === "negative"
                ? "1.5px solid #ef4444"
                : singleFocusPrimaryInputStyle.border,
              background: form.isKmAkhir2Locked
                ? "var(--card-border, rgba(0, 0, 0, 0.04))"
                : kmLiveS2.status === "negative"
                  ? "rgba(239, 68, 68, 0.08)"
                  : singleFocusPrimaryInputStyle.background,
            }}
          />
        </div>

        {/* Realtime Distance & Error Badges untuk primary input */}
        {kmLiveS2.status === "negative" && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "#f87171",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{kmLiveS2.formattedText}</span>
          </div>
        )}

        {kmLiveS2.status === "extreme" && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{kmLiveS2.formattedText}</span>
          </div>
        )}

        {kmLiveS2.status !== "negative" && kmLiveS2.status !== "extreme" && kmDistanceS2 !== null && (
          <div style={singleFocusDistanceBadgeStyle(true)}>
            <span>{TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S2}</span>
            <span style={{ fontWeight: 700, color: "var(--shift2-color, #7e22ce)" }}>
              {TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_VALUE_KM(kmDistanceS2)}
            </span>
          </div>
        )}

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
  }

  return null;
};
