import { useState, useEffect, useMemo } from "react";
import type { BusData } from "@/services/googleSheets";
import { splitShiftKeterangan, cleanShiftNote } from "@/utils/keteranganUtils";
import type { BrushMode, StatusMap } from "./types";

interface UseFleetStatusDataOptions {
  buses: BusData[];
  initialShift?: 1 | 2;
  onConfirmStatus: (
    shift: 1 | 2,
    statusMap: StatusMap,
  ) => Promise<void>;
  onClose: () => void;
}

export function useFleetStatusData({
  buses,
  initialShift = 1,
  onConfirmStatus,
  onClose,
}: UseFleetStatusDataOptions) {
  const [currentShift, setCurrentShift] = useState<1 | 2>(initialShift);
  const [activeBrush, setActiveBrush] = useState<BrushMode>("SGO");
  const [isSaving, setIsSaving] = useState(false);

  // Status map: rowIndex -> { s1: string, s2: string }
  const [unitMap, setUnitMap] = useState<StatusMap>(new Map());

  // Inisialisasi unitMap dari daftar buses
  useEffect(() => {
    if (!buses || buses.length === 0) return;
    const nextMap = new Map<number, { s1: string; s2: string }>();
    for (const b of buses) {
      const split = splitShiftKeterangan(b.keterangan);
      nextMap.set(b.rowIndex, { s1: split.s1, s2: split.s2 });
    }
    setUnitMap(nextMap);
  }, [buses]);

  // Handle tap pada kartu bus: terapkan activeBrush ke shift yang sedang aktif
  const handleCardTap = (rowIndex: number) => {
    setUnitMap((prev) => {
      const next = new Map(prev);
      const current = next.get(rowIndex) || { s1: "", s2: "" };

      let nextVal = "";
      if (activeBrush === "OFF") nextVal = "OFF";
      else if (activeBrush === "TO") nextVal = "TO EVDAL";
      else nextVal = ""; // SGO (kosong)

      if (currentShift === 1) {
        next.set(rowIndex, { ...current, s1: nextVal });
      } else {
        next.set(rowIndex, { ...current, s2: nextVal });
      }
      return next;
    });
  };

  // Quick Action: SGO Semua Unit pada shift aktif
  const handleSgoAll = () => {
    setUnitMap((prev) => {
      const next = new Map(prev);
      for (const [rowIndex, val] of next.entries()) {
        if (currentShift === 1) {
          next.set(rowIndex, { ...val, s1: "" });
        } else {
          next.set(rowIndex, { ...val, s2: "" });
        }
      }
      return next;
    });
  };

  // Perhitungan ringkasan real-time
  const summaryCounts = useMemo(() => {
    let sgo = 0;
    let off = 0;
    let to = 0;

    for (const b of buses) {
      const unitVal = unitMap.get(b.rowIndex);
      const status = cleanShiftNote(currentShift === 1 ? unitVal?.s1 : unitVal?.s2);
      const upper = status.toUpperCase();

      if (!upper) {
        sgo++;
      } else if (upper.includes("OFF")) {
        off++;
      } else {
        to++;
      }
    }

    return { sgo, off, to };
  }, [buses, unitMap, currentShift]);

  // Submit konfirmasi
  const handleConfirm = async () => {
    try {
      setIsSaving(true);
      await onConfirmStatus(currentShift, unitMap);
      onClose();
    } catch (err) {
      console.warn("[FleetStatusModal] Gagal menyimpan status armada:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    currentShift,
    setCurrentShift,
    activeBrush,
    setActiveBrush,
    isSaving,
    unitMap,
    handleCardTap,
    handleSgoAll,
    summaryCounts,
    handleConfirm,
  };
}
