import { Copy, Check, Share2 } from "lucide-react";
import { TEXT_WA_REPORT } from "@/constants/texts";

interface WaReportPreviewProps {
  messageText: string;
  isFormat3Blocked: boolean;
  copied: boolean;
  onCopy: () => void;
  onOpenWa: () => void;
}

export function WaReportPreview({
  messageText,
  isFormat3Blocked,
  copied,
  onCopy,
  onOpenWa,
}: WaReportPreviewProps) {
  return (
    <>
      {/* Monospace Message Preview Container */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "var(--bg-color, #0b0f19)",
          color: "var(--text-primary, #e2e8f0)",
          padding: "12px 14px",
          borderRadius: "14px",
          fontFamily: "monospace",
          fontSize: "11.5px",
          lineHeight: 1.45,
          whiteSpace: "pre-wrap",
          marginBottom: "14px",
          minHeight: "120px",
          maxHeight: "min(36dvh, 260px)",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
        }}
      >
        {messageText || TEXT_WA_REPORT.LOADING_PREVIEW}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          type="button"
          disabled={isFormat3Blocked}
          onClick={onCopy}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "12px",
            background: copied
              ? "var(--accent-color, #10b981)"
              : "var(--input-bg, rgba(255, 255, 255, 0.06))",
            color: copied ? "#ffffff" : "var(--text-primary, #ededed)",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: isFormat3Blocked ? "not-allowed" : "pointer",
            opacity: isFormat3Blocked ? 0.4 : 1,
            transition: "all 0.2s ease",
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? TEXT_WA_REPORT.COPIED_BTN : TEXT_WA_REPORT.COPY_BTN}
        </button>

        <button
          type="button"
          disabled={isFormat3Blocked}
          onClick={onOpenWa}
          style={{
            flex: 1.2,
            padding: "12px",
            borderRadius: "12px",
            background: "#25D366",
            color: "#ffffff",
            border: "none",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: isFormat3Blocked
              ? "none"
              : "0 2px 10px rgba(37, 211, 102, 0.35)",
            cursor: isFormat3Blocked ? "not-allowed" : "pointer",
            opacity: isFormat3Blocked ? 0.4 : 1,
          }}
        >
          <Share2 size={16} />
          {TEXT_WA_REPORT.OPEN_WA_BTN}
        </button>
      </div>
    </>
  );
}
