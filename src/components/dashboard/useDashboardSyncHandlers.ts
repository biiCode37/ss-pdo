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
    (routeCode: string) => {
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
    },
    [handleSetSheetUrl, handleSetSelectedTab, setCurrentView, monitoringDate],
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
