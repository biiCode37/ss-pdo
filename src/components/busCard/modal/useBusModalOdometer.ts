import { useState, useMemo, useEffect } from "react";
import type { BusData } from "@/services/googleSheets";
import { TEXT_ALERTS } from "@/constants/texts/text_alerts";
import {
  computeRealtimeDistance,
  extractLeading3Digits,
  type KmDistanceResult,
} from "@/utils/modals/busInput/busModalOdometer";
import { detectSmartRollover } from "@/utils/modals/busInput/busModalValidation";

export type ModalTab = "shift1" | "shift2" | "trip" | "notes";

export interface SmartRolloverResult {
  suggestedKm: string;
  diff: number;
}

export interface UseBusModalOdometerProps {
  bus: BusData;
  previousDayKmAkhir2?: string;
  isSingleMode?: boolean;
  activeCategory?: string;
  activeTab?: ModalTab;
}

export interface UseBusModalOdometerReturn {
  // Field values & setters
  kmAwal1: string;
  setKmAwal1: React.Dispatch<React.SetStateAction<string>>;
  kmAkhir1: string;
  setKmAkhir1: React.Dispatch<React.SetStateAction<string>>;
  kmAwal2: string;
  setKmAwal2: React.Dispatch<React.SetStateAction<string>>;
  kmAkhir2: string;
  setKmAkhir2: React.Dispatch<React.SetStateAction<string>>;

  // Draft Prefill Statuses
  isKmAwal1PrefillOnly: boolean;
  isKmAkhir1PrefillOnly: boolean;
  isKmAwal2PrefillOnly: boolean;
  isKmAkhir2PrefillOnly: boolean;

  // Validity Guards
  isKmAwal1Valid: boolean;
  isKmAkhir1Valid: boolean;
  isKmAwal2Valid: boolean;
  isKmAkhir2Valid: boolean;

  // Cascading Locks
  isKmAkhir1Locked: boolean;
  isKmAwal2Locked: boolean;
  isKmAkhir2Locked: boolean;
  isS1Started: boolean;

  // Single Focus Redirection
  effectiveCategory: string;
  guideMessage: string | null;

  // Realtime Live Calculations
  kmLiveS1: KmDistanceResult;
  kmLiveS2: KmDistanceResult;
  kmDistanceS1: string | null;
  kmDistanceS2: string | null;

  // Actions
  handleCopyKmAkhir1ToAwal2: () => void;
  targetKmAwalForRollover: string;
  smartRolloverSuggestion: SmartRolloverResult | null;
  rolloverTargetShift: "shift1" | "shift2" | null;
  applyRollover: () => boolean;
}

