import React, { useState, useEffect, useRef, useMemo, useId } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Zap,
  Check,
  AlertCircle,
  Bus,
  FileText,
  Gauge,
} from "lucide-react";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import { parseIndonesianNumber } from "@/utils/numberUtils";
import {
  getSatsetMode,
  setSatsetMode,
  MAX_TOA_VALUE,
  MAX_TRIP_COUNT,
} from "@/utils/modals/busInput/busModalTypes";
import {
  validateKmPair,
  validateToaValue,
  validateTripCount,
} from "@/utils/modals/busInput/busModalValidation";
import { TEXT_ALERTS, TEXT_COMMON } from "@/constants/texts";

export interface BusInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  bus: BusData;
  headerMap?: HeaderMap;
  activeCategory?: string;
  initialTab?: "shift1" | "shift2" | "trip" | "notes";
  onSave: (updates: Partial<BusData>) => void | Promise<void>;
}

type ModalTab = "shift1" | "shift2" | "trip" | "notes";

const KETERANGAN_OPTIONS = [
  { value: "", label: "SGO (Siap Guna Operasi)" },
  { value: "AP", label: "AP (Ada Perbaikan)" },
  { value: "TO", label: "TO (Tunggu Onderdil)" },
  { value: "BA", label: "BA (Berita Acara)" },
  { value: "OFF", label: "OFF (Tidak Beroperasi)" },
];

