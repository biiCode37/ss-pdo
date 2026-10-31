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
        gap: "10px",
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
          minHeight: isKeyboardOpen ? "40px" : "46px",
          padding: isKeyboardOpen ? "6px 12px" : "10px 14px",
          borderRadius: "12px",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
          background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
          color: "var(--text-secondary, #94a3b8)",
          fontSize: isKeyboardOpen ? "0.85rem" : "0.9rem",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
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
          minHeight: isKeyboardOpen ? "40px" : "46px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          padding: isKeyboardOpen ? "6px 14px" : "10px 16px",
          borderRadius: "12px",
          border: "none",
          background: isDisabled
            ? "var(--color-disabled-bg)"
            : "var(--color-action-primary-bg)",
          color: isDisabled ? "var(--color-disabled-fg)" : "var(--color-action-primary-fg)",
          fontSize: isKeyboardOpen ? "0.88rem" : "0.92rem",
          fontWeight: 700,
          cursor: isDisabled ? "not-allowed" : "pointer",
          boxShadow: isDisabled
            ? "none"
            : "0 4px 14px var(--color-shadow)",
          transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <Check size={isKeyboardOpen ? 16 : 18} />
        <span>{TEXT_ALERTS.BUS_INPUT_MODAL.SAVE_BTN}</span>
      </button>
    </div>
  );
};
