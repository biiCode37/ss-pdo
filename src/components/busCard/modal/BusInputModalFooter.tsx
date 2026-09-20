import React from "react";
import { Check } from "lucide-react";
import { TEXT_ALERTS, TEXT_COMMON } from "@/constants/texts";

interface BusInputModalFooterProps {
  formId: string;
  onDismiss: () => void;
  isDisabled?: boolean;
  isKeyboardOpen?: boolean;
}

export const BusInputModalFooter: React.FC<BusInputModalFooterProps> = ({
  formId,
  onDismiss,
  isDisabled = false,
  isKeyboardOpen = false,
}) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        marginTop: "auto",
        paddingTop: isKeyboardOpen ? "8px" : "12px",
        borderTop: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
        position: "sticky",
        bottom: 0,
        background: "var(--card-bg, #171717)",
        zIndex: 20,
      }}
    >
      <button
        type="button"
        onClick={onDismiss}
        style={{
          flex: 1,
          minHeight: isKeyboardOpen ? "42px" : "48px",
          padding: isKeyboardOpen ? "8px 12px" : "12px 14px",
          borderRadius: isKeyboardOpen ? "12px" : "14px",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
          background: "rgba(255, 255, 255, 0.05)",
          color: "var(--text-secondary, #8b8b8b)",
          fontSize: isKeyboardOpen ? "0.88rem" : "0.92rem",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.15s ease",
        }}
      >
        {TEXT_COMMON.BUTTONS.CANCEL}
      </button>

      <button
        id={`submit-bus-modal-${formId}`}
        type="submit"
        disabled={isDisabled}
        style={{
          flex: 2,
          minHeight: isKeyboardOpen ? "42px" : "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          padding: isKeyboardOpen ? "8px 14px" : "12px 16px",
          borderRadius: isKeyboardOpen ? "12px" : "14px",
          border: "none",
          background: isDisabled
            ? "rgba(100, 116, 139, 0.3)"
            : "linear-gradient(135deg, #0284c7, #0ea5e9)",
          color: isDisabled ? "#94a3b8" : "#ffffff",
          fontSize: isKeyboardOpen ? "0.9rem" : "0.95rem",
          fontWeight: 700,
          cursor: isDisabled ? "not-allowed" : "pointer",
          boxShadow: isDisabled
            ? "none"
            : "0 4px 16px rgba(14, 165, 233, 0.35)",
          transition: "all 0.15s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <Check size={isKeyboardOpen ? 16 : 18} />
        <span>{TEXT_ALERTS.BUS_INPUT_MODAL.SAVE_BTN}</span>
      </button>
    </div>
  );
};
