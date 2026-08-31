import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import type { BusData, HeaderMap } from "../services/googleSheets";
import {
  getBusData,
  getAccumulatedBusData,
  reauthenticateSession,
  formatWholeSheet,
} from "../services/googleSheets";
import { extractSpreadsheetId } from "../utils/sheetIdentity";
import { BusList } from "./BusList";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { ProfileMenuSheet } from "./ProfileMenuSheet";
import { RouteSelectorCard } from "./RouteSelectorCard";
import { SwipeableContainer } from "./SwipeableContainer";
import { BottomNav } from "./BottomNav";
import { UserManagementSkeleton } from "./Skeletons";

// Dynamic Code Splitting for infrequently visited administration pages
const UserManagementPage = lazy(() =>
  import("./UserManagementPage").then((m) => ({ default: m.UserManagementPage }))
);
import {
  CloudOff,
  RefreshCw,
  AlertTriangle,
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
  const [currentView, setCurrentView] = useState<'dashboard' | 'user_management' | 'audit_log'>('dashboard');

  // Mobile Back Navigation Handlers (PWA / Mobile hardware gesture support)
  useMobileBackHandler({
    id: "user_management_view",
    isOpen: currentView === "user_management",
    onClose: () => setCurrentView("dashboard"),
  });

  useMobileBackHandler({
    id: "audit_log_view",
    isOpen: currentView === "audit_log",
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
      showSuccessToast("Data antrean berhasil disinkronkan ke Google Sheets!");
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
      showSuccessToast("Item berhasil dihapus dari antrean.");
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
      showSuccessToast("Sesi berhasil diperbarui!");
    } catch (err: any) {
      const errFormatted = formatUserError(err, "Gagal memperbarui sesi. Silakan coba lagi.");
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

  const lastAutoLoadedSheetRef = useRef("");
  useEffect(() => {
    if (!sheetUrl || isLoading || busData) return;
    if (lastAutoLoadedSheetRef.current === sheetUrl) return;
    lastAutoLoadedSheetRef.current = sheetUrl;
    handleLoadData(false);
  }, [sheetUrl, isLoading, busData, handleLoadData]);

  async function handleLoadData(isRefresh = false, targetTab?: string) {
    const tabToLoad = targetTab || selectedTab;
    if (!sheetUrl) {
      setError("Silakan pilih atau paste link Google Sheet terlebih dahulu");
      return;
    }

    const sheetId = extractSpreadsheetId(sheetUrl);
    if (!sheetId) {
      setError(
        "Link tidak valid. Pastikan Anda meng-copy link dari Google Sheets.",
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
      if (tabToLoad === "AKUMULASI") {
        const activeRouteCode = getRouteCodeForSheet(sheetId || sheetUrl);

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
        result = await getBusData(sheetId, tabToLoad);
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
      setCurrentTabName(tabToLoad);
      setMissingColumns(missing);
      setSheetSummary(summary || {});
    } catch (err: any) {
      if (currentRequestId !== requestIdRef.current) return;
      if (err.name === "AbortError") return;

      setError(
        formatUserError(
          err,
          "Gagal memuat data. Periksa kembali link dan tab Anda.",
        ),
      );
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  // BUG-20: Handle async tab selection properly
  const handleSelectTab = async (newTab: string) => {
    setSelectedTab(newTab);
    if (currentSheetId || sheetUrl) {
      await handleLoadData(false, newTab);
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
        setError("Tidak bisa refresh saat offline");
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
          ⚠️ Koneksi Terputus - Mode Offline Aktif
        </div>
      )}

      {isAuthExpired && (
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
              Sesi Google Sheets kedaluwarsa. Ketuk tombol untuk perbarui sesi.
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
            {isReauthenticating ? "Memproses..." : "Login Ulang"}
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
          {/* POJOK KIRI: Title PUSM & Helper Subtitle */}
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                textAlign: "left",
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "-0.5px",
                lineHeight: 1.15,
                color: "var(--text-primary)",
              }}
            >
              PUSM
            </h1>
            <span
              style={{
                fontSize: "10.5px",
                color: "var(--text-secondary)",
                fontWeight: 500,
                letterSpacing: "0.2px",
                whiteSpace: "nowrap",
                lineHeight: 1.3,
                marginTop: "1px",
              }}
            >
              PDO Utara Spreadsheet Mobile
            </span>
          </div>

          {/* POJOK KANAN: Active Page Name Badge + Status Antrean Offline */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {/* Nama Halaman Aktif */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "20px",
                background: "rgba(62, 207, 142, 0.1)",
                border: "1px solid rgba(62, 207, 142, 0.22)",
                color: "var(--accent-color)",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.2px",
                whiteSpace: "nowrap",
                userSelect: "none",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--accent-color)",
                  boxShadow: "0 0 6px var(--accent-color)",
                }}
              />
              <span>
                {mainTab === "input"
                  ? "Input SS"
                  : mainTab === "analytics"
                    ? "Dashboard"
                    : "Daftar Unit"}
              </span>
            </div>

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
                title="Buka antrean sinkronisasi"
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
          setSheetUrl={setSheetUrl}
          selectedTab={selectedTab}
          setSelectedTab={handleSelectTab}
          days={days}
          isLoading={isLoading}
          isDataLoaded={!!busData}
          currentSheetId={currentSheetId}
          currentTabName={currentTabName}
          onLoadData={() => handleLoadData(false)}
          accRange={accRangeDetails}
        />
      </div>

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
            <span>Sesi Google perlu diperbarui untuk sinkronisasi data.</span>
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
            Perbarui Sesi
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
                  <span>Beberapa kolom tidak ditemukan di Sheet:</span>
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



      <QueueModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
        queue={queue}
        onRetry={(id) => {
          retryItem(id);
          showInfoToast("Mencoba menyinkronkan kembali...");
        }}
        onDelete={handleDeleteQueueItem}
        onResolveConflict={(id) => {
          resolveConflict(id);
          showInfoToast("Menggunakan data dari server.");
        }}
        onForceConflict={(id) => {
          forceConflictItem(id);
          showWarningToast("Menimpa data server dengan data lokal...");
        }}
        onProcessQueue={processQueue}
      />

      <AccumulationSheet
        isOpen={isAccSheetOpen}
        onClose={() => setIsAccSheetOpen(false)}
        currentMonth={activeMonth}
        currentYear={activeYear}
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
              formatUserError(err, "Gagal memuat data akumulasi."),
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
        onOpenUserManagement={() => {
          setIsProfileMenuOpen(false);
          setCurrentView('user_management');
        }}
        onOpenAuditLogs={() => {
          setIsProfileMenuOpen(false);
          setCurrentView('audit_log');
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
            throw new Error("Data spreadsheet belum dimuat.");
          }
          await formatWholeSheet(currentSheetId, currentTabName, busData, headerMap);
        }}
        currentTabName={currentTabName}
        hasActiveData={Boolean(currentSheetId && currentTabName && busData && busData.length > 0)}
      />
    </div>
  );
}
