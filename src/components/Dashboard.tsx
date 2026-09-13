import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import {
  getBusData,
  getAccumulatedBusData,
  reauthenticateSession,
  formatWholeSheet,
  updateBulkBusData,
} from "@/services/googleSheets";
import { extractSpreadsheetId } from "@/utils/sheetIdentity";
import { getRenopsForDate } from "@/utils/holidayUtils";
import { combineShiftKeterangan, cleanShiftNote } from "@/utils/keteranganUtils";
import {
  fetchDailyRouteReport,
  upsertDailyRouteReport,
  recordFleetStatusAuditLog,
} from "@/services/dailyRouteReportService";
import type { FleetUnitStatusDetail } from "@/types/supabase";
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
import { getCrossPeriodAccumulation } from "@/services/routeService";
import {
  getMonthYearForSheet,
  getRouteCodeForSheet,
  getRoutesFromCache,
} from "@/utils/cacheUtils";
import { TEXT_DASHBOARD, TEXT_FLEET_STATUS } from "@/constants/texts";

import { DashboardHeader } from "./dashboard/DashboardHeader";
import { DashboardStatusBanners } from "./dashboard/DashboardStatusBanners";
import { DashboardContentTabs } from "./dashboard/DashboardContentTabs";
import { DashboardModals } from "./dashboard/DashboardModals";

// Dynamic Code Splitting for infrequently visited administration pages
const UserManagementPage = lazy(() =>
  import("./UserManagementPage").then((m) => ({ default: m.UserManagementPage }))
);

interface Props {
  onLogout: () => void;
  needsReauth?: boolean;
}

