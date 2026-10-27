import React from "react";
import { TEXT_ALERTS } from "@/constants/texts";
import { getCurrentOperationalShift, normalizeKeterangan } from "@/utils/keteranganUtils";
import { KeteranganPresetBar } from "../notes/KeteranganPresetBar";
import type { BusInputFormReturn } from "../useBusInputForm";

interface SingleFocusNotesProps {
  form: BusInputFormReturn;
}

export const SingleFocusNotes: React.FC<SingleFocusNotesProps> = ({ form }) => {
  const {
    keteranganS1,
    setKeteranganS1,
    keteranganS2,
    setKeteranganS2,
    keterangan,
    setKeterangan,
    handleInputFocus,
  } = form;

  const isShift2 = Boolean(
    (form.activeCategory && form.activeCategory.toLowerCase().includes("2")) ||
    (form.effectiveCategory && form.effectiveCategory.toLowerCase().includes("2")) ||
    ((form.activeCategory === "keterangan" || form.effectiveCategory === "keterangan") &&
      (form.activeShift ?? getCurrentOperationalShift()) === 2)
  );

  const shiftLabel = isShift2
    ? TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS.LABEL_SHIFT2_NOTE
    : TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS.LABEL_SHIFT1_NOTE;

  const currentNote = isShift2
    ? (keteranganS2 ?? keterangan ?? "")
    : (keteranganS1 ?? keterangan ?? "");

  const handleNoteChange = (val: string) => {
    if (isShift2) {
      if (setKeteranganS2) {
        setKeteranganS2(val);
      } else if (setKeterangan) {
        setKeterangan(val);
      }
    } else {
      if (setKeteranganS1) {
        setKeteranganS1(val);
      } else if (setKeterangan) {
        setKeterangan(val);
      }
    }
  };

  return (
    <div
      style={{
        paddingTop: "6px",
        borderTop: "1px dashed var(--card-border, rgba(0, 0, 0, 0.1))",
      }}
    >
      <KeteranganPresetBar
        value={currentNote}
        onChange={handleNoteChange}
        shift={isShift2 ? 2 : 1}
        shiftLabel={shiftLabel}
      />
      <label
        htmlFor="single-input-keterangan"
        style={{
          fontSize: "0.8rem",
          fontWeight: 600,
          color: "var(--text-secondary, #6b7280)",
          display: "block",
          marginBottom: "4px",
        }}
      >
        {TEXT_ALERTS.BUS_INPUT_MODAL.NOTES_DETAIL_LABEL}
      </label>
      <textarea
        id="single-input-keterangan"
        rows={3}
        value={currentNote}
        onChange={(e) => handleNoteChange(e.target.value)}
        onBlur={() => handleNoteChange(normalizeKeterangan(currentNote))}
        onFocus={handleInputFocus}
        placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.NOTES_DETAIL_PLACEHOLDER}
        aria-label={shiftLabel}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "10px",
          border: "1px solid var(--card-border, rgba(0, 0, 0, 0.12))",
          background: "var(--input-bg, rgba(243, 244, 246, 0.9))",
          color: "var(--text-primary, #171717)",
          fontSize: "0.9rem",
          boxSizing: "border-box",
          resize: "none",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
};
