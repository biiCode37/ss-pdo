import { useState, useEffect, useRef } from "react";
import { getBusData } from "@/services/googleSheets/core";
import { getRoutesFromCache } from "@/utils/cacheUtils";
import { matchRouteSheetById } from "@/utils/sheetIdentity";
import {
  getStoredOdometerForUnit,
  saveStoredOdometers,
} from "@/utils/modals/busInput/odometerRegistry";

export interface OdometerRefInfo {
  km: string;
  dateLabel: string; // e.g. "Kemarin", "Tgl 18", "Tgl 17", "Riwayat"
}

export interface UsePreviousDayOdometerProps {
  sheetId: string;
  currentTabName: string;
  activeMonth: number;
  activeYear: number;
  routeCode?: string;
  activeUnits?: string[];
  maxLookbackDays?: number; // default: 5
}

export interface UsePreviousDayOdometerReturn {
  previousDayKmMap: Record<string, string>;
  previousDayRefMap: Record<string, OdometerRefInfo>;
  isLoading: boolean;
}

interface CachedDayResult {
  kmMap: Record<string, string>;
}

// Memory cache lintas mount: `${sheetId}_${tabName}` -> kmMap
const memoryKmCache = new Map<string, CachedDayResult>();

export function clearMemoryKmCache(): void {
  memoryKmCache.clear();
}

/**
 * Helper untuk menentukan target spreadsheet, tab, dan dateLabel berdasarkan offset hari mundur
 */
export function resolveLookbackTarget({
  currentDay,
  offset,
  sheetId,
  activeMonth,
  activeYear,
  routeCode,
}: {
  currentDay: number;
  offset: number;
  sheetId: string;
  activeMonth: number;
  activeYear: number;
  routeCode?: string;
}): { targetSheetId: string; targetTab: string; dateLabel: string } | null {
  const diff = currentDay - offset;

  if (diff >= 1) {
    // Masih dalam bulan yang sama
    const targetTab = String(diff);
    const dateLabel = offset === 1 ? "Kemarin" : `Tgl ${targetTab}`;
    return { targetSheetId: sheetId, targetTab, dateLabel };
  }

  // Mundur melewati tanggal 1 (masuk ke bulan sebelumnya)
  const prevMonth = activeMonth === 1 ? 12 : activeMonth - 1;
  const prevYear = activeMonth === 1 ? activeYear - 1 : activeYear;
  const lastDayOfPrevMonth = new Date(activeYear, activeMonth - 1, 0).getDate();
  const targetDayInPrevMonth = lastDayOfPrevMonth + diff;

  if (targetDayInPrevMonth < 1) {
    // Terlalu jauh ke belakang melewati 2 bulan
    return null;
  }

  const routes = getRoutesFromCache();
  const match = matchRouteSheetById(routes, sheetId);
  const targetRoute = match?.route || routes.find((r) => r.route_code === routeCode);

  if (targetRoute && targetRoute.route_sheets) {
    const prevSheet = targetRoute.route_sheets.find(
      (s) => s.year === prevYear && s.month === prevMonth,
    );
    if (prevSheet && prevSheet.spreadsheet_id) {
      const targetTab = String(targetDayInPrevMonth);
      const dateLabel = `Tgl ${targetTab}/${prevMonth}`;
      return {
        targetSheetId: prevSheet.spreadsheet_id,
        targetTab,
        dateLabel,
      };
    }
  }

  return null;
}

/**
 * Hook untuk mengambil odometer KM Akhir S2 (dengan fallback KM Akhir S1)
 * armada bus dengan penelusuran mundur cerdas (Smart Lookback hingga 3–5 hari)
 * dan fallback ke cache offline lokal (odometerRegistry).
 */
