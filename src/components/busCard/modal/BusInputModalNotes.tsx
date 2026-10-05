import React, { useState } from "react";
import { TEXT_ALERTS } from "@/constants/texts";
import type { BusInputFormReturn } from "./useBusInputForm";

export const KETERANGAN_OPTIONS = [
  { value: "", label: "SGO (Siap Guna Operasi)" },
  { value: "AP", label: "AP (Ada Perbaikan)" },
  { value: "TO", label: "TO (Tunggu Onderdil)" },
  { value: "BA", label: "BA (Berita Acara)" },
  { value: "OFF", label: "OFF (Tidak Beroperasi)" },
];

interface BusInputModalNotesProps {
  form: BusInputFormReturn;
}

export const BusInputModalNotes: React.FC<BusInputModalNotesProps> = ({ form }) => {
  const { keteranganInputRef, keterangan, setKeterangan, handleInputFocus } = form;

  const [selectedKetCategory, setSelectedKetCategory] = useState(() => {
    const raw = (keterangan || "").trim().toUpperCase();
    for (const opt of KETERANGAN_OPTIONS) {
      if (opt.value && raw.startsWith(opt.value)) return opt.value;
    }
    return "";
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div>
        <label
          style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "6px" }}
        >
          {TEXT_ALERTS.BUS_INPUT_MODAL.FLEET_QUICK_STATUS}
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {KETERANGAN_OPTIONS.map((opt) => {
            const isSelected = selectedKetCategory === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setSelectedKetCategory(opt.value);
                  if (opt.value === "") {
                    setKeterangan("");
                  } else if (!keterangan.toUpperCase().startsWith(opt.value)) {
                    setKeterangan(opt.value + " ");
                  }
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  border: "1px solid",
                  borderColor: isSelected ? "#38bdf8" : "rgba(255, 255, 255, 0.1)",
                  background: isSelected ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.04)",
                  color: isSelected ? "#38bdf8" : "var(--text-secondary, #94a3b8)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {opt.value || "SGO"}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor="input-keterangan"
          style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
        >
          {TEXT_ALERTS.BUS_INPUT_MODAL.NOTES_DETAIL_LABEL}
        </label>
        <textarea
          ref={keteranganInputRef}
          id="input-keterangan"
          rows={3}
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
    </div>
  );
};
