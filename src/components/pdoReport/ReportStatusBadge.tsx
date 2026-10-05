import React from "react";
import { TEXT_PDO_FORM } from "@/constants/texts";

interface ReportStatusBadgeProps {
  status: "draft" | "submitted" | "verified";
}

export const ReportStatusBadge: React.FC<ReportStatusBadgeProps> = ({
  status,
}) => {
  if (status === "verified") {
    return (
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          background: "rgba(16, 185, 129, 0.14)",
          color: "var(--success-color, #10b981)",
          padding: "3px 9px",
          borderRadius: "8px",
          border: "1px solid rgba(16, 185, 129, 0.3)",
        }}
      >
        {TEXT_PDO_FORM.BADGES.VERIFIED}
      </span>
    );
  }

  if (status === "submitted") {
    return (
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          background: "rgba(14, 165, 233, 0.14)",
          color: "var(--info-color, #38bdf8)",
          padding: "3px 9px",
          borderRadius: "8px",
          border: "1px solid rgba(14, 165, 233, 0.3)",
        }}
      >
        {TEXT_PDO_FORM.BADGES.SUBMITTED}
      </span>
    );
  }

  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 700,
        background: "rgba(245, 158, 11, 0.14)",
        color: "var(--warning-color, #f59e0b)",
        padding: "3px 9px",
        borderRadius: "8px",
        border: "1px solid rgba(245, 158, 11, 0.3)",
      }}
    >
      {TEXT_PDO_FORM.BADGES.DRAFT}
    </span>
  );
};
