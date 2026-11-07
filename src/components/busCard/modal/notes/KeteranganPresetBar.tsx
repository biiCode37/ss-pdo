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

  // refact_222: satu komponen tombol opsi (.ui-option-btn). Preset bermakna status
  // memakai data-tone agar warna aktifnya tetap memberi petunjuk (OFF kuning, TO merah, OKB/Renop hijau).
  const presets: Array<{ key: string; label: string; active: boolean; tone?: string; onClick: () => void; show: boolean }> = [
    { key: "ba", label: texts.BTN_BA, active: isBaActive, onClick: handleToggleBa, show: true },
    { key: "off", label: texts.BTN_OFF, active: isOffActive, tone: "warning", onClick: handleToggleOff, show: true },
    { key: "to", label: texts.BTN_TO_EVDAL, active: isToEvdalActive, tone: "error", onClick: handleToggleToEvdal, show: true },
    { key: "okb", label: texts.BTN_OKB, active: isOkbActive, tone: "success", onClick: handleToggleOkb, show: isShift2 },
    { key: "renop", label: texts.BTN_RENOP, active: isRenopActive, tone: "success", onClick: handleToggleRenop, show: isShift2 },
  ];

  return (
    <div className="ket-presets">
      {shiftLabel && <span className="ket-presets-label">{shiftLabel}</span>}

      <div className="ket-presets-row">
        {presets.filter((p) => p.show).map((p) => (
          <button
            key={p.key}
            type="button"
            className="ui-option-btn"
            data-tone={p.tone}
            aria-pressed={p.active}
            onClick={p.onClick}
          >
            {p.label}
          </button>
        ))}

        <button
          type="button"
          data-testid="reset-keterangan-btn"
          className="ui-option-btn ket-presets-reset"
          onClick={handleReset}
          disabled={!hasValue}
          title={texts.RESET_TOOLTIP}
          aria-label={texts.RESET_TOOLTIP}
        >
          <RotateCcw size={16} aria-hidden="true" />
          <span>{texts.BTN_RESET}</span>
        </button>
      </div>

      {/* Kode BA (hanya saat BA aktif) */}
      {isBaActive && (
        <div className="ket-presets-row">
          {(texts.BA_CODES || ["01", "02", "03", "04"]).map((code) => (
            <button
              key={code}
              type="button"
              data-ba-code={code}
              className="ui-option-btn"
              aria-pressed={currentBaCode === code}
              title={texts.BA_TYPES[code as keyof typeof texts.BA_TYPES] || `BA.${code}`}
              onClick={() => handleSelectBaCode(code as "01" | "02" | "03" | "04")}
            >
              {code}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
