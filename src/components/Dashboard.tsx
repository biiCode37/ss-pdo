import { lazy, Suspense, useMemo } from "react";
import { BottomNav } from "@/components/BottomNav";
import { UserManagementSkeleton } from "@/components/Skeletons";
import { AllRouteMonitoringPage } from "@/components/AllRouteMonitoringPage";
import { ProfileMenuSheet } from "@/components/ProfileMenuSheet";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { usePreviousDayOdometer } from "@/hooks/usePreviousDayOdometer";
import { getStoredUserRole } from "@/utils/roleStorage";
import { showAuthExpiredAlert, showSuccessToast } from "@/utils/alertUtils";
import { TEXT_DASHBOARD } from "@/constants/texts";

import {
  DashboardHeader,
  DashboardStatusBanners,
  DashboardContentTabs,
  DashboardModals,
  useDashboardData,
  useDashboardFleet,
  usePullToRefresh,
  useDashboardUiState,
  useDashboardSyncHandlers,
} from "./dashboard/index";

import { usePageAccess } from "@/context/PageAccessContext";
import {
  PageDisabledState,
  SuperadminMaintenanceBanner,
} from "@/components/pageManagement";

// Dynamic Code Splitting for infrequently visited administration pages
const UserManagementPage = lazy(() =>
  import("./UserManagementPage").then((m) => ({
    default: m.UserManagementPage,
  })),
);

const PageManagementPage = lazy(() =>
  import("./pageManagement/PageManagementPage").then((m) => ({
    default: m.PageManagementPage,
  })),
);

interface Props {
  onLogout: () => void;
  needsReauth?: boolean;
}

