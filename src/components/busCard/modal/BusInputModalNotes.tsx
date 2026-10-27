import React, { useState } from "react";
import { TEXT_ALERTS } from "@/constants/texts";
import { combineShiftKeterangan, getCurrentOperationalShift } from "@/utils/keteranganUtils";
import { KeteranganPresetBar } from "./notes/KeteranganPresetBar";
import type { BusInputFormReturn } from "./useBusInputForm";

interface BusInputModalNotesProps {
  form: BusInputFormReturn;
}

export const BusInputModalNotes: React.FC<BusInputModalNotesProps> = ({ form }) => {
  const {
    keteranganInputRef,
    keteranganS1,
    setKeteranganS1,
    keteranganS2,
    setKeteranganS2,
    handleInputFocus,
  } = form;

  // Rentang waktu penentu opsi shift default: < 14.00 -> Shift 1, >= 14.00 -> Shift 2
  const defaultNoteShift: 1 | 2 = form.activeShift ?? getCurrentOperationalShift();
  const [activeNoteShift, setActiveNoteShift] = useState<1 | 2>(defaultNoteShift);
  const [applyAllShifts, setApplyAllShifts] = useState<boolean>(false);

  const currentNote = activeNoteShift === 1 ? keteranganS1 : keteranganS2;

  const handleNoteChange = (val: string) => {
    if (activeNoteShift === 1) {
      setKeteranganS1(val);
      if (applyAllShifts) {
        setKeteranganS2(val);
      }
    } else {
      setKeteranganS2(val);
      if (applyAllShifts) {
        setKeteranganS1(val);
      }
    }
  };

  const handleToggleApplyAll = (checked: boolean) => {
    setApplyAllShifts(checked);
    if (checked) {
      if (activeNoteShift === 1) {
        setKeteranganS2(keteranganS1);
      } else {
        setKeteranganS1(keteranganS2);
      }
    }
  };

  const combinedPreview = combineShiftKeterangan(keteranganS1, keteranganS2);
  const texts = TEXT_ALERTS.BUS_INPUT_MODAL;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* 1. Segmented Switch Shift 1 vs Shift 2 & Apply All Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        {/* Segmented Switch Buttons */}
        <div
          role="group"
          aria-label={texts.PRESETS.ARIA_SELECT_NOTE_SHIFT}
          style={{
            display: "inline-flex",
            padding: "3px",
            background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
            borderRadius: "10px",
            gap: "4px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveNoteShift(1)}
            style={{
              padding: "4px 12px",
              borderRadius: "7px",
              fontSize: "0.78rem",
              fontWeight: activeNoteShift === 1 ? 700 : 500,
              cursor: "pointer",
              border:
                activeNoteShift === 1
                  ? "1px solid var(--shift1-border, rgba(56, 189, 248, 0.3))"
                  : "1px solid transparent",
              background:
                activeNoteShift === 1
                  ? "var(--card-bg, #1e293b)"
                  : "transparent",
              color:
                activeNoteShift === 1
                  ? "var(--shift1-color, #38bdf8)"
                  : "var(--text-secondary, #94a3b8)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>{texts.TAB_SHIFT_1}</span>
            {keteranganS1.trim() !== "" && (
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--shift1-color, #38bdf8)",
                  display: "inline-block",
                }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveNoteShift(2)}
            style={{
              padding: "4px 12px",
              borderRadius: "7px",
              fontSize: "0.78rem",
              fontWeight: activeNoteShift === 2 ? 700 : 500,
              cursor: "pointer",
              border:
                activeNoteShift === 2
                  ? "1px solid var(--shift2-border, rgba(168, 85, 247, 0.3))"
                  : "1px solid transparent",
              background:
                activeNoteShift === 2
                  ? "var(--card-bg, #1e293b)"
                  : "transparent",
              color:
                activeNoteShift === 2
                  ? "var(--shift2-color, #c084fc)"
                  : "var(--text-secondary, #94a3b8)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>{texts.TAB_SHIFT_2}</span>
            {keteranganS2.trim() !== "" && (
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--shift2-color, #c084fc)",
                  display: "inline-block",
                }}
              />
            )}
          </button>
        </div>

        {/* Checkbox "Terapkan ke Kedua Shift" */}
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.78rem",
            color: "var(--text-secondary, #94a3b8)",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            id="toggle-apply-all-shifts"
            checked={applyAllShifts}
            onChange={(e) => handleToggleApplyAll(e.target.checked)}
            style={{ accentColor: "var(--accent-color, #38bdf8)", cursor: "pointer" }}
          />
          <span>{texts.PRESETS.APPLY_ALL_SHIFTS}</span>
        </label>
      </div>

      {/* 2. KeteranganPresetBar untuk Shift Aktif */}
      <div
        style={{
          padding: "10px 12px",
          borderRadius: "12px",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
        }}
      >
        <KeteranganPresetBar
          value={currentNote}
          onChange={handleNoteChange}
          shiftLabel={
            activeNoteShift === 1
              ? texts.PRESETS.LABEL_SHIFT1_NOTE
              : texts.PRESETS.LABEL_SHIFT2_NOTE
          }
        />
        <textarea
          ref={keteranganInputRef}
          id="input-keterangan"
          rows={3}
          value={currentNote}
          onChange={(e) => handleNoteChange(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={texts.NOTES_DETAIL_PLACEHOLDER}
          aria-label={
            activeNoteShift === 1
              ? texts.PRESETS.LABEL_SHIFT1_NOTE
              : texts.PRESETS.LABEL_SHIFT2_NOTE
          }
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "12px",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
            background: "var(--input-bg, rgba(0, 0, 0, 0.25))",
            color: "var(--text-primary, #ededed)",
            fontSize: "0.9rem",
            lineHeight: 1.5,
            boxSizing: "border-box",
            resize: "none",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* 3. Live Preview SSOT Format Badge Box */}
      <div
        style={{
          padding: "8px 12px",
          borderRadius: "10px",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 600,
            color: "var(--text-secondary, #94a3b8)",
            letterSpacing: "0.3px",
          }}
        >
          {texts.PRESETS.PREVIEW_SSOT_LABEL}
        </span>
        <div
          style={{
            fontSize: "0.85rem",
            fontFamily: "monospace",
            fontWeight: 600,
            color: combinedPreview
              ? "var(--accent-color, #38bdf8)"
              : "var(--text-secondary, #64748b)",
            wordBreak: "break-all",
          }}
        >
          {combinedPreview || texts.PRESETS.EMPTY_PREVIEW}
        </div>
      </div>
    </div>
  );
};
