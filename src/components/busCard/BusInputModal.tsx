import { useState, useEffect, useRef, useCallback } from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import { TEXT_ALERTS, TEXT_FLEET_STATUS } from "@/constants/texts";
import { useBusInputForm, type ModalTab } from "./modal/useBusInputForm";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import { ModalShell } from "@/components/ui/ModalShell";
import { markBackNavigationDismissing } from "@/utils/historyNavigation";
import { BusInputModalHeader } from "./modal/BusInputModalHeader";
import { BusInputModalTabs } from "./modal/BusInputModalTabs";
import { BusInputModalSingleFocus } from "./modal/BusInputModalSingleFocus";
import { BusInputModalShift1 } from "./modal/BusInputModalShift1";
import { BusInputModalShift2 } from "./modal/BusInputModalShift2";
import { BusInputModalTrip } from "./modal/BusInputModalTrip";
import { BusInputModalNotes } from "./modal/BusInputModalNotes";
import { BusInputModalFooter } from "./modal/BusInputModalFooter";

export interface BusInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  bus: BusData;
  headerMap?: HeaderMap;
  activeCategory?: string;
  initialTab?: ModalTab;
  onSave: (updates: Partial<BusData>) => void | Promise<void>;
  isShiftConfirmed?: boolean;
  activeShift?: 1 | 2;
  previousDayKmAkhir2?: string;
  previousDayDateLabel?: string;
}

