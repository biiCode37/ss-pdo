import { useState, useEffect, useRef, useMemo } from "react";
import { fetchRoutesWithSheets } from "@/services/routeService";
import { extractSpreadsheetId } from "@/utils/sheetIdentity";
import type { Route } from "@/types/supabase";
import type { FlatRouteSheet } from "./types";

interface UseRouteCascadeOptions {
  isDataLoaded: boolean;
  currentSheetId?: string;
  currentTabName?: string;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  sheetUrl: string;
  setSheetUrl: (url: string) => void;
  days: string[];
  onRouteCodeChange?: (routeCode: string) => void;
}

export function useRouteCascade({
  isDataLoaded,
  currentSheetId,
  currentTabName,
  selectedTab,
  setSelectedTab,
  sheetUrl,
  setSheetUrl,
  days,
  onRouteCodeChange,
}: UseRouteCascadeOptions) {
  // 4-Level Sequential Selection State (Cascade: Year → Month → Route → Date)
  const [selectedYear, setSelectedYear] = useState<number | null>(
    new Date().getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedRouteCode, setSelectedRouteCode] = useState<string>("");
  const [formTab, setFormTab] = useState<string>(
    () => currentTabName || selectedTab || String(new Date().getDate()),
  );

  const [routes, setRoutes] = useState<Route[]>([]);
  // ponytail: native flatMap replaces custom flattenRoutes utility file
  const flatSheets = useMemo<FlatRouteSheet[]>(
    () =>
      routes.flatMap((r) =>
        (r.route_sheets || []).map((s) => ({
          routeId: r.id,
          routeCode: r.route_code,
          routeName: r.route_name,
          sheet: s,
        })),
      ),
    [routes],
  );

  // Derived cascade options (filter by parent selection) — DECLARED FIRST for proper ordering
  const availableYears = useMemo(
    () =>
      Array.from(new Set(flatSheets.map((f) => f.sheet.year))).sort(
        (a, b) => b - a,
      ),
    [flatSheets],
  );

  const availableMonths = useMemo(
    () =>
      selectedYear
        ? Array.from(
            new Set(
              flatSheets
                .filter((f) => f.sheet.year === selectedYear)
                .map((f) => f.sheet.month),
            ),
          ).sort((a, b) => a - b)
        : [],
    [flatSheets, selectedYear],
  );

  const availableRouteCodes = useMemo(
    () =>
      selectedYear && selectedMonth
        ? Array.from(
            new Set(
              flatSheets
                .filter(
                  (f) =>
                    f.sheet.year === selectedYear &&
                    f.sheet.month === selectedMonth,
                )
                .map((f) => f.routeCode),
            ),
          ).sort((a, b) =>
            a.localeCompare(b, "id", { numeric: true, sensitivity: "base" }),
          )
        : [],
    [flatSheets, selectedYear, selectedMonth],
  );

  // Derived cascade enabled flags
  const monthEnabled = selectedYear !== null && availableYears.length > 0;
  const routeEnabled = selectedMonth !== null;
  const dateEnabled = selectedRouteCode !== "";

  // Helper: cari sheet untuk kombinasi rute+bulan+tahun saat ini
  const getSheetForSelection = (code: string | null) => {
    if (!code || !selectedYear || !selectedMonth) return null;
    return (
      flatSheets.find(
        (f) =>
          f.routeCode === code &&
          f.sheet.month === selectedMonth &&
          f.sheet.year === selectedYear,
      ) || null
    );
  };

  // Load routes dari Supabase / cache lokal
  const loadRoutes = async () => {
    const data = await fetchRoutesWithSheets();
    setRoutes(data);
    return data;
  };

  const isAccumulation = selectedTab === "AKUMULASI";

  useEffect(() => {
    loadRoutes().then((data) => {
      const flat = data.flatMap((r) =>
        (r.route_sheets || []).map((s) => ({
          routeId: r.id,
          routeCode: r.route_code,
          routeName: r.route_name,
          sheet: s,
        })),
      );
      if (flat.length > 0) {
        // Cek riwayat dari localStorage (BUG-42) - hanya saat membuka aplikasi baru (!isDataLoaded)
        try {
          const saved = !isDataLoaded
            ? localStorage.getItem("PDO_LAST_VISITED")
            : null;
          if (saved) {
            const parsed = JSON.parse(saved);
            const savedMatch = flat.find(
              (f) =>
                f.sheet.sheet_url === parsed.sheetUrl ||
                (extractSpreadsheetId(f.sheet.sheet_url) &&
                  extractSpreadsheetId(parsed.sheetUrl) &&
                  extractSpreadsheetId(f.sheet.sheet_url) ===
                    extractSpreadsheetId(parsed.sheetUrl)),
            );
            if (
              savedMatch &&
              parsed.year &&
              parsed.month &&
              parsed.routeCode
            ) {
              // Restore penuh → semua dropdown disabled cascade menjadi enabled
              setSelectedYear(parsed.year);
              setSelectedMonth(parsed.month);
              setSelectedRouteCode(parsed.routeCode);
              setSheetUrl(savedMatch.sheet.sheet_url);

              // BUG-FIX: Sinkronisasi tanggal saat membuka aplikasi.
              // Jika rute tersimpan adalah periode bulan & tahun saat ini, tanggal HARUS selalu hari ini (today).
              // Tanggal tersimpan (parsed.selectedTab) hanya digunakan jika membuka arsip periode lampau.
              const now = new Date();
              const isCurrentPeriod =
                parsed.year === now.getFullYear() &&
                parsed.month === now.getMonth() + 1;
              const todayDay = String(now.getDate());
              const restoredTab = isCurrentPeriod
                ? todayDay
                : parsed.selectedTab || todayDay;
              setSelectedTab(restoredTab);
              setFormTab(restoredTab);
              return;
            }
          }
        } catch (_e) {}

        // Fallback: hanya Tahun default ke tahun sekarang, sisanya menunggu
        // input cascade dari user (Bulan/Rute/Tanggal disabled).
        const currentYear = new Date().getFullYear();
        if (flat.some((f) => f.sheet.year === currentYear)) {
          setSelectedYear(currentYear);
        } else if (flat.length > 0) {
          setSelectedYear(flat[0].sheet.year);
        }
        // BUG-13: Jangan menampilkan tanggal "terisi" yang menyesatkan pada
        // dropdown Tanggal yang masih disabled (belum ada rute terpilih).
        if (!isAccumulation && !currentTabName && !selectedTab) {
          setFormTab("");
        }
        if (!sheetUrl) {
          setSheetUrl("");
        }
      }
    });
  }, []);

  // ROUTE-12-01: Sync dropdown cascade HANYA saat data sheet baru selesai dimuat (currentSheetId berganti)
  // Tidak memantau sheetUrl/selectedTab agar pilihan rute yang baru dipilih user tidak tertimpa balik
  const prevLoadedSheetIdRef = useRef<string | undefined>(currentSheetId);
  useEffect(() => {
    if (flatSheets.length === 0 || !currentSheetId) return;

    if (prevLoadedSheetIdRef.current === currentSheetId && selectedRouteCode)
      return;
    prevLoadedSheetIdRef.current = currentSheetId;

    const active = flatSheets.find((f) => {
      const fId =
        extractSpreadsheetId(f.sheet.sheet_url) ||
        extractSpreadsheetId(f.sheet.spreadsheet_id);
      return fId === currentSheetId;
    });

    if (active) {
      setSelectedYear(active.sheet.year);
      setSelectedMonth(active.sheet.month);
      setSelectedRouteCode(active.routeCode);

      // Simpan ke localStorage (BUG-42)
      try {
        localStorage.setItem(
          "PDO_LAST_VISITED",
          JSON.stringify({
            sheetUrl: active.sheet.sheet_url,
            selectedTab,
            routeCode: active.routeCode,
            month: active.sheet.month,
            year: active.sheet.year,
          }),
        );
      } catch (_e) {}
    }
  }, [flatSheets, currentSheetId, selectedTab]);

  // CSS cascade handlers — perubahan pada level atas me-reset level bawah
  const handleYearChange = (year: string) => {
    const y = year ? Number(year) : null;
    setSelectedYear(y);
    setSelectedMonth(null);
    setSelectedRouteCode("");
    setSheetUrl("");
    if (!isAccumulation) setFormTab("");
  };

  const handleMonthChange = (month: string) => {
    const m = month ? Number(month) : null;
    setSelectedMonth(m);
    setSelectedRouteCode("");
    setSheetUrl("");
    if (!isAccumulation) setFormTab("");
  };

  const handleRouteCodeChange = (code: string) => {
    setSelectedRouteCode(code);

    const sheetFn = getSheetForSelection(code);
    if (sheetFn) {
      setSheetUrl(sheetFn.sheet.sheet_url);
      // BUG-3/12: Hanya auto-set tanggal hari ini saat mode NORMAL.
      // Di mode AKUMULASI, formTab & Tanggal dropdown dibiarkan (rekap).
      if (!isAccumulation) {
        const today = String(new Date().getDate());
        const defaultDay = days.includes(today) ? today : days[0] || "";
        setFormTab(defaultDay);
      }
    } else {
      setSheetUrl("");
      setFormTab("");
    }
  };

  const handleTabChange = (tab: string) => {
    setFormTab(tab);
  };

  // ROUTE-12-01: Cari info rute aktif untuk pill (prioritaskan data ter-load jika ada)
  const loadedFlat =
    isDataLoaded && currentSheetId
      ? flatSheets.find((f) => {
          const fId =
            extractSpreadsheetId(f.sheet.sheet_url) ||
            extractSpreadsheetId(f.sheet.spreadsheet_id);
          return fId === currentSheetId;
        })
      : null;

  useEffect(() => {
    const activeCode = loadedFlat?.routeCode || selectedRouteCode;
    if (activeCode && onRouteCodeChange) {
      onRouteCodeChange(activeCode);
    }
  }, [loadedFlat?.routeCode, selectedRouteCode, onRouteCodeChange]);

  // Sinkronkan pilihan form dengan tab data yang sedang aktif saat data baru dimuat
  useEffect(() => {
    if (currentTabName) {
      setFormTab(currentTabName);
    }
  }, [currentTabName]);

  return {
    routes,
    flatSheets,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedRouteCode,
    setSelectedRouteCode,
    formTab,
    setFormTab,
    availableYears,
    availableMonths,
    availableRouteCodes,
    monthEnabled,
    routeEnabled,
    dateEnabled,
    handleYearChange,
    handleMonthChange,
    handleRouteCodeChange,
    handleTabChange,
    getSheetForSelection,
    loadRoutes,
  };
}
