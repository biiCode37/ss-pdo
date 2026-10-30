import React from "react";
import { RotateCcw } from "lucide-react";
import { TEXT_ALERTS } from "@/constants/texts";
import {
  extractKeteranganTokens,
  formatKeteranganTokens,
} from "@/utils/keteranganUtils";

// ponytail: Komponen preset keterangan terisolasi, modular, dan mendukung multi-select non-destruktif

export interface KeteranganPresetBarProps {
  value: string;
  onChange: (newValue: string) => void;
  shiftLabel?: string;
  shift?: 1 | 2;
}

export const KeteranganPresetBar: React.FC<KeteranganPresetBarProps> = ({
  value,
  onChange,
  shiftLabel,
  shift,
}) => {
  const isShift2 = shift === 2 || Boolean(shiftLabel && shiftLabel.includes("2"));
  const tokens = extractKeteranganTokens(value);

  const isBaActive = Boolean(tokens.baCode);
  const currentBaCode = tokens.baCode || "";
  const isOffActive = tokens.isOff;
  const isToEvdalActive = tokens.isToEvdal;
  const isOkbActive = tokens.isOkb;
  const isRenopActive = tokens.isRenop;

  const handleToggleBa = () => {
    const next = extractKeteranganTokens(value);
    if (next.baCode) {
      next.baCode = null;
      onChange(formatKeteranganTokens(next));
    } else {
      next.baCode = "01";
      const formatted = formatKeteranganTokens(next);
      onChange(next.detail ? formatted : `${formatted} `);
    }
  };

  const handleSelectBaCode = (newCode: "01" | "02" | "03" | "04") => {
    const next = extractKeteranganTokens(value);
    next.baCode = newCode;
    const formatted = formatKeteranganTokens(next);
    onChange(next.detail ? formatted : `${formatted} `);
  };

  const handleToggleOff = () => {
    const next = extractKeteranganTokens(value);
    next.isOff = !next.isOff;
    onChange(formatKeteranganTokens(next));
  };

  const handleToggleToEvdal = () => {
    const next = extractKeteranganTokens(value);
    next.isToEvdal = !next.isToEvdal;
    onChange(formatKeteranganTokens(next));
  };

  const handleToggleOkb = () => {
    const next = extractKeteranganTokens(value);
    next.isOkb = !next.isOkb;
    onChange(formatKeteranganTokens(next));
  };

  const handleToggleRenop = () => {
    const next = extractKeteranganTokens(value);
    next.isRenop = !next.isRenop;
    onChange(formatKeteranganTokens(next));
  };

  const handleReset = () => {
    onChange("");
  };

  const texts = TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS;
  const hasValue = Boolean(value && value.trim());

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

      {/* Baris 1: Preset Buttons Utama [BA] [OFF] [TO EVDAL] [OKB] [Renop] dan Tombol [Reset] */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
        {/* Tombol Preset BA (Multi-select) */}
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

        {/* Tombol Preset OFF (Kuning, Multi-select) */}
        <button
          type="button"
          onClick={handleToggleOff}
          style={{
            padding: "5px 12px",
            borderRadius: "8px",
            fontSize: "0.78rem",
            fontWeight: 700,
            cursor: "pointer",
            border: isOffActive
              ? "1px solid #eab308"
              : "1px solid var(--border-color, rgba(255, 255, 255, 0.15))",
            background: isOffActive
              ? "rgba(234, 179, 8, 0.2)"
              : "rgba(255, 255, 255, 0.05)",
            color: isOffActive ? "#eab308" : "var(--text-primary, #f8fafc)",
            transition: "all 0.15s ease",
          }}
        >
          {texts.BTN_OFF}
        </button>

        {/* Tombol Preset TO EVDAL (Merah, Multi-select) */}
        <button
          type="button"
          onClick={handleToggleToEvdal}
          style={{
            padding: "5px 12px",
            borderRadius: "8px",
            fontSize: "0.78rem",
            fontWeight: 700,
            cursor: "pointer",
            border: isToEvdalActive
              ? "1px solid #ef4444"
              : "1px solid var(--border-color, rgba(255, 255, 255, 0.15))",
            background: isToEvdalActive
              ? "rgba(239, 68, 68, 0.2)"
              : "rgba(255, 255, 255, 0.05)",
            color: isToEvdalActive ? "#ef4444" : "var(--text-primary, #f8fafc)",
            transition: "all 0.15s ease",
          }}
        >
          {texts.BTN_TO_EVDAL}
        </button>

        {/* Khusus Shift 2: Tombol Preset OKB (HIJAU saat aktif, Multi-select) */}
        {isShift2 && (
          <button
            type="button"
            onClick={handleToggleOkb}
            style={{
              padding: "5px 12px",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              border: isOkbActive
                ? "1px solid #10b981"
                : "1px solid var(--border-color, rgba(255, 255, 255, 0.15))",
              background: isOkbActive
                ? "rgba(16, 185, 129, 0.2)"
                : "rgba(255, 255, 255, 0.05)",
              color: isOkbActive ? "#10b981" : "var(--text-primary, #f8fafc)",
              transition: "all 0.15s ease",
            }}
          >
            {texts.BTN_OKB}
          </button>
        )}

        {/* Khusus Shift 2: Tombol Preset Renop (Emerald / Hijau, Multi-select) */}
        {isShift2 && (
          <button
            type="button"
            onClick={handleToggleRenop}
            style={{
              padding: "5px 12px",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              border: isRenopActive
                ? "1px solid #10b981"
                : "1px solid var(--border-color, rgba(255, 255, 255, 0.15))",
              background: isRenopActive
                ? "rgba(16, 185, 129, 0.2)"
                : "rgba(255, 255, 255, 0.05)",
              color: isRenopActive ? "#10b981" : "var(--text-primary, #f8fafc)",
              transition: "all 0.15s ease",
            }}
          >
            {texts.BTN_RENOP}
          </button>
        )}

        {/* Tombol Reset (Membersihkan semua teks & preset) */}
        <button
          type="button"
          data-testid="reset-keterangan-btn"
          onClick={handleReset}
          disabled={!hasValue}
          style={{
            marginLeft: "auto",
            padding: "5px 11px",
            borderRadius: "8px",
            fontSize: "0.76rem",
            fontWeight: 600,
            cursor: hasValue ? "pointer" : "default",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
            background: hasValue
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(255, 255, 255, 0.03)",
            color: hasValue
              ? "var(--text-secondary, #94a3b8)"
              : "rgba(255, 255, 255, 0.2)",
            opacity: hasValue ? 1 : 0.4,
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
          title={texts.RESET_TOOLTIP}
          aria-label={texts.RESET_TOOLTIP}
        >
          <RotateCcw size={12} />
          <span>{texts.BTN_RESET}</span>
        </button>
      </div>

      {/* Baris 2: Pill Ringkas Jenis BA [01, 02, 03, 04] (Hanya muncul jika BA aktif) */}
      {isBaActive && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
            padding: "6px 8px",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          }}
        >
          {(texts.BA_CODES || ["01", "02", "03", "04"]).map((code) => {
            const isCodeActive = currentBaCode === code;
            const title =
              texts.BA_TYPES[code as keyof typeof texts.BA_TYPES] || `BA.${code}`;
            return (
              <button
                key={code}
                type="button"
                data-ba-code={code}
                title={title}
                onClick={() => handleSelectBaCode(code as "01" | "02" | "03" | "04")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: isCodeActive ? 800 : 600,
                  cursor: "pointer",
                  border: isCodeActive
                    ? "1px solid var(--accent-color, #38bdf8)"
                    : "1px solid var(--border-color, rgba(255, 255, 255, 0.15))",
                  background: isCodeActive
                    ? "rgba(56, 189, 248, 0.25)"
                    : "rgba(255, 255, 255, 0.05)",
                  color: isCodeActive
                    ? "var(--accent-color, #38bdf8)"
                    : "var(--text-secondary, #94a3b8)",
                  transition: "all 0.15s ease",
                }}
              >
                {code}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