export function Dashboard({ onLogout, needsReauth }: Props) {
  const [sheetUrl, setSheetUrl] = useState(() => {
    try {
      const saved = localStorage.getItem("PDO_LAST_VISITED");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.sheetUrl || "";
      }
    } catch (_e) {}
    return "";
  });

  const [selectedRouteCode, setSelectedRouteCode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("PDO_LAST_VISITED");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.routeCode || "";
      }
    } catch (_e) {}
    return "";
  });
  const [routeSelectorOpenTrigger, setRouteSelectorOpenTrigger] = useState(0);

  const [selectedTab, setSelectedTab] = useState(() =>
    String(new Date().getDate()),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<"input" | "analytics" | "units">(
    "analytics",
  );

  // Route Management State
  const [busData, setBusData] = useState<BusData[] | null>(null);
  const [headerMap, setHeaderMap] = useState<HeaderMap | null>(null);
  const [currentSheetId, setCurrentSheetId] = useState<string>("");
  const [currentTabName, setCurrentTabName] = useState<string>("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [sheetSummary, setSheetSummary] = useState<Record<string, number>>({});
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (
      (document.documentElement.getAttribute("data-theme") as
        | "light"
        | "dark") || "dark"
    );
  });

  const [touchStartY, setTouchStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);

  const [isAuthExpired, setIsAuthExpired] = useState(false);
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const [isAccSheetOpen, setIsAccSheetOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<
    "dashboard" | "user_management" | "regional_monitoring"
  >("dashboard");

  // Mobile Back Navigation Handlers (PWA / Mobile hardware gesture support)
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

  // Track custom accumulation range for startDay parameter
  const [accRange, setAccRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [accRangeDetails, setAccRangeDetails] = useState<{
    startDay: number;
    startMonth: number;
    startYear: number;
    endDay: number;
    endMonth: number;
    endYear: number;
  } | null>(null);

  // Memoized activeMonth and activeYear from cached routes
  const { activeMonth, activeYear } = useMemo(() => {
    const { month, year } = getMonthYearForSheet(sheetUrl);
    return { activeMonth: month, activeYear: year };
  }, [sheetUrl]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);
  const headerBlockRef = useRef<HTMLDivElement>(null);

  // Ref sinkron untuk sheetUrl/selectedTab
  const sheetUrlRef = useRef(sheetUrl);
  const selectedTabRef = useRef(selectedTab);

  const handleSetSheetUrl = (url: string) => {
    sheetUrlRef.current = url;
    setSheetUrl(url);
  };

  const handleSetSelectedTab = (tab: string) => {
    selectedTabRef.current = tab;
    setSelectedTab(tab);
    if (tab !== "AKUMULASI") {
      setAccRange(null);
      setAccRangeDetails(null);
    }
  };

  useEffect(() => {
    sheetUrlRef.current = sheetUrl;
  }, [sheetUrl]);
  useEffect(() => {
    selectedTabRef.current = selectedTab;
  }, [selectedTab]);

  useEffect(() => {
    const el = headerBlockRef.current;
    if (!el) return;

    const updateHeight = () => {
      const h = el.offsetHeight;
      document.documentElement.style.setProperty(
        "--sticky-header-height",
        `${h}px`,
      );
    };

    updateHeight();

    const ro = new ResizeObserver(() => {
      updateHeight();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
    };
  }, []);

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

  const didInitialAutoLoadRef = useRef(false);
  useEffect(() => {
    if (didInitialAutoLoadRef.current) return;
    if (!sheetUrlRef.current || busData) return;
    didInitialAutoLoadRef.current = true;
    handleLoadData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLoadData(
    isRefresh = false,
    targetTab?: string,
    targetSheetUrl?: string,
  ) {
    const currentSheetUrl = targetSheetUrl || sheetUrlRef.current;
    const activeTab = targetTab || selectedTabRef.current;
    if (!currentSheetUrl) {
      setError(TEXT_DASHBOARD.SELECT_ROUTE_FIRST);
      return;
    }

    const sheetId = extractSpreadsheetId(currentSheetUrl);
    if (!sheetId) {
      setError(TEXT_DASHBOARD.INVALID_SHEET_LINK);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    setIsLoading(true);
    setError(null);

    if (isRefresh || sheetId !== currentSheetId) {
      setRefreshKey((prev) => prev + 1);
    }

    try {
      let result: any = null;
      if (activeTab === "AKUMULASI") {
        const activeRouteCode = getRouteCodeForSheet(sheetId || currentSheetUrl);

        if (activeRouteCode && accRangeDetails) {
          const cross = await getCrossPeriodAccumulation(
            activeRouteCode,
            accRangeDetails.startYear,
            accRangeDetails.startMonth,
            accRangeDetails.startDay,
            accRangeDetails.endYear,
            accRangeDetails.endMonth,
            accRangeDetails.endDay,
          );
          if (cross && cross.data.length > 0) {
            result = {
              data: cross.data,
              headerMap: {},
              missingColumns: [],
              sheetSummary: {},
            };
          }
        }

        if (!result) {
          result = await getAccumulatedBusData(
            sheetId,
            accRange?.end ?? new Date().getDate(),
            accRange?.start ?? 1,
          );
        }
      } else {
        result = await getBusData(sheetId, activeTab);
      }

      const {
        data,
        headerMap,
        missingColumns: missing,
        sheetSummary: summary,
      } = result;

      if (currentRequestId !== requestIdRef.current) return;

      setBusData(data);
      setHeaderMap(headerMap);
      setCurrentSheetId(sheetId);
      setCurrentTabName(activeTab);
      handleSetSelectedTab(activeTab);
      setMissingColumns(missing);
      setSheetSummary(summary || {});
    } catch (err: any) {
      if (currentRequestId !== requestIdRef.current) return;
      if (err.name === "AbortError") return;

      setError(formatUserError(err, TEXT_DASHBOARD.LOAD_DATA_FAIL));
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }

  const handleSelectTab = async (newTab: string) => {
    handleSetSelectedTab(newTab);
    if (currentSheetId || sheetUrlRef.current) {
      await handleLoadData(false, newTab);
    }
  };

  const handleExitAccumulation = async (targetDay?: string) => {
    const today = String(new Date().getDate());
    const dayToSelect =
      targetDay || (days.includes(today) ? today : days[0] || "1");
    setAccRange(null);
    setAccRangeDetails(null);
    handleSetSelectedTab(dayToSelect);
    if (currentSheetId || sheetUrlRef.current) {
      await handleLoadData(false, dayToSelect);
    }
  };

  const handleUpdateBus = (rowIndex: number, updates: Partial<BusData>) => {
    setBusData((prevData) => {
      if (!prevData) return prevData;
      return prevData.map((bus) =>
        bus.rowIndex === rowIndex ? { ...bus, ...updates } : bus,
      );
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStartY(e.touches[0].clientY);
    } else {
      setTouchStartY(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0) {
      setPullDistance(Math.min(diff, 100));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      if (!isOnline) {
        setError(TEXT_DASHBOARD.REFRESH_OFFLINE_ERR);
        setIsRefreshing(false);
        setPullDistance(0);
        setTouchStartY(0);
        return;
      }
      setIsRefreshing(true);
      handleLoadData(true).finally(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        setTouchStartY(0);
      });
    } else {
      setPullDistance(0);
      setTouchStartY(0);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

  const currentRouteCode = useMemo(() => {
    return getRouteCodeForSheet(currentSheetId || sheetUrl) || "";
  }, [currentSheetId, sheetUrl]);

  const matchedRoute = useMemo(() => {
    if (!currentRouteCode) return null;
    const cached = getRoutesFromCache();
    return cached.find((r) => r.route_code === currentRouteCode) || null;
  }, [currentRouteCode]);

  const activeRouteCode = useMemo(() => {
    return (
      matchedRoute?.route_code ||
      currentRouteCode ||
      selectedRouteCode ||
      TEXT_DASHBOARD.HEADER.DEFAULT_PICK_ROUTE
    );
  }, [matchedRoute, currentRouteCode, selectedRouteCode]);

  const operationalReportDate = useMemo(() => {
    const rawTab = currentTabName || selectedTab;
    const dayNum = parseInt(rawTab, 10);
    if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
      return `${activeYear}-${String(activeMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    }
    return new Date().toISOString().split("T")[0];
  }, [currentTabName, selectedTab, activeYear, activeMonth]);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [operationalReportStatus, setOperationalReportStatus] = useState<
    "draft" | "submitted" | "verified"
  >("draft");
  const [monitoringDate, setMonitoringDate] = useState<string | null>(null);

  const dynamicRenops = useMemo(() => {
    return getRenopsForDate(matchedRoute, operationalReportDate);
  }, [matchedRoute, operationalReportDate]);

  const activeShift: 1 | 2 = new Date().getHours() >= 14 ? 2 : 1;
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [confirmedShifts, setConfirmedShifts] = useState<{
    1: boolean;
    2: boolean;
  }>({
    1: false,
    2: false,
  });

  useEffect(() => {
    let isMounted = true;
    if (matchedRoute?.id && operationalReportDate) {
      fetchDailyRouteReport(matchedRoute.id, operationalReportDate)
        .then((report) => {
          if (isMounted) {
            setOperationalReportStatus(report?.status || "draft");
            setConfirmedShifts({
              1: Boolean(
                report?.is_fleet_confirmed_s1 ??
                  (report &&
                    (report.realops_shift1 > 0 ||
                      report.status === "submitted" ||
                      report.status === "verified")),
              ),
              2: Boolean(
                report?.is_fleet_confirmed_s2 ??
                  (report &&
                    (report.realops_shift2 > 0 ||
                      report.status === "submitted" ||
                      report.status === "verified")),
              ),
            });
          }
        })
        .catch(() => {
          if (isMounted) {
            setOperationalReportStatus("draft");
            setConfirmedShifts({ 1: false, 2: false });
          }
        });
    } else {
      setOperationalReportStatus("draft");
      setConfirmedShifts({ 1: false, 2: false });
    }
    return () => {
      isMounted = false;
    };
  }, [matchedRoute?.id, operationalReportDate]);

  const isPastDate = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return operationalReportDate < todayStr;
  }, [operationalReportDate]);

  const isShiftConfirmed = useMemo(() => {
    if (selectedTab === "AKUMULASI") return true;
    if (confirmedShifts[activeShift]) return true;

    if (isPastDate && busData && busData.length > 0) {
      const hasAnyData = busData.some((b) => {
        const ket = (b.keterangan || "").trim();
        const hasToa =
          Boolean(b.totalToa && b.totalToa !== "0") ||
          Boolean(b.toaShift1 && b.toaShift1 !== "0");
        const hasKm = Boolean(b.kmAkhir1 || b.kmAkhir2);
        return ket.length > 0 || hasToa || hasKm;
      });
      if (hasAnyData) return true;
    }

    return false;
  }, [selectedTab, confirmedShifts, activeShift, isPastDate, busData]);

  const handleConfirmFleetStatus = async (
    shift: 1 | 2,
    statusMap: Map<number, { s1: string; s2: string }>,
  ) => {
    if (!currentSheetId || !currentTabName || !headerMap) return;

    let realopsS1 = 0;
    let realopsS2 = 0;
    const updatesList: { rowIndex: number; updates: Partial<BusData> }[] = [];

    for (const [rowIndex, val] of statusMap.entries()) {
      const cleanS1 = cleanShiftNote(val.s1);
      const cleanS2 = cleanShiftNote(val.s2);
      if (!cleanS1) realopsS1++;
      if (!cleanS2) realopsS2++;

      const combinedKeterangan = combineShiftKeterangan(val.s1, val.s2);
      updatesList.push({
        rowIndex,
        updates: { keterangan: combinedKeterangan },
      });
    }

    try {
      await updateBulkBusData(
        currentSheetId,
        currentTabName,
        updatesList,
        headerMap,
      );

      setBusData((prev) =>
        prev
          ? prev.map((bus) => {
              const match = updatesList.find((u) => u.rowIndex === bus.rowIndex);
              return match ? { ...bus, ...match.updates } : bus;
            })
          : null,
      );

      if (matchedRoute?.id && operationalReportDate) {
        const nonSgoUnits: FleetUnitStatusDetail[] = [];
        let offCount = 0;
        let toCount = 0;

        for (const bus of busData || []) {
          const unitVal = statusMap.get(bus.rowIndex);
          const note = cleanShiftNote(shift === 1 ? unitVal?.s1 : unitVal?.s2);
          if (note) {
            const isOff = note.toUpperCase().includes("OFF");
            if (isOff) offCount++;
            else toCount++;

            nonSgoUnits.push({
              unit: bus.unit,
              note,
              isOff,
            });
          }
        }

        const totalUnits = busData?.length || 0;
        const sgoCount = Math.max(0, totalUnits - nonSgoUnits.length);

        await upsertDailyRouteReport({
          route_id: matchedRoute.id,
          route_code: matchedRoute.route_code,
          date: operationalReportDate,
          renops_shift1: dynamicRenops.renops,
          realops_shift1: realopsS1,
          renops_shift2: dynamicRenops.renops,
          realops_shift2: realopsS2,
          headway_fastest: 3,
          headway_slowest: 10,
          traffic_jam_spots: matchedRoute.default_traffic_jam_spots || [],
          status: operationalReportStatus || "draft",
          ...(shift === 1
            ? {
                fleet_status_shift1: nonSgoUnits,
                is_fleet_confirmed_s1: true,
                fleet_confirmed_s1_at: new Date().toISOString(),
              }
            : {
                fleet_status_shift2: nonSgoUnits,
                is_fleet_confirmed_s2: true,
                fleet_confirmed_s2_at: new Date().toISOString(),
              }),
        });

        await recordFleetStatusAuditLog({
          route_id: matchedRoute.id,
          route_code: matchedRoute.route_code,
          date: operationalReportDate,
          shift,
          sgo_count: sgoCount,
          to_count: toCount,
          off_count: offCount,
          total_units: totalUnits,
          fleet_status: nonSgoUnits,
          confirmed_by: localStorage.getItem("PDO_USER_EMAIL") || undefined,
        });
      }

      setConfirmedShifts((prev) => ({ ...prev, [shift]: true }));
      showSuccessToast(TEXT_FLEET_STATUS.TOAST.APPLY_SUCCESS(shift));
    } catch (err: any) {
      console.warn("[Dashboard] Gagal menerapkan status armada:", err);
      const friendlyErr = formatUserError(
        err,
        TEXT_FLEET_STATUS.TOAST.APPLY_ERROR,
      );
      if (friendlyErr) {
        showErrorToast(friendlyErr);
      }
      throw err;
    }
  };

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
          if (matched && matched.route_sheets && matched.route_sheets.length > 0) {
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
          setRouteSelectorOpenTrigger((prev) => prev + 1)
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
        onLoadData={(tab, targetUrl) => handleLoadData(true, tab, targetUrl)}
        accRange={accRangeDetails}
        onExitAccumulation={handleExitAccumulation}
        reportRoute={matchedRoute}
        reportStatus={operationalReportStatus}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onRouteCodeChange={(code) => setSelectedRouteCode(code)}
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
          onSelectUnit={(unit) => {
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
        onApplyAccumulation={async (
          sDay,
          sMonth,
          sYear,
          eDay,
          eMonth,
          eYear,
        ) => {
          setAccRangeDetails({
            startDay: sDay,
            startMonth: sMonth,
            startYear: sYear,
            endDay: eDay,
            endMonth: eMonth,
            endYear: eYear,
          });
          setAccRange({ start: sDay, end: eDay });
          setSelectedTab("AKUMULASI");
          setIsLoading(true);
          setError(null);

          try {
            const activeRouteCode = getRouteCodeForSheet(sheetUrl);
            let crossResult = null;
            if (activeRouteCode) {
              crossResult = await getCrossPeriodAccumulation(
                activeRouteCode,
                sYear,
                sMonth,
                sDay,
                eYear,
                eMonth,
                eDay,
              );
            }

            if (crossResult && crossResult.data.length > 0) {
              setBusData(crossResult.data);
              setCurrentTabName("AKUMULASI");
              setSheetSummary({});
              setRefreshKey((prev) => prev + 1);
            } else {
              let targetSheetId =
                currentSheetId || extractSpreadsheetId(sheetUrl);
              if (activeRouteCode) {
                const routes = getRoutesFromCache();
                const route = routes.find(
                  (r: any) => r.route_code === activeRouteCode,
                );
                const matchSheet = route?.route_sheets?.find(
                  (s: any) => s.month === eMonth && s.year === eYear,
                );
                if (matchSheet) {
                  const mUrl = matchSheet.sheet_url;
                  setSheetUrl(mUrl);
                  targetSheetId =
                    extractSpreadsheetId(matchSheet.spreadsheet_id) ||
                    extractSpreadsheetId(mUrl);
                }
              }

              if (targetSheetId) {
                const result = await getAccumulatedBusData(
                  targetSheetId,
                  eDay,
                  sDay,
                );
                setBusData(result.data);
                setHeaderMap(result.headerMap);
                setCurrentSheetId(targetSheetId);
                setCurrentTabName("AKUMULASI");
                setMissingColumns(result.missingColumns);
                setSheetSummary(result.sheetSummary || {});
                setRefreshKey((prev) => prev + 1);
              }
            }
          } catch (err: any) {
            setError(formatUserError(err, TEXT_DASHBOARD.ACCUMULATION_LOAD_FAIL));
          } finally {
            setIsLoading(false);
          }
        }}
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
