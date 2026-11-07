import React from "react";

export const singleFocusPrimaryInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1.5px solid var(--color-border-control)",
  background: "var(--color-surface-subtle)",
  color: "var(--color-text-primary)",
  fontSize: "18px",
  fontWeight: 700,
  boxSizing: "border-box",
};

export const singleFocusSubInputStyle = (
  isLocked: boolean = false,
): React.CSSProperties => ({
  width: "100%",
  padding: "10px 12px",
  borderRadius: "12px",
  border: "1px solid var(--color-border-subtle)",
  background: isLocked
    ? "var(--color-surface-subtle)"
    : "var(--color-surface-subtle)",
  color: "var(--color-text-primary)",
  fontSize: "16px",
  boxSizing: "border-box",
  opacity: isLocked ? 0.45 : 1,
  cursor: isLocked ? "not-allowed" : "text",
});

export const singleFocusLabelStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "var(--color-text-primary)",
  display: "block",
  marginBottom: "6px",
};

export const singleFocusHelperTextStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "var(--color-text-secondary)",
  display: "block",
  marginTop: "4px",
};

export const singleFocusDistanceBadgeStyle = (
  isShift2: boolean = false,
): React.CSSProperties => ({
  padding: "8px 12px",
  borderRadius: "8px",
  background: isShift2
    ? "var(--color-shift-2-bg)"
    : "var(--color-shift-1-bg)",
  border: isShift2
    ? "1px solid var(--color-shift-2-border)"
    : "1px solid var(--color-shift-1-border)",
  fontSize: "13px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "var(--color-text-primary)",
});

export const singleFocusCopyBtnStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: 600,
  background: "var(--color-shift-1-bg)",
  border: "1px solid var(--color-shift-1-border)",
  color: "var(--color-shift-1-fg)",
  cursor: "pointer",
};
