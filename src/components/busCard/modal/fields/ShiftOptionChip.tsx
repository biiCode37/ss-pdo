import React from "react";

export interface ShiftOptionChipProps {
  id?: string;
  isActive: boolean;
  onToggle: () => void;
  label: string;
  title?: string;
  style?: React.CSSProperties;
}

/**
 * ShiftOptionChip - Komponen chip opsi aksi (Manual & Catatan) untuk modal bus.
 * Mengeliminasi duplikasi logika dan gaya getChipStyle pada Shift 1 dan Shift 2.
 * Seluruh teks/copy label diterima dari pemanggil melalui kamus domain sentral.
 */
export const ShiftOptionChip: React.FC<ShiftOptionChipProps> = ({
  id,
  isActive,
  onToggle,
  label,
  title,
  style,
}) => {
  return (
    <button
      id={id}
      type="button"
      aria-pressed={isActive}
      onClick={onToggle}
      title={title}
      style={{
        padding: "6px 12px",
        borderRadius: "9999px",
        fontSize: "0.78rem",
        fontWeight: 600,
        border: "1px solid",
        borderColor: isActive
          ? "var(--accent-color, #38bdf8)"
          : "var(--card-border, rgba(255, 255, 255, 0.1))",
        background: isActive
          ? "rgba(56, 189, 248, 0.15)"
          : "rgba(255, 255, 255, 0.04)",
        color: isActive
          ? "var(--accent-color, #38bdf8)"
          : "var(--text-secondary, #8b8b8b)",
        cursor: "pointer",
        transition: "all 0.15s cubic-bezier(0.32, 0.72, 0, 1)",
        ...style,
      }}
    >
      {label}
    </button>
  );
};
