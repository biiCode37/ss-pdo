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
      className="ui-option-btn"
      aria-pressed={isActive}
      onClick={onToggle}
      title={title}
      style={style}
    >
      {label}
    </button>
  );
};
