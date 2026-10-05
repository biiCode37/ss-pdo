import React from "react";
import { Bus, ChevronDown, ChevronUp } from "lucide-react";
import { TEXT_PDO_FORM } from "@/constants/texts";
import { ReportStatusBadge } from "./ReportStatusBadge";

interface ReportAccordionHeaderProps {
  routeCode: string;
  status: "draft" | "submitted" | "verified";
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const ReportAccordionHeader: React.FC<ReportAccordionHeaderProps> = ({
  routeCode,
  status,
  isExpanded,
  onToggleExpand,
}) => {
  return (
    <div
      onClick={onToggleExpand}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
        userSelect: "none",
        paddingBottom: isExpanded ? "12px" : "0",
        borderBottom: isExpanded
          ? "1px solid var(--border-color, rgba(255, 255, 255, 0.08))"
          : "none",
        transition: "padding 0.2s ease",
      }}
      title={
        isExpanded ? "Klik untuk menciutkan form" : "Klik untuk membuka form"
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "rgba(62, 207, 142, 0.12)",
            color: "var(--accent-color, #3ECF8E)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Bus size={18} />
        </div>
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.2px",
            }}
          >
            {TEXT_PDO_FORM.CARD_TITLE}
          </h3>
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            {TEXT_PDO_FORM.CARD_SUBTITLE(routeCode)}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <ReportStatusBadge status={status} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: "var(--input-bg, rgba(255, 255, 255, 0.04))",
            color: "var(--text-secondary)",
          }}
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>
    </div>
  );
};
