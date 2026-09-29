import React from "react";
import { Copy } from "lucide-react";
import { TEXT_ALERTS } from "@/constants/texts";
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
    showKeterangan,
    setShowKeterangan,
  } = form;

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
              background: form.isKmAwal2Locked
                ? "var(--card-border, rgba(0, 0, 0, 0.04))"
                : singleFocusPrimaryInputStyle.background,
            }}
          />

          {form.smartRolloverSuggestion && (
            <SingleFocusKmRolloverBanner
              suggestion={form.smartRolloverSuggestion}
              onApply={form.handleApplyRollover}
            />
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
              style={singleFocusSubInputStyle(form.isKmAkhir2Locked)}
            />
          </div>
        )}

        {kmDistanceS2 !== null && (
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
              background: form.isKmAkhir2Locked
                ? "var(--card-border, rgba(0, 0, 0, 0.04))"
                : singleFocusPrimaryInputStyle.background,
            }}
          />
        </div>

        {kmDistanceS2 !== null && (
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
