import React from "react";
import { TEXT_ALERTS } from "@/constants/texts";
import type { BusInputFormReturn } from "../useBusInputForm";

interface SingleFocusNotesProps {
  form: BusInputFormReturn;
}

export const SingleFocusNotes: React.FC<SingleFocusNotesProps> = ({ form }) => {
  const { keterangan, setKeterangan, handleInputFocus } = form;

  return (
    <div
      style={{
        paddingTop: "6px",
        borderTop: "1px dashed var(--card-border, rgba(0, 0, 0, 0.1))",
      }}
    >
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
        rows={2}
        value={keterangan}
        onChange={(e) => setKeterangan(e.target.value)}
        onFocus={handleInputFocus}
        placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.NOTES_DETAIL_PLACEHOLDER}
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
        }}
      />
    </div>
  );
};