export function usePreviousDayOdometer({
  sheetId,
  currentTabName,
  activeMonth,
  activeYear,
  routeCode,
  activeUnits,
  maxLookbackDays = 5,
}: UsePreviousDayOdometerProps): UsePreviousDayOdometerReturn {
  const [previousDayKmMap, setPreviousDayKmMap] = useState<Record<string, string>>({});
  const [previousDayRefMap, setPreviousDayRefMap] = useState<Record<string, OdometerRefInfo>>({});
  const [isLoading, setIsLoading] = useState(false);
  const cancelRef = useRef(false);

  // Stringify activeUnits untuk dependency useEffect stabil
  const activeUnitsKey = (activeUnits || []).sort().join(",");

  useEffect(() => {
    cancelRef.current = false;

    if (!sheetId || !currentTabName || currentTabName === "AKUMULASI") {
      setPreviousDayKmMap({});
      setPreviousDayRefMap({});
      return;
    }

    const currentDay = parseInt(currentTabName, 10);
    if (isNaN(currentDay) || currentDay < 1) {
      setPreviousDayKmMap({});
      setPreviousDayRefMap({});
      return;
    }

    let isSubscribed = true;
    setIsLoading(true);

    const fetchSmartLookback = async () => {
      const combinedKmMap: Record<string, string> = {};
      const combinedRefMap: Record<string, OdometerRefInfo> = {};

      const unitsToFind = new Set<string>(
        (activeUnits || []).map((u) => u.trim().toUpperCase()).filter(Boolean),
      );

      const maxDays = Math.max(1, Math.min(maxLookbackDays, 7));

      try {
        for (let offset = 1; offset <= maxDays; offset++) {
          if (!isSubscribed || cancelRef.current) return;

          const target = resolveLookbackTarget({
            currentDay,
            offset,
            sheetId,
            activeMonth,
            activeYear,
            routeCode,
          });

          if (!target) break;

          const cacheKey = `${target.targetSheetId}_${target.targetTab}`;
          let dayData: CachedDayResult | undefined = memoryKmCache.get(cacheKey);

          if (!dayData) {
            let busDataResult;
            try {
              busDataResult = await getBusData(target.targetSheetId, target.targetTab);
            } catch (_err) {
              if (target.targetTab.length === 1) {
                busDataResult = await getBusData(
                  target.targetSheetId,
                  target.targetTab.padStart(2, "0"),
                );
              } else {
                throw _err;
              }
            }

            const kmMap: Record<string, string> = {};
            if (busDataResult?.data) {
              for (const b of busDataResult.data) {
                if (!b.unit) continue;
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

            dayData = { kmMap };
            memoryKmCache.set(cacheKey, dayData);
          }

          // Masukkan data untuk unit yang belum terisi
          for (const [unit, rawKm] of Object.entries(dayData.kmMap)) {
            const norm = unit.toUpperCase();
            if (!combinedKmMap[norm] && rawKm) {
              combinedKmMap[norm] = rawKm;
              combinedKmMap[unit] = rawKm;
              combinedRefMap[norm] = { km: rawKm, dateLabel: target.dateLabel };
              combinedRefMap[unit] = { km: rawKm, dateLabel: target.dateLabel };
            }
          }

          // Cek apakah seluruh unit yang dicari sudah ketemu
          if (unitsToFind.size > 0) {
            const allFound = Array.from(unitsToFind).every((u) => Boolean(combinedKmMap[u]));
            if (allFound) {
              break;
            }
          } else {
            // Jika daftar unit tidak diberikan di awal, cukup telusuri H-1
            if (offset >= 1) break;
          }
        }

        // Fallback ke Local Storage Registry untuk unit yang belum ketemu
        if (unitsToFind.size > 0) {
          for (const u of unitsToFind) {
            if (!combinedKmMap[u]) {
              const stored = getStoredOdometerForUnit(u);
              if (stored && stored.km) {
                combinedKmMap[u] = stored.km;
                combinedRefMap[u] = {
                  km: stored.km,
                  dateLabel: stored.dateLabel || "Riwayat",
                };
              }
            }
          }
        }

        // Perbarui Local Storage Registry dengan data terbaru yang ditemukan
        saveStoredOdometers(combinedRefMap);

        if (isSubscribed && !cancelRef.current) {
          setPreviousDayKmMap(combinedKmMap);
          setPreviousDayRefMap(combinedRefMap);
        }
      } catch (err) {
        console.warn("[usePreviousDayOdometer] Gagal memuat data KM lookback:", err);
        // Jika Google Sheets gagal/offline, coba fallback sepenuhnya ke Local Storage
        if (unitsToFind.size > 0) {
          for (const u of unitsToFind) {
            const stored = getStoredOdometerForUnit(u);
            if (stored && stored.km) {
              combinedKmMap[u] = stored.km;
              combinedRefMap[u] = {
                km: stored.km,
                dateLabel: stored.dateLabel || "Riwayat",
              };
            }
          }
        }
        if (isSubscribed && !cancelRef.current) {
          setPreviousDayKmMap(combinedKmMap);
          setPreviousDayRefMap(combinedRefMap);
        }
      } finally {
        if (isSubscribed && !cancelRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchSmartLookback();

    return () => {
      isSubscribed = false;
      cancelRef.current = true;
    };
  }, [sheetId, currentTabName, activeMonth, activeYear, routeCode, activeUnitsKey, maxLookbackDays]);

  return { previousDayKmMap, previousDayRefMap, isLoading };
}
