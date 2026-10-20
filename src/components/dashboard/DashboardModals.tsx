import React from "react";
import { A2ReportModal } from "@/components/pdoReport/A2ReportModal";
import { QueueModal } from "@/components/QueueModal";
import { AccumulationSheet } from "@/components/AccumulationSheet";
import { ProfileMenuSheet } from "@/components/ProfileMenuSheet";
import type { BusData } from "@/services/googleSheets";
import type { Route } from "@/types/supabase";
import type { SyncItem } from "@/hooks/useOfflineSync";
import { TEXT_DASHBOARD, TEXT_PAGE_MANAGEMENT } from "@/constants/texts";
import { showInfoToast, showWarningToast } from "@/utils/alertUtils";
import { usePageAccess } from "@/context/PageAccessContext";
import { getStoredUserRole } from "@/utils/roleStorage";

interface DashboardModalsProps {
  matchedRoute: Route | null;
  selectedTab: string;
  isReportModalOpen: boolean;
  onCloseReportModal: () => void;
  operationalReportDate: string;
  dynamicRenops: { renops: number; label: string };
  onOperationalStatusChange: (status: "draft" | "submitted" | "verified" | "failed") => void;
  onRefreshFleetData?: () => Promise<void> | void;
  busData: BusData[] | null;
  activeShift: 1 | 2;
  isQueueModalOpen: boolean;
  onCloseQueueModal: () => void;
  queue: SyncItem[];
  retryItem: (id: string) => void;
  onDeleteQueueItem: (id: string) => void;
  resolveConflict: (id: string) => void;
  forceConflictItem: (id: string) => void;
  processQueue: () => Promise<void>;
  isAccSheetOpen: boolean;
  onCloseAccSheet: () => void;
  activeMonth: number;
  activeYear: number;
  onResetAccumulation: () => void;
  onApplyAccumulation: (
    sDay: number,
    sMonth: number,
    sYear: number,
    eDay: number,
    eMonth: number,
    eYear: number,
  ) => Promise<void>;
  isProfileMenuOpen: boolean;
  onCloseProfileMenu: () => void;
  onOpenAccumulation: () => void;
  onOpenRegionalMonitoring?: () => void;
  onReturnToRouteView?: () => void;
  isInMonitoringView?: boolean;
  onOpenUserManagement: () => void;
  onOpenPageManagement?: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  isOnline: boolean;
  onLogout: () => void;
  onFormatWholeSheet: () => Promise<void>;
  currentTabName: string;
  hasActiveData: boolean;
}

export const DashboardModals: React.FC<DashboardModalsProps> = ({
  matchedRoute,
  selectedTab,
  isReportModalOpen,
  onCloseReportModal,
  operationalReportDate,
  dynamicRenops,
  onOperationalStatusChange,
  onRefreshFleetData,
  busData,
  activeShift,
  isQueueModalOpen,
  onCloseQueueModal,
  queue,
  retryItem,
  onDeleteQueueItem,
  resolveConflict,
  forceConflictItem,
  processQueue,
  isAccSheetOpen,
  onCloseAccSheet,
  activeMonth,
  activeYear,
  onResetAccumulation,
  onApplyAccumulation,
  isProfileMenuOpen,
  onCloseProfileMenu,
  onOpenAccumulation,
  onOpenRegionalMonitoring,
  onReturnToRouteView,
  isInMonitoringView,
  onOpenUserManagement,
  onOpenPageManagement,
  theme,
  onToggleTheme,
  isOnline,
  onLogout,
  onFormatWholeSheet,
  currentTabName,
  hasActiveData,
}) => {
  const { canAccessPage } = usePageAccess();
  const currentUserRole = getStoredUserRole();

  React.useEffect(() => {
    if (isReportModalOpen && !canAccessPage("a2_report", currentUserRole)) {
      onCloseReportModal();
      showWarningToast(TEXT_PAGE_MANAGEMENT.MAINTENANCE.DEFAULT_MESSAGE);
    }
  }, [isReportModalOpen, canAccessPage, currentUserRole, onCloseReportModal]);

  React.useEffect(() => {
    if (isAccSheetOpen && !canAccessPage("accumulation", currentUserRole)) {
      onCloseAccSheet();
      showWarningToast(TEXT_PAGE_MANAGEMENT.MAINTENANCE.DEFAULT_MESSAGE);
    }
  }, [isAccSheetOpen, canAccessPage, currentUserRole, onCloseAccSheet]);

  return (
    <>
      {/* Modal Laporan Harian A2 Armada Petugas PDO */}
      {matchedRoute && selectedTab !== "AKUMULASI" && canAccessPage("a2_report", currentUserRole) && (
        <A2ReportModal
          isOpen={isReportModalOpen}
          onClose={onCloseReportModal}
          routeId={matchedRoute.id}
          routeCode={matchedRoute.route_code}
          selectedDate={operationalReportDate}
          defaultRenops={dynamicRenops.renops}
          buses={busData}
          initialShift={activeShift}
          onSaveSuccess={() => {
            onOperationalStatusChange("submitted");
            onRefreshFleetData?.();
          }}
          onSaveFailure={() => {
            onOperationalStatusChange("failed");
          }}
        />
      )}


      {/* Modal Antrean Sinkronisasi Offline */}
      <QueueModal
        isOpen={isQueueModalOpen}
        onClose={onCloseQueueModal}
        queue={queue}
        onRetry={(id) => {
          retryItem(id);
          showInfoToast(TEXT_DASHBOARD.QUEUE_RETRYING);
        }}
        onDelete={onDeleteQueueItem}
        onResolveConflict={(id) => {
          resolveConflict(id);
          showInfoToast(TEXT_DASHBOARD.QUEUE_USE_SERVER);
        }}
        onForceConflict={(id) => {
          forceConflictItem(id);
          showWarningToast(TEXT_DASHBOARD.QUEUE_OVERWRITE_SERVER);
        }}
        onProcessQueue={processQueue}
      />

      {/* Sheet Pemilihan Rentang Akumulasi Lintas Periode */}
      <AccumulationSheet
        isOpen={isAccSheetOpen}
        onClose={onCloseAccSheet}
        currentMonth={activeMonth}
        currentYear={activeYear}
        isAccumulationActive={selectedTab === "AKUMULASI"}
        onResetAccumulation={onResetAccumulation}
        onApply={onApplyAccumulation}
      />

      {/* Bottom Sheet Profil & Menu Pengguna */}
      <ProfileMenuSheet
        isOpen={isProfileMenuOpen}
        onClose={onCloseProfileMenu}
        onOpenAccumulation={onOpenAccumulation}
        onOpenRegionalMonitoring={onOpenRegionalMonitoring}
        onReturnToRouteView={onReturnToRouteView}
        isInMonitoringView={isInMonitoringView}
        onOpenUserManagement={onOpenUserManagement}
        onOpenPageManagement={onOpenPageManagement}
        isDarkMode={theme === "dark"}
        onToggleTheme={onToggleTheme}
        offlineQueueCount={
          queue.filter(
            (q) => q.status === "pending" || q.status === "failed",
          ).length
        }
        isOnline={isOnline}
        onLogout={onLogout}
        onFormatWholeSheet={onFormatWholeSheet}
        currentTabName={currentTabName}
        hasActiveData={hasActiveData}
      />
    </>
  );
};
