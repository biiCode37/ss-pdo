import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import type { BusData, HeaderMap } from "../services/googleSheets";
import {
  getBusData,
  getAccumulatedBusData,
  reauthenticateSession,
  formatWholeSheet,
  isUsingServiceAccount,
  updateBulkBusData,
} from "../services/googleSheets";
import { extractSpreadsheetId } from "../utils/sheetIdentity";
import { BusList } from "./BusList";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { ProfileMenuSheet } from "./ProfileMenuSheet";
import { UserProfileHeader } from "./UserProfileHeader";
import { RouteSelectorCard } from "./RouteSelectorCard";
import { RouteOperationalReportCard } from "./RouteOperationalReportCard";
import { ShiftConfirmationAlertBar } from "./fleetStatus/ShiftConfirmationAlertBar";
import { FleetStatusModal } from "./fleetStatus/FleetStatusModal";
import { getRenopsForDate } from "../utils/holidayUtils";
import { combineShiftKeterangan, cleanShiftNote } from "../utils/keteranganUtils";
import { fetchDailyRouteReport, upsertDailyRouteReport } from "../services/dailyRouteReportService";
import { SwipeableContainer } from "./SwipeableContainer";
import { BottomNav } from "./BottomNav";
import { UserManagementSkeleton } from "./Skeletons";

