import React from "react";

export const singleFocusPrimaryInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1.5px solid var(--accent-color, #38bdf8)",
  background: "var(--input-bg, rgba(0, 0, 0, 0.25))",
  color: "var(--text-primary, #ededed)",
  fontSize: "1.15rem",
  fontWeight: 700,
  boxSizing: "border-box",
};

export const getSingleFocusChipStyle = (
  isActive: boolean,
  isDisabled: boolean = false,
): React.CSSProperties => ({
  padding: "5px 10px",
  borderRadius: "8px",
  fontSize: "0.75rem",
  fontWeight: 600,
  border: "1px solid",
  borderColor: isActive
    ? "var(--shift1-color, #0284c7)"
    : "var(--card-border, rgba(255, 255, 255, 0.12))",
  background: isActive
    ? "var(--shift1-bg, rgba(2, 132, 199, 0.15))"
    : "var(--input-bg, rgba(255, 255, 255, 0.04))",
  color: isActive
    ? "var(--shift1-action-text, #38bdf8)"
    : "var(--text-secondary, #94a3b8)",
  cursor: isDisabled ? "not-allowed" : "pointer",
  opacity: isDisabled ? 0.45 : 1,
});

export const singleFocusSubInputStyle = (
  isLocked: boolean = false,
): React.CSSProperties => ({
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
  background: isLocked
    ? "rgba(255, 255, 255, 0.03)"
    : "var(--input-bg, rgba(0, 0, 0, 0.25))",
  color: "var(--text-primary, #ededed)",
  fontSize: "0.95rem",
  boxSizing: "border-box",
  opacity: isLocked ? 0.45 : 1,
  cursor: isLocked ? "not-allowed" : "text",
});

export const singleFocusLabelStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  fontWeight: 700,
  color: "var(--text-primary, #ededed)",
  display: "block",
  marginBottom: "6px",
};

export const singleFocusHelperTextStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "var(--text-secondary, #94a3b8)",
  display: "block",
  marginTop: "4px",
};

export const singleFocusDistanceBadgeStyle = (
  isShift2: boolean = false,
): React.CSSProperties => ({
  padding: "8px 12px",
  borderRadius: "8px",
  background: isShift2
    ? "var(--shift2-bg, rgba(126, 34, 206, 0.12))"
    : "var(--shift1-bg, rgba(2, 132, 199, 0.12))",
  border: isShift2
    ? "1px solid var(--shift2-border, rgba(126, 34, 206, 0.25))"
    : "1px solid var(--shift1-border, rgba(2, 132, 199, 0.25))",
  fontSize: "0.82rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "var(--text-primary, #ededed)",
});

export const singleFocusCopyBtnStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: "6px",
  fontSize: "0.75rem",
  fontWeight: 600,
  background: "var(--shift1-bg, rgba(2, 132, 199, 0.15))",
  border: "1px solid var(--shift1-border, rgba(2, 132, 199, 0.3))",
  color: "var(--shift1-action-text, #38bdf8)",
  cursor: "pointer",
};