export function useBusModalOdometer({
  bus,
  previousDayKmAkhir2,
  isSingleMode = false,
  activeCategory = "all",
  activeTab = "shift1",
}: UseBusModalOdometerProps): UseBusModalOdometerReturn {
  // Auto-Prefill 3 Leading Digits for KM Awal 1 (Zero Phantom Value)
  const initialKmAwal1 = useMemo(() => {
    if (bus.kmAwal1 && bus.kmAwal1.trim() !== "") return bus.kmAwal1;
    if (previousDayKmAkhir2) return extractLeading3Digits(previousDayKmAkhir2);
    return "";
  }, [bus.kmAwal1, previousDayKmAkhir2]);

  const [kmAwal1, setKmAwal1] = useState<string>(initialKmAwal1);

  // KM Akhir S1 WAJIB diawali string kosong "" jika belum ada di bus (Zero Phantom Value)
  const initialKmAkhir1 = useMemo(() => {
    if (bus.kmAkhir1 && bus.kmAkhir1.trim() !== "") return bus.kmAkhir1;
    return "";
  }, [bus.kmAkhir1]);

  const [kmAkhir1, setKmAkhir1] = useState<string>(initialKmAkhir1);

  const initialKmAwal2 = useMemo(() => {
    if (bus.kmAwal2 && bus.kmAwal2.trim() !== "") return bus.kmAwal2;
    // Skenario B: Bus dinas siang saja (S1 kosong murni)
    const isS1Empty =
      (!bus.kmAwal1 || bus.kmAwal1.trim() === "") &&
      (!bus.kmAkhir1 || bus.kmAkhir1.trim() === "");
    if (isS1Empty && previousDayKmAkhir2) {
      return extractLeading3Digits(previousDayKmAkhir2);
    }
    return "";
  }, [bus.kmAwal2, bus.kmAwal1, bus.kmAkhir1, previousDayKmAkhir2]);

  const [kmAwal2, setKmAwal2] = useState<string>(initialKmAwal2);

  // KM Akhir S2 WAJIB diawali string kosong "" jika belum ada di bus (Zero Phantom Value)
  const initialKmAkhir2 = useMemo(() => {
    if (bus.kmAkhir2 && bus.kmAkhir2.trim() !== "") return bus.kmAkhir2;
    return "";
  }, [bus.kmAkhir2]);

  const [kmAkhir2, setKmAkhir2] = useState<string>(initialKmAkhir2);

  // Evaluasi Semantik: Apakah field masih berupa draft prefill yang belum dilengkapi user?
  const isKmAwal1PrefillOnly = Boolean(
    previousDayKmAkhir2 &&
      !bus.kmAwal1 &&
      kmAwal1.trim() === extractLeading3Digits(previousDayKmAkhir2) &&
      kmAwal1.trim().length <= 3,
  );

  // Status Validitas Angka Odometer: field ada nilainya, bukan draft prefill,
  // dan memenuhi Full Value Guard (>3 digit atau merupakan data eksisting bus)
  const isKmAwal1Valid = Boolean(
    kmAwal1 &&
      kmAwal1.trim() !== "" &&
      (kmAwal1.trim().length > 3 ||
        Boolean(bus.kmAwal1 && bus.kmAwal1.trim() === kmAwal1.trim())) &&
      !isKmAwal1PrefillOnly,
  );

  const isKmAkhir1PrefillOnly = Boolean(
    isKmAwal1Valid &&
      !bus.kmAkhir1 &&
      kmAkhir1.trim() === extractLeading3Digits(kmAwal1) &&
      kmAkhir1.trim().length <= 3 &&
      kmAwal1.trim().length > kmAkhir1.trim().length,
  );

  const isKmAkhir1Valid = Boolean(
    kmAkhir1 &&
      kmAkhir1.trim() !== "" &&
      (kmAkhir1.trim().length > 3 ||
        Boolean(bus.kmAkhir1 && bus.kmAkhir1.trim() === kmAkhir1.trim())) &&
      !isKmAkhir1PrefillOnly,
  );

  // Status Kunci Berantai (Cascading Lock)
  // 1. KM Akhir S1 terkunci sampai KM Awal S1 terisi valid
  const isKmAkhir1Locked = !isKmAwal1Valid;

  // 2. KM Awal S2:
  // - Skenario A (Bus dinas pagi): Ada aktivitas S1 -> Terkunci sampai KM Akhir S1 valid.
  // - Skenario B (Bus dinas siang saja): S1 kosong murni -> Terbuka langsung.
  const isS1Started = Boolean(
    (kmAwal1 && kmAwal1.trim().length > 0 && !isKmAwal1PrefillOnly) ||
      (bus.kmAwal1 && bus.kmAwal1.trim().length > 0),
  );
  const isKmAwal2Locked = isS1Started && !isKmAkhir1Valid;

  const isKmAwal2PrefillOnly = Boolean(
    !isS1Started &&
      previousDayKmAkhir2 &&
      !bus.kmAwal2 &&
      kmAwal2.trim() === extractLeading3Digits(previousDayKmAkhir2) &&
      kmAwal2.trim().length <= 3,
  );

  const isKmAwal2Valid = Boolean(
    kmAwal2 &&
      kmAwal2.trim() !== "" &&
      (kmAwal2.trim().length > 3 ||
        Boolean(bus.kmAwal2 && bus.kmAwal2.trim() === kmAwal2.trim())) &&
      !isKmAwal2PrefillOnly,
  );

  const isKmAkhir2PrefillOnly = Boolean(
    isKmAwal2Valid &&
      !bus.kmAkhir2 &&
      kmAkhir2.trim() === extractLeading3Digits(kmAwal2) &&
      kmAkhir2.trim().length <= 3 &&
      kmAwal2.trim().length > kmAkhir2.trim().length,
  );

  const isKmAkhir2Valid = Boolean(
    kmAkhir2 &&
      kmAkhir2.trim() !== "" &&
      (kmAkhir2.trim().length > 3 ||
        Boolean(bus.kmAkhir2 && bus.kmAkhir2.trim() === kmAkhir2.trim())) &&
      !isKmAkhir2PrefillOnly,
  );

  // 3. KM Akhir S2 terkunci sampai KM Awal S2 terisi valid
  const isKmAkhir2Locked = !isKmAwal2Valid;

  // Mode Fokus Tunggal: Redirection Cerdas & Pesan Panduan (SSOT Bab 5.A)
  const { effectiveCategory, guideMessage } = useMemo(() => {
    if (!isSingleMode) {
      return { effectiveCategory: activeCategory, guideMessage: null };
    }

    if (activeCategory === "kmAkhir1" && isKmAkhir1Locked) {
      return {
        effectiveCategory: "kmAwal1",
        guideMessage: TEXT_ALERTS.BUS_INPUT_MODAL.GUIDE_FILL_KM_AWAL_FIRST,
      };
    }

    if (activeCategory === "kmAwal2" && isKmAwal2Locked) {
      return {
        effectiveCategory: "kmAkhir1",
        guideMessage:
          TEXT_ALERTS.BUS_INPUT_MODAL.VALIDATION_KM_S2_REQUIRES_S1_CLOSED,
      };
    }

    if (activeCategory === "kmAkhir2" && isKmAkhir2Locked) {
      if (isKmAwal2Locked) {
        return {
          effectiveCategory: "kmAkhir1",
          guideMessage:
            TEXT_ALERTS.BUS_INPUT_MODAL.VALIDATION_KM_S2_REQUIRES_S1_CLOSED,
        };
      }
      return {
        effectiveCategory: "kmAwal2",
        guideMessage: TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_KM_LOCKED,
      };
    }

    return { effectiveCategory: activeCategory, guideMessage: null };
  }, [
    isSingleMode,
    activeCategory,
    isKmAkhir1Locked,
    isKmAwal2Locked,
    isKmAkhir2Locked,
  ]);

  // Prefill reaktif KM Awal S1 saat previousDayKmAkhir2 tiba dan field masih kosong
  useEffect(() => {
    if (previousDayKmAkhir2 && (!bus.kmAwal1 || bus.kmAwal1.trim() === "")) {
      const prefill = extractLeading3Digits(previousDayKmAkhir2);
      if (prefill) {
        setKmAwal1((current: string) => {
          if (!current || current.trim() === "") {
            return prefill;
          }
          return current;
        });
      }
    }
  }, [previousDayKmAkhir2, bus.kmAwal1]);

  // Reactivity KM Awal 1 -> KM Akhir 1 (Unlock & Auto-Reset)
  useEffect(() => {
    if (isKmAwal1Valid) {
      const prefill = extractLeading3Digits(kmAwal1);
      if (prefill) {
        setKmAkhir1((current: string) => {
          if (!current || current.trim() === "") {
            return prefill;
          }
          return current;
        });
      }
    } else {
      // Skenario 4: Jika KM Awal S1 dihapus / tidak valid, auto-reset KM Akhir S1
      setKmAkhir1((current: string) => {
        if (current && (!bus.kmAkhir1 || current.trim().length <= 3)) {
          return "";
        }
        return current;
      });
    }
  }, [isKmAwal1Valid, kmAwal1, bus.kmAkhir1]);

  // Reactivity KM Awal 2 -> KM Akhir 2 (Unlock & Auto-Reset)
  useEffect(() => {
    if (isKmAwal2Valid) {
      const prefill = extractLeading3Digits(kmAwal2);
      if (prefill) {
        setKmAkhir2((current: string) => {
          if (!current || current.trim() === "") {
            return prefill;
          }
          return current;
        });
      }
    } else {
      // Skenario 4: Jika KM Awal S2 dihapus / tidak valid, auto-reset KM Akhir S2
      setKmAkhir2((current: string) => {
        if (current && (!bus.kmAkhir2 || current.trim().length <= 3)) {
          return "";
        }
        return current;
      });
    }
  }, [isKmAwal2Valid, kmAwal2, bus.kmAkhir2]);

  // Prefill reaktif KM Awal S2 untuk Skenario B (Bus Dinas Siang Saja)
  useEffect(() => {
    if (
      !isS1Started &&
      (!bus.kmAwal2 || bus.kmAwal2.trim() === "") &&
      previousDayKmAkhir2
    ) {
      const prefill = extractLeading3Digits(previousDayKmAkhir2);
      if (prefill) {
        setKmAwal2((current: string) => {
          if (!current || current.trim() === "") {
            return prefill;
          }
          return current;
        });
      }
    }
  }, [isS1Started, previousDayKmAkhir2, bus.kmAwal2]);

  // Live calculations for distance
  const kmLiveS1 = useMemo(
    () => computeRealtimeDistance(kmAwal1, kmAkhir1),
    [kmAwal1, kmAkhir1],
  );

  const kmLiveS2 = useMemo(
    () => computeRealtimeDistance(kmAwal2, kmAkhir2),
    [kmAwal2, kmAkhir2],
  );

  // Backward-compatible string distance (e.g. "45.0")
  const kmDistanceS1 = useMemo(() => {
    if (kmLiveS1.diff !== null && kmLiveS1.status !== "negative") {
      return kmLiveS1.diff.toFixed(1);
    }
    return null;
  }, [kmLiveS1]);

  const kmDistanceS2 = useMemo(() => {
    if (kmLiveS2.diff !== null && kmLiveS2.status !== "negative") {
      return kmLiveS2.diff.toFixed(1);
    }
    return null;
  }, [kmLiveS2]);

  // Skenario 5: Salin KM Akhir S1 ke KM Awal S2
  const handleCopyKmAkhir1ToAwal2 = () => {
    if (kmAkhir1 && kmAkhir1.trim().length > 3) {
      const copiedVal = kmAkhir1.trim();
      setKmAwal2(copiedVal);
      // Buka dan prefill KM Akhir S2 jika masih kosong
      const prefill = extractLeading3Digits(copiedVal);
      if (prefill && (!kmAkhir2 || kmAkhir2.trim() === "")) {
        setKmAkhir2(prefill);
      }
    }
  };

  // Deteksi Smart Rollover (Skenario 6: Pergantian Kepala Ribuan Lintas Hari)
  // Menentukan identitas shift target rollover secara eksplisit (R108-01)
  const rolloverTargetShift = useMemo<"shift1" | "shift2" | null>(() => {
    if (isSingleMode) {
      if (effectiveCategory === "kmAwal2" || effectiveCategory === "kmAkhir2") {
        const hasShift1 =
          (bus.kmAwal1 && bus.kmAwal1.trim() !== "") ||
          (kmAwal1 && kmAwal1.trim() !== "" && kmAwal1.trim().length > 3);
        if (!hasShift1) return "shift2";
        return null;
      }
      return "shift1";
    }
    if (activeTab === "shift2") {
      const hasShift1 =
        (bus.kmAwal1 && bus.kmAwal1.trim() !== "") ||
        (kmAwal1 && kmAwal1.trim() !== "" && kmAwal1.trim().length > 3);
      if (!hasShift1) return "shift2";
      return null;
    }
    return "shift1";
  }, [
    isSingleMode,
    effectiveCategory,
    activeTab,
    bus.kmAwal1,
    kmAwal1,
  ]);

  const targetKmAwalForRollover = useMemo(() => {
    if (rolloverTargetShift === "shift2") return kmAwal2;
    if (rolloverTargetShift === "shift1") return kmAwal1;
    return "";
  }, [rolloverTargetShift, kmAwal1, kmAwal2]);

  const smartRolloverSuggestion = useMemo(() => {
    if (!targetKmAwalForRollover || !previousDayKmAkhir2) return null;
    return detectSmartRollover(targetKmAwalForRollover, previousDayKmAkhir2);
  }, [targetKmAwalForRollover, previousDayKmAkhir2]);

  const applyRollover = (): boolean => {
    if (!smartRolloverSuggestion || !rolloverTargetShift) return false;
    if (rolloverTargetShift === "shift2") {
      setKmAwal2(smartRolloverSuggestion.suggestedKm);
      if (!kmAkhir2 || kmAkhir2.trim().length <= 3) {
        setKmAkhir2(extractLeading3Digits(smartRolloverSuggestion.suggestedKm));
      }
    } else if (rolloverTargetShift === "shift1") {
      setKmAwal1(smartRolloverSuggestion.suggestedKm);
      if (!kmAkhir1 || kmAkhir1.trim().length <= 3) {
        setKmAkhir1(extractLeading3Digits(smartRolloverSuggestion.suggestedKm));
      }
    }
    return true;
  };

  return {
    kmAwal1,
    setKmAwal1,
    kmAkhir1,
    setKmAkhir1,
    kmAwal2,
    setKmAwal2,
    kmAkhir2,
    setKmAkhir2,
    isKmAwal1PrefillOnly,
    isKmAwal1Valid,
    isKmAkhir1PrefillOnly,
    isKmAkhir1Valid,
    isKmAwal2PrefillOnly,
    isKmAwal2Valid,
    isKmAkhir2PrefillOnly,
    isKmAkhir2Valid,
    isKmAkhir1Locked,
    isKmAwal2Locked,
    isKmAkhir2Locked,
    isS1Started,
    effectiveCategory,
    guideMessage,
    kmLiveS1,
    kmLiveS2,
    kmDistanceS1,
    kmDistanceS2,
    handleCopyKmAkhir1ToAwal2,
    targetKmAwalForRollover,
    smartRolloverSuggestion,
    rolloverTargetShift,
    applyRollover,
  };
}