export function Dashboard({ onLogout, needsReauth }: Props) {
  const { canAccessPage, isUnderMaintenance } = usePageAccess();
  const currentUserRole = getStoredUserRole();

  // 1. Google Sheets Data & Accumulation Hook
  const {
    sheetUrl,
    handleSetSheetUrl,
    setSelectedRouteCode,
    routeSelectorOpenTrigger,
    setRouteSelectorOpenTrigger,
    selectedTab,
    handleSetSelectedTab,
    isLoading,
    error,
    setError,
    busData,
    setBusData,
    headerMap,
    currentSheetId,
    currentTabName,
    missingColumns,
    sheetSummary,
    refreshKey,
    accRangeDetails,
    activeMonth,
    activeYear,
    headerBlockRef,
    days,
    matchedRoute,
    activeRouteCode,
    operationalReportDate,
    handleLoadData,
    handleSelectTab,
    handleExitAccumulation,
    handleUpdateBus,
    handleApplyAccumulation,
  } = useDashboardData();

  // 2. Global UI, Modal, Swipe & Navigation State Hook
  const {
    isOnline,
    isAuthExpired,
    setIsAuthExpired,
    isReauthenticating,
    setIsReauthenticating,
    isQueueModalOpen,
    setIsQueueModalOpen,
    isAccSheetOpen,
    setIsAccSheetOpen,
    isProfileMenuOpen,
    setIsProfileMenuOpen,
    currentView,
    setCurrentView,
    monitoringDate,
    setMonitoringDate,
    mainTab,
    setMainTab,
    theme,
    toggleTheme,
    handleSwipeNextTab,
    handleSwipePrevTab,
    handleSelectUnit,
  } = useDashboardUiState({
    onClearError: () => setError(null),
  });

  // 3. Fleet Status & Operational Report Hook
  const {
    isReportModalOpen,
    setIsReportModalOpen,
    operationalReportStatus,
    setOperationalReportStatus,
    dynamicRenops,
    activeShift,
    confirmedShifts,
    isShiftConfirmed,
    refreshFleetData,
  } = useDashboardFleet({
    matchedRoute,
    operationalReportDate,
    selectedTab,
    busData,
    currentSheetId,
    currentTabName,
    headerMap,
    setBusData,
  });

  // 4. Offline Queue & Background Sync
  const {
    queue,
    addToQueue,
    processQueue,
    retryItem,
    removeItem,
    resolveConflict,
    forceConflictItem,
  } = useOfflineSync({
    onSyncSuccess: (rowIndex, _sheetId, _tabName, updates) => {
      handleUpdateBus(rowIndex, updates);
      showSuccessToast(TEXT_DASHBOARD.QUEUE_SYNC_SUCCESS);
    },
    onAuthError: () => {
      setIsAuthExpired(true);
      showAuthExpiredAlert(handleReauthenticate);
    },
  });

  // 5. Previous Day Odometer Prefill Hook
  const activeUnits = useMemo(
    () => busData?.map((b) => b.unit),
    [busData],
  );

  const { previousDayKmMap, previousDayRefMap } = usePreviousDayOdometer({
    sheetId: currentSheetId,
    currentTabName,
    activeMonth,
    activeYear,
    routeCode: activeRouteCode,
    activeUnits,
  });

  // 5. Sync, Reauthentication, & Sheet Action Handlers
  const {
    handleDeleteQueueItem,
    handleReauthenticate,
    handleSelectMonitoringRoute,
    handleFormatWholeSheet,
  } = useDashboardSyncHandlers({
    removeItem,
    processQueue,
    currentSheetId,
    currentTabName,
    busData,
    headerMap,
    handleLoadData,
    handleSetSheetUrl,
    handleSetSelectedTab,
    setCurrentView,
    monitoringDate,
    setError,
    setIsAuthExpired,
    setIsReauthenticating,
  });

  // 6. Pull to Refresh Gesture Hook
  const {
    touchStartY,
    pullDistance,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = usePullToRefresh({
    onRefresh: () => handleLoadData(true),
    isOnline,
    onError: (msg: string) => setError(msg),
  });

  // 7. Dynamic Administration & Regional Views
  if (currentView === "page_management") {
    if (currentUserRole !== "superadmin") {
      return (
        <PageDisabledState onBack={() => setCurrentView("dashboard")} />
      );
    }
    return (
      <Suspense fallback={<UserManagementSkeleton />}>
        <PageManagementPage onBack={() => setCurrentView("dashboard")} />
      </Suspense>
    );
  }

  if (currentView === "user_management") {
    if (!canAccessPage("user_management", currentUserRole)) {
      return (
        <PageDisabledState onBack={() => setCurrentView("dashboard")} />
      );
    }
    return (
      <Suspense fallback={<UserManagementSkeleton />}>
        {currentUserRole === "superadmin" && isUnderMaintenance("user_management") && (
          <SuperadminMaintenanceBanner
            onManageAccess={() => setCurrentView("page_management")}
          />
        )}
        <UserManagementPage
          onBack={() => setCurrentView("dashboard")}
          currentUserEmail={localStorage.getItem("PDO_USER_EMAIL") || ""}
          currentUserRole={currentUserRole}
          isDarkMode={theme === "dark"}
        />
      </Suspense>
    );
  }

  if (currentView === "regional_monitoring") {
    if (!canAccessPage("regional_monitoring", currentUserRole)) {
      return (
        <PageDisabledState onBack={() => setCurrentView("dashboard")} />
      );
    }
    return (
      <>
        {currentUserRole === "superadmin" && isUnderMaintenance("regional_monitoring") && (
          <SuperadminMaintenanceBanner
            onManageAccess={() => setCurrentView("page_management")}
          />
        )}
        <AllRouteMonitoringPage
          onBackToRouteView={() => setCurrentView("dashboard")}
          onOpenProfile={() => setIsProfileMenuOpen(true)}
          currentDate={monitoringDate || operationalReportDate}
          onDateChange={(date) => setMonitoringDate(date)}
          currentUserEmail={localStorage.getItem("PDO_USER_EMAIL") || ""}
          onSelectRoute={handleSelectMonitoringRoute}
        />
        <ProfileMenuSheet
          isOpen={isProfileMenuOpen}
          onClose={() => setIsProfileMenuOpen(false)}
          isInMonitoringView={true}
          onReturnToRouteView={() => {
            setIsProfileMenuOpen(false);
            setCurrentView("dashboard");
          }}
          onOpenAccumulation={() => {
            setIsProfileMenuOpen(false);
            setCurrentView("dashboard");
            setIsAccSheetOpen(true);
          }}
          onOpenUserManagement={() => {
            setIsProfileMenuOpen(false);
            setCurrentView("user_management");
          }}
          onOpenPageManagement={() => {
            setIsProfileMenuOpen(false);
            setCurrentView("page_management");
          }}
          isDarkMode={theme === "dark"}
          onToggleTheme={toggleTheme}
          offlineQueueCount={
            queue.filter(
              (q) => q.status === "pending" || q.status === "failed",
            ).length
          }
          isOnline={isOnline}
          onLogout={onLogout}
        />
      </>
    );
  }

  // 8. Main Route Dashboard View
  if (!canAccessPage("dashboard", currentUserRole)) {
    return <PageDisabledState />;
  }

  return (
    <div
      className="app-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {currentUserRole === "superadmin" && isUnderMaintenance("dashboard") && (
        <SuperadminMaintenanceBanner
          onManageAccess={() => setCurrentView("page_management")}
        />
      )}
      {/* 1. Header & Sticky Route Selector */}
      <DashboardHeader
        headerBlockRef={headerBlockRef}
        onOpenProfile={() => setIsProfileMenuOpen(true)}
        activeRouteCode={activeRouteCode}
        onOpenRouteSelector={() =>
          setRouteSelectorOpenTrigger((prev: number) => prev + 1)
        }
        queue={queue}
        onOpenQueue={() => setIsQueueModalOpen(true)}
        sheetUrl={sheetUrl}
        setSheetUrl={handleSetSheetUrl}
        selectedTab={selectedTab}
        setSelectedTab={handleSetSelectedTab}
        days={days}
        isLoading={isLoading}
        isDataLoaded={!!busData}
        currentSheetId={currentSheetId}
        currentTabName={currentTabName}
        onLoadData={(tab?: string, targetUrl?: string) =>
          handleLoadData(true, tab, targetUrl)
        }
        accRange={accRangeDetails}
        onExitAccumulation={handleExitAccumulation}
        reportRoute={matchedRoute}
        reportStatus={operationalReportStatus}
        confirmedShifts={confirmedShifts}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onRouteCodeChange={(code: string) => setSelectedRouteCode(code)}
        routeSelectorOpenTrigger={routeSelectorOpenTrigger}
      />

      {/* 2. Status Banners, Skeletons, & Alerts */}
      <DashboardStatusBanners
        pullDistance={pullDistance}
        touchStartY={touchStartY}
        isRefreshing={isRefreshing}
        isOnline={isOnline}
        isAuthExpired={isAuthExpired}
        isReauthenticating={isReauthenticating}
        onReauthenticate={handleReauthenticate}
        error={error}
        missingColumns={missingColumns}
        needsReauth={needsReauth}
        confirmedShifts={confirmedShifts}
        matchedRoute={matchedRoute}
        selectedTab={selectedTab}
        busData={busData}
        activeShift={activeShift}
        isLoading={isLoading}
        mainTab={mainTab}
      />

      {/* 3. Main Content Swipeable Tabs */}
      {busData && headerMap && (
        <DashboardContentTabs
          mainTab={mainTab}
          onSwipeNext={handleSwipeNextTab}
          onSwipePrev={handleSwipePrevTab}
          onOpenPageManagement={() => setCurrentView("page_management")}
          busData={busData}
          headerMap={headerMap}
          currentSheetId={currentSheetId}
          currentTabName={currentTabName}
          queue={queue}
          addToQueue={addToQueue}
          isLoading={isLoading}
          onUpdateBus={handleUpdateBus}
          accRangeDetails={accRangeDetails}
          onExitAccumulation={() => handleExitAccumulation()}
          isShiftConfirmed={isShiftConfirmed}
          activeShift={activeShift}
          sheetSummary={sheetSummary}
          selectedTab={selectedTab}
          refreshKey={refreshKey}
          sheetUrl={sheetUrl}
          activeMonth={activeMonth}
          activeYear={activeYear}
          onSelectTab={handleSelectTab}
          onSelectUnit={handleSelectUnit}
          missingColumns={missingColumns}
          previousDayKmMap={previousDayKmMap}
          previousDayRefMap={previousDayRefMap}
        />
      )}

      {/* 4. Modals & Bottom Sheets */}
      <DashboardModals
        matchedRoute={matchedRoute}
        selectedTab={selectedTab}
        isReportModalOpen={isReportModalOpen}
        onCloseReportModal={() => setIsReportModalOpen(false)}
        operationalReportDate={operationalReportDate}
        dynamicRenops={dynamicRenops}
        onOperationalStatusChange={setOperationalReportStatus}
        onRefreshFleetData={refreshFleetData}
        busData={busData}
        activeShift={activeShift}
        isQueueModalOpen={isQueueModalOpen}
        onCloseQueueModal={() => setIsQueueModalOpen(false)}
        queue={queue}
        retryItem={retryItem}
        onDeleteQueueItem={handleDeleteQueueItem}
        resolveConflict={resolveConflict}
        forceConflictItem={forceConflictItem}
        processQueue={processQueue}
        isAccSheetOpen={isAccSheetOpen}
        onCloseAccSheet={() => setIsAccSheetOpen(false)}
        activeMonth={activeMonth}
        activeYear={activeYear}
        onResetAccumulation={() => handleExitAccumulation()}
        onApplyAccumulation={handleApplyAccumulation}
        isProfileMenuOpen={isProfileMenuOpen}
        onCloseProfileMenu={() => setIsProfileMenuOpen(false)}
        onOpenAccumulation={() => {
          setIsProfileMenuOpen(false);
          setIsAccSheetOpen(true);
        }}
        onOpenRegionalMonitoring={() => {
          setIsProfileMenuOpen(false);
          setCurrentView("regional_monitoring");
        }}
        isInMonitoringView={false}
        onOpenUserManagement={() => {
          setIsProfileMenuOpen(false);
          setCurrentView("user_management");
        }}
        onOpenPageManagement={() => {
          setIsProfileMenuOpen(false);
          setCurrentView("page_management");
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        isOnline={isOnline}
        onLogout={onLogout}
        onFormatWholeSheet={handleFormatWholeSheet}
        currentTabName={currentTabName}
        hasActiveData={Boolean(
          currentSheetId && currentTabName && busData && busData.length > 0,
        )}
      />

      {/* 5. Mobile Bottom Navigation */}
      <BottomNav
        activeTab={mainTab}
        onSelectTab={setMainTab}
        pendingQueueCount={
          queue.filter((q) => q.status === "pending" || q.status === "failed")
            .length
        }
      />
    </div>
  );
}

export default Dashboard;
