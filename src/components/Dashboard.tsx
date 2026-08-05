import { useState, useEffect, useRef } from "react";
import type { BusData, HeaderMap } from "../services/googleSheets";
import {
  extractSheetId,
  getBusData,
  reauthenticateSession,
} from "../services/googleSheets";
import { BusList } from "./BusList";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { BottomNav } from "./BottomNav";
import { RouteSelectorCard } from "./RouteSelectorCard";
import { SwipeableContainer } from "./SwipeableContainer";
import {
  LogOut,
  CloudOff,
  Sun,
  Moon,
  RefreshCw,
  AlertTriangle,
  RotateCw,
  Trash2,
} from "lucide-react";
import { useOfflineSync } from "../hooks/useOfflineSync";
import { formatUserError } from "../utils/errorFormatter";
import { extractMonthYearLabel, slugifyUnitId } from "../utils/analytics";

import { UnitSummaryDashboard } from "./UnitSummaryDashboard";

interface Props {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: Props) {
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

  const [selectedTab, setSelectedTab] = useState(() => {
    try {
      const saved = localStorage.getItem("PDO_LAST_VISITED");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedTab) return String(parsed.selectedTab);
      }
    } catch (_e) {}
    return new Date().getDate().toString();
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<"input" | "analytics" | "units">("analytics");

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

