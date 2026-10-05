import { useState, useMemo, useRef, useEffect, useId } from "react";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import {
  getSatsetMode,
  setSatsetMode,
  SINGLE_COLUMN_META,
} from "@/utils/modals/busInput/busModalTypes";
import {
  computeLiveToaShift2,
  extractLeading3Digits,
} from "@/utils/modals/busInput/busModalOdometer";
import { useBusModalOdometer } from "./useBusModalOdometer";
import {
  validateBusInputForm,
  getCrossDayValidationErrors,
} from "./busInputValidation";
import { buildBusInputPayload } from "./busInputPayload";
import { TEXT_ALERTS } from "@/constants/texts";

export type ModalTab = "shift1" | "shift2" | "trip" | "notes";

export interface UseBusInputFormProps {
  bus: BusData;
  headerMap?: HeaderMap;
  activeCategory?: string;
  initialTab?: ModalTab;
  onSave: (updates: Partial<BusData>) => void | Promise<void>;
  onDismiss: () => void;
  isOpen: boolean;
  isMounted: boolean;
  previousDayKmAkhir2?: string;
  previousDayDateLabel?: string;
}

export function useBusInputForm({
  bus,
  headerMap,
  activeCategory = "all",
  initialTab = "shift1",
  onSave,
  onDismiss,
  isOpen,
  isMounted,
  previousDayKmAkhir2,
  previousDayDateLabel,
}: UseBusInputFormProps) {
  // Evaluasi mode Single-Column Focus
  const isSingleColumnEligible = Boolean(
    activeCategory &&
      activeCategory.toUpperCase() !== "ALL" &&
      SINGLE_COLUMN_META[activeCategory],
  );
  const [isExpandedAll, setIsExpandedAll] = useState(false);
  const isSingleMode = isSingleColumnEligible && !isExpandedAll;

  // Resolved initial tab
  const resolvedInitialTab: ModalTab = useMemo(() => {
    if (
      activeCategory === "trip" ||
      activeCategory === "tripPergi" ||
      activeCategory === "tripPulang"
    ) {
      return "trip";
    }
    if (activeCategory.toLowerCase().includes("2")) {
      return "shift2";
    }
    if (activeCategory === "keterangan") {
      return "notes";
    }
    return initialTab || "shift1";
  }, [activeCategory, initialTab]);

  const [activeTab, setActiveTab] = useState<ModalTab>(resolvedInitialTab);
  const [isSatset, setIsSatsetState] = useState<boolean>(getSatsetMode());

  // Form Fields State
  const [tripPergi, setTripPergi] = useState(bus.tripPergi || "");
  const [tripPulang, setTripPulang] = useState(bus.tripPulang || "");
  const [toaShift1, setToaShift1] = useState(bus.toaShift1 || "");
  const [manualShift1, setManualShift1] = useState(bus.manualShift1 || "");
  const [showManual1, setShowManual1] = useState(
    Boolean(
      bus.manualShift1 &&
        bus.manualShift1 !== "0" &&
        bus.manualShift1.trim() !== "",
    ),
  );

  const [toaShift2, setToaShift2] = useState(bus.toaShift2 || "");
  const [totalToa, setTotalToa] = useState(bus.totalToa || "");
  const [manualShift2, setManualShift2] = useState(bus.manualShift2 || "");
  const [showManual2, setShowManual2] = useState(
    Boolean(
      bus.manualShift2 &&
        bus.manualShift2 !== "0" &&
        bus.manualShift2.trim() !== "",
    ),
  );

  // Sub-hook Odometer: 4 state KM, prefill, lock berantai, rollover, dan jarak live (Batch 3.2)
  const odometer = useBusModalOdometer({
    bus,
    previousDayKmAkhir2,
    isSingleMode,
    activeCategory,
    activeTab,
  });

  const {
    kmAwal1,
    setKmAwal1,
    kmAkhir1,
    setKmAkhir1,
    kmAwal2,
    setKmAwal2,
    kmAkhir2,
    setKmAkhir2,
    isKmAwal1Valid,
    isKmAkhir1Valid,
    isKmAwal2Valid,
    isKmAkhir2Valid,
    isKmAkhir1Locked,
    isKmAwal2Locked,
    isKmAkhir2Locked,
    effectiveCategory,
    guideMessage,
    kmLiveS1,
    kmLiveS2,
    kmDistanceS1,
    kmDistanceS2,
    handleCopyKmAkhir1ToAwal2,
    smartRolloverSuggestion,
  } = odometer;

  const [keterangan, setKeterangan] = useState(bus.keterangan || "");
  const [showKeterangan, setShowKeterangan] = useState(
    isSingleMode
      ? activeCategory === "keterangan"
      : Boolean(bus.keterangan && bus.keterangan.trim() !== ""),
  );
  const [showKmAkhir1InSingle, setShowKmAkhir1InSingle] = useState(
    isSingleMode
      ? activeCategory === "kmAkhir1"
      : Boolean(bus.kmAkhir1 && bus.kmAkhir1.trim() !== ""),
  );
  const [showKmAkhir2InSingle, setShowKmAkhir2InSingle] = useState(
    isSingleMode
      ? activeCategory === "kmAkhir2"
      : Boolean(bus.kmAkhir2 && bus.kmAkhir2.trim() !== ""),
  );

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [bypassOdometerReset, setBypassOdometerReset] = useState<boolean>(false);
  const formId = useId();

  // Input refs for autofocus & autoselect
  const singlePrimaryInputRef = useRef<HTMLInputElement>(null);
  const toaS1InputRef = useRef<HTMLInputElement>(null);
  const toaS2InputRef = useRef<HTMLInputElement>(null);
  const tripPergiInputRef = useRef<HTMLInputElement>(null);
  const keteranganInputRef = useRef<HTMLTextAreaElement>(null);

  // Autofocus & Autoselect in 60ms (DOM paint & mobile keyboard)
  useEffect(() => {
    if (!isOpen || !isMounted) return;

    const timer = setTimeout(() => {
      let targetElement: HTMLInputElement | HTMLTextAreaElement | null = null;
      if (isSingleMode) {
        targetElement = singlePrimaryInputRef.current;
      } else {
        if (activeTab === "shift1") targetElement = toaS1InputRef.current;
        else if (activeTab === "shift2") targetElement = toaS2InputRef.current;
        else if (activeTab === "trip") targetElement = tripPergiInputRef.current;
        else if (activeTab === "notes") targetElement = keteranganInputRef.current;
      }

      if (targetElement) {
        targetElement.focus();
        const val = targetElement.value || "";
        const isKmInput =
          (isSingleMode && Boolean(effectiveCategory?.toLowerCase().includes("km"))) ||
          Boolean(targetElement.id && targetElement.id.toLowerCase().includes("km"));
        const isPrefillOnly = isKmInput && val.length > 0 && val.length <= 3;

        if (isPrefillOnly) {
          // Jangan block/select 3 digit prefill! Letakkan kursor di paling kanan (akhir teks)
          // agar user dapat langsung mengetik kelanjutan digit tanpa menimpa prefill.
          try {
            if (typeof targetElement.setSelectionRange === "function") {
              targetElement.setSelectionRange(val.length, val.length);
            }
          } catch {
            // safe fallback
          }
        } else {
          try {
            if ("select" in targetElement && typeof targetElement.select === "function") {
              targetElement.select();
            }
          } catch {
            // safe fallback
          }
        }
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [isOpen, isMounted, isSingleMode, activeTab, effectiveCategory]);

  // Jika input KM yang sedang aktif terisi 3 digit prefill, pastikan kursor diletakkan di akhir teks (bukan di-select)
  useEffect(() => {
    if (isSingleMode && effectiveCategory?.toLowerCase().includes("km")) {
      const el = singlePrimaryInputRef.current;
      if (el && document.activeElement === el) {
        const val = el.value || "";
        if (val.length > 0 && val.length <= 3) {
          try {
            if (typeof el.setSelectionRange === "function") {
              el.setSelectionRange(val.length, val.length);
            }
          } catch {}
        }
      }
    }
  }, [kmAwal1, kmAkhir1, kmAwal2, kmAkhir2, isSingleMode, effectiveCategory]);

  // Smart Viewport Auto-Scroll on focus & kursor di akhir untuk prefill
  const handleInputFocus = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    try {
      e.target.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {
      // safe fallback
    }

    const val = e.target.value || "";
    const isKmInput = Boolean(e.target.id && e.target.id.toLowerCase().includes("km"));
    if (isKmInput && val.length > 0 && val.length <= 3) {
      try {
        if (typeof (e.target as HTMLInputElement).setSelectionRange === "function") {
          (e.target as HTMLInputElement).setSelectionRange(val.length, val.length);
        }
      } catch {
        // safe fallback
      }
    }
  };

  // Enter-to-Save
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = (e.target as HTMLElement).closest("form");
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const toaLiveS2 = useMemo(
    () => computeLiveToaShift2(totalToa, toaShift1),
    [totalToa, toaShift1],
  );

  const handleApplyRollover = () => {
    const targetShift = odometer.rolloverTargetShift;
    const suggestion = odometer.smartRolloverSuggestion;
    const applied = odometer.applyRollover();

    if (applied && validationErrors.length > 0 && suggestion && targetShift) {
      // Hitung angka KM terkini setelah rollover diterapkan (R112-01)
      const nextKmAwal1 =
        targetShift === "shift1" ? suggestion.suggestedKm : kmAwal1;
      const nextKmAwal2 =
        targetShift === "shift2" ? suggestion.suggestedKm : kmAwal2;
      const nextKmAkhir1 =
        targetShift === "shift1" && (!kmAkhir1 || kmAkhir1.trim().length <= 3)
          ? extractLeading3Digits(suggestion.suggestedKm)
          : kmAkhir1;
      const nextKmAkhir2 =
        targetShift === "shift2" && (!kmAkhir2 || kmAkhir2.trim().length <= 3)
          ? extractLeading3Digits(suggestion.suggestedKm)
          : kmAkhir2;

      // Segarkan error validasi aktif dengan nilai KM terbaru
      const refreshedErrors = validateBusInputForm({
        isSingleMode,
        effectiveCategory,
        tripPergi,
        tripPulang,
        toaShift1,
        toaShift2,
        totalToa,
        manualShift1,
        manualShift2,
        showManual1,
        showManual2,
        kmAwal1: nextKmAwal1,
        kmAkhir1: nextKmAkhir1,
        kmAwal2: nextKmAwal2,
        kmAkhir2: nextKmAkhir2,
        bus,
        bypassOdometerReset,
        previousDayKmAkhir2,
        previousDayDateLabel,
        headerMap,
      });

      setValidationErrors(refreshedErrors);
    }
  };

  // Toggle Mode Satset
  const handleToggleSatset = () => {
    const next = !isSatset;
    setIsSatsetState(next);
    setSatsetMode(next);
  };

  // Helper murni delegasi ke busInputValidation
  const getActiveCrossDayErrors = (bypass: boolean = false): string[] => {
    return getCrossDayValidationErrors({
      isSingleMode,
      effectiveCategory,
      kmAwal1,
      kmAkhir1,
      kmAwal2,
      bus,
      bypassOdometerReset: bypass,
      previousDayKmAkhir2,
      previousDayDateLabel,
    });
  };

  const hasCrossDayError =
    bypassOdometerReset ||
    validationErrors.some((err) =>
      getActiveCrossDayErrors(false).includes(err),
    );

  const handleToggleBypassOdometerReset = (checked: boolean) => {
    setBypassOdometerReset(checked);
    if (checked) {
      const crossDayErrors = getActiveCrossDayErrors(false);
      setValidationErrors((prev) =>
        prev.filter((err) => !crossDayErrors.includes(err)),
      );
    }
  };

  // Form Submit handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateBusInputForm({
      isSingleMode,
      effectiveCategory,
      tripPergi,
      tripPulang,
      toaShift1,
      toaShift2,
      totalToa,
      manualShift1,
      manualShift2,
      showManual1,
      showManual2,
      kmAwal1,
      kmAkhir1,
      kmAwal2,
      kmAkhir2,
      bus,
      bypassOdometerReset,
      previousDayKmAkhir2,
      previousDayDateLabel,
      headerMap,
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    const updates = buildBusInputPayload({
      isSingleMode,
      effectiveCategory,
      tripPergi,
      tripPulang,
      toaShift1,
      toaShift2,
      totalToa,
      manualShift1,
      manualShift2,
      showManual1,
      showManual2,
      kmAwal1,
      kmAkhir1,
      kmAwal2,
      kmAkhir2,
      isKmAwal1Valid,
      isKmAwal2Valid,
      isKmAwal2Locked,
      showKmAkhir1InSingle,
      showKmAkhir2InSingle,
      keterangan,
      showKeterangan,
      bus,
      previousDayKmAkhir2,
    });

    onSave(updates);
    onDismiss();
  };

  return {
    isSingleMode,
    isSingleColumnEligible,
    isExpandedAll,
    setIsExpandedAll,
    activeTab,
    setActiveTab,
    isSatset,
    handleToggleSatset,
    formId,
    validationErrors,
    handleFormSubmit,
    handleInputFocus,
    handleInputKeyDown,
    singlePrimaryInputRef,
    toaS1InputRef,
    toaS2InputRef,
    tripPergiInputRef,
    keteranganInputRef,
    // Fields & state
    tripPergi,
    setTripPergi,
    tripPulang,
    setTripPulang,
    toaShift1,
    setToaShift1,
    manualShift1,
    setManualShift1,
    showManual1,
    setShowManual1,
    kmAwal1,
    setKmAwal1,
    kmAkhir1,
    setKmAkhir1,
    toaShift2,
    setToaShift2,
    totalToa,
    setTotalToa,
    manualShift2,
    setManualShift2,
    showManual2,
    setShowManual2,
    kmAwal2,
    setKmAwal2,
    kmAkhir2,
    setKmAkhir2,
    keterangan,
    setKeterangan,
    showKeterangan,
    setShowKeterangan,
    showKmAkhir1InSingle,
    setShowKmAkhir1InSingle,
    showKmAkhir2InSingle,
    setShowKmAkhir2InSingle,
    kmDistanceS1,
    kmDistanceS2,
    kmLiveS1,
    kmLiveS2,
    toaLiveS2,
    handleCopyKmAkhir1ToAwal2,
    bus,
    previousDayKmAkhir2,
    previousDayDateLabel:
      previousDayDateLabel || TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_PREVIOUS_DAY,
    // Smart Rollover & Cross-Day Validation (Skenario 6)
    bypassOdometerReset,
    setBypassOdometerReset,
    handleToggleBypassOdometerReset,
    hasCrossDayError,
    smartRolloverSuggestion,
    handleApplyRollover,
    // Cascading & Single Mode Redirection Flags (SSOT)
    effectiveCategory,
    guideMessage,
    isKmAwal1Valid,
    isKmAkhir1Valid,
    isKmAwal2Valid,
    isKmAkhir2Valid,
    isKmAkhir1Locked,
    isKmAwal2Locked,
    isKmAkhir2Locked,
  };
}

export type BusInputFormReturn = ReturnType<typeof useBusInputForm>;
