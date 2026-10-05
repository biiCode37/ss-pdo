import React from "react";

export const singleFocusPrimaryInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1.5px solid var(--accent-color, #38bdf8)",
  background: "var(--input-bg, rgba(243, 244, 246, 0.9))",
  color: "var(--text-primary, #171717)",
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
  borderColor: isActive ? "var(--shift1-color, #0284c7)" : "var(--card-border, rgba(0, 0, 0, 0.12))",
  background: isActive ? "var(--shift1-bg, rgba(2, 132, 199, 0.12))" : "var(--input-bg, rgba(0, 0, 0, 0.04))",
  color: isActive ? "var(--shift1-action-text, #0369a1)" : "var(--text-secondary, #6b7280)",
  cursor: isDisabled ? "not-allowed" : "pointer",
  opacity: isDisabled ? 0.45 : 1,
});

export const singleFocusSubInputStyle = (
  isLocked: boolean = false,
): React.CSSProperties => ({
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid var(--card-border, rgba(0, 0, 0, 0.12))",
  background: isLocked ? "var(--card-border, rgba(0, 0, 0, 0.04))" : "var(--input-bg, rgba(243, 244, 246, 0.9))",
  color: "var(--text-primary, #171717)",
  fontSize: "0.95rem",
  boxSizing: "border-box",
  opacity: isLocked ? 0.45 : 1,
  cursor: isLocked ? "not-allowed" : "text",
});

export const singleFocusLabelStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  fontWeight: 700,
  color: "var(--text-primary, #171717)",
  display: "block",
  marginBottom: "6px",
};

export const singleFocusHelperTextStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "var(--text-secondary, #6b7280)",
  display: "block",
  marginTop: "4px",
};

export const singleFocusDistanceBadgeStyle = (
  isShift2: boolean = false,
): React.CSSProperties => ({
  padding: "8px 12px",
  borderRadius: "8px",
  background: isShift2
    ? "var(--shift2-bg, rgba(126, 34, 206, 0.08))"
    : "var(--shift1-bg, rgba(2, 132, 199, 0.08))",
  border: isShift2
    ? "1px solid var(--shift2-border, rgba(126, 34, 206, 0.2))"
    : "1px solid var(--shift1-border, rgba(2, 132, 199, 0.2))",
  fontSize: "0.82rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "var(--text-primary, #171717)",
});

export const singleFocusCopyBtnStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: "6px",
  fontSize: "0.75rem",
  fontWeight: 600,
  background: "var(--shift1-bg, rgba(2, 132, 199, 0.08))",
  border: "1px solid var(--shift1-border, rgba(2, 132, 199, 0.25))",
  color: "var(--shift1-action-text, #0369a1)",
  cursor: "pointer",
};
