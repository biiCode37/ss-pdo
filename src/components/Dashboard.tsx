import { useState, useEffect, lazy, Suspense } from "react";
import {
  reauthenticateSession,
  formatWholeSheet,
} from "@/services/googleSheets";
import { BottomNav } from "@/components/BottomNav";
import { UserManagementSkeleton } from "@/components/Skeletons";
import { AllRouteMonitoringPage } from "@/components/AllRouteMonitoringPage";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useMobileBackHandler } from "@/hooks/useMobileBackHandler";
import { formatUserError } from "@/utils/errorFormatter";
import { slugifyUnitId } from "@/utils/analytics";
import { getStoredUserRole } from "@/utils/roleStorage";
import {
  showDeleteQueueConfirm,
  showAuthExpiredAlert,
  showSuccessToast,
  showErrorToast,
} from "@/utils/alertUtils";
import { getRoutesFromCache } from "@/utils/cacheUtils";
import { TEXT_DASHBOARD } from "@/constants/texts";

import { DashboardHeader } from "./dashboard/DashboardHeader";
import { DashboardStatusBanners } from "./dashboard/DashboardStatusBanners";
import { DashboardContentTabs } from "./dashboard/DashboardContentTabs";
import { DashboardModals } from "./dashboard/DashboardModals";
import { useDashboardData } from "./dashboard/useDashboardData";
import { useDashboardFleet } from "./dashboard/useDashboardFleet";
import { usePullToRefresh } from "./dashboard/usePullToRefresh";

// Dynamic Code Splitting for infrequently visited administration pages
const UserManagementPage = lazy(() =>
  import("./UserManagementPage").then((m) => ({
    default: m.UserManagementPage,
  })),
);

interface Props {
  onLogout: () => void;
  needsReauth?: boolean;
}

