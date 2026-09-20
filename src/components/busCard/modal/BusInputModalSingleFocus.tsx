import React from "react";
import { Copy, Info, Sparkles } from "lucide-react";
import { MAX_TOA_VALUE } from "@/utils/modals/busInput/busModalTypes";
import { TEXT_ALERTS } from "@/constants/texts";
import type { BusInputFormReturn } from "./useBusInputForm";

interface BusInputModalSingleFocusProps {
  form: BusInputFormReturn;
  activeCategory: string;
  busKmAwal1?: string;
}

export const BusInputModalSingleFocus: React.FC<BusInputModalSingleFocusProps> = ({
  form,
  activeCategory,
  busKmAwal1,
}) => {
  const currentCategory = form.effectiveCategory || activeCategory;

  const {
    singlePrimaryInputRef,
    handleInputFocus,
    handleInputKeyDown,
    toaShift1,
    setToaShift1,
    showManual1,
    setShowManual1,
    manualShift1,
    setManualShift1,
    totalToa,
    setTotalToa,
    showManual2,
    setShowManual2,
    manualShift2,
    setManualShift2,
    kmAwal1,
    setKmAwal1,
    kmAkhir1,
    setKmAkhir1,
    showKmAkhir1InSingle,
    setShowKmAkhir1InSingle,
    kmDistanceS1,
    kmAwal2,
    setKmAwal2,
    kmAkhir2,
    setKmAkhir2,
    showKmAkhir2InSingle,
    setShowKmAkhir2InSingle,
    kmDistanceS2,
    keterangan,
    setKeterangan,
    showKeterangan,
    setShowKeterangan,
  } = form;

  const primaryInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1.5px solid var(--color-primary, #38bdf8)",
    background: "rgba(0, 0, 0, 0.35)",
    color: "var(--text-main, #f8fafc)",
    fontSize: "1.15rem",
    fontWeight: 700,
    boxSizing: "border-box",
  };

  const getChipStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "5px 10px",
    borderRadius: "8px",
    fontSize: "0.75rem",
    fontWeight: 600,
    border: "1px solid",
    borderColor: isActive ? "#38bdf8" : "rgba(255, 255, 255, 0.12)",
    background: isActive ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.04)",
    color: isActive ? "#38bdf8" : "var(--text-secondary, #94a3b8)",
    cursor: "pointer",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Banner Panduan Ramah Redirection / Locking */}
      {form.guideMessage && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            background: "rgba(56, 189, 248, 0.12)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            color: "var(--color-primary, #38bdf8)",
            fontSize: "0.82rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Info size={16} style={{ flexShrink: 0 }} />
          <span>{form.guideMessage}</span>
        </div>
      )}

      {/* TOA SHIFT 1 */}
      {currentCategory === "toaShift1" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label
              htmlFor="single-input-toaShift1"
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--text-main, #f8fafc)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S1}
            </label>
            <input
              ref={singlePrimaryInputRef}
              id="single-input-toaShift1"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              max={MAX_TOA_VALUE}
              value={toaShift1}
              onChange={(e) => setToaShift1(e.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.TOA_S1}
              style={primaryInputStyle}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setShowManual1((prev) => !prev)}
              style={getChipStyle(showManual1)}
            >
              {showManual1 ? "✓ Manual S1" : "+ Manual S1"}
            </button>
            <button
              type="button"
              onClick={() => setShowKeterangan((prev) => !prev)}
              style={getChipStyle(showKeterangan)}
            >
              {showKeterangan ? "✓ Catatan" : "+ Catatan"}
            </button>
          </div>

          {showManual1 && (
            <div>
              <label
                htmlFor="single-input-manualShift1"
                style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
              >
                {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S1}
              </label>
              <input
                id="single-input-manualShift1"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                max={MAX_TOA_VALUE}
                value={manualShift1}
                onChange={(e) => setManualShift1(e.target.value)}
                onFocus={handleInputFocus}
                onKeyDown={handleInputKeyDown}
                placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_MANUAL_S1}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
                  background: "rgba(0, 0, 0, 0.25)",
                  color: "var(--text-main, #f8fafc)",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* TOTAL TOA */}
      {currentCategory === "totalToa" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label
              htmlFor="single-input-totalToa"
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--text-main, #f8fafc)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOTAL_TOA}
            </label>
            <input
              ref={singlePrimaryInputRef}
              id="single-input-totalToa"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              max={MAX_TOA_VALUE}
              value={totalToa}
              onChange={(e) => setTotalToa(e.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.TOTAL_TOA}
              style={primaryInputStyle}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setShowManual2((prev) => !prev)}
              style={getChipStyle(showManual2)}
            >
              {showManual2 ? "✓ Manual S2" : "+ Manual S2"}
            </button>
            <button
              type="button"
              onClick={() => setShowKeterangan((prev) => !prev)}
              style={getChipStyle(showKeterangan)}
            >
              {showKeterangan ? "✓ Catatan" : "+ Catatan"}
            </button>
          </div>

          {showManual2 && (
            <div>
              <label
                htmlFor="single-input-manualShift2"
                style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
              >
                {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S2}
              </label>
              <input
                id="single-input-manualShift2"
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
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
                  background: "rgba(0, 0, 0, 0.25)",
                  color: "var(--text-main, #f8fafc)",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* KM AWAL 1 */}
      {currentCategory === "kmAwal1" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label
                htmlFor="single-input-kmAwal1"
                style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main, #f8fafc)" }}
              >
                {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AWAL_S1}
              </label>
              {busKmAwal1 && (
                <span style={{ fontSize: "0.75rem", color: "#38bdf8", background: "rgba(56, 189, 248, 0.12)", padding: "2px 8px", borderRadius: "6px" }}>
                  {TEXT_ALERTS.BUS_INPUT_MODAL.REF_KM_AWAL_DYNAMIC(
                    busKmAwal1,
                    form.previousDayDateLabel || "Kemarin",
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
              style={primaryInputStyle}
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
              style={{
                ...getChipStyle(showKmAkhir1InSingle),
                opacity: form.isKmAkhir1Locked ? 0.45 : 1,
                cursor: form.isKmAkhir1Locked ? "not-allowed" : "pointer",
              }}
            >
              {showKmAkhir1InSingle ? "✓ KM Akhir 1" : "+ KM Akhir 1"}
            </button>
            <button
              type="button"
              onClick={() => setShowKeterangan((prev) => !prev)}
              style={getChipStyle(showKeterangan)}
            >
              {showKeterangan ? "✓ Catatan" : "+ Catatan"}
            </button>
          </div>

          {showKmAkhir1InSingle && (
            <div>
              <label
                htmlFor="single-input-kmAkhir1-sub"
                style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
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
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
                  background: form.isKmAkhir1Locked
                    ? "rgba(255, 255, 255, 0.03)"
                    : "rgba(0, 0, 0, 0.25)",
                  color: "var(--text-main, #f8fafc)",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                  opacity: form.isKmAkhir1Locked ? 0.45 : 1,
                  cursor: form.isKmAkhir1Locked ? "not-allowed" : "text",
                }}
              />
            </div>
          )}

          {kmDistanceS1 !== null && (
            <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", fontSize: "0.82rem", display: "flex", justifyContent: "space-between", color: "var(--text-main, #f8fafc)" }}>
              <span>{TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S1}</span>
              <span style={{ fontWeight: 700, color: "#38bdf8" }}>{kmDistanceS1} KM</span>
            </div>
          )}
        </div>
      )}

      {/* KM AKHIR 1 */}
      {currentCategory === "kmAkhir1" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label
                htmlFor="single-input-kmAkhir1"
                style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main, #f8fafc)" }}
              >
                {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AKHIR_S1}
              </label>
              {kmAwal1 && (
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary, #94a3b8)", background: "rgba(255, 255, 255, 0.06)", padding: "2px 8px", borderRadius: "6px" }}>
                  Acuan KM Awal 1: {kmAwal1}
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
                ...primaryInputStyle,
                opacity: form.isKmAkhir1Locked ? 0.45 : 1,
                cursor: form.isKmAkhir1Locked ? "not-allowed" : "text",
                background: form.isKmAkhir1Locked
                  ? "rgba(255, 255, 255, 0.03)"
                  : primaryInputStyle.background,
              }}
            />
          </div>

          {kmDistanceS1 !== null && (
            <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", fontSize: "0.82rem", display: "flex", justifyContent: "space-between", color: "var(--text-main, #f8fafc)" }}>
              <span>{TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S1}</span>
              <span style={{ fontWeight: 700, color: "#38bdf8" }}>{kmDistanceS1} KM</span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setShowKeterangan((prev) => !prev)}
              style={getChipStyle(showKeterangan)}
            >
              {showKeterangan ? "✓ Catatan" : "+ Catatan"}
            </button>
          </div>
        </div>
      )}

      {/* KM AWAL 2 */}
      {currentCategory === "kmAwal2" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label
                htmlFor="single-input-kmAwal2"
                style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main, #f8fafc)" }}
              >
                {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AWAL_S2}
              </label>
              {form.isKmAkhir1Valid && kmAkhir1 && (
                <button
                  type="button"
                  onClick={form.handleCopyKmAkhir1ToAwal2}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    background: "rgba(56, 189, 248, 0.12)",
                    color: "#38bdf8",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Copy size={11} />
                  <span>Salin KM Akhir S1 ({kmAkhir1})</span>
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
                ...primaryInputStyle,
                opacity: form.isKmAwal2Locked ? 0.45 : 1,
                cursor: form.isKmAwal2Locked ? "not-allowed" : "text",
                background: form.isKmAwal2Locked
                  ? "rgba(255, 255, 255, 0.03)"
                  : primaryInputStyle.background,
              }}
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
              style={{
                ...getChipStyle(showKmAkhir2InSingle),
                opacity: form.isKmAkhir2Locked ? 0.45 : 1,
                cursor: form.isKmAkhir2Locked ? "not-allowed" : "pointer",
              }}
            >
              {showKmAkhir2InSingle ? "✓ KM Akhir 2" : "+ KM Akhir 2"}
            </button>
            <button
              type="button"
              onClick={() => setShowKeterangan((prev) => !prev)}
              style={getChipStyle(showKeterangan)}
            >
              {showKeterangan ? "✓ Catatan" : "+ Catatan"}
            </button>
          </div>

          {showKmAkhir2InSingle && (
            <div>
              <label
                htmlFor="single-input-kmAkhir2-sub"
                style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
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
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
                  background: form.isKmAkhir2Locked
                    ? "rgba(255, 255, 255, 0.03)"
                    : "rgba(0, 0, 0, 0.25)",
                  color: "var(--text-main, #f8fafc)",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                  opacity: form.isKmAkhir2Locked ? 0.45 : 1,
                  cursor: form.isKmAkhir2Locked ? "not-allowed" : "text",
                }}
              />
            </div>
          )}

          {kmDistanceS2 !== null && (
            <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", fontSize: "0.82rem", display: "flex", justifyContent: "space-between", color: "var(--text-main, #f8fafc)" }}>
              <span>{TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S2}</span>
              <span style={{ fontWeight: 700, color: "#38bdf8" }}>{kmDistanceS2} KM</span>
            </div>
          )}
        </div>
      )}

      {/* KM AKHIR 2 */}
      {currentCategory === "kmAkhir2" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label
                htmlFor="single-input-kmAkhir2"
                style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main, #f8fafc)" }}
              >
                {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AKHIR_S2}
              </label>
              {kmAwal2 && (
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary, #94a3b8)", background: "rgba(255, 255, 255, 0.06)", padding: "2px 8px", borderRadius: "6px" }}>
                  Acuan KM Awal 2: {kmAwal2}
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
                ...primaryInputStyle,
                opacity: form.isKmAkhir2Locked ? 0.45 : 1,
                cursor: form.isKmAkhir2Locked ? "not-allowed" : "text",
                background: form.isKmAkhir2Locked
                  ? "rgba(255, 255, 255, 0.03)"
                  : primaryInputStyle.background,
              }}
            />
          </div>

          {kmDistanceS2 !== null && (
            <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", fontSize: "0.82rem", display: "flex", justifyContent: "space-between", color: "var(--text-main, #f8fafc)" }}>
              <span>{TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S2}</span>
              <span style={{ fontWeight: 700, color: "#38bdf8" }}>{kmDistanceS2} KM</span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setShowKeterangan((prev) => !prev)}
              style={getChipStyle(showKeterangan)}
            >
              {showKeterangan ? "✓ Catatan" : "+ Catatan"}
            </button>
          </div>
        </div>
      )}

      {/* Catatan di Single Mode */}
      {showKeterangan && (
        <div style={{ paddingTop: "6px", borderTop: "1px dashed rgba(255, 255, 255, 0.1)" }}>
          <label
            htmlFor="single-input-keterangan"
            style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
          >
            {TEXT_ALERTS.BUS_INPUT_MODAL.NOTES_DETAIL_LABEL}
          </label>
          <textarea
            id="single-input-keterangan"
            rows={2}
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.NOTES_DETAIL_PLACEHOLDER}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
              background: "rgba(0, 0, 0, 0.25)",
              color: "var(--text-main, #f8fafc)",
              fontSize: "0.9rem",
              boxSizing: "border-box",
              resize: "none",
            }}
          />
        </div>
      )}
    </div>
  );
};
