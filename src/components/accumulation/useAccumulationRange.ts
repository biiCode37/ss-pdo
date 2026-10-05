import { useState, useEffect, useMemo } from "react";
import { fetchRoutesWithSheets } from "@/services/routeService";
import { getRoutesFromCache } from "@/utils/cacheUtils";
import { TEXT_DASHBOARD } from "@/constants/texts";

/** Jumlah hari valid untuk bulan/tahun tertentu (BUG-51: cegah 31 Feb) */
export const getDaysInMonth = (month: number, year: number): number =>
  new Date(year, month, 0).getDate();

interface UseAccumulationRangeOptions {
  isOpen: boolean;
  currentMonth?: number;
  currentYear?: number;
  onApply: (
    startDay: number,
    startMonth: number,
    startYear: number,
    endDay: number,
    endMonth: number,
    endYear: number,
  ) => void;
  onDismiss: () => void;
}

export function useAccumulationRange({
  isOpen,
  currentMonth,
  currentYear,
  onApply,
  onDismiss,
}: UseAccumulationRangeOptions) {
  const today = useMemo(() => new Date(), []);
  const defaultMonth = currentMonth || today.getMonth() + 1;
  const defaultYear = currentYear || today.getFullYear();

  const [startMonth, setStartMonth] = useState(defaultMonth);
  const [startYear, setStartYear] = useState(defaultYear);
  const [startDay, setStartDay] = useState(1);

  const [endMonth, setEndMonth] = useState(defaultMonth);
  const [endYear, setEndYear] = useState(defaultYear);
  const [endDay, setEndDay] = useState(() => {
    if (
      defaultMonth === today.getMonth() + 1 &&
      defaultYear === today.getFullYear()
    ) {
      return today.getDate();
    }
    return getDaysInMonth(defaultMonth, defaultYear);
  });

  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [rangeError, setRangeError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // BUG-52: Reset penuh state tanggal setiap kali sheet dibuka
    setStartDay(1);
    if (
      currentMonth === today.getMonth() + 1 &&
      currentYear === today.getFullYear()
    ) {
      setEndDay(today.getDate());
    } else {
      setEndDay(getDaysInMonth(defaultMonth, defaultYear));
    }
    setRangeError(null);
  }, [isOpen, currentMonth, currentYear, defaultMonth, defaultYear, today]);

  useEffect(() => {
    const loadDbPeriods = async (
      candidateStartMonth: number,
      candidateStartYear: number,
    ) => {
      try {
        let cachedRoutes = getRoutesFromCache();
        if (cachedRoutes.length === 0) {
          cachedRoutes = await fetchRoutesWithSheets();
        }

        const allSheets: any[] = [];
        for (const r of cachedRoutes) {
          for (const s of r.route_sheets || []) {
            allSheets.push(s);
          }
        }

        if (allSheets.length > 0) {
          const mSet = Array.from(new Set(allSheets.map((s) => s.month))).sort(
            (a, b) => a - b,
          );
          const ySet = Array.from(new Set(allSheets.map((s) => s.year))).sort(
            (a, b) => b - a,
          );

          setAvailableMonths(mSet);
          setAvailableYears(ySet);

          // BUG-54: Bandingkan terhadap kandidat eksplisit (nilai reset)
          if (mSet.length > 0 && !mSet.includes(candidateStartMonth)) {
            setStartMonth(mSet[0]);
            setEndMonth(mSet[mSet.length - 1]);
          }
          if (ySet.length > 0 && !ySet.includes(candidateStartYear)) {
            setStartYear(ySet[0]);
            setEndYear(ySet[0]);
          }
        }
      } catch (_e) {}
    };

    if (isOpen) {
      const baseMonth = currentMonth || defaultMonth;
      const baseYear = currentYear || defaultYear;
      if (currentMonth) {
        setStartMonth(currentMonth);
        setEndMonth(currentMonth);
      }
      if (currentYear) {
        setStartYear(currentYear);
        setEndYear(currentYear);
      }
      loadDbPeriods(baseMonth, baseYear);
    }
  }, [isOpen, currentMonth, currentYear, defaultMonth, defaultYear]);

  // BUG-51: Daftar hari mengikuti jumlah hari riil bulan terpilih
  const days = Array.from(
    { length: getDaysInMonth(startMonth, startYear) },
    (_, i) => i + 1,
  );
  const endDays = Array.from(
    { length: getDaysInMonth(endMonth, endYear) },
    (_, i) => i + 1,
  );

  // Clamp nilai hari bila melebihi jumlah hari bulan aktif
  const safeStartDay = Math.min(startDay, days.length);
  const safeEndDay = Math.min(endDay, endDays.length);

  const handleApply = () => {
    // BUG-51: Validasi rentang — tolak rentang terbalik & tanggal mustahil
    const startNum =
      startYear * 10000 +
      startMonth * 100 +
      Math.min(startDay, getDaysInMonth(startMonth, startYear));
    const endNum =
      endYear * 10000 +
      endMonth * 100 +
      Math.min(endDay, getDaysInMonth(endMonth, endYear));
    if (startNum > endNum) {
      setRangeError(TEXT_DASHBOARD.ACCUMULATION_SHEET.ERROR_DATE_RANGE);
      return;
    }

    setRangeError(null);
    onApply(
      Math.min(startDay, getDaysInMonth(startMonth, startYear)),
      startMonth,
      startYear,
      Math.min(endDay, getDaysInMonth(endMonth, endYear)),
      endMonth,
      endYear,
    );
    onDismiss();
  };

  return {
    startMonth,
    setStartMonth,
    startYear,
    setStartYear,
    startDay,
    setStartDay,
    endMonth,
    setEndMonth,
    endYear,
    setEndYear,
    endDay,
    setEndDay,
    availableMonths,
    availableYears,
    rangeError,
    days,
    endDays,
    safeStartDay,
    safeEndDay,
    handleApply,
  };
}
