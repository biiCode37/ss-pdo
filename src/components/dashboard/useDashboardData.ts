import { useState, useEffect, useRef, useMemo } from "react";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import {
  getBusData,
  getAccumulatedBusData,
} from "@/services/googleSheets";
import { extractSpreadsheetId } from "@/utils/sheetIdentity";
import { formatUserError } from "@/utils/errorFormatter";
import { getCrossPeriodAccumulation } from "@/services/routeService";
import {
  getMonthYearForSheet,
  getRouteCodeForSheet,
  getRoutesFromCache,
} from "@/utils/cacheUtils";
import { TEXT_DASHBOARD } from "@/constants/texts";

export function useDashboardData() {
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

  // Route Management State
  const [busData, setBusData] = useState<BusData[] | null>(null);
  const [headerMap, setHeaderMap] = useState<HeaderMap | null>(null);
  const [currentSheetId, setCurrentSheetId] = useState<string>("");
  const [currentTabName, setCurrentTabName] = useState<string>("");
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [sheetSummary, setSheetSummary] = useState<Record<string, number>>({});
  const [refreshKey, setRefreshKey] = useState<number>(0);

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

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

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
        headerMap: hMap,
        missingColumns: missing,
        sheetSummary: summary,
      } = result;

      if (currentRequestId !== requestIdRef.current) return;

      setBusData(data);
      setHeaderMap(hMap);
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

  const didInitialAutoLoadRef = useRef(false);
  useEffect(() => {
    if (didInitialAutoLoadRef.current) return;
    if (!sheetUrlRef.current || busData) return;
    didInitialAutoLoadRef.current = true;
    handleLoadData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleApplyAccumulation = async (
    sDay: number,
    sMonth: number,
    sYear: number,
    eDay: number,
    eMonth: number,
    eYear: number,
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
  };

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

  return {
    sheetUrl,
    setSheetUrl,
    handleSetSheetUrl,
    selectedRouteCode,
    setSelectedRouteCode,
    routeSelectorOpenTrigger,
    setRouteSelectorOpenTrigger,
    selectedTab,
    setSelectedTab,
    handleSetSelectedTab,
    isLoading,
    setIsLoading,
    error,
    setError,
    busData,
    setBusData,
    headerMap,
    setHeaderMap,
    currentSheetId,
    setCurrentSheetId,
    currentTabName,
    setCurrentTabName,
    missingColumns,
    sheetSummary,
    setSheetSummary,
    refreshKey,
    setRefreshKey,
    accRange,
    setAccRange,
    accRangeDetails,
    setAccRangeDetails,
    activeMonth,
    activeYear,
    headerBlockRef,
    days,
    currentRouteCode,
    matchedRoute,
    activeRouteCode,
    operationalReportDate,
    handleLoadData,
    handleSelectTab,
    handleExitAccumulation,
    handleUpdateBus,
    handleApplyAccumulation,
  };
}
