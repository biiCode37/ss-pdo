import React, { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { TEXT_ALERTS } from "@/constants/texts";
import { validateKmCrossDay } from "@/utils/modals/busInput/busModalValidation";
import type { BusInputFormReturn } from "../useBusInputForm";
import {
  singleFocusPrimaryInputStyle,
  getSingleFocusChipStyle,
  singleFocusSubInputStyle,
  singleFocusLabelStyle,
  singleFocusHelperTextStyle,
  singleFocusDistanceBadgeStyle,
} from "./singleFocusStyles";
import { SingleFocusKmRolloverBanner } from "./SingleFocusKmRolloverBanner";

export interface SingleFocusKmShift1Props {
  form: BusInputFormReturn;
  currentCategory: string;
  busKmAwal1?: string;
}

export const SingleFocusKmShift1: React.FC<SingleFocusKmShift1Props> = ({
  form,
  currentCategory,
  busKmAwal1,
}) => {
  const {
    singlePrimaryInputRef,
    handleInputFocus,
    handleInputKeyDown,
    kmAwal1,
    setKmAwal1,
    kmAkhir1,
    setKmAkhir1,
    showKmAkhir1InSingle,
    setShowKmAkhir1InSingle,
    kmDistanceS1,
    kmLiveS1,
    showKeterangan,
    setShowKeterangan,
  } = form;

  const previousDateLabel =
    form.previousDayDateLabel || TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_PREVIOUS_DAY;
  const resolvedBusKmAwal1 = busKmAwal1 || form.bus.kmAwal1 || form.previousDayKmAkhir2;

  // Realtime Cross-Day Error untuk KM Awal 1
  const crossDayErrorS1 = useMemo(() => {
    if (!form.previousDayKmAkhir2 || form.bypassOdometerReset) return null;
    return validateKmCrossDay(
      kmAwal1,
      form.previousDayKmAkhir2,
      TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_1,
      previousDateLabel,
      form.bypassOdometerReset,
    );
  }, [kmAwal1, form.previousDayKmAkhir2, previousDateLabel, form.bypassOdometerReset]);

  // KM AWAL 1
  if (currentCategory === "kmAwal1") {
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
            <label htmlFor="single-input-kmAwal1" style={singleFocusLabelStyle}>
              {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AWAL_S1}
            </label>
            {resolvedBusKmAwal1 && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--shift1-action-text, #0369a1)",
                  background: "var(--shift1-bg, rgba(2, 132, 199, 0.08))",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  fontWeight: 600,
                }}
              >
                {TEXT_ALERTS.BUS_INPUT_MODAL.REF_KM_AWAL_DYNAMIC(
                  resolvedBusKmAwal1,
                  previousDateLabel,
                )}
              </span>
            )}
          </div>
          <input
            ref={singlePrimaryInputRef}
            id="single-input-kmAwal1"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={kmAwal1}
            onChange={(e) => setKmAwal1(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AWAL_1}
            style={singleFocusPrimaryInputStyle}
          />

          {form.smartRolloverSuggestion && (
            <SingleFocusKmRolloverBanner
              suggestion={form.smartRolloverSuggestion}
              onApply={form.handleApplyRollover}
            />
          )}

          {crossDayErrorS1 && !form.smartRolloverSuggestion && (
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
                <span>{crossDayErrorS1}</span>
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
                  style={{ accentColor: "#38bdf8" }}
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
            disabled={form.isKmAkhir1Locked}
            onClick={() => {
              if (!form.isKmAkhir1Locked) {
                setShowKmAkhir1InSingle((prev) => !prev);
              }
            }}
            title={
              form.isKmAkhir1Locked
                ? TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_KM_LOCKED
                : undefined
            }
            style={getSingleFocusChipStyle(showKmAkhir1InSingle, form.isKmAkhir1Locked)}
          >
            {showKmAkhir1InSingle
              ? TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_KM_AKHIR_1
              : TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_KM_AKHIR_1}
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

        {showKmAkhir1InSingle && (
          <div>
            <label
              htmlFor="single-input-kmAkhir1-sub"
              style={{
                ...singleFocusHelperTextStyle,
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AKHIR_S1}
            </label>
            <input
              id="single-input-kmAkhir1-sub"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
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
              style={{
                ...singleFocusSubInputStyle(form.isKmAkhir1Locked),
                border: kmLiveS1.status === "negative"
                  ? "1px solid #ef4444"
                  : singleFocusSubInputStyle(form.isKmAkhir1Locked).border,
                background: kmLiveS1.status === "negative" ? "rgba(239, 68, 68, 0.08)" : undefined,
              }}
            />
          </div>
        )}

        {/* Realtime Distance & Error Badges untuk sub-input */}
        {kmLiveS1.status === "negative" && (
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
            <span>{kmLiveS1.formattedText}</span>
          </div>
        )}

        {kmLiveS1.status === "extreme" && (
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
            <span>{kmLiveS1.formattedText}</span>
          </div>
        )}

        {kmLiveS1.status !== "negative" && kmLiveS1.status !== "extreme" && kmDistanceS1 !== null && (
          <div style={singleFocusDistanceBadgeStyle(false)}>
            <span>{TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S1}</span>
            <span style={{ fontWeight: 700, color: "var(--shift1-action-text, #0369a1)" }}>
              {TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_VALUE_KM(kmDistanceS1)}
            </span>
          </div>
        )}
      </div>
    );
  }

  // KM AKHIR 1
  if (currentCategory === "kmAkhir1") {
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
            <label htmlFor="single-input-kmAkhir1" style={singleFocusLabelStyle}>
              {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AKHIR_S1}
            </label>
            {kmAwal1 && (
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
                {TEXT_ALERTS.BUS_INPUT_MODAL.REF_KM_AWAL_S1(kmAwal1)}
              </span>
            )}
          </div>
          <input
            ref={singlePrimaryInputRef}
            id="single-input-kmAkhir1"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
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
            style={{
              ...singleFocusPrimaryInputStyle,
              opacity: form.isKmAkhir1Locked ? 0.45 : 1,
              cursor: form.isKmAkhir1Locked ? "not-allowed" : "text",
              border: kmLiveS1.status === "negative"
                ? "1.5px solid #ef4444"
                : singleFocusPrimaryInputStyle.border,
              background: form.isKmAkhir1Locked
                ? "var(--card-border, rgba(0, 0, 0, 0.04))"
                : kmLiveS1.status === "negative"
                  ? "rgba(239, 68, 68, 0.08)"
                  : singleFocusPrimaryInputStyle.background,
            }}
          />
        </div>

        {/* Realtime Distance & Error Badges untuk primary input */}
        {kmLiveS1.status === "negative" && (
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
            <span>{kmLiveS1.formattedText}</span>
          </div>
        )}

        {kmLiveS1.status === "extreme" && (
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
            <span>{kmLiveS1.formattedText}</span>
          </div>
        )}

        {kmLiveS1.status !== "negative" && kmLiveS1.status !== "extreme" && kmDistanceS1 !== null && (
          <div style={singleFocusDistanceBadgeStyle(false)}>
            <span>{TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S1}</span>
            <span style={{ fontWeight: 700, color: "var(--shift1-action-text, #0369a1)" }}>
              {TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_VALUE_KM(kmDistanceS1)}
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
