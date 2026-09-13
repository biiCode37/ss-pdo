import { X, Info } from "lucide-react";
import { TEXT_AUTH, TEXT_COMMON } from "@/constants/texts";

interface LoginInfoHeaderProps {
  onClose: () => void;
}

export function LoginInfoHeader({ onClose }: LoginInfoHeaderProps) {
  return (
    <>
      {/* Pull Indicator Bar */}
      <div
        style={{
          width: "40px",
          height: "4px",
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          borderRadius: "9999px",
          margin: "0 auto 16px auto",
        }}
      />

      {/* Sheet Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              padding: "6px",
              borderRadius: "8px",
              backgroundColor: "rgba(62, 207, 142, 0.15)",
              color: "var(--accent-color, #3ECF8E)",
            }}
          >
            <Info size={18} />
          </div>
          <h3
            style={{
              fontSize: "17px",
              fontWeight: 800,
              margin: 0,
              color: "var(--text-primary)",
            }}
          >
            {TEXT_AUTH.INFO_MODAL_TITLE}
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-color)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label={TEXT_COMMON.BUTTONS.CLOSE}
          data-testid="close-info-modal-btn"
        >
          <X size={18} />
        </button>
      </div>
    </>
  );
}
