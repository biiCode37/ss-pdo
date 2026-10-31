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
        className="ui-status"
        data-tone="success"
        style={{
          border: "1px solid var(--color-success-border)",
        }}
      >
        {TEXT_PDO_FORM.BADGES.VERIFIED}
      </span>
    );
  }

  if (status === "submitted") {
    return (
      <span
        className="ui-status"
        data-tone="info"
        style={{
          border: "1px solid var(--color-info-border)",
        }}
      >
        {TEXT_PDO_FORM.BADGES.SUBMITTED}
      </span>
    );
  }

  return (
    <span
      className="ui-status"
      data-tone="warning"
      style={{
        border: "1px solid var(--color-warning-border)",
      }}
    >
      {TEXT_PDO_FORM.BADGES.DRAFT}
    </span>
  );
};
