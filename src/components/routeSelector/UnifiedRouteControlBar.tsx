import React from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { TEXT_DASHBOARD, TEXT_PDO_FORM } from "@/constants/texts";

interface UnifiedRouteControlBarProps {
  displayDateLabel: string;
  isAccumulation: boolean;
  days: string[];
  sheetUrl: string;
  setSelectedTab: (tab: string) => void;
  onLoadData: (tab?: string, targetSheetUrl?: string) => void;
  onExitAccumulation?: (targetDay?: string) => void;
  reportRoute?: { id: number; route_code: string } | null;
  reportStatus?: "draft" | "submitted" | "verified" | "failed";
  confirmedShifts?: { 1: boolean; 2: boolean };
  onOpenReportModal?: () => void;
}

export const UnifiedRouteControlBar: React.FC<UnifiedRouteControlBarProps> = ({
  displayDateLabel,
  isAccumulation,
  days,
  sheetUrl,
  setSelectedTab,
  onLoadData,
  onExitAccumulation,
  reportRoute,
  reportStatus,
  confirmedShifts,
  onOpenReportModal,
}) => {
  return (
    <div
      className="glass unified-route-control-bar"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        padding: "5px 8px",
        borderRadius: "12px",
        marginBottom: "12px",
        border: "1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08))",
        background: "var(--color-bg-surface, rgba(23, 23, 23, 0.75))",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* Left Segment: Static Date Display Badge (Informative Only, Not Clickable) */}
      <div
        data-testid="date-display-badge"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flex: 1,
          minWidth: 0,
          padding: "4px 6px",
          borderRadius: "8px",
          background: "transparent",
          userSelect: "none",
          cursor: "default",
        }}
        title={TEXT_DASHBOARD.ROUTE_SELECTOR.DATE_DISPLAY_TITLE(displayDateLabel)}
      >
        <Calendar
          size={14}
          style={{ color: "var(--color-action-primary-bg, #3ECF8E)", flexShrink: 0 }}
        />
        <span
          style={{
            fontWeight: 600,
            fontSize: "12.5px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: "var(--color-text-primary, var(--text-primary))",
            letterSpacing: "-0.01em",
          }}
        >
          {displayDateLabel}
        </span>
      </div>

      {/* Right Segment: Exit Accumulation OR Unified Operational Report Pill */}
      {isAccumulation ? (
        <button
          type="button"
          data-testid="exit-accumulation-btn"
          onClick={() => {
            if (onExitAccumulation) {
              onExitAccumulation();
            } else {
              const today = String(new Date().getDate());
              const defaultDay = days.includes(today) ? today : days[0] || "1";
              setSelectedTab(defaultDay);
              onLoadData(defaultDay, sheetUrl);
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "rgba(234, 179, 8, 0.12)",
            border: "1px solid rgba(234, 179, 8, 0.35)",
            borderRadius: "8px",
            color: "var(--color-warning-fg, #eab308)",
            padding: "5px 9px",
            fontSize: "11.5px",
            fontWeight: 700,
            cursor: "pointer",
            flexShrink: 0,
            whiteSpace: "nowrap",
            transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
          title="Keluar dari mode akumulasi kembali ke harian"
        >
          <span>✕</span>
          <span>Keluar Akumulasi</span>
        </button>
      ) : reportRoute && onOpenReportModal ? (() => {
        const isFailed = reportStatus === "failed";
        const isVerified = reportStatus === "verified";
        const isSubmitted = reportStatus === "submitted";

        let statusBg = "var(--color-warning-bg, rgba(245, 158, 11, 0.1))";
        let statusBorder = "var(--color-warning-border, rgba(245, 158, 11, 0.25))";
        let statusColor = "var(--color-warning-fg, #f59e0b)";
        let statusLabel: string = TEXT_PDO_FORM.A2_REPORT.PILL_LABEL;
        let statusTitle: string = TEXT_PDO_FORM.A2_REPORT.MODAL_TITLE;

        if (isFailed) {
          statusBg = "var(--color-danger-bg, rgba(239, 68, 68, 0.12))";
          statusBorder = "var(--color-danger-border, rgba(239, 68, 68, 0.35))";
          statusColor = "var(--color-danger-fg, #ef4444)";
          statusLabel = TEXT_PDO_FORM.A2_REPORT.STATUS_FAILED;
          statusTitle = TEXT_PDO_FORM.A2_REPORT.TOOLTIP_FAILED;
        } else if (isVerified) {
          statusBg = "var(--color-success-bg, rgba(16, 185, 129, 0.1))";
          statusBorder = "var(--color-success-border, rgba(16, 185, 129, 0.25))";
          statusColor = "var(--color-success-fg, #10b981)";
          statusLabel = TEXT_PDO_FORM.A2_REPORT.STATUS_VERIFIED;
        } else if (isSubmitted) {
          statusBg = "var(--color-info-bg, rgba(14, 165, 233, 0.1))";
          statusBorder = "var(--color-info-border, rgba(14, 165, 233, 0.25))";
          statusColor = "var(--color-info-fg, #38bdf8)";
          if (confirmedShifts?.[1] && confirmedShifts?.[2]) {
            statusLabel = TEXT_PDO_FORM.A2_REPORT.STATUS_SUBMITTED_BOTH;
          } else if (confirmedShifts?.[1]) {
            statusLabel = TEXT_PDO_FORM.A2_REPORT.STATUS_SUBMITTED_SHIFT_1;
          } else if (confirmedShifts?.[2]) {
            statusLabel = TEXT_PDO_FORM.A2_REPORT.STATUS_SUBMITTED_SHIFT_2;
          } else {
            statusLabel = TEXT_PDO_FORM.A2_REPORT.STATUS_SUBMITTED;
          }
        }

        return (
          <button
            type="button"
            data-testid="open-operational-report-btn"
            onClick={onOpenReportModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: statusBg,
              border: `1px solid ${statusBorder}`,
              borderRadius: "8px",
              color: statusColor,
              padding: "5px 9px",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
              whiteSpace: "nowrap",
              transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
            title={statusTitle}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: statusColor,
                flexShrink: 0,
              }}
            />
            <span>{statusLabel}</span>
            <ChevronDown size={12} style={{ opacity: 0.7 }} />
          </button>
        );
      })() : null}
    </div>
  );
};
