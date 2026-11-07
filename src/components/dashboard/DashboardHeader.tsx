import React, { useLayoutEffect, useRef } from "react";
import { ChevronDown, ChevronLeft, AlertTriangle, CloudOff } from "lucide-react";
import { UserProfileHeader } from "@/components/UserProfileHeader";
import { RouteSelectorCard } from "@/components/RouteSelectorCard";
import { TEXT_DASHBOARD } from "@/constants/texts";
import type { Route } from "@/types/supabase";

interface DashboardHeaderProps {
  inputControlsRef?: React.Ref<HTMLDivElement>;
  onOpenProfile: () => void;
  activeRouteCode: string;
  onOpenRouteSelector: () => void;
  queue: Array<{ status: string }>;
  onOpenQueue: () => void;
  sheetUrl: string;
  setSheetUrl: (url: string) => void;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  days: string[];
  isLoading: boolean;
  isDataLoaded: boolean;
  currentSheetId: string;
  currentTabName: string;
  onLoadData: (tab?: string, targetUrl?: string) => Promise<void>;
  accRange: {
    startDay: number;
    startMonth: number;
    startYear: number;
    endDay: number;
    endMonth: number;
    endYear: number;
  } | null;
  onExitAccumulation: (targetDay?: string) => Promise<void>;
  reportRoute: Route | null;
  reportStatus: "draft" | "submitted" | "verified" | "failed";
  confirmedShifts?: { 1: boolean; 2: boolean };
  onOpenReportModal: () => void;
  onRouteCodeChange: (code: string) => void;
  routeSelectorOpenTrigger: number;
  onBackToMonitoring?: () => void;
  maintenanceBanner?: React.ReactNode;
  hideRouteControlBar?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  inputControlsRef,
  onOpenProfile,
  activeRouteCode,
  onOpenRouteSelector,
  queue,
  onOpenQueue,
  sheetUrl,
  setSheetUrl,
  selectedTab,
  setSelectedTab,
  days,
  isLoading,
  isDataLoaded,
  currentSheetId,
  currentTabName,
  onLoadData,
  accRange,
  onExitAccumulation,
  reportRoute,
  reportStatus,
  confirmedShifts,
  onOpenReportModal,
  onRouteCodeChange,
  routeSelectorOpenTrigger,
  onBackToMonitoring,
  maintenanceBanner,
  hideRouteControlBar = false,
}) => {
  const headerBlockRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const header = headerBlockRef.current;
    if (!header) return;
    const updateHeight = () => {
      document.documentElement.style.setProperty(
        "--sticky-header-height",
        `${header.offsetHeight}px`,
      );
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--sticky-header-height");
    };
  }, []);

  const hasConflictOrFailedQueue = queue.some(
    (q) => q.status === "failed" || q.status === "conflict",
  );

  return (
    <div
      ref={headerBlockRef}
      className="sticky-top-block"
    >
      {/* 0. Banner Maintenance Terpadu di Puncak Header */}
      {maintenanceBanner}

      <div
        className="app-header"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
          padding: 0,
          gap: "8px",
          textAlign: "left",
        }}
      >
        {/* POJOK KIRI: Tombol Kembali ke Wilayah (Non-PDO) + Badge Kode Rute Aktif + Status Antrean Offline */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            alignItems: "center",
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          {onBackToMonitoring && (
            <button
              type="button"
              onClick={onBackToMonitoring}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 8px",
                borderRadius: "12px",
                background: "var(--color-bg-surface, var(--card-bg, rgba(255, 255, 255, 0.06)))",
                border: "1px solid var(--color-border-subtle, var(--border-color, rgba(255, 255, 255, 0.12)))",
                color: "var(--color-text-secondary, var(--text-secondary, #a0aec0))",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
              }}
              title={TEXT_DASHBOARD.SWITCHER.TITLE}
              aria-label={TEXT_DASHBOARD.SWITCHER.TITLE}
              data-testid="back-to-monitoring-btn"
            >
              <ChevronLeft size={16} style={{ flexShrink: 0 }} />
              <span>{TEXT_DASHBOARD.SWITCHER.REGIONAL_MONITORING}</span>
            </button>
          )}

          {/* Badge Kode Rute Aktif */}
          <button
            type="button"
            className="ui-chip-btn ui-chip-btn--accent"
            onClick={onOpenRouteSelector}
            title={TEXT_DASHBOARD.ROUTE_SELECTOR.ACTIVE_ROUTE_TITLE(activeRouteCode)}
            aria-label={TEXT_DASHBOARD.ROUTE_SELECTOR.ACTIVE_ROUTE_ARIA(activeRouteCode)}
            data-testid="active-route-badge-btn"
          >
            <span>{activeRouteCode}</span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>

          {queue.length > 0 && (
            <button
              type="button"
              className={`ui-chip-btn ${hasConflictOrFailedQueue ? "ui-chip-btn--error" : "ui-chip-btn--warning"}`}
              onClick={onOpenQueue}
              title={TEXT_DASHBOARD.SYNC_QUEUE_TITLE}
            >
              {hasConflictOrFailedQueue ? (
                <AlertTriangle size={16} aria-hidden="true" />
              ) : (
                <CloudOff size={16} aria-hidden="true" />
              )}
              <span>{queue.length}</span>
            </button>
          )}
        </div>

        {/* POJOK KANAN: Profil Akun Pengguna (Avatar, Nama, Role, Email) */}
        <UserProfileHeader onOpenProfile={onOpenProfile} />
      </div>

      <RouteSelectorCard
        sheetUrl={sheetUrl}
        setSheetUrl={setSheetUrl}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        days={days}
        isLoading={isLoading}
        isDataLoaded={isDataLoaded}
        currentSheetId={currentSheetId}
        currentTabName={currentTabName}
        onLoadData={onLoadData}
        accRange={accRange}
        onExitAccumulation={onExitAccumulation}
        reportRoute={reportRoute}
        reportStatus={reportStatus}
        confirmedShifts={confirmedShifts}
        onOpenReportModal={onOpenReportModal}
        onRouteCodeChange={onRouteCodeChange}
        externalOpenTrigger={routeSelectorOpenTrigger}
        hideControlBar={hideRouteControlBar}
      />
      <div ref={inputControlsRef} />
    </div>
  );
};