  // BUG-19: AbortController and Request ID tracking for race condition protection
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);

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
    },
    onAuthError: () => {
      // BUG-23: Handle auth error when offline sync queue encounters 401 session expiry
      setIsAuthExpired(true);
      setError(
        formatUserError(
          { status: 401 },
          "Sesi anda telah berakhir. Ketuk tombol 'Perbarui Sesi' untuk melanjutkan.",
        ),
      );
    },
  });

  const handleReauthenticate = async () => {
    setIsReauthenticating(true);
    try {
      await reauthenticateSession();
      setIsAuthExpired(false);
      setError(null);
      if (currentSheetId && currentTabName) {
        handleLoadData(true, currentTabName);
      }
      processQueue();
    } catch (err: any) {
      setError(
        formatUserError(err, "Gagal memperbarui sesi. Silakan coba lagi."),
      );
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

  const mainTabs: Array<"input" | "analytics" | "units"> = ["input", "analytics", "units"];

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

  const handleLoadData = async (isRefresh = false, targetTab?: string) => {
    const tabToLoad = targetTab || selectedTab;
    if (!sheetUrl) {
      setError("Silakan pilih atau paste link Google Sheet terlebih dahulu");
      return;
    }

    const sheetId = extractSheetId(sheetUrl);
    if (!sheetId) {
      setError(
        "Link tidak valid. Pastikan Anda meng-copy link dari Google Sheets.",
      );
      return;
    }

    // BUG-19: Abort previous request & increment request ID to ignore stale responses
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    setIsLoading(true);
    setError(null);
    // Keep previous busData in memory while loading new date data to prevent component unmounting/flicker

    if (isRefresh || sheetId !== currentSheetId) {
      setRefreshKey((prev) => prev + 1);
    }

    try {
      const {
        data,
        headerMap,
        missingColumns: missing,
        sheetSummary: summary,
      } = await getBusData(sheetId, tabToLoad);

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

  const handleSelectTab = (newTab: string) => {
    setSelectedTab(newTab);
    if (currentSheetId || sheetUrl) {
      handleLoadData(false, newTab);
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
        setPullDistance(0);
        setTouchStartY(0);
        return;
      }
      setIsRefreshing(true);
      handleLoadData(true).finally(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      });
    } else {
      setPullDistance(0);
    }
    setTouchStartY(0);
  };

  // Generate options for days 1-31
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

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
            background: 'var(--danger-color, #ef4444)',
            color: '#ffffff',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600 }}>
            <AlertTriangle size={20} />
            <span>Sesi Google Sheets kedaluwarsa. Ketuk tombol untuk perbarui sesi.</span>
          </div>
          <button
            type="button"
            className="btn"
            style={{
              background: '#ffffff',
              color: 'var(--danger-color, #ef4444)',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              border: 'none',
              padding: '8px 14px',
              fontSize: '13px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={handleReauthenticate}
            disabled={isReauthenticating}
          >
            {isReauthenticating ? <RefreshCw size={14} className="spinner" /> : <RefreshCw size={14} />}
            {isReauthenticating ? 'Memproses...' : 'Login Ulang'}
          </button>
        </div>
      )}
      <div
        className="app-header"
        style={{
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ margin: 0, textAlign: "left", fontSize: "20px" }}>
          PDO Utara Spreadsheet Mobile
        </h1>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
                fontSize: "14px",
                fontWeight: "bold",
                background: queue.some(
                  (q) => q.status === "failed" || q.status === "conflict",
                )
                  ? "rgba(239, 68, 68, 0.1)"
                  : "rgba(234, 179, 8, 0.1)",
                padding: "4px 8px",
                borderRadius: "12px",
                cursor: "pointer",
              }}
            >
              {queue.some(
                (q) => q.status === "failed" || q.status === "conflict",
              ) ? (
                <AlertTriangle size={16} />
              ) : (
                <CloudOff size={16} />
              )}
              {queue.length} Tertunda
            </div>
          )}
          <button
            className="btn btn-outline"
            style={{ padding: "8px" }}
            onClick={toggleTheme}
            title="Toggle Theme"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button
            className="btn btn-outline"
            style={{ padding: "8px", color: "var(--danger-color)" }}
            onClick={onLogout}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
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

      {isLoading && !busData && (
        <div className="bus-list" style={{ marginTop: "16px" }}>
          <phantom-ui loading={true}>
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bus-card glass"
                style={{
                  height: "84px",
                  marginBottom: "12px",
                  borderRadius: "16px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  opacity: 0.75,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ width: "90px", height: "18px", borderRadius: "6px", background: "var(--card-border)" }}></div>
                  <div style={{ width: "70px", height: "16px", borderRadius: "12px", background: "var(--card-border)" }}></div>
                </div>
                <div style={{ width: "160px", height: "12px", borderRadius: "4px", background: "var(--card-border)", opacity: 0.6 }}></div>
              </div>
            ))}
          </phantom-ui>
        </div>
      )}

      {busData && headerMap && (
        <SwipeableContainer
          onSwipeLeft={handleSwipeNextTab}
          onSwipeRight={handleSwipePrevTab}
        >
          <div
            style={{
              visibility: mainTab === "input" ? "visible" : "hidden",
              height: mainTab === "input" ? "auto" : 0,
              overflow: mainTab === "input" ? "visible" : "hidden",
              opacity: mainTab === "input" ? 1 : 0,
              transform: mainTab === "input" ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1), transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
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
            />
          </div>

          <div
            style={{
              visibility: mainTab === "analytics" ? "visible" : "hidden",
              height: mainTab === "analytics" ? "auto" : 0,
              overflow: mainTab === "analytics" ? "visible" : "hidden",
              opacity: mainTab === "analytics" ? 1 : 0,
              transform: mainTab === "analytics" ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1), transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            <AnalyticsDashboard
              busData={busData}
              sheetSummary={sheetSummary}
              sheetId={currentSheetId}
              selectedTab={selectedTab}
              refreshKey={refreshKey}
              monthLabel={extractMonthYearLabel(sheetUrl)}
              onSelectTab={handleSelectTab}
              onSelectUnit={(unit) => {
                setMainTab("input");
                setTimeout(() => {
                  const cardId = `bus-card-${slugifyUnitId(unit)}`;
                  const el = document.getElementById(cardId);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    el.classList.remove("bus-card-highlight");
                    // Trigger reflow to restart CSS animation if clicked repeatedly
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

          <div
            style={{
              visibility: mainTab === "units" ? "visible" : "hidden",
              height: mainTab === "units" ? "auto" : 0,
              overflow: mainTab === "units" ? "visible" : "hidden",
              opacity: mainTab === "units" ? 1 : 0,
              transform: mainTab === "units" ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1), transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            <UnitSummaryDashboard
              busData={busData}
              sheetId={currentSheetId}
              selectedTab={selectedTab}
            />
          </div>
        </SwipeableContainer>
      )}

      <BottomNav
        activeTab={mainTab}
        onSelectTab={setMainTab}
        pendingQueueCount={
          queue.filter((q) => q.status === "pending" || q.status === "failed")
            .length
        }
      />

      {isQueueModalOpen && (
        <div
          onClick={() => setIsQueueModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "16px",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              borderRadius: "12px",
              padding: "20px",
              width: "100%",
              maxWidth: "420px",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "var(--shadow)",
              border: "1px solid var(--border-color)",
            }}
          >
            <h2
              style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "16px" }}
            >
              Antrean Sinkronisasi
            </h2>
            {queue.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>
                Tidak ada antrean.
              </p>
            ) : (
              queue.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  <p style={{ margin: "0 0 4px 0", fontSize: "14px" }}>
                    <strong>Tab {item.tabName}</strong> — Baris {item.rowIndex}
                  </p>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "13px",
                      color:
                        item.status === "pending"
                          ? "var(--warning-color)"
                          : item.status === "conflict"
                            ? "var(--accent-color)"
                            : "var(--danger-color)",
                    }}
                  >
                    {item.status === "pending" &&
                      `⏳ Menunggu (percobaan ke-${(item.retryCount || 0) + 1})`}
                    {item.status === "failed" &&
                      `❌ Gagal setelah ${item.retryCount} percobaan`}
                    {item.status === "conflict" &&
                      "⚠️ Tabrakan data — data server telah berubah"}
                  </p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {item.status === "failed" && (
                      <>
                        <button
                          className="btn btn-outline"
                          style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          onClick={() => {
                            retryItem(item.id);
                          }}
                        >
                          <RotateCw size={14} /> Coba Lagi
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            color: "var(--danger-color)",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 size={14} /> Hapus
                        </button>
                      </>
                    )}
                    {item.status === "conflict" && (
                      <>
                        <button
                          className="btn btn-outline"
                          style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          onClick={() => resolveConflict(item.id)}
                        >
                          Gunakan Data Server
                        </button>
                        <button
                          className="btn"
                          style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            background: "var(--danger-color)",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          onClick={() => forceConflictItem(item.id)}
                        >
                          Force Save
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              {queue.some((q) => q.status === "pending") && (
                <button
                  className="btn"
                  style={{ flex: 1 }}
                  onClick={() => {
                    processQueue();
                    setIsQueueModalOpen(false);
                  }}
                >
                  Sinkronkan Sekarang
                </button>
              )}
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => setIsQueueModalOpen(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
