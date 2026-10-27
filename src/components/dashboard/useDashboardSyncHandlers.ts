import { useCallback } from "react";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import {
  reauthenticateSession,
  formatWholeSheet,
} from "@/services/googleSheets";
import { formatUserError } from "@/utils/errorFormatter";
import {
  showDeleteQueueConfirm,
  showSuccessToast,
  showErrorToast,
} from "@/utils/alertUtils";
import { getRoutesFromCache } from "@/utils/cacheUtils";
import { fetchRoutesWithSheets } from "@/services/routeService";
import { formatRouteCode } from "@/utils/routeValidation";
import { TEXT_DASHBOARD } from "@/constants/texts";
import type { DashboardView } from "./useDashboardUiState";

interface UseDashboardSyncHandlersOptions {
  removeItem: (itemId: string) => void;
  processQueue: () => Promise<void>;
  currentSheetId: string | null;
  currentTabName: string | null;
  busData: BusData[] | null;
  headerMap: HeaderMap | null;
  handleLoadData: (
    showToast?: boolean,
    tab?: string,
    targetUrl?: string,
  ) => Promise<void>;
  handleSetSheetUrl: (url: string) => void;
  setSelectedRouteCode?: (code: string) => void;
  handleSetSelectedTab: (tab: string) => void;
  setCurrentView: (view: DashboardView) => void;
  monitoringDate: string | null;
  setError: (error: string | null) => void;
  setIsAuthExpired: (expired: boolean) => void;
  setIsReauthenticating: (reauthenticating: boolean) => void;
}

export function useDashboardSyncHandlers(
  options: UseDashboardSyncHandlersOptions,
) {
  const {
    removeItem,
    processQueue,
    currentSheetId,
    currentTabName,
    busData,
    headerMap,
    handleLoadData,
    handleSetSheetUrl,
    setSelectedRouteCode,
    handleSetSelectedTab,
    setCurrentView,
    monitoringDate,
    setError,
    setIsAuthExpired,
    setIsReauthenticating,
  } = options;

  const handleDeleteQueueItem = useCallback(
    async (itemId: string) => {
      const confirmed = await showDeleteQueueConfirm();
      if (confirmed) {
        removeItem(itemId);
        showSuccessToast(TEXT_DASHBOARD.QUEUE_ITEM_DELETED);
      }
    },
    [removeItem],
  );

  const handleReauthenticate = useCallback(async () => {
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
      } catch (queueError: unknown) {
        console.warn("Error processing queue after re-auth:", queueError);
      }
      showSuccessToast(TEXT_DASHBOARD.SESSION_REFRESH_SUCCESS);
    } catch (err: unknown) {
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
  }, [
    setIsReauthenticating,
    setIsAuthExpired,
    setError,
    currentSheetId,
    currentTabName,
    handleLoadData,
    processQueue,
  ]);

  const handleSelectMonitoringRoute = useCallback(
    async (routeCode: string) => {
      try {
        let cachedRoutes = getRoutesFromCache();
        if (!cachedRoutes || cachedRoutes.length === 0) {
          try {
            cachedRoutes = await fetchRoutesWithSheets();
          } catch (_e) {}
        }

        const cleanInput = (routeCode || "").trim().toLowerCase();
        const formattedInput = formatRouteCode(routeCode).toLowerCase();

        const matchFn = (r: any) => {
          const c = (r.route_code || "").trim().toLowerCase();
          const n = (r.route_name || r.name || "").trim().toLowerCase();
          const fc = formatRouteCode(r.route_code || "").toLowerCase();
          return (
            c === cleanInput ||
            fc === formattedInput ||
            c === formattedInput ||
            n === cleanInput ||
            n.includes(cleanInput)
          );
        };

        let matched = cachedRoutes.find(matchFn);

        // Jika rute tidak ditemukan di cache lokal, ambil data terbaru dari Supabase
        if (!matched) {
          try {
            const fresh = await fetchRoutesWithSheets();
            if (fresh && fresh.length > 0) {
              cachedRoutes = fresh;
              matched = cachedRoutes.find(matchFn);
            }
          } catch (_e) {}
        }

        const effectiveDate =
          monitoringDate || new Date().toISOString().split("T")[0];
        const parts = effectiveDate.split("-");
        let targetYear = new Date().getFullYear();
        let targetMonth = new Date().getMonth() + 1;
        let targetDay = String(new Date().getDate());

        if (parts.length === 3) {
          targetYear = parseInt(parts[0], 10) || targetYear;
          targetMonth = parseInt(parts[1], 10) || targetMonth;
          targetDay = String(parseInt(parts[2], 10) || targetDay);
        }

        let targetSheetUrl = "";
        if (matched && matched.route_sheets && matched.route_sheets.length > 0) {
          const matchedSheet = matched.route_sheets.find(
            (s: any) => s.year === targetYear && s.month === targetMonth,
          );
          const fallbackSheet =
            matched.route_sheets[matched.route_sheets.length - 1];
          const chosen = matchedSheet || fallbackSheet;
          targetSheetUrl = chosen?.sheet_url || chosen?.spreadsheet_id || "";
          if (chosen) {
            targetYear = chosen.year;
            targetMonth = chosen.month;
          }
        }

        const finalRouteCode = matched?.route_code || routeCode;
        if (finalRouteCode) {
          setSelectedRouteCode?.(finalRouteCode);
        }

        if (targetSheetUrl) {
          handleSetSheetUrl(targetSheetUrl);
          try {
            localStorage.setItem(
              "PDO_LAST_VISITED",
              JSON.stringify({
                sheetUrl: targetSheetUrl,
                selectedTab: targetDay,
                routeCode: finalRouteCode,
                month: targetMonth,
                year: targetYear,
              }),
            );
          } catch (_e) {}
        }

        handleSetSelectedTab(targetDay);
        setCurrentView("dashboard");

        // Muat data Google Sheets secara aktif untuk rute dan tanggal terpilih
        if (targetSheetUrl) {
          await handleLoadData(true, targetDay, targetSheetUrl);
        }
      } catch (err) {
        console.warn("[handleSelectMonitoringRoute] Gagal memuat data rute terpilih:", err);
        setCurrentView("dashboard");
      }
    },
    [
      handleSetSheetUrl,
      handleSetSelectedTab,
      setSelectedRouteCode,
      setCurrentView,
      monitoringDate,
      handleLoadData,
    ],
  );

  const handleFormatWholeSheet = useCallback(async () => {
    if (!currentSheetId || !currentTabName || !busData || !headerMap) {
      throw new Error(TEXT_DASHBOARD.SHEET_NOT_LOADED);
    }
    await formatWholeSheet(
      currentSheetId,
      currentTabName,
      busData,
      headerMap,
    );
  }, [currentSheetId, currentTabName, busData, headerMap]);

  return {
    handleDeleteQueueItem,
    handleReauthenticate,
    handleSelectMonitoringRoute,
    handleFormatWholeSheet,
  };
}
