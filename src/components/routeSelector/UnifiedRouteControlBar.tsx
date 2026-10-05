import React from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { TEXT_DASHBOARD } from "@/constants/texts";

interface UnifiedRouteControlBarProps {
  displayDateLabel: string;
  isAccumulation: boolean;
  days: string[];
  sheetUrl: string;
  setSelectedTab: (tab: string) => void;
  onLoadData: (tab?: string, targetSheetUrl?: string) => void;
  onExitAccumulation?: (targetDay?: string) => void;
  reportRoute?: { id: number; route_code: string } | null;
  reportStatus?: "draft" | "submitted" | "verified";
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
        padding: "6px 8px",
        borderRadius: "14px",
        marginBottom: "14px",
        border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
        background: "var(--card-bg, rgba(23, 23, 23, 0.75))",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
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
          padding: "5px 8px",
          borderRadius: "9px",
          background: "transparent",
          userSelect: "none",
          cursor: "default",
        }}
        title={TEXT_DASHBOARD.ROUTE_SELECTOR.DATE_DISPLAY_TITLE(displayDateLabel)}
      >
        <Calendar
          size={14}
          style={{ color: "var(--accent-color, #3ECF8E)", flexShrink: 0 }}
        />
        <span
          style={{
            fontWeight: 600,
            fontSize: "13px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: "var(--text-primary)",
            letterSpacing: "-0.1px",
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
            gap: "6px",
            background: "rgba(234, 179, 8, 0.12)",
            border: "1px solid rgba(234, 179, 8, 0.35)",
            borderRadius: "9px",
            color: "var(--warning-color, #eab308)",
            padding: "6px 10px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            flexShrink: 0,
            whiteSpace: "nowrap",
            transition: "all 0.2s ease",
          }}
          title="Keluar dari mode akumulasi kembali ke harian"
        >
          <span>✕</span>
          <span>Keluar Akumulasi</span>
        </button>
      ) : reportRoute && onOpenReportModal ? (
        <button
          type="button"
          data-testid="open-operational-report-btn"
          onClick={onOpenReportModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background:
              reportStatus === "verified"
                ? "rgba(16, 185, 129, 0.1)"
                : reportStatus === "submitted"
                  ? "rgba(14, 165, 233, 0.1)"
                  : "rgba(245, 158, 11, 0.1)",
            border: `1px solid ${
              reportStatus === "verified"
                ? "rgba(16, 185, 129, 0.25)"
                : reportStatus === "submitted"
                  ? "rgba(14, 165, 233, 0.25)"
                  : "rgba(245, 158, 11, 0.25)"
            }`,
            borderRadius: "9px",
            color:
              reportStatus === "verified"
                ? "var(--success-color, #10b981)"
                : reportStatus === "submitted"
                  ? "var(--info-color, #38bdf8)"
                  : "var(--warning-color, #f59e0b)",
            padding: "6px 10px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            flexShrink: 0,
            whiteSpace: "nowrap",
            transition: "all 0.2s ease",
          }}
          title="Buka laporan kondisi dan armada rute"
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background:
                reportStatus === "verified"
                  ? "var(--success-color, #10b981)"
                  : reportStatus === "submitted"
                    ? "var(--info-color, #38bdf8)"
                    : "var(--warning-color, #f59e0b)",
              flexShrink: 0,
            }}
          />
          <span>
            {reportStatus === "verified"
              ? "Terverifikasi"
              : reportStatus === "submitted"
                ? "Terkirim"
                : "Laporan"}
          </span>
          <ChevronDown size={13} style={{ opacity: 0.7 }} />
        </button>
      ) : null}
    </div>
  );
};
