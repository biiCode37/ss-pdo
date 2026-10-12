import React from "react";
import { TEXT_ALERTS } from "@/constants/texts";
import type { BusInputFormReturn } from "./useBusInputForm";

interface BusInputModalNotesProps {
  form: BusInputFormReturn;
}

export const BusInputModalNotes: React.FC<BusInputModalNotesProps> = ({ form }) => {
  const { keteranganInputRef, keterangan, setKeterangan, handleInputFocus } = form;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div>
        <label
          htmlFor="input-keterangan"
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "var(--text-secondary, #94a3b8)",
            display: "block",
            marginBottom: "6px",
          }}
        >
          {TEXT_ALERTS.BUS_INPUT_MODAL.NOTES_DETAIL_LABEL}
        </label>
        <textarea
          ref={keteranganInputRef}
          id="input-keterangan"
          rows={4}
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.NOTES_DETAIL_PLACEHOLDER}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
            background: "rgba(0, 0, 0, 0.25)",
            color: "var(--text-main, #f8fafc)",
            fontSize: "0.9rem",
            lineHeight: 1.5,
            boxSizing: "border-box",
            resize: "none",
          }}
        />
      </div>
    </div>
  );
};

