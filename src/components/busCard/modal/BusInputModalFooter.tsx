import React from "react";
import { Check } from "lucide-react";
import { TEXT_ALERTS, TEXT_COMMON } from "@/constants/texts";

interface BusInputModalFooterProps {
  formId: string;
  onDismiss: () => void;
}

export const BusInputModalFooter: React.FC<BusInputModalFooterProps> = ({
  formId,
  onDismiss,
}) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        marginTop: "auto",
        paddingTop: "12px",
        borderTop: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
      }}
    >
      <button
        type="button"
        onClick={onDismiss}
        style={{
          flex: 1,
          padding: "12px",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          background: "rgba(255, 255, 255, 0.05)",
          color: "var(--text-secondary, #94a3b8)",
          fontSize: "0.9rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {TEXT_COMMON.BUTTONS.CANCEL}
      </button>

      <button
        id={`submit-bus-modal-${formId}`}
        type="submit"
        style={{
          flex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "12px",
          borderRadius: "12px",
          border: "none",
          background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
          color: "#ffffff",
          fontSize: "0.9rem",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(14, 165, 233, 0.4)",
        }}
      >
        <Check size={18} />
        <span>{TEXT_ALERTS.BUS_INPUT_MODAL.SAVE_BTN}</span>
      </button>
    </div>
  );
};
