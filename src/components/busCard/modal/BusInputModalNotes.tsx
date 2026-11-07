import React, { useState } from "react";
import { TEXT_ALERTS } from "@/constants/texts";
import { combineShiftKeterangan, getCurrentOperationalShift, normalizeKeterangan } from "@/utils/keteranganUtils";
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

  const shiftButtons: Array<{ shift: 1 | 2; label: string; hasNote: boolean }> = [
    { shift: 1, label: texts.TAB_SHIFT_1, hasNote: keteranganS1.trim() !== "" },
    { shift: 2, label: texts.TAB_SHIFT_2, hasNote: keteranganS2.trim() !== "" },
  ];

  return (
    <div className="bus-notes">
      {/* 1. Pilih shift catatan & terapkan ke kedua shift */}
      <div className="bus-notes-toolbar">
        <div
          role="group"
          aria-label={texts.PRESETS.ARIA_SELECT_NOTE_SHIFT}
          className="ui-segmented ui-segmented--inline"
        >
          {shiftButtons.map((b) => (
            <button
              key={b.shift}
              type="button"
              className="ui-segmented-btn"
              aria-pressed={activeNoteShift === b.shift}
              onClick={() => setActiveNoteShift(b.shift)}
            >
              <span>{b.label}</span>
              {b.hasNote && <span className="ui-chip-dot" aria-hidden="true" />}
            </button>
          ))}
        </div>

        <label className="bus-notes-apply-all">
          <input
            type="checkbox"
            id="toggle-apply-all-shifts"
            checked={applyAllShifts}
            onChange={(e) => handleToggleApplyAll(e.target.checked)}
          />
          <span>{texts.PRESETS.APPLY_ALL_SHIFTS}</span>
        </label>
      </div>

      {/* 2. Preset & teks catatan shift aktif */}
      <div className="bus-notes-panel">
        <KeteranganPresetBar
          value={currentNote}
          onChange={handleNoteChange}
          shift={activeNoteShift}
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
          className="input-field bus-notes-textarea"
          value={currentNote}
          onChange={(e) => handleNoteChange(e.target.value)}
          onBlur={() => handleNoteChange(normalizeKeterangan(currentNote))}
          onFocus={handleInputFocus}
          placeholder={texts.NOTES_DETAIL_PLACEHOLDER}
          aria-label={
            activeNoteShift === 1
              ? texts.PRESETS.LABEL_SHIFT1_NOTE
              : texts.PRESETS.LABEL_SHIFT2_NOTE
          }
        />
      </div>

      {/* 3. Pratinjau format yang dikirim ke spreadsheet */}
      <div className="bus-notes-preview">
        <span className="bus-notes-preview-label">{texts.PRESETS.PREVIEW_SSOT_LABEL}</span>
        <div className={`bus-notes-preview-value${combinedPreview ? "" : " is-empty"}`}>
          {combinedPreview || texts.PRESETS.EMPTY_PREVIEW}
        </div>
      </div>
    </div>
  );
};
