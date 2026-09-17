import { useState, useMemo, useRef, useEffect, useId } from "react";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import { parseIndonesianNumber } from "@/utils/numberUtils";
import {
  getSatsetMode,
  setSatsetMode,
  SINGLE_COLUMN_META,
} from "@/utils/modals/busInput/busModalTypes";
import {
  validateKmPair,
  validateToaValue,
  validateToaPair,
  validateTripCount,
} from "@/utils/modals/busInput/busModalValidation";
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
  const [kmAwal1, setKmAwal1] = useState(bus.kmAwal1 || "");
  const [kmAkhir1, setKmAkhir1] = useState(bus.kmAkhir1 || "");

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
  const [kmAwal2, setKmAwal2] = useState(bus.kmAwal2 || "");
  const [kmAkhir2, setKmAkhir2] = useState(bus.kmAkhir2 || "");

  const [keterangan, setKeterangan] = useState(bus.keterangan || "");
  const [showKeterangan, setShowKeterangan] = useState(
    Boolean(bus.keterangan && bus.keterangan.trim() !== ""),
  );
  const [showKmAkhir1InSingle, setShowKmAkhir1InSingle] = useState(
    Boolean(bus.kmAkhir1 && bus.kmAkhir1.trim() !== ""),
  );
  const [showKmAkhir2InSingle, setShowKmAkhir2InSingle] = useState(
    Boolean(bus.kmAkhir2 && bus.kmAkhir2.trim() !== ""),
  );

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
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
        if ("select" in targetElement && typeof targetElement.select === "function") {
          targetElement.select();
        }
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [isOpen, isMounted, isSingleMode, activeTab]);

  // Smart Viewport Auto-Scroll on focus
  const handleInputFocus = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    try {
      e.target.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {
      // safe fallback
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

  // Live distance calculation
  const kmDistanceS1 = useMemo(() => {
    const awal = parseIndonesianNumber(kmAwal1);
    const akhir = parseIndonesianNumber(kmAkhir1);
    if (!isNaN(awal) && !isNaN(akhir) && akhir >= awal) {
      return (akhir - awal).toFixed(1);
    }
    return null;
  }, [kmAwal1, kmAkhir1]);

  const kmDistanceS2 = useMemo(() => {
    const awal = parseIndonesianNumber(kmAwal2);
    const akhir = parseIndonesianNumber(kmAkhir2);
    if (!isNaN(awal) && !isNaN(akhir) && akhir >= awal) {
      return (akhir - awal).toFixed(1);
    }
    return null;
  }, [kmAwal2, kmAkhir2]);

  // Toggle Mode Satset
  const handleToggleSatset = () => {
    const next = !isSatset;
    setIsSatsetState(next);
    setSatsetMode(next);
  };

  // Form Submit handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (isSingleMode) {
      if (activeCategory === "toaShift1") {
        const err = validateToaValue(
          toaShift1,
          TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S1,
        );
        if (err) errors.push(err);
        if (showManual1) {
          const errM = validateToaValue(
            manualShift1,
            TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S1,
          );
          if (errM) errors.push(errM);
        }
        if (totalToa) {
          const errPair = validateToaPair(toaShift1, totalToa);
          if (errPair) errors.push(errPair);
        }
      } else if (activeCategory === "totalToa") {
        const err = validateToaValue(
          totalToa,
          TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOTAL_TOA,
        );
        if (err) errors.push(err);
        if (showManual2) {
          const errM = validateToaValue(
            manualShift2,
            TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S2,
          );
          if (errM) errors.push(errM);
        }
        const errPair = validateToaPair(toaShift1, totalToa);
        if (errPair) errors.push(errPair);
      } else if (activeCategory === "kmAwal1" || activeCategory === "kmAkhir1") {
        const err = validateKmPair(kmAwal1, kmAkhir1, "Shift 1");
        if (err) errors.push(err);
      } else if (activeCategory === "kmAwal2" || activeCategory === "kmAkhir2") {
        const err = validateKmPair(kmAwal2, kmAkhir2, "Shift 2");
        if (err) errors.push(err);
      }
    } else {
      const errTp = validateTripCount(
        tripPergi,
        headerMap?.tripPergiLabel || "Trip Pergi",
      );
      if (errTp) errors.push(errTp);
      const errTpl = validateTripCount(
        tripPulang,
        headerMap?.tripPulangLabel || "Trip Pulang",
      );
      if (errTpl) errors.push(errTpl);

      const errToaS1 = validateToaValue(
        toaShift1,
        TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S1,
      );
      if (errToaS1) errors.push(errToaS1);
      if (showManual1) {
        const errManS1 = validateToaValue(
          manualShift1,
          TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S1,
        );
        if (errManS1) errors.push(errManS1);
      }

      const errKmS1 = validateKmPair(kmAwal1, kmAkhir1, "Shift 1");
      if (errKmS1) errors.push(errKmS1);

      const errToaS2 = validateToaValue(toaShift2, "TOA Shift 2");
      if (errToaS2) errors.push(errToaS2);
      if (showManual2) {
        const errManS2 = validateToaValue(
          manualShift2,
          TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S2,
        );
        if (errManS2) errors.push(errManS2);
      }

      const errKmS2 = validateKmPair(kmAwal2, kmAkhir2, "Shift 2");
      if (errKmS2) errors.push(errKmS2);

      const toaS1Num = parseIndonesianNumber(toaShift1);
      const toaS2Num = parseIndonesianNumber(toaShift2);
      const finalToaS1 = isNaN(toaS1Num) ? 0 : toaS1Num;
      const finalToaS2 = isNaN(toaS2Num) ? 0 : toaS2Num;
      const computedTotal = finalToaS1 + finalToaS2;
      const prospectiveTotal =
        computedTotal > 0 ? String(computedTotal) : totalToa;
      if (prospectiveTotal) {
        const errPair = validateToaPair(toaShift1, prospectiveTotal);
        if (errPair) errors.push(errPair);
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    let effectiveTotalToa = "";
    if (isSingleMode && activeCategory === "totalToa") {
      effectiveTotalToa = totalToa.trim();
    } else {
      const toaS1Num = parseIndonesianNumber(toaShift1);
      const toaS2Num = parseIndonesianNumber(toaShift2);
      const finalToaS1 = isNaN(toaS1Num) ? 0 : toaS1Num;
      const finalToaS2 = isNaN(toaS2Num) ? 0 : toaS2Num;
      const computedTotal = finalToaS1 + finalToaS2;
      effectiveTotalToa =
        computedTotal > 0 ? String(computedTotal) : totalToa.trim();
    }

    const updates: Partial<BusData> = {
      tripPergi: tripPergi.trim(),
      tripPulang: tripPulang.trim(),
      toaShift1: toaShift1.trim(),
      manualShift1: showManual1 ? manualShift1.trim() : "",
      kmAwal1: kmAwal1.trim(),
      kmAkhir1: kmAkhir1.trim(),
      toaShift2: toaShift2.trim(),
      manualShift2: showManual2 ? manualShift2.trim() : "",
      kmAwal2: kmAwal2.trim(),
      kmAkhir2: kmAkhir2.trim(),
      totalToa: effectiveTotalToa,
      keterangan: keterangan.trim(),
    };

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
  };
}

export type BusInputFormReturn = ReturnType<typeof useBusInputForm>;
