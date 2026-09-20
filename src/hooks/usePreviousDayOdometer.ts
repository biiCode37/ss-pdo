import { useState, useEffect, useRef } from "react";
import { getBusData } from "@/services/googleSheets/core";
import { getRoutesFromCache } from "@/utils/cacheUtils";
import { matchRouteSheetById } from "@/utils/sheetIdentity";

export interface UsePreviousDayOdometerProps {
  sheetId: string;
  currentTabName: string;
  activeMonth: number;
  activeYear: number;
  routeCode?: string;
}

export interface UsePreviousDayOdometerReturn {
  previousDayKmMap: Record<string, string>;
  isLoading: boolean;
}

// Memory cache lintas mount: `${sheetId}_${tabName}` -> kmMap
const memoryKmCache = new Map<string, Record<string, string>>();

/**
 * Hook untuk mengambil odometer KM Akhir S2 (dengan fallback KM Akhir S1)
 * armada bus pada hari sebelumnya dari Google Sheets SSOT.
 */
export function usePreviousDayOdometer({
  sheetId,
  currentTabName,
  activeMonth,
  activeYear,
  routeCode,
}: UsePreviousDayOdometerProps): UsePreviousDayOdometerReturn {
  const [previousDayKmMap, setPreviousDayKmMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;

    if (!sheetId || !currentTabName || currentTabName === "AKUMULASI") {
      setPreviousDayKmMap({});
      return;
    }

    const currentDay = parseInt(currentTabName, 10);
    if (isNaN(currentDay) || currentDay < 1) {
      setPreviousDayKmMap({});
      return;
    }

    let targetSheetId = sheetId;
    let targetTab = "";

    if (currentDay > 1) {
      // Hari sebelumnya di bulan yang sama (spreadsheet yang sama)
      targetTab = String(currentDay - 1);
    } else {
      // Tanggal 1: ambil dari hari terakhir bulan sebelumnya
      const prevMonth = activeMonth === 1 ? 12 : activeMonth - 1;
      const prevYear = activeMonth === 1 ? activeYear - 1 : activeYear;
      const lastDayOfPrevMonth = new Date(activeYear, activeMonth - 1, 0).getDate();
      targetTab = String(lastDayOfPrevMonth);

      // Cari spreadsheet bulan sebelumnya dari cache rute
      const routes = getRoutesFromCache();
      const match = matchRouteSheetById(routes, sheetId);
      const targetRoute = match?.route || routes.find((r) => r.route_code === routeCode);

      if (targetRoute && targetRoute.route_sheets) {
        const prevSheet = targetRoute.route_sheets.find(
          (s) => s.year === prevYear && s.month === prevMonth
        );
        if (prevSheet && prevSheet.spreadsheet_id) {
          targetSheetId = prevSheet.spreadsheet_id;
        } else {
          setPreviousDayKmMap({});
          return;
        }
      } else {
        setPreviousDayKmMap({});
        return;
      }
    }

    const cacheKey = `${targetSheetId}_${targetTab}`;
    if (memoryKmCache.has(cacheKey)) {
      setPreviousDayKmMap(memoryKmCache.get(cacheKey) || {});
      return;
    }

    let isSubscribed = true;
    setIsLoading(true);

    const fetchPreviousDay = async () => {
      try {
        let busDataResult;
        try {
          busDataResult = await getBusData(targetSheetId, targetTab);
        } catch (_err) {
          // Jika tab menggunakan format 2 digit (misal: "01"), coba fallback padStart
          if (targetTab.length === 1) {
            busDataResult = await getBusData(targetSheetId, targetTab.padStart(2, "0"));
          } else {
            throw _err;
          }
        }

        if (!isSubscribed || cancelRef.current) return;

        const kmMap: Record<string, string> = {};
        if (busDataResult?.data) {
          for (const b of busDataResult.data) {
            if (!b.unit) continue;
            // Prioritas: KM Akhir S2. Jika kosong (misal unit hanya operasi S1), gunakan KM Akhir S1
            const rawKm =
              b.kmAkhir2 && b.kmAkhir2.trim() !== ""
                ? b.kmAkhir2.trim()
                : b.kmAkhir1 && b.kmAkhir1.trim() !== ""
                  ? b.kmAkhir1.trim()
                  : "";

            if (rawKm) {
              kmMap[b.unit.trim().toUpperCase()] = rawKm;
              kmMap[b.unit.trim()] = rawKm;
            }
          }
        }

        memoryKmCache.set(cacheKey, kmMap);
        setPreviousDayKmMap(kmMap);
      } catch (err) {
        console.warn("[usePreviousDayOdometer] Gagal memuat data KM hari sebelumnya:", err);
        if (isSubscribed) {
          setPreviousDayKmMap({});
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    fetchPreviousDay();

    return () => {
      isSubscribed = false;
      cancelRef.current = true;
    };
  }, [sheetId, currentTabName, activeMonth, activeYear, routeCode]);

  return { previousDayKmMap, isLoading };
}
