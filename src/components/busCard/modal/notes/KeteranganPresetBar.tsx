import React from "react";
import { TEXT_ALERTS } from "@/constants/texts";
import { parseKeterangan } from "@/utils/keteranganUtils";

// ponytail: Komponen preset keterangan terisolasi dan modular, reusable untuk S1, S2, dan Full Form

export interface KeteranganPresetBarProps {
  value: string;
  onChange: (newValue: string) => void;
  shiftLabel?: string;
}

export const KeteranganPresetBar: React.FC<KeteranganPresetBarProps> = ({
  value,
  onChange,
  shiftLabel,
}) => {
  const parsed = parseKeterangan(value);
  const trimmed = (value || "").trim();

  const isBaActive = Boolean(
    (parsed.prefix && parsed.prefix.startsWith("BA.")) ||
    /^BA(?:\.|$|\s)/i.test(trimmed)
  );
  const currentBaCode = parsed.prefix
    ? parsed.prefix.replace("BA.", "")
    : (trimmed.match(/^BA\.?0?([1-4])/i)?.[1]?.padStart(2, "0") || "");

  const isOffActive = trimmed.toUpperCase() === "OFF";
  const isToEvdalActive = trimmed.toUpperCase() === "TO EVDAL";
  const isNormalActive = !trimmed;

  const handleToggleBa = () => {
    if (isBaActive) {
      // Toggle off BA: hilangkan prefix BA jika ada detail, atau kosongkan
      const cleanDetail = parsed.detail.trim();
      onChange(cleanDetail);
    } else {
      // Aktifkan BA dengan default 01
      const detail = trimmed ? ` ${trimmed}` : "";
      onChange(detail ? `BA.01${detail}` : "BA.01 ");
    }
  };

  const handleBaCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    if (!newCode) return;
    const detail = parsed.detail.trim();
    onChange(detail ? `BA.${newCode} ${detail}` : `BA.${newCode} `);
  };

  const handleSelectOff = () => {
    if (isOffActive) {
      onChange("");
    } else {
      onChange("OFF");
    }
  };

  const handleSelectToEvdal = () => {
    if (isToEvdalActive) {
      onChange("");
    } else {
      onChange("TO EVDAL");
    }
  };

  const handleClear = () => {
    onChange("");
  };

  const handleSelectNp = (np: "NP1" | "NP2") => {
    onChange(`BA.02 ${np}`);
  };

  const texts = TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "8px" }}>
      {shiftLabel && (
        <span
          style={{
            fontSize: "0.76rem",
            fontWeight: 700,
            color: "var(--text-secondary, #94a3b8)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {shiftLabel}
        </span>
      )}

      {/* Baris 1: Preset Buttons Utama */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
        {/* Tombol Preset BA */}
        <button
          type="button"
          onClick={handleToggleBa}
          style={{
            padding: "5px 12px",
            borderRadius: "8px",
            fontSize: "0.78rem",
            fontWeight: 700,
            cursor: "pointer",
            border: isBaActive
              ? "1px solid var(--accent-color, #38bdf8)"
              : "1px solid var(--border-color, rgba(255, 255, 255, 0.15))",
            background: isBaActive
              ? "rgba(56, 189, 248, 0.2)"
              : "rgba(255, 255, 255, 0.05)",
            color: isBaActive
              ? "var(--accent-color, #38bdf8)"
              : "var(--text-primary, #f8fafc)",
            transition: "all 0.15s ease",
          }}
        >
          {texts.BTN_BA}
        </button>

        {/* Tombol Preset OFF */}
        <button
          type="button"
          onClick={handleSelectOff}
          style={{
            padding: "5px 12px",
            borderRadius: "8px",
            fontSize: "0.78rem",
            fontWeight: 700,
            cursor: "pointer",
            border: isOffActive
              ? "1px solid #ef4444"
              : "1px solid var(--border-color, rgba(255, 255, 255, 0.15))",
            background: isOffActive
              ? "rgba(239, 68, 68, 0.2)"
              : "rgba(255, 255, 255, 0.05)",
            color: isOffActive ? "#ef4444" : "var(--text-primary, #f8fafc)",
            transition: "all 0.15s ease",
          }}
        >
          {texts.BTN_OFF}
        </button>

        {/* Tombol Preset TO EVDAL */}
        <button
          type="button"
          onClick={handleSelectToEvdal}
          style={{
            padding: "5px 12px",
            borderRadius: "8px",
            fontSize: "0.78rem",
            fontWeight: 700,
            cursor: "pointer",
            border: isToEvdalActive
              ? "1px solid #f59e0b"
              : "1px solid var(--border-color, rgba(255, 255, 255, 0.15))",
            background: isToEvdalActive
              ? "rgba(245, 158, 11, 0.2)"
              : "rgba(255, 255, 255, 0.05)",
            color: isToEvdalActive ? "#f59e0b" : "var(--text-primary, #f8fafc)",
            transition: "all 0.15s ease",
          }}
        >
          {texts.BTN_TO_EVDAL}
        </button>

        {/* Tombol Reset/Normal SGO */}
        <button
          type="button"
          onClick={handleClear}
          style={{
            padding: "5px 10px",
            borderRadius: "8px",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
            border: isNormalActive
              ? "1px solid #10b981"
              : "1px dashed var(--border-color, rgba(255, 255, 255, 0.2))",
            background: isNormalActive
              ? "rgba(16, 185, 129, 0.15)"
              : "transparent",
            color: isNormalActive
              ? "#10b981"
              : "var(--text-secondary, #94a3b8)",
            transition: "all 0.15s ease",
            marginLeft: "auto",
          }}
        >
          {texts.BTN_CLEAR}
        </button>
      </div>

      {/* Baris 2: Dropdown Pilih Jenis BA (Hanya muncul jika BA aktif) */}
      {isBaActive && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
          <select
            id="select-ba-type"
            value={currentBaCode}
            onChange={handleBaCodeChange}
            style={{
              flex: "1 1 200px",
              padding: "6px 10px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 600,
              border: "1px solid var(--border-color, rgba(255, 255, 255, 0.2))",
              background: "var(--input-bg, rgba(0, 0, 0, 0.3))",
              color: "var(--text-primary, #f8fafc)",
              outline: "none",
            }}
          >
            <option value="" disabled>
              {texts.SELECT_BA_DEFAULT}
            </option>
            <option value="01">{texts.BA_TYPES["01"]}</option>
            <option value="02">{texts.BA_TYPES["02"]}</option>
            <option value="03">{texts.BA_TYPES["03"]}</option>
            <option value="04">{texts.BA_TYPES["04"]}</option>
          </select>

          {/* Sub-chips cepat NP1 & NP2 jika jenis BA adalah 02 */}
          {currentBaCode === "02" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                onClick={() => handleSelectNp("NP1")}
                style={{
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: parsed.detail.trim() === "NP1"
                    ? "1px solid #10b981"
                    : "1px solid var(--border-color, rgba(255, 255, 255, 0.15))",
                  background: parsed.detail.trim() === "NP1"
                    ? "rgba(16, 185, 129, 0.2)"
                    : "rgba(255, 255, 255, 0.05)",
                  color: parsed.detail.trim() === "NP1"
                    ? "#10b981"
                    : "var(--text-primary, #f8fafc)",
                }}
              >
                {texts.BTN_NP1}
              </button>
              <button
                type="button"
                onClick={() => handleSelectNp("NP2")}
                style={{
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: parsed.detail.trim() === "NP2"
                    ? "1px solid #10b981"
                    : "1px solid var(--border-color, rgba(255, 255, 255, 0.15))",
                  background: parsed.detail.trim() === "NP2"
                    ? "rgba(16, 185, 129, 0.2)"
                    : "rgba(255, 255, 255, 0.05)",
                  color: parsed.detail.trim() === "NP2"
                    ? "#10b981"
                    : "var(--text-primary, #f8fafc)",
                }}
              >
                {texts.BTN_NP2}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
