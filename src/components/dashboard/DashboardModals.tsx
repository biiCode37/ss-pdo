import React from "react";
import { RouteOperationalReportCard } from "@/components/RouteOperationalReportCard";
import { FleetStatusModal } from "@/components/fleetStatus/FleetStatusModal";
import { QueueModal } from "@/components/QueueModal";
import { AccumulationSheet } from "@/components/AccumulationSheet";
import { ProfileMenuSheet } from "@/components/ProfileMenuSheet";
import type { BusData } from "@/services/googleSheets";
import type { Route } from "@/types/supabase";
import type { SyncItem } from "@/hooks/useOfflineSync";
import { TEXT_DASHBOARD } from "@/constants/texts";
import { showInfoToast, showWarningToast } from "@/utils/alertUtils";

interface DashboardModalsProps {
  matchedRoute: Route | null;
  selectedTab: string;
  isReportModalOpen: boolean;
  onCloseReportModal: () => void;
  operationalReportDate: string;
  dynamicRenops: { renops: number; label: string };
  onOperationalStatusChange: (status: "draft" | "submitted" | "verified") => void;
  busData: BusData[] | null;
  isFleetModalOpen: boolean;
  onCloseFleetModal: () => void;
  activeShift: 1 | 2;
  onConfirmFleetStatus: (
    shift: 1 | 2,
    statusMap: Map<number, { s1: string; s2: string }>,
  ) => Promise<void>;
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
  onOpenRegionalMonitoring: () => void;
  onOpenUserManagement: () => void;
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
  busData,
  isFleetModalOpen,
  onCloseFleetModal,
  activeShift,
  onConfirmFleetStatus,
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
  onOpenUserManagement,
  theme,
  onToggleTheme,
  isOnline,
  onLogout,
  onFormatWholeSheet,
  currentTabName,
  hasActiveData,
}) => {
  return (
    <>
      {/* Modal Laporan Operasional Rute */}
      {matchedRoute && selectedTab !== "AKUMULASI" && (
        <RouteOperationalReportCard
          asModal={true}
          isOpen={isReportModalOpen}
          onClose={onCloseReportModal}
          routeId={matchedRoute.id}
          routeCode={matchedRoute.route_code}
          selectedDate={operationalReportDate}
          defaultTrafficJamSpots={matchedRoute.default_traffic_jam_spots || []}
          defaultRenops={dynamicRenops.renops}
          userEmail={localStorage.getItem("PDO_USER_EMAIL") || undefined}
          onStatusChange={onOperationalStatusChange}
        />
      )}

      {/* Modal Penetapan Status Armada */}
      {matchedRoute && selectedTab !== "AKUMULASI" && busData && (
        <FleetStatusModal
          isOpen={isFleetModalOpen}
          onClose={onCloseFleetModal}
          routeCode={matchedRoute.route_code}
          selectedDate={operationalReportDate}
          renopsTarget={dynamicRenops.renops}
          dayLabel={dynamicRenops.label}
          buses={busData}
          initialShift={activeShift}
          onConfirmStatus={onConfirmFleetStatus}
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
        onOpenUserManagement={onOpenUserManagement}
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
