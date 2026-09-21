import { useState, useEffect, useMemo } from "react";
import type { BusData } from "@/services/googleSheets";
import { splitShiftKeterangan, cleanShiftNote } from "@/utils/keteranganUtils";
import type {
  BrushMode,
  StatusMap,
  FleetStatusConfirmationPayload,
} from "./types";

interface UseFleetStatusDataOptions {
  buses: BusData[];
  initialShift?: 1 | 2;
  renopsTarget?: number;
  isConfirmedS1?: boolean;
  isConfirmedS2?: boolean;
  confirmedByS1?: string;
  confirmedByS2?: string;
  confirmedAtS1?: string;
  confirmedAtS2?: string;
  onConfirmStatus: (
    shift: 1 | 2,
    statusMap: StatusMap,
    payload?: FleetStatusConfirmationPayload,
  ) => Promise<void>;
  onClose: () => void;
}

export function useFleetStatusData({
  buses,
  initialShift = 1,
  renopsTarget = 0,
  isConfirmedS1 = false,
  isConfirmedS2 = false,
  confirmedByS1,
  confirmedByS2,
  confirmedAtS1,
  confirmedAtS2,
  onConfirmStatus,
  onClose,
}: UseFleetStatusDataOptions) {
  const [currentShift, setCurrentShift] = useState<1 | 2>(initialShift);
  const [activeBrush, setActiveBrush] = useState<BrushMode>("SGO");
  const [isSaving, setIsSaving] = useState(false);
  const [targetRenops, setTargetRenops] = useState<number>(renopsTarget);

  // Perbarui targetRenops jika prop renopsTarget berubah
  useEffect(() => {
    setTargetRenops(renopsTarget);
  }, [renopsTarget]);

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

  // Status penguncian per shift
  const isLocked = currentShift === 1 ? isConfirmedS1 : isConfirmedS2;
  const confirmedBy = currentShift === 1 ? confirmedByS1 : confirmedByS2;
  const confirmedAt = currentShift === 1 ? confirmedAtS1 : confirmedAtS2;

  // Handle tap pada kartu bus: terapkan activeBrush ke shift yang sedang aktif
  const handleCardTap = (rowIndex: number) => {
    if (isLocked) return;

    setUnitMap((prev) => {
      const next = new Map(prev);
      const current = next.get(rowIndex) || { s1: "", s2: "" };

      let nextVal = "";
      if (activeBrush === "OFF") nextVal = "OFF";
      else if (activeBrush === "TO") nextVal = "TO EVDAL";
      else if (activeBrush === "SO") nextVal = "SO";
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
    if (isLocked) return;

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
    let so = 0;
    let other = 0;

    for (const b of buses) {
      const unitVal = unitMap.get(b.rowIndex);
      const status = cleanShiftNote(currentShift === 1 ? unitVal?.s1 : unitVal?.s2);
      const upper = status.toUpperCase();

      if (!upper) {
        sgo++;
      } else if (upper.includes("OFF")) {
        off++;
      } else if (upper.includes("SO")) {
        so++;
      } else if (upper.includes("TO")) {
        to++;
      } else {
        other++;
      }
    }

    return {
      sgo,
      off,
      to,
      so,
      other,
      realops: sgo,
      totalUnits: buses.length,
    };
  }, [buses, unitMap, currentShift]);

  // Submit konfirmasi
  const handleConfirm = async () => {
    if (isLocked) {
      onClose();
      return;
    }

    try {
      setIsSaving(true);

      // Kumpulkan daftar unit non-SGO
      const nonSgoUnits: Array<{
        unit_body: string;
        status_id: number;
        status_code: string;
        note: string;
      }> = [];

      for (const b of buses) {
        const unitVal = unitMap.get(b.rowIndex);
        const rawNote = cleanShiftNote(currentShift === 1 ? unitVal?.s1 : unitVal?.s2);
        if (!rawNote) continue;

        const upper = rawNote.toUpperCase();
        let statusId = 2; // Default TO
        let statusCode = 'TO';
        let note = rawNote;

        if (upper.includes("OFF")) {
          statusId = 3;
          statusCode = 'OFF';
          note = 'LIBUR';
        } else if (upper.includes("SO")) {
          statusId = 4;
          statusCode = 'SO';
          note = rawNote.length > 2 ? rawNote : 'STOP OPERASI';
        } else if (upper.includes("TO")) {
          statusId = 2;
          statusCode = 'TO';
          note = rawNote;
        } else {
          statusId = 2;
          statusCode = 'OTHER';
          note = rawNote;
        }

        nonSgoUnits.push({
          unit_body: b.unit,
          status_id: statusId,
          status_code: statusCode,
          note,
        });
      }

      const payload: FleetStatusConfirmationPayload = {
        targetRenops,
        realops: summaryCounts.sgo,
        sgoCount: summaryCounts.sgo,
        toCount: summaryCounts.to,
        offCount: summaryCounts.off,
        soCount: summaryCounts.so,
        otherCount: summaryCounts.other,
        nonSgoUnits,
      };

      await onConfirmStatus(currentShift, unitMap, payload);
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
    targetRenops,
    setTargetRenops,
    isLocked,
    confirmedBy,
    confirmedAt,
    unitMap,
    handleCardTap,
    handleSgoAll,
    summaryCounts,
    handleConfirm,
  };
}
