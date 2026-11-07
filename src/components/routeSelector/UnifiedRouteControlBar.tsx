import React from "react";
import { ChevronDown, X } from "lucide-react";
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
  isInsidePanel?: boolean;
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
  isInsidePanel = false,
}) => {
  const handleExitAccumulation = () => {
    if (onExitAccumulation) {
      onExitAccumulation();
      return;
    }
    const today = String(new Date().getDate());
    const defaultDay = days.includes(today) ? today : days[0] || "1";
    setSelectedTab(defaultDay);
    onLoadData(defaultDay, sheetUrl);
  };

  const renderReportPill = () => {
    if (!reportRoute || !onOpenReportModal) return null;
    let tone = "warning";
    let label: string = TEXT_PDO_FORM.A2_REPORT.PILL_LABEL;
    let title: string = TEXT_PDO_FORM.A2_REPORT.MODAL_TITLE;
    if (reportStatus === "failed") {
      tone = "error";
      label = TEXT_PDO_FORM.A2_REPORT.STATUS_FAILED;
      title = TEXT_PDO_FORM.A2_REPORT.TOOLTIP_FAILED;
    } else if (reportStatus === "verified") {
      tone = "success";
      label = TEXT_PDO_FORM.A2_REPORT.STATUS_VERIFIED;
    } else if (reportStatus === "submitted") {
      tone = "info";
      if (confirmedShifts?.[1] && confirmedShifts?.[2]) {
        label = TEXT_PDO_FORM.A2_REPORT.STATUS_SUBMITTED_BOTH;
      } else if (confirmedShifts?.[1]) {
        label = TEXT_PDO_FORM.A2_REPORT.STATUS_SUBMITTED_SHIFT_1;
      } else if (confirmedShifts?.[2]) {
        label = TEXT_PDO_FORM.A2_REPORT.STATUS_SUBMITTED_SHIFT_2;
      } else {
        label = TEXT_PDO_FORM.A2_REPORT.STATUS_SUBMITTED;
      }
    }
    return (
      <button
        type="button"
        data-testid="open-operational-report-btn"
        className={`ui-chip-btn ui-chip-btn--${tone}`}
        onClick={onOpenReportModal}
        title={title}
      >
        <span className="ui-chip-dot" aria-hidden="true" />
        <span>{label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
    );
  };

  return (
    <div
      className={
        isInsidePanel
          ? "unified-route-control-bar"
          : "glass unified-route-control-bar unified-route-control-bar--standalone"
      }
    >
      {/* Tanggal aktif (informasi, tidak bisa diketuk) */}
      <div
        data-testid="date-display-badge"
        className="route-date-label"
        title={TEXT_DASHBOARD.ROUTE_SELECTOR.DATE_DISPLAY_TITLE(displayDateLabel)}
      >
        {displayDateLabel}
      </div>

      {isAccumulation ? (
        <button
          type="button"
          data-testid="exit-accumulation-btn"
          className="ui-chip-btn ui-chip-btn--warning"
          onClick={handleExitAccumulation}
          title={TEXT_DASHBOARD.ROUTE_SELECTOR.EXIT_ACCUMULATION_TITLE}
        >
          <X size={16} aria-hidden="true" />
          <span>{TEXT_DASHBOARD.ROUTE_SELECTOR.EXIT_ACCUMULATION}</span>
        </button>
      ) : (
        renderReportPill()
      )}
    </div>
  );
};
