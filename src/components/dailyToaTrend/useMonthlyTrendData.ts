import { useState, useEffect } from "react";
import { getMonthlyToaTrend } from "@/services/googleSheets";
import type { TrendItem } from "./types";

// ponytail: helper sederhana agar "AKUMULASI" → today, angka → parseInt
export function parseSelectedDay(tab: string): number {
  if (tab === "AKUMULASI") return new Date().getDate();
  return parseInt(tab, 10) || new Date().getDate();
}

export function useMonthlyTrendData(
  sheetId: string,
  selectedTab: string,
  refreshKey: number = 0,
  unitFilter?: string,
) {
  const [trendData, setTrendData] = useState<TrendItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Track max day for the chart so internal bar/badge clicks don't shrink the chart
  const [chartMaxDay, setChartMaxDay] = useState<number>(() => {
    return Math.max(1, Math.min(31, parseSelectedDay(selectedTab)));
  });

  // When sheetId or refreshKey changes (e.g. user clicks "LOAD DATA" in header), reset chartMaxDay to selectedTab
  useEffect(() => {
    const selectedNum = parseSelectedDay(selectedTab);
    setChartMaxDay(Math.max(1, Math.min(31, selectedNum)));
  }, [sheetId, refreshKey, selectedTab]);

  // When selectedTab increases beyond current chartMaxDay, expand chartMaxDay
  useEffect(() => {
    const selectedNum = parseSelectedDay(selectedTab);
    if (selectedNum > chartMaxDay) {
      setChartMaxDay(Math.min(31, selectedNum));
    }
  }, [selectedTab, chartMaxDay]);

  useEffect(() => {
    if (!sheetId || chartMaxDay < 1) return;

    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    getMonthlyToaTrend(sheetId, chartMaxDay, unitFilter)
      .then((data) => {
        if (isMounted) {
          setTrendData(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn("[DailyToaTrendCard] Gagal memuat tren:", err);
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sheetId, chartMaxDay, unitFilter, refreshKey]);

  return {
    trendData,
    isLoading,
    hasError,
    chartMaxDay,
    setChartMaxDay,
  };
}