export function BusInputModal({
  isOpen,
  onClose,
  bus,
  headerMap,
  activeCategory = "all",
  initialTab = "shift1",
  onSave,
}: BusInputModalProps) {
  // Tentukan tab awal berdasarkan initialTab atau activeCategory
  const resolvedInitialTab: ModalTab = useMemo(() => {
    if (activeCategory === "trip" || activeCategory === "tripPergi" || activeCategory === "tripPulang") {
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
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isClosingRef = useRef(false);

  // Form Fields State
  const [tripPergi, setTripPergi] = useState(bus.tripPergi || "");
  const [tripPulang, setTripPulang] = useState(bus.tripPulang || "");
  const [toaShift1, setToaShift1] = useState(bus.toaShift1 || "");
  const [manualShift1, setManualShift1] = useState(bus.manualShift1 || "");
  const [showManual1, setShowManual1] = useState(
    Boolean(bus.manualShift1 && bus.manualShift1 !== "0" && bus.manualShift1.trim() !== ""),
  );
  const [kmAwal1, setKmAwal1] = useState(bus.kmAwal1 || "");
  const [kmAkhir1, setKmAkhir1] = useState(bus.kmAkhir1 || "");

  const [toaShift2, setToaShift2] = useState(bus.toaShift2 || "");
  const [manualShift2, setManualShift2] = useState(bus.manualShift2 || "");
  const [showManual2, setShowManual2] = useState(
    Boolean(bus.manualShift2 && bus.manualShift2 !== "0" && bus.manualShift2.trim() !== ""),
  );
  const [kmAwal2, setKmAwal2] = useState(bus.kmAwal2 || "");
  const [kmAkhir2, setKmAkhir2] = useState(bus.kmAkhir2 || "");

  const [keterangan, setKeterangan] = useState(bus.keterangan || "");
  const [selectedKetCategory, setSelectedKetCategory] = useState(() => {
    const raw = (bus.keterangan || "").trim().toUpperCase();
    for (const opt of KETERANGAN_OPTIONS) {
      if (opt.value && raw.startsWith(opt.value)) return opt.value;
    }
    return "";
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Unique form ID for accessibility
  const formId = useId();

  // Animasi & keyboard handlers
  const handleDismiss = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    setTimeout(onClose, 220);
  };

  const handleDismissRef = useRef(handleDismiss);
  handleDismissRef.current = handleDismiss;

  useEffect(() => {
    if (!isOpen) {
      setIsMounted(false);
      setIsClosing(false);
      isClosingRef.current = false;
      return;
    }

    const frameId = requestAnimationFrame(() => setIsMounted(true));
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismissRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Kalkulasi live jarak tempuh
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

  // Validasi & Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    // Validasi Trip
    const errTp = validateTripCount(tripPergi, headerMap?.tripPergiLabel || "Trip Pergi");
    if (errTp) errors.push(errTp);
    const errTpl = validateTripCount(tripPulang, headerMap?.tripPulangLabel || "Trip Pulang");
    if (errTpl) errors.push(errTpl);

    // Validasi TOA S1 & Manual S1
    const errToaS1 = validateToaValue(toaShift1, TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S1);
    if (errToaS1) errors.push(errToaS1);
    if (showManual1) {
      const errManS1 = validateToaValue(manualShift1, TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S1);
      if (errManS1) errors.push(errManS1);
    }

    // Validasi KM S1
    const errKmS1 = validateKmPair(kmAwal1, kmAkhir1, "Shift 1");
    if (errKmS1) errors.push(errKmS1);

    // Validasi TOA S2 & Manual S2
    const errToaS2 = validateToaValue(toaShift2, "TOA Shift 2");
    if (errToaS2) errors.push(errToaS2);
    if (showManual2) {
      const errManS2 = validateToaValue(manualShift2, TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S2);
      if (errManS2) errors.push(errManS2);
    }

    // Validasi KM S2
    const errKmS2 = validateKmPair(kmAwal2, kmAkhir2, "Shift 2");
    if (errKmS2) errors.push(errKmS2);

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const toaS1Num = parseIndonesianNumber(toaShift1);
    const toaS2Num = parseIndonesianNumber(toaShift2);

    // Hitung total TOA
    const finalToaS1 = isNaN(toaS1Num) ? 0 : toaS1Num;
    const finalToaS2 = isNaN(toaS2Num) ? 0 : toaS2Num;
    const totalToa = finalToaS1 + finalToaS2;

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
      totalToa: totalToa > 0 ? String(totalToa) : "",
      keterangan: keterangan.trim(),
    };

    onSave(updates);
    handleDismiss();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay bus-input-modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        opacity: isClosing ? 0 : isMounted ? 1 : 0,
        transition:
          "opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
        willChange: "opacity, background-color",
      }}
      onClick={handleDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass bus-input-modal-content"
        style={{
          width: "100%",
          maxWidth: "560px",
          maxHeight: "min(92dvh, 780px)",
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          padding: "20px 20px calc(24px + env(safe-area-inset-bottom, 0px)) 20px",
          background: "var(--card-bg, #1e293b)",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
          borderBottom: "none",
          boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.5)",
          transform:
            isClosing || !isMounted
              ? "translateY(100%) scale(0.95)"
              : "translateY(0px) scale(1)",
          transition: "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`bus-modal-title-${formId}`}
      >
        {/* 1. Header Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "14px",
            borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "var(--color-primary-bg, rgba(59, 130, 246, 0.15))",
                color: "var(--color-primary, #38bdf8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bus size={20} />
            </div>
            <div>
              <h2
                id={`bus-modal-title-${formId}`}
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  margin: 0,
                  color: "var(--text-main, #f8fafc)",
                  letterSpacing: "-0.01em",
                }}
              >
                Unit {bus.unit}
              </h2>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary, #94a3b8)",
                }}
              >
                {TEXT_ALERTS.BUS_INPUT_MODAL.SUBTITLE}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Mode Satset Pill Toggle */}
            <button
              type="button"
              onClick={handleToggleSatset}
              title={TEXT_ALERTS.BUS_INPUT_MODAL.SATSET_TOOLTIP}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 600,
                border: "1px solid",
                borderColor: isSatset ? "var(--accent-color, #38bdf8)" : "rgba(255, 255, 255, 0.1)",
                background: isSatset
                  ? "rgba(56, 189, 248, 0.15)"
                  : "rgba(255, 255, 255, 0.04)",
                color: isSatset ? "var(--accent-color, #38bdf8)" : "var(--text-secondary, #94a3b8)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Zap size={13} fill={isSatset ? "currentColor" : "none"} />
              <span>Satset</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label={TEXT_ALERTS.BUS_INPUT_MODAL.MODAL_CLOSE_ARIA}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.06)",
                border: "none",
                color: "var(--text-secondary, #94a3b8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2. Segmented Navigation Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "4px",
            padding: "8px 0",
            borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.06))",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("shift1")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 4px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: activeTab === "shift1" ? 700 : 500,
              background: activeTab === "shift1" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: activeTab === "shift1" ? "#38bdf8" : "var(--text-secondary, #94a3b8)",
              border: activeTab === "shift1" ? "1px solid rgba(56, 189, 248, 0.3)" : "none",
              cursor: "pointer",
            }}
          >
            <Gauge size={14} />
            <span>Shift 1</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("shift2")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 4px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: activeTab === "shift2" ? 700 : 500,
              background: activeTab === "shift2" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: activeTab === "shift2" ? "#38bdf8" : "var(--text-secondary, #94a3b8)",
              border: activeTab === "shift2" ? "1px solid rgba(56, 189, 248, 0.3)" : "none",
              cursor: "pointer",
            }}
          >
            <Gauge size={14} />
            <span>Shift 2</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("trip")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 4px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: activeTab === "trip" ? 700 : 500,
              background: activeTab === "trip" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: activeTab === "trip" ? "#38bdf8" : "var(--text-secondary, #94a3b8)",
              border: activeTab === "trip" ? "1px solid rgba(56, 189, 248, 0.3)" : "none",
              cursor: "pointer",
            }}
          >
            <Bus size={14} />
            <span>{TEXT_ALERTS.BUS_INPUT_MODAL.TAB_RITASE}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 4px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: activeTab === "notes" ? 700 : 500,
              background: activeTab === "notes" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: activeTab === "notes" ? "#38bdf8" : "var(--text-secondary, #94a3b8)",
              border: activeTab === "notes" ? "1px solid rgba(56, 189, 248, 0.3)" : "none",
              cursor: "pointer",
            }}
          >
            <FileText size={14} />
            <span>{TEXT_ALERTS.BUS_INPUT_MODAL.TAB_KET}</span>
          </button>
        </div>

        {/* 3. Validation Errors Alert Bar */}
        {validationErrors.length > 0 && (
          <div
            style={{
              margin: "12px 0 0 0",
              padding: "8px 12px",
              borderRadius: "8px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#f87171",
              fontSize: "0.8rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
              <AlertCircle size={15} />
              <span>{TEXT_ALERTS.BUS_INPUT_MODAL.VALIDATION_HEADER}</span>
            </div>
            <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 4. Form Body */}
        <form
          onSubmit={handleFormSubmit}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 0",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {/* TAB 1: SHIFT 1 */}
          {activeTab === "shift1" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                <div>
                  <label
                    htmlFor="input-toa-s1"
                    style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
                  >
                    TOA Shift 1
                  </label>
                  <input
                    id="input-toa-s1"
                    type="number"
                    min="0"
                    max={MAX_TOA_VALUE}
                    value={toaShift1}
                    onChange={(e) => setToaShift1(e.target.value)}
                    placeholder="Contoh: 150"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
                      background: "rgba(0, 0, 0, 0.25)",
                      color: "var(--text-main, #f8fafc)",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Tiket Manual Toggle */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      color: "var(--text-secondary, #94a3b8)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={showManual1}
                      onChange={(e) => setShowManual1(e.target.checked)}
                      style={{ cursor: "pointer" }}
                    />
                    <span>{TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_HAS_MANUAL_S1}</span>
                  </label>

                  {showManual1 && (
                    <input
                      type="number"
                      min="0"
                      max={MAX_TOA_VALUE}
                      value={manualShift1}
                      onChange={(e) => setManualShift1(e.target.value)}
                      placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_MANUAL_S1}
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
                        background: "rgba(0, 0, 0, 0.25)",
                        color: "var(--text-main, #f8fafc)",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                      }}
                    />
                  )}
                </div>
              </div>

              {/* KM S1 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label
                    htmlFor="input-km-awal-1"
                    style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
                  >
                    {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AWAL_S1}
                  </label>
                  <input
                    id="input-km-awal-1"
                    type="text"
                    value={kmAwal1}
                    onChange={(e) => setKmAwal1(e.target.value)}
                    placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AWAL_1}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
                      background: "rgba(0, 0, 0, 0.25)",
                      color: "var(--text-main, #f8fafc)",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="input-km-akhir-1"
                    style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
                  >
                    {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AKHIR_S1}
                  </label>
                  <input
                    id="input-km-akhir-1"
                    type="text"
                    value={kmAkhir1}
                    onChange={(e) => setKmAkhir1(e.target.value)}
                    placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AKHIR_1}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
                      background: "rgba(0, 0, 0, 0.25)",
                      color: "var(--text-main, #f8fafc)",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Live Distance Preview */}
              {kmDistanceS1 !== null && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "rgba(56, 189, 248, 0.08)",
                    border: "1px solid rgba(56, 189, 248, 0.2)",
                    fontSize: "0.82rem",
                    display: "flex",
                    justifyContent: "space-between",
                    color: "var(--text-main, #f8fafc)",
                  }}
                >
                  <span>{TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S1}</span>
                  <span style={{ fontWeight: 700, color: "#38bdf8" }}>{kmDistanceS1} KM</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SHIFT 2 */}
          {activeTab === "shift2" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                <div>
                  <label
                    htmlFor="input-toa-s2"
                    style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
                  >
                    TOA Shift 2
                  </label>
                  <input
                    id="input-toa-s2"
                    type="number"
                    min="0"
                    max={MAX_TOA_VALUE}
                    value={toaShift2}
                    onChange={(e) => setToaShift2(e.target.value)}
                    placeholder="Contoh: 180"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
                      background: "rgba(0, 0, 0, 0.25)",
                      color: "var(--text-main, #f8fafc)",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Tiket Manual Toggle S2 */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      color: "var(--text-secondary, #94a3b8)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={showManual2}
                      onChange={(e) => setShowManual2(e.target.checked)}
                      style={{ cursor: "pointer" }}
                    />
                    <span>{TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_HAS_MANUAL_S2}</span>
                  </label>

                  {showManual2 && (
                    <input
                      type="number"
                      min="0"
                      max={MAX_TOA_VALUE}
                      value={manualShift2}
                      onChange={(e) => setManualShift2(e.target.value)}
                      placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_MANUAL_S2}
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
                        background: "rgba(0, 0, 0, 0.25)",
                        color: "var(--text-main, #f8fafc)",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                      }}
                    />
                  )}
                </div>
              </div>

              {/* KM S2 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label
                    htmlFor="input-km-awal-2"
                    style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
                  >
                    {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AWAL_S2}
                  </label>
                  <input
                    id="input-km-awal-2"
                    type="text"
                    value={kmAwal2}
                    onChange={(e) => setKmAwal2(e.target.value)}
                    placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AWAL_2}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
                      background: "rgba(0, 0, 0, 0.25)",
                      color: "var(--text-main, #f8fafc)",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="input-km-akhir-2"
                    style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
                  >
                    {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AKHIR_S2}
                  </label>
                  <input
                    id="input-km-akhir-2"
                    type="text"
                    value={kmAkhir2}
                    onChange={(e) => setKmAkhir2(e.target.value)}
                    placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AKHIR_2}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
                      background: "rgba(0, 0, 0, 0.25)",
                      color: "var(--text-main, #f8fafc)",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Live Distance Preview S2 */}
              {kmDistanceS2 !== null && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "rgba(56, 189, 248, 0.08)",
                    border: "1px solid rgba(56, 189, 248, 0.2)",
                    fontSize: "0.82rem",
                    display: "flex",
                    justifyContent: "space-between",
                    color: "var(--text-main, #f8fafc)",
                  }}
                >
                  <span>{TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S2}</span>
                  <span style={{ fontWeight: 700, color: "#38bdf8" }}>{kmDistanceS2} KM</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RITASE (TRIP) */}
          {activeTab === "trip" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label
                    htmlFor="input-trip-pergi"
                    style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
                  >
                    {headerMap?.tripPergiLabel || "Trip Pergi"}
                  </label>
                  <input
                    id="input-trip-pergi"
                    type="number"
                    min="0"
                    max={MAX_TRIP_COUNT}
                    value={tripPergi}
                    onChange={(e) => setTripPergi(e.target.value)}
                    placeholder="0"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
                      background: "rgba(0, 0, 0, 0.25)",
                      color: "var(--text-main, #f8fafc)",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="input-trip-pulang"
                    style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
                  >
                    {headerMap?.tripPulangLabel || "Trip Pulang"}
                  </label>
                  <input
                    id="input-trip-pulang"
                    type="number"
                    min="0"
                    max={MAX_TRIP_COUNT}
                    value={tripPulang}
                    onChange={(e) => setTripPulang(e.target.value)}
                    placeholder="0"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
                      background: "rgba(0, 0, 0, 0.25)",
                      color: "var(--text-main, #f8fafc)",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Total Trip Summary */}
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary, #94a3b8)" }}>
                  {TEXT_ALERTS.BUS_INPUT_MODAL.TOTAL_TRIP_LABEL}
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#38bdf8" }}>
                  {(parseIndonesianNumber(tripPergi) || 0) + (parseIndonesianNumber(tripPulang) || 0)} {TEXT_ALERTS.BUS_INPUT_MODAL.TRIP_UNIT}
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: KETERANGAN */}
          {activeTab === "notes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label
                  style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "6px" }}
                >
                  {TEXT_ALERTS.BUS_INPUT_MODAL.FLEET_QUICK_STATUS}
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {KETERANGAN_OPTIONS.map((opt) => {
                    const isSelected = selectedKetCategory === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSelectedKetCategory(opt.value);
                          if (opt.value === "") {
                            setKeterangan("");
                          } else if (!keterangan.toUpperCase().startsWith(opt.value)) {
                            setKeterangan(opt.value + " ");
                          }
                        }}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "9999px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          border: "1px solid",
                          borderColor: isSelected ? "#38bdf8" : "rgba(255, 255, 255, 0.1)",
                          background: isSelected ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.04)",
                          color: isSelected ? "#38bdf8" : "var(--text-secondary, #94a3b8)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {opt.value || "SGO"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="input-keterangan"
                  style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "4px" }}
                >
                  {TEXT_ALERTS.BUS_INPUT_MODAL.NOTES_DETAIL_LABEL}
                </label>
                <textarea
                  id="input-keterangan"
                  rows={3}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.NOTES_DETAIL_PLACEHOLDER}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color, rgba(255, 255, 255, 0.12))",
                    background: "rgba(0, 0, 0, 0.25)",
                    color: "var(--text-main, #f8fafc)",
                    fontSize: "0.9rem",
                    boxSizing: "border-box",
                    resize: "none",
                  }}
                />
              </div>
            </div>
          )}

          {/* 5. Footer Buttons */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "auto",
              paddingTop: "12px",
              borderTop: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
            }}
          >
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                background: "rgba(255, 255, 255, 0.05)",
                color: "var(--text-secondary, #94a3b8)",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {TEXT_COMMON.BUTTONS.CANCEL}
            </button>

            <button
              type="submit"
              style={{
                flex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                color: "#ffffff",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(14, 165, 233, 0.4)",
              }}
            >
              <Check size={18} />
              <span>{TEXT_ALERTS.BUS_INPUT_MODAL.SAVE_BTN}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export default BusInputModal;
