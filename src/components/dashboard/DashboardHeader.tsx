import React from "react";
import { MapPin, ChevronDown, AlertTriangle, CloudOff } from "lucide-react";
import { UserProfileHeader } from "@/components/UserProfileHeader";
import { RouteSelectorCard } from "@/components/RouteSelectorCard";
import { TEXT_DASHBOARD } from "@/constants/texts";
import type { Route } from "@/types/supabase";

interface DashboardHeaderProps {
  headerBlockRef: React.RefObject<HTMLDivElement | null>;
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
  reportStatus: "draft" | "submitted" | "verified";
  onOpenReportModal: () => void;
  onRouteCodeChange: (code: string) => void;
  routeSelectorOpenTrigger: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  headerBlockRef,
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
  onOpenReportModal,
  onRouteCodeChange,
  routeSelectorOpenTrigger,
}) => {
  const hasConflictOrFailedQueue = queue.some(
    (q) => q.status === "failed" || q.status === "conflict",
  );

  return (
    <div
      ref={headerBlockRef}
      className="sticky-top-block"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "var(--bg-color)",
        paddingTop: "12px",
        paddingBottom: "4px",
        marginTop: "-16px",
        marginLeft: "-16px",
        marginRight: "-16px",
        paddingLeft: "16px",
        paddingRight: "16px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
      }}
    >
      <div
        className="app-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
          padding: 0,
          gap: "12px",
          textAlign: "left",
        }}
      >
        {/* POJOK KIRI: Profil Akun Pengguna (Avatar, Nama, Role, Email) */}
        <UserProfileHeader onOpenProfile={onOpenProfile} />

        {/* POJOK KANAN: Badge Kode Rute Aktif + Status Antrean Offline */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {/* Badge Kode Rute Aktif */}
          <button
            type="button"
            onClick={onOpenRouteSelector}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 10px",
              borderRadius: "10px",
              background: "var(--accent-bg, rgba(62, 207, 142, 0.12))",
              border: "1px solid var(--accent-border, rgba(62, 207, 142, 0.32))",
              color: "var(--accent-color, #3ECF8E)",
              fontSize: "12.5px",
              fontWeight: 700,
              letterSpacing: "0.2px",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
            title={TEXT_DASHBOARD.ROUTE_SELECTOR.ACTIVE_ROUTE_TITLE(activeRouteCode)}
            aria-label={TEXT_DASHBOARD.ROUTE_SELECTOR.ACTIVE_ROUTE_ARIA(activeRouteCode)}
            data-testid="active-route-badge-btn"
          >
            <MapPin size={13} style={{ color: "var(--accent-color, #3ECF8E)", flexShrink: 0 }} />
            <span>{activeRouteCode}</span>
            <ChevronDown size={12} style={{ opacity: 0.65, flexShrink: 0 }} />
          </button>

          {queue.length > 0 && (
            <div
              onClick={onOpenQueue}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: hasConflictOrFailedQueue
                  ? "var(--danger-color)"
                  : "var(--warning-color)",
                fontSize: "12px",
                fontWeight: "bold",
                background: hasConflictOrFailedQueue
                  ? "rgba(247, 85, 85, 0.12)"
                  : "rgba(245, 158, 11, 0.12)",
                padding: "4px 8px",
                borderRadius: "20px",
                cursor: "pointer",
                border:
                  "1px solid " +
                  (hasConflictOrFailedQueue
                    ? "rgba(247, 85, 85, 0.25)"
                    : "rgba(245, 158, 11, 0.25)"),
              }}
              title={TEXT_DASHBOARD.SYNC_QUEUE_TITLE}
            >
              {hasConflictOrFailedQueue ? (
                <AlertTriangle size={14} />
              ) : (
                <CloudOff size={14} />
              )}
              <span>{queue.length}</span>
            </div>
          )}
        </div>
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
        onOpenReportModal={onOpenReportModal}
        onRouteCodeChange={onRouteCodeChange}
        externalOpenTrigger={routeSelectorOpenTrigger}
      />
    </div>
  );
};
