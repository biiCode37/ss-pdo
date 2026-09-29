import React, { forwardRef } from "react";

export interface BusFormFieldProps {
  id: string;
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  variant?: "hero" | "secondary";
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
  min?: string | number;
  max?: string | number;
  placeholder?: string;
  disabled?: boolean;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  labelStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
}

/**
 * BusFormField - Komponen input form modal bus terpadu untuk Shift 1 dan Shift 2.
 * Menghilangkan duplikasi gaya heroInputStyle dan secondaryInputStyle dengan mendukung
 * tema Light/Dark adaptif via CSS variables serta mempertahankan kontrak input & keyboard navigation.
 */
export const BusFormField = forwardRef<HTMLInputElement, BusFormFieldProps>(
  (
    {
      id,
      label,
      value,
      onChange,
      variant = "secondary",
      type = "text",
      inputMode = "numeric",
      pattern = "[0-9]*",
      min,
      max,
      placeholder,
      disabled = false,
      onFocus,
      onKeyDown,
      labelStyle,
      inputStyle,
      containerStyle,
    },
    ref,
  ) => {
    const isHero = variant === "hero";

    const baseInputStyle: React.CSSProperties = {
      width: "100%",
      padding: "10px 12px",
      borderRadius: "12px",
      border: isHero
        ? "1.5px solid var(--card-border, rgba(255, 255, 255, 0.12))"
        : "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
      background: disabled
        ? "rgba(255, 255, 255, 0.03)"
        : "var(--input-bg, rgba(0, 0, 0, 0.25))",
      color: "var(--text-primary, #ededed)",
      fontSize: isHero ? "1.15rem" : "0.95rem",
      fontWeight: isHero ? 800 : 400,
      boxSizing: "border-box",
      textAlign: isHero ? "left" : undefined,
      opacity: disabled ? 0.45 : 1,
      cursor: disabled ? "not-allowed" : "text",
      ...inputStyle,
    };

    const baseLabelStyle: React.CSSProperties = {
      fontSize: isHero ? "0.82rem" : "0.78rem",
      fontWeight: isHero ? 700 : 600,
      color: "var(--text-secondary, #8b8b8b)",
      display: "block",
      marginBottom: isHero ? "6px" : "4px",
      ...labelStyle,
    };

    return (
      <div style={containerStyle}>
        <label htmlFor={id} style={baseLabelStyle}>
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          type={type}
          inputMode={inputMode}
          pattern={pattern}
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          style={baseInputStyle}
        />
      </div>
    );
  },
);

BusFormField.displayName = "BusFormField";