export function BusInputModal({
  isOpen,
  onClose,
  bus,
  headerMap,
  activeCategory = "all",
  initialTab = "shift1",
  onSave,
  isShiftConfirmed,
  activeShift = 1,
  previousDayKmAkhir2,
  previousDayDateLabel,
}: BusInputModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isClosingRef = useRef(false);
  const formIdRef = useRef<string>("");
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { viewportHeight, isKeyboardOpen, keyboardHeight } = useVisualViewport();

  const handleDismiss = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    if (formIdRef.current) {
      markBackNavigationDismissing(`bus_input_modal_${formIdRef.current}`);
    }
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, 220);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsMounted(false);
      setIsClosing(false);
      isClosingRef.current = false;
      return;
    }

    const frameId = requestAnimationFrame(() => setIsMounted(true));

    return () => {
      cancelAnimationFrame(frameId);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen]);

  const form = useBusInputForm({
    bus,
    headerMap,
    activeCategory,
    initialTab,
    onSave,
    onDismiss: handleDismiss,
    isOpen,
    isMounted,
    previousDayKmAkhir2,
    previousDayDateLabel,
  });

  formIdRef.current = form.formId;

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleDismiss}
      id={`bus-input-modal-${form.formId}`}
      backHandlerId={`bus_input_modal_${form.formId}`}
      ariaLabelledBy={`bus-modal-title-${form.formId}`}
      initialFocusRef={form.isSingleMode ? form.singlePrimaryInputRef : undefined}
      zIndex={99999}
      backdropClassName="modal-overlay bus-input-modal-overlay"
      backdropStyle={{
        alignItems: "flex-end",
        justifyContent: "center",
        bottom: isKeyboardOpen ? `${keyboardHeight}px` : 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        opacity: isClosing ? 0 : isMounted ? 1 : 0,
        transition:
          "opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.22s cubic-bezier(0.32, 0.72, 0, 1), bottom 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
        willChange: "opacity, background-color, bottom",
      }}
      contentClassName="glass bus-input-modal-content"
      contentStyle={{
        width: "100%",
        maxWidth: "560px",
        maxHeight: isKeyboardOpen
          ? `${Math.min(viewportHeight - 10, 680)}px`
          : "min(92dvh, 780px)",
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderTopLeftRadius: "24px",
        borderTopRightRadius: "24px",
        padding: isKeyboardOpen
          ? "12px 16px 8px 16px"
          : "18px 20px calc(20px + env(safe-area-inset-bottom, 0px)) 20px",
        background: "var(--card-bg, #171717)",
        border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
        borderBottom: "none",
        boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.5)",
        transform:
          isClosing || !isMounted
            ? "translateY(100%) scale(0.95)"
            : "translateY(0px) scale(1)",
        transition:
          "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1), max-height 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* 1. Header Bar */}
        <BusInputModalHeader
          unit={bus.unit}
          formId={form.formId}
          isSingleColumnEligible={form.isSingleColumnEligible}
          isExpandedAll={form.isExpandedAll}
          onToggleExpandedAll={() => form.setIsExpandedAll((prev) => !prev)}
          isSatset={form.isSatset}
          onToggleSatset={form.handleToggleSatset}
          onDismiss={handleDismiss}
        />

        {/* 2. Navigation Tabs */}
        {!form.isSingleMode && (
          <BusInputModalTabs
            activeTab={form.activeTab}
            onSelectTab={form.setActiveTab}
          />
        )}

        {/* 2b. Unconfirmed Shift Warning Reminder Banner */}
        {isShiftConfirmed === false && (
          <div
            style={{
              margin: "10px 0 0 0",
              padding: "8px 12px",
              borderRadius: "8px",
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              color: "var(--warning-text, #f59e0b)",
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span style={{ lineHeight: 1.35, fontWeight: 500 }}>
              {TEXT_FLEET_STATUS.MODAL.MODAL_REMINDER(activeShift || 1)}
            </span>
          </div>
        )}

        {/* 3. Validation Errors Alert Bar & Odometer Controls */}
        {(form.validationErrors.length > 0 || form.hasCrossDayError) && (
          <div
            style={{
              margin: "12px 0 0 0",
              padding: "8px 12px",
              borderRadius: "8px",
              background:
                form.validationErrors.length > 0
                  ? "rgba(239, 68, 68, 0.15)"
                  : "rgba(56, 189, 248, 0.1)",
              border:
                form.validationErrors.length > 0
                  ? "1px solid rgba(239, 68, 68, 0.35)"
                  : "1px solid rgba(56, 189, 248, 0.3)",
              color: form.validationErrors.length > 0 ? "#f87171" : "inherit",
              fontSize: "0.8rem",
            }}
          >
            {form.validationErrors.length > 0 && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 600,
                  }}
                >
                  <AlertCircle size={15} />
                  <span>{TEXT_ALERTS.BUS_INPUT_MODAL.VALIDATION_HEADER}</span>
                </div>
                <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                  {form.validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </>
            )}

            {/* Rekomendasi Cerdas 1-Klik Jika Terdeteksi Rollover Lintas Hari */}
            {form.smartRolloverSuggestion && (
              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={form.handleApplyRollover}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    background: "#f59e0b",
                    color: "#000",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Sparkles size={13} />
                  <span>
                    {TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_APPLY_BTN(
                      form.smartRolloverSuggestion.suggestedKm,
                    )}
                  </span>
                </button>
              </div>
            )}

            {/* Checkbox Bypass Reset Odometer jika ada error mundur lintas hari */}
            {form.hasCrossDayError && (
              <label
                style={{
                  marginTop: form.validationErrors.length > 0 ? "10px" : "0",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.78rem",
                  color: "var(--text-secondary, #cbd5e1)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.bypassOdometerReset}
                  onChange={(e) => {
                    form.handleToggleBypassOdometerReset(e.target.checked);
                  }}
                  style={{ accentColor: "var(--accent-color, #38bdf8)" }}
                />
                <span>
                  {TEXT_ALERTS.BUS_INPUT_MODAL.BYPASS_ODOMETER_RESET_LABEL}
                </span>
              </label>
            )}
          </div>
        )}

        {/* 4. Form Body */}
        <form
          onSubmit={form.handleFormSubmit}
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Scrollable Container untuk Form Inputs */}
          <div
            className="no-scrollbar"
            style={{
              flex: 1,
              overflowY: "auto",
              minHeight: 0,
              padding: isKeyboardOpen ? "4px 0" : "8px 0",
              display: "flex",
              flexDirection: "column",
              gap: isKeyboardOpen ? "8px" : "12px",
            }}
          >
            {form.isSingleMode && (
              <BusInputModalSingleFocus
                form={form}
                activeCategory={activeCategory}
                busKmAwal1={bus.kmAwal1 || previousDayKmAkhir2}
              />
            )}

            {!form.isSingleMode && form.activeTab === "shift1" && (
              <BusInputModalShift1 form={form} />
            )}

            {!form.isSingleMode && form.activeTab === "shift2" && (
              <BusInputModalShift2 form={form} />
            )}

            {!form.isSingleMode && form.activeTab === "trip" && (
              <BusInputModalTrip
                form={form}
                tripPergiLabel={
                  headerMap?.tripPergiLabel ||
                  TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TRIP_PERGI
                }
                tripPulangLabel={
                  headerMap?.tripPulangLabel ||
                  TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TRIP_PULANG
                }
              />
            )}

            {!form.isSingleMode && form.activeTab === "notes" && (
              <BusInputModalNotes form={form} />
            )}
          </div>

          {/* 5. Fixed / Pinned Footer Buttons (Selalu di atas keyboard) */}
          <BusInputModalFooter
            formId={form.formId}
            onDismiss={handleDismiss}
            isDisabled={form.validationErrors.length > 0}
            isKeyboardOpen={isKeyboardOpen}
          />
        </form>
    </ModalShell>
  );
}

export default BusInputModal;