export function Dashboard({ onLogout, needsReauth }: Props) {
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

  // 2. Global System & Offline / Auth States
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAuthExpired, setIsAuthExpired] = useState(false);
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [isAccSheetOpen, setIsAccSheetOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<
    "dashboard" | "user_management" | "regional_monitoring"
  >("dashboard");
  const [monitoringDate, setMonitoringDate] = useState<string | null>(null);

  const [mainTab, setMainTab] = useState<"input" | "analytics" | "units">(
    "analytics",
  );

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (
      (document.documentElement.getAttribute("data-theme") as
        | "light"
        | "dark") || "dark"
    );
  });

  // 3. Fleet Status & Report Hook
  const {
    isReportModalOpen,
    setIsReportModalOpen,
    operationalReportStatus,
    setOperationalReportStatus,
    dynamicRenops,
    activeShift,
    isFleetModalOpen,
    setIsFleetModalOpen,
    confirmedShifts,
    isShiftConfirmed,
    handleConfirmFleetStatus,
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

  // 4. Pull to Refresh Gesture Hook
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

  // 5. Mobile Hardware Back Navigation
  useMobileBackHandler({
    id: "regional_monitoring_view",
    isOpen: currentView === "regional_monitoring",
    onClose: () => setCurrentView("dashboard"),
  });

  useMobileBackHandler({
    id: "user_management_view",
    isOpen: currentView === "user_management",
    onClose: () => setCurrentView("dashboard"),
  });

  useMobileBackHandler({
    id: "profile_menu_sheet",
    isOpen: isProfileMenuOpen,
    onClose: () => setIsProfileMenuOpen(false),
  });

  useMobileBackHandler({
    id: "acc_sheet",
    isOpen: isAccSheetOpen,
    onClose: () => setIsAccSheetOpen(false),
  });

  useMobileBackHandler({
    id: "queue_modal",
    isOpen: isQueueModalOpen,
    onClose: () => setIsQueueModalOpen(false),
  });

  // 6. Offline Queue & Background Sync
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

  const handleDeleteQueueItem = async (itemId: string) => {
    const confirmed = await showDeleteQueueConfirm();
    if (confirmed) {
      removeItem(itemId);
      showSuccessToast(TEXT_DASHBOARD.QUEUE_ITEM_DELETED);
    }
  };

  const handleReauthenticate = async () => {
    setIsReauthenticating(true);
    try {
      await reauthenticateSession();
      setIsAuthExpired(false);
      setError(null);
      if (currentSheetId && currentTabName) {
        handleLoadData(true, currentTabName);
      }
      try {
        await processQueue();
      } catch (queueError: any) {
        console.warn("Error processing queue after re-auth:", queueError);
      }
      showSuccessToast(TEXT_DASHBOARD.SESSION_REFRESH_SUCCESS);
    } catch (err: any) {
      const errFormatted = formatUserError(
        err,
        TEXT_DASHBOARD.SESSION_REFRESH_FAIL,
      );
      setError(errFormatted);
      if (errFormatted) {
        showErrorToast(errFormatted);
      }
    } finally {
      setIsReauthenticating(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("PDO_THEME", newTheme);
  };

  const mainTabs: Array<"input" | "analytics" | "units"> = [
    "input",
    "analytics",
    "units",
  ];

  const handleSwipeNextTab = () => {
    setMainTab((prev) => {
      const currentIndex = mainTabs.indexOf(prev);
      const nextIndex = (currentIndex + 1) % mainTabs.length;
      return mainTabs[nextIndex];
    });
  };

  const handleSwipePrevTab = () => {
    setMainTab((prev) => {
      const currentIndex = mainTabs.indexOf(prev);
      const prevIndex = (currentIndex - 1 + mainTabs.length) % mainTabs.length;
      return mainTabs[prevIndex];
    });
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      setIsAuthExpired(true);
    };
    const handleLoginSuccess = () => {
      setIsAuthExpired(false);
      setError(null);
    };
    window.addEventListener("google-auth-expired", handleAuthExpired);
    window.addEventListener("google-login-success", handleLoginSuccess);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("google-auth-expired", handleAuthExpired);
      window.removeEventListener("google-login-success", handleLoginSuccess);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 7. Dynamic Administration & Regional Views
  if (currentView === "user_management") {
    return (
      <Suspense fallback={<UserManagementSkeleton />}>
        <UserManagementPage
          onBack={() => setCurrentView("dashboard")}
          currentUserEmail={localStorage.getItem("PDO_USER_EMAIL") || ""}
          currentUserRole={getStoredUserRole()}
          isDarkMode={theme === "dark"}
        />
      </Suspense>
    );
  }

  if (currentView === "regional_monitoring") {
    return (
      <AllRouteMonitoringPage
        onBackToRouteView={() => setCurrentView("dashboard")}
        currentDate={monitoringDate || operationalReportDate}
        onDateChange={(date) => setMonitoringDate(date)}
        currentUserEmail={localStorage.getItem("PDO_USER_EMAIL") || ""}
        onSelectRoute={(routeCode) => {
          const cachedRoutes = getRoutesFromCache();
          const matched = cachedRoutes.find(
            (r: any) =>
              r.route_code?.toLowerCase() === routeCode.toLowerCase() ||
              r.name?.toLowerCase().includes(routeCode.toLowerCase()),
          );
          if (
            matched &&
            matched.route_sheets &&
            matched.route_sheets.length > 0
          ) {
            const latestSheet =
              matched.route_sheets[matched.route_sheets.length - 1];
            if (latestSheet && latestSheet.sheet_url) {
              handleSetSheetUrl(latestSheet.sheet_url);
            }
          }
          if (monitoringDate) {
            const day = String(parseInt(monitoringDate.split("-")[2], 10));
            handleSetSelectedTab(day);
          }
          setCurrentView("dashboard");
        }}
      />
    );
  }

  // 8. Main Route Dashboard View
  return (
    <div
      className="app-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
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
        onOpenFleetModal={() => setIsFleetModalOpen(true)}
        isLoading={isLoading}
        mainTab={mainTab}
      />

      {/* 3. Main Content Swipeable Tabs */}
      {busData && headerMap && (
        <DashboardContentTabs
          mainTab={mainTab}
          onSwipeNext={handleSwipeNextTab}
          onSwipePrev={handleSwipePrevTab}
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
          onOpenFleetStatus={() => setIsFleetModalOpen(true)}
          sheetSummary={sheetSummary}
          selectedTab={selectedTab}
          refreshKey={refreshKey}
          sheetUrl={sheetUrl}
          activeMonth={activeMonth}
          activeYear={activeYear}
          onSelectTab={handleSelectTab}
          onSelectUnit={(unit: string) => {
            setMainTab("units");
            setTimeout(() => {
              const slug = slugifyUnitId(unit);
              const el =
                document.getElementById(`unit-card-${slug}`) ||
                document.getElementById(`bus-card-${slug}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.remove("bus-card-highlight");
                void el.offsetWidth;
                el.classList.add("bus-card-highlight");
                setTimeout(() => {
                  el.classList.remove("bus-card-highlight");
                }, 6000);
              }
            }, 150);
          }}
          missingColumns={missingColumns}
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
        busData={busData}
        isFleetModalOpen={isFleetModalOpen}
        onCloseFleetModal={() => setIsFleetModalOpen(false)}
        activeShift={activeShift}
        onConfirmFleetStatus={handleConfirmFleetStatus}
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
        onOpenAccumulation={() => setIsAccSheetOpen(true)}
        onOpenRegionalMonitoring={() => {
          setIsProfileMenuOpen(false);
          setCurrentView("regional_monitoring");
        }}
        onOpenUserManagement={() => {
          setIsProfileMenuOpen(false);
          setCurrentView("user_management");
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        isOnline={isOnline}
        onLogout={onLogout}
        onFormatWholeSheet={async () => {
          if (!currentSheetId || !currentTabName || !busData || !headerMap) {
            throw new Error(TEXT_DASHBOARD.SHEET_NOT_LOADED);
          }
          await formatWholeSheet(
            currentSheetId,
            currentTabName,
            busData,
            headerMap,
          );
        }}
        currentTabName={currentTabName}
        hasActiveData={Boolean(
          currentSheetId && currentTabName && busData && busData.length > 0,
        )}
      />

      {/* 5. Mobile Bottom Navigation */}
      <BottomNav
        activeTab={mainTab}
        onSelectTab={setMainTab}
        onOpenMore={() => setIsProfileMenuOpen(true)}
        pendingQueueCount={
          queue.filter((q) => q.status === "pending" || q.status === "failed")
            .length
        }
      />
    </div>
  );
}

export default Dashboard;