// Dynamic Code Splitting for infrequently visited administration pages
const UserManagementPage = lazy(() =>
  import("./UserManagementPage").then((m) => ({ default: m.UserManagementPage }))
);
import { AllRouteMonitoringPage } from "./AllRouteMonitoringPage";
import {
  CloudOff,
  RefreshCw,
  AlertTriangle,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { QueueModal } from "./QueueModal";
import { useOfflineSync } from "../hooks/useOfflineSync";
import { useMobileBackHandler } from "../hooks/useMobileBackHandler";
import { formatUserError } from "../utils/errorFormatter";
import { extractMonthYearLabel, slugifyUnitId } from "../utils/analytics";
import { getStoredUserRole } from "../utils/roleStorage";
import {
  showDeleteQueueConfirm,
  showAuthExpiredAlert,
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  showWarningToast,
} from "../utils/alertUtils";

import { UnitSummaryDashboard } from "./UnitSummaryDashboard";
import { AccumulationSheet } from "./AccumulationSheet";
import { getCrossPeriodAccumulation } from "../services/routeService";
import {
  getMonthYearForSheet,
  getRouteCodeForSheet,
  getRoutesFromCache,
} from "../utils/cacheUtils";
import {
  BusCardSkeleton,
  DailyToaTrendSkeleton,
  UnitCardSkeleton,
} from "./Skeletons";
import { TEXT_DASHBOARD, TEXT_AUTH, TEXT_COMMON } from "../constants/texts";

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
  const [currentView, setCurrentView] = useState<'dashboard' | 'user_management' | 'regional_monitoring'>('dashboard');

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

  // ponytail: track custom accumulation range for startDay parameter
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

  // Memoized activeMonth and activeYear from cached routes (SOL-R6-017 / SOL-R6-018)
  const { activeMonth, activeYear } = useMemo(() => {
    const { month, year } = getMonthYearForSheet(sheetUrl);
    return { activeMonth: month, activeYear: year };
  }, [sheetUrl]);

  // BUG-15: ResizeObserver cleanup properly handled via dependency array
  // BUG-19: Request ID tracking for race condition protection
  // BUG-19: Use AbortController for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);
  const headerBlockRef = useRef<HTMLDivElement>(null);

  // ROUTE-12-01: Ref sinkron untuk sheetUrl/selectedTab — membaca state TERBARU
  // seketika tanpa delay 1 siklus render useEffect
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
      document.documentElement.style.setProperty("--sticky-header-height", `${h}px`);
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
      // BUG-06: Update busData saat sinkronisasi antrean berhasil
      // Ini mencegah false positive "Tabrakan Data" pada edit berikutnya
      handleUpdateBus(rowIndex, updates);
      showSuccessToast(TEXT_DASHBOARD.QUEUE_SYNC_SUCCESS);
    },
    onAuthError: () => {
      // BUG-23: Handle auth error when offline sync queue encounters 401 session expiry
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
      // BUG-21: Wrap processQueue to catch errors
      try {
        await processQueue();
      } catch (queueError: any) {
        console.warn('Error processing queue after re-auth:', queueError);
        // Silently continue, the main process was already handled by handleLoadData
      }
      showSuccessToast(TEXT_DASHBOARD.SESSION_REFRESH_SUCCESS);
    } catch (err: any) {
      const errFormatted = formatUserError(err, TEXT_DASHBOARD.SESSION_REFRESH_FAIL);
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
    // Listen for auth expiration / login success events
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

  // BUG-68: Auto-load HANYA sekali saat cold-start (jika ada sheetUrl
  // tersimpan dari localStorage). Pemilihan/ubahan dropdown (tahun, bulan,
  // rute, tanggal) TIDAK memicu load — hanya tombol "Load Data".
  const didInitialAutoLoadRef = useRef(false);
  useEffect(() => {
    if (didInitialAutoLoadRef.current) return;
    if (!sheetUrlRef.current || busData) return;
    didInitialAutoLoadRef.current = true;
    handleLoadData(false);
    // Mount-only; sheetUrl/busData dibaca via ref agar selalu fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLoadData(isRefresh = false, targetTab?: string, targetSheetUrl?: string) {
    // ROUTE-12-01: Baca dari targetSheetUrl eksplisit jika tersedia, atau baca dari ref terkini
    const currentSheetUrl = targetSheetUrl || sheetUrlRef.current;
    const activeTab = targetTab || selectedTabRef.current;
    if (!currentSheetUrl) {
      setError(TEXT_DASHBOARD.SELECT_ROUTE_FIRST);
      return;
    }

    const sheetId = extractSpreadsheetId(currentSheetUrl);
    if (!sheetId) {
      setError(
        TEXT_DASHBOARD.INVALID_SHEET_LINK,
      );
      return;
    }

    // BUG-19: Cancel previous request before starting new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    setIsLoading(true);
    setError(null);
    // Keep previous busData in memory while loading new date data to prevent component unmounting/flicker

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
      setMissingColumns(missing);
      setSheetSummary(summary || {});
    } catch (err: any) {
      if (currentRequestId !== requestIdRef.current) return;
      if (err.name === "AbortError") return;

      setError(
        formatUserError(
          err,
          TEXT_DASHBOARD.LOAD_DATA_FAIL,
        ),
      );
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  // BUG-20: Handle async tab selection properly (untuk tab bar / chart analitik)
  const handleSelectTab = async (newTab: string) => {
    handleSetSelectedTab(newTab);
    if (currentSheetId || sheetUrlRef.current) {
      await handleLoadData(false, newTab);
    }
  };

  // ACC-17-01: Handler untuk keluar dari mode akumulasi kembali ke mode tanggal harian
  const handleExitAccumulation = async (targetDay?: string) => {
    const today = String(new Date().getDate());
    const dayToSelect = targetDay || (days.includes(today) ? today : (days[0] || "1"));
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
      setPullDistance(Math.min(diff, 100)); // cap at 100px
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      // BUG-14: Cek status online sebelum refresh
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

  // Generate options for days 1-31
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
    return matchedRoute?.route_code || currentRouteCode || selectedRouteCode || "Pilih Rute";
  }, [matchedRoute, currentRouteCode, selectedRouteCode]);

  const operationalReportDate = useMemo(() => {
    const dayNum = parseInt(selectedTab, 10);
    if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
      return `${activeYear}-${String(activeMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    }
    return new Date().toISOString().split("T")[0];
  }, [selectedTab, activeYear, activeMonth]);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [operationalReportStatus, setOperationalReportStatus] = useState<'draft' | 'submitted' | 'verified'>('draft');

  const dynamicRenops = useMemo(() => {
    return getRenopsForDate(matchedRoute, operationalReportDate);
  }, [matchedRoute, operationalReportDate]);

  const activeShift: 1 | 2 = new Date().getHours() >= 14 ? 2 : 1;
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [confirmedShifts, setConfirmedShifts] = useState<{ 1: boolean; 2: boolean }>({
    1: false,
    2: false,
  });

  useEffect(() => {
    let isMounted = true;
    if (matchedRoute?.id && operationalReportDate) {
      fetchDailyRouteReport(matchedRoute.id, operationalReportDate)
        .then((report) => {
          if (isMounted) {
            setOperationalReportStatus(report?.status || 'draft');
            setConfirmedShifts({
              1: Boolean(report && (report.realops_shift1 > 0 || report.status === 'submitted' || report.status === 'verified')),
              2: Boolean(report && (report.realops_shift2 > 0 || report.status === 'submitted' || report.status === 'verified')),
            });
          }
        })
        .catch(() => {
          if (isMounted) {
            setOperationalReportStatus('draft');
            setConfirmedShifts({ 1: false, 2: false });
          }
        });
    } else {
      setOperationalReportStatus('draft');
      setConfirmedShifts({ 1: false, 2: false });
    }
    return () => {
      isMounted = false;
    };
  }, [matchedRoute?.id, operationalReportDate]);

  const handleConfirmFleetStatus = async (
    shift: 1 | 2,
    statusMap: Map<number, { s1: string; s2: string }>
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
      await updateBulkBusData(currentSheetId, currentTabName, updatesList, headerMap);

      setBusData((prev) =>
        prev
          ? prev.map((bus) => {
              const match = updatesList.find((u) => u.rowIndex === bus.rowIndex);
              return match ? { ...bus, ...match.updates } : bus;
            })
          : null
      );

      if (matchedRoute?.id && operationalReportDate) {
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
          status: 'draft',
        });
      }

      setConfirmedShifts((prev) => ({ ...prev, [shift]: true }));
      showSuccessToast(`Status armada Shift ${shift} berhasil diterapkan!`);
    } catch (err: any) {
      console.warn('[Dashboard] Gagal menerapkan status armada:', err);
      showErrorToast(err?.message || 'Gagal menerapkan status armada');
      throw err;
    }
  };

  if (currentView === 'user_management') {
    return (
      <Suspense fallback={<UserManagementSkeleton />}>
        <UserManagementPage
          onBack={() => setCurrentView('dashboard')}
          currentUserEmail={localStorage.getItem("PDO_USER_EMAIL") || ""}
          currentUserRole={getStoredUserRole()}
          isDarkMode={theme === "dark"}
        />
      </Suspense>
    );
  }

  if (currentView === 'regional_monitoring') {
    return (
      <AllRouteMonitoringPage
        onBackToRouteView={() => setCurrentView('dashboard')}
        currentDate={operationalReportDate}
        currentUserEmail={localStorage.getItem("PDO_USER_EMAIL") || ""}
        onSelectRoute={(routeCode) => {
          const cachedRoutes = getRoutesFromCache();
          const matched = cachedRoutes.find((r: any) =>
            r.route_code?.toLowerCase() === routeCode.toLowerCase() ||
            r.name?.toLowerCase().includes(routeCode.toLowerCase())
          );
          if (matched && matched.route_sheets && matched.route_sheets.length > 0) {
            const latestSheet = matched.route_sheets[matched.route_sheets.length - 1];
            if (latestSheet && latestSheet.sheet_url) {
              handleSetSheetUrl(latestSheet.sheet_url);
            }
          }
          setCurrentView('dashboard');
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
      <div
        style={{
          height: pullDistance > 0 ? `${pullDistance}px` : "0",
          overflow: "hidden",
          transition: touchStartY === 0 ? "height 0.3s ease" : "none",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            transform: `rotate(${pullDistance * 3}deg)`,
            color: "var(--accent-color)",
          }}
        >
          <RefreshCw size={24} className={isRefreshing ? "spinner" : ""} />
        </div>
      </div>

      {!isOnline && (
        <div className="offline-banner">
          {TEXT_COMMON.STATUS.OFFLINE_BANNER}
        </div>
      )}

      {!isUsingServiceAccount() && isAuthExpired && (
        <div
          style={{
            background: "var(--danger-color, #ef4444)",
            color: "#ffffff",
            padding: "12px 16px",
            borderRadius: "12px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={20} />
            <span>
              {TEXT_AUTH.SESSION_EXPIRED_BANNER}
            </span>
          </div>
          <button
            type="button"
            className="btn"
            style={{
              background: "#ffffff",
              color: "var(--danger-color, #ef4444)",
              fontWeight: "bold",
              whiteSpace: "nowrap",
              border: "none",
              padding: "8px 14px",
              fontSize: "13px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onClick={handleReauthenticate}
            disabled={isReauthenticating}
          >
            {isReauthenticating ? (
              <RefreshCw size={14} className="spinner" />
            ) : (
              <RefreshCw size={14} />
            )}
            {isReauthenticating ? TEXT_COMMON.STATUS.PROCESSING : TEXT_AUTH.REAUTH_BTN}
          </button>
        </div>
      )}
      {/* Sticky Freeze Header Block (Title, Profile, & Route Selector) */}
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
          }}
        >
          {/* POJOK KIRI: Profil Akun Pengguna (Avatar, Nama, Role, Email) */}
          <UserProfileHeader onOpenProfile={() => setIsProfileMenuOpen(true)} />

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
              onClick={() => setRouteSelectorOpenTrigger((prev) => prev + 1)}
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
              title={`Kode Rute Aktif: ${activeRouteCode}. Klik untuk memilih rute.`}
              aria-label={`Rute aktif: ${activeRouteCode}`}
              data-testid="active-route-badge-btn"
            >
              <MapPin size={13} style={{ color: "var(--accent-color, #3ECF8E)", flexShrink: 0 }} />
              <span>{activeRouteCode}</span>
              <ChevronDown size={12} style={{ opacity: 0.65, flexShrink: 0 }} />
            </button>

            {queue.length > 0 && (
              <div
                onClick={() => setIsQueueModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: queue.some(
                    (q) => q.status === "failed" || q.status === "conflict",
                  )
                    ? "var(--danger-color)"
                    : "var(--warning-color)",
                  fontSize: "12px",
                  fontWeight: "bold",
                  background: queue.some(
                    (q) => q.status === "failed" || q.status === "conflict",
                  )
                    ? "rgba(247, 85, 85, 0.12)"
                    : "rgba(245, 158, 11, 0.12)",
                  padding: "4px 8px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  border:
                    "1px solid " +
                    (queue.some(
                      (q) => q.status === "failed" || q.status === "conflict",
                    )
                      ? "rgba(247, 85, 85, 0.25)"
                      : "rgba(245, 158, 11, 0.25)"),
                }}
                title={TEXT_DASHBOARD.SYNC_QUEUE_TITLE}
              >
                {queue.some(
                  (q) => q.status === "failed" || q.status === "conflict",
                ) ? (
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
          externalOpenTrigger={routeSelectorOpenTrigger}
        />
      </div>

      <ShiftConfirmationAlertBar
        isOpen={
          !confirmedShifts[activeShift] &&
          Boolean(matchedRoute) &&
          selectedTab !== "AKUMULASI" &&
          Boolean(busData && busData.length > 0)
        }
        shift={activeShift}
        routeCode={matchedRoute?.route_code || ""}
        onOpenModal={() => setIsFleetModalOpen(true)}
      />

      {error && !isAuthExpired && (
        <div className="error-text" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {missingColumns.length > 0 && (
        <div
          style={{
            marginTop: 12,
            marginBottom: 16,
            padding: "10px 14px",
            background: "rgba(234, 179, 8, 0.12)",
            border: "1px solid rgba(234, 179, 8, 0.4)",
            borderRadius: "8px",
            fontSize: "13px",
            lineHeight: 1.5,
            color: "var(--warning-color)",
          }}
        >
          ⚠️ Kolom berikut <strong>tidak terdeteksi</strong> di header sheet dan{" "}
          <strong>TIDAK akan tersimpan</strong>: {missingColumns.join(", ")}.
          Hubungi admin untuk memperbaiki header.
        </div>
      )}

      {needsReauth && (
        <div
          className="card"
          style={{
            marginTop: "16px",
            marginBottom: "16px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderColor: "var(--danger-color, #ef4444)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "12px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--danger-color, #ef4444)" }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{TEXT_AUTH.SESSION_NEED_REAUTH}</span>
          </div>
          <button
            onClick={() => reauthenticateSession().catch(() => {})}
            style={{
              padding: "6px 12px",
              backgroundColor: "var(--danger-color, #ef4444)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {TEXT_AUTH.REFRESH_SESSION_BTN}
          </button>
        </div>
      )}

      {isLoading && !busData && (
        <div style={{ marginTop: "16px" }}>
          {mainTab === "analytics" && <DailyToaTrendSkeleton />}
          {mainTab === "input" && <BusCardSkeleton count={5} />}
          {mainTab === "units" && <UnitCardSkeleton count={6} />}
        </div>
      )}

      {busData && headerMap && (
        <SwipeableContainer
          onSwipeLeft={handleSwipeNextTab}
          onSwipeRight={handleSwipePrevTab}
        >
          <div style={{ display: mainTab === "input" ? "block" : "none" }}>
            {missingColumns.length > 0 && (
              <div
                className="card"
                style={{
                  marginBottom: "16px",
                  backgroundColor: "var(--warning-bg, rgba(245, 158, 11, 0.1))",
                  borderColor: "var(--warning-border, #f59e0b)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--warning-text, #d97706)",
                    fontWeight: 600,
                  }}
                >
                  <AlertTriangle size={18} />
                  <span>{TEXT_DASHBOARD.MISSING_COLS_TITLE}</span>
                </div>
                <ul
                  style={{
                    margin: "8px 0 0 24px",
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {missingColumns.map((col, i) => (
                    <li key={i}>{col}</li>
                  ))}
                </ul>
              </div>
            )}

            <BusList
              data={busData}
              sheetId={currentSheetId}
              tabName={currentTabName}
              headerMap={headerMap}
              syncQueue={queue}
              addToQueue={addToQueue}
              isLoading={isLoading}
              onUpdateBus={handleUpdateBus}
              accRange={accRangeDetails}
              onExitAccumulation={() => handleExitAccumulation()}
            />
          </div>

          <div style={{ display: mainTab === "analytics" ? "block" : "none" }}>
            <AnalyticsDashboard
              busData={busData}
              sheetSummary={sheetSummary}
              sheetId={currentSheetId}
              selectedTab={selectedTab}
              refreshKey={refreshKey}
              monthLabel={extractMonthYearLabel(sheetUrl)}
              activeMonth={activeMonth}
              activeYear={activeYear}
              accRange={accRangeDetails}
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
            />
          </div>

          <div style={{ display: mainTab === "units" ? "block" : "none" }}>
            <UnitSummaryDashboard
              busData={busData}
              sheetId={currentSheetId}
              selectedTab={selectedTab}
              activeMonth={activeMonth}
              activeYear={activeYear}
              accRange={accRangeDetails}
            />
          </div>
        </SwipeableContainer>
      )}

      {matchedRoute && selectedTab !== "AKUMULASI" && (
        <RouteOperationalReportCard
          asModal={true}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          routeId={matchedRoute.id}
          routeCode={matchedRoute.route_code}
          selectedDate={operationalReportDate}
          defaultTrafficJamSpots={matchedRoute.default_traffic_jam_spots || []}
          defaultRenops={dynamicRenops.renops}
          userEmail={localStorage.getItem("PDO_USER_EMAIL") || undefined}
          onStatusChange={setOperationalReportStatus}
          onOpenFleetStatus={() => {
            setIsReportModalOpen(false);
            setIsFleetModalOpen(true);
          }}
        />
      )}

      {matchedRoute && selectedTab !== "AKUMULASI" && busData && (
        <FleetStatusModal
          isOpen={isFleetModalOpen}
          onClose={() => setIsFleetModalOpen(false)}
          routeCode={matchedRoute.route_code}
          selectedDate={operationalReportDate}
          renopsTarget={dynamicRenops.renops}
          dayLabel={dynamicRenops.label}
          buses={busData}
          initialShift={activeShift}
          onNavigateToReport={() => {
            setIsFleetModalOpen(false);
            setIsReportModalOpen(true);
          }}
          onConfirmStatus={handleConfirmFleetStatus}
        />
      )}

      <QueueModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
        queue={queue}
        onRetry={(id) => {
          retryItem(id);
          showInfoToast(TEXT_DASHBOARD.QUEUE_RETRYING);
        }}
        onDelete={handleDeleteQueueItem}
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

      <AccumulationSheet
        isOpen={isAccSheetOpen}
        onClose={() => setIsAccSheetOpen(false)}
        currentMonth={activeMonth}
        currentYear={activeYear}
        isAccumulationActive={selectedTab === "AKUMULASI"}
        onResetAccumulation={() => handleExitAccumulation()}
        onApply={async (sDay, sMonth, sYear, eDay, eMonth, eYear) => {
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
            // 1. Cari route_code aktif via cacheUtils (SOL-R6-017 / SOL-R6-018)
            const activeRouteCode = getRouteCodeForSheet(sheetUrl);

            // 2. Coba kueri instan Supabase (Opsi B: Aggregation Layer Cache)
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
              // Opsi B Supabase Cache Berhasil!
              setBusData(crossResult.data);
              setCurrentTabName("AKUMULASI");
              setSheetSummary({});
              setRefreshKey((prev) => prev + 1);
            } else {
              // Fallback Opsi A: Google Sheets API
              let targetSheetId = currentSheetId || extractSpreadsheetId(sheetUrl);
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
                const result = await getAccumulatedBusData(targetSheetId, eDay, sDay);
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
            setError(
              formatUserError(err, TEXT_DASHBOARD.ACCUMULATION_LOAD_FAIL),
            );
          } finally {
            setIsLoading(false);
          }
        }}
      />

      <BottomNav
        activeTab={mainTab}
        onSelectTab={setMainTab}
        onOpenMore={() => setIsProfileMenuOpen(true)}
        pendingQueueCount={
          queue.filter(
            (q) => q.status === "pending" || q.status === "failed",
          ).length
        }
      />

      <ProfileMenuSheet
        isOpen={isProfileMenuOpen}
        onClose={() => setIsProfileMenuOpen(false)}
        onOpenAccumulation={() => setIsAccSheetOpen(true)}
        onOpenRegionalMonitoring={() => {
          setIsProfileMenuOpen(false);
          setCurrentView('regional_monitoring');
        }}
        onOpenUserManagement={() => {
          setIsProfileMenuOpen(false);
          setCurrentView('user_management');
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
        onFormatWholeSheet={async () => {
          if (!currentSheetId || !currentTabName || !busData || !headerMap) {
            throw new Error(TEXT_DASHBOARD.SHEET_NOT_LOADED);
          }
          await formatWholeSheet(currentSheetId, currentTabName, busData, headerMap);
        }}
        currentTabName={currentTabName}
        hasActiveData={Boolean(currentSheetId && currentTabName && busData && busData.length > 0)}
      />
    </div>
  );
}
