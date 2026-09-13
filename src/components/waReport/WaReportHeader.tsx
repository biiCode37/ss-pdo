import { Share2, X } from "lucide-react";
import { TEXT_WA_REPORT } from "@/constants/texts";

interface WaReportHeaderProps {
  onClose: () => void;
}

export function WaReportHeader({ onClose }: WaReportHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "rgba(37, 211, 102, 0.12)",
            color: "#25D366",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Share2 size={20} />
        </div>
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "16.5px",
              fontWeight: 700,
              color: "var(--text-primary, #ededed)",
            }}
          >
            {TEXT_WA_REPORT.MODAL_TITLE}
          </h2>
          <span
            style={{
              fontSize: "11.5px",
              color: "var(--text-secondary, #8b8b8b)",
            }}
          >
            {TEXT_WA_REPORT.MODAL_SUBTITLE}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-secondary, #64748b)",
          padding: "6px",
        }}
      >
        <X size={22} />
      </button>
    </div>
  );
}
