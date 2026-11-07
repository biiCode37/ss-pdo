import { useState, useEffect, useRef, useCallback } from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import { TEXT_ALERTS } from "@/constants/texts";
import { showBulkTripModal } from "@/utils/modals/bulkModals";
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
  initialTab,
  onSave,
  isShiftConfirmed: _isShiftConfirmed,
  activeShift,
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
    activeShift,
    onSave,
    onDismiss: handleDismiss,
    isOpen,
    isMounted,
    previousDayKmAkhir2,
    previousDayDateLabel,
  });

  formIdRef.current = form.formId;

  // Form yang sama dengan "Set Jumlah Trip" (Trip Pergi + Trip Pulang), mode aktivasi 1 unit
  const handlePromptActivateInput = async () => {
    const result = await showBulkTripModal({
      unitCount: 1,
      headerMap,
      isActivation: true,
    });
    if (result) {
      form.handleActivateInput(result.tripPergi, result.tripPulang);
    }
  };

  // Penegakan proteksi status disabled pada elemen input angka saat form terkunci
  useEffect(() => {
    if (!isOpen) return;
    const modalEl = document.getElementById(`bus-input-modal-${form.formId}`);
    if (!modalEl) return;

    const numberInputs = modalEl.querySelectorAll<HTMLInputElement>(
      'input[type="number"], input[id^="input-toa"], input[id^="input-trip"], input[id^="input-km"], input[id^="single-input-trip"], input[id^="single-input-toa"], input[id^="single-input-km"]'
    );

    numberInputs.forEach((input) => {
      if (form.isLocked) {
        input.disabled = true;
      } else {
        const isKmLocked =
          (input.id === "input-km-akhir-1" && form.isKmAkhir1Locked) ||
          (input.id === "input-km-awal-2" && form.isKmAwal2Locked) ||
          (input.id === "input-km-akhir-2" && form.isKmAkhir2Locked);
        if (!isKmLocked) {
          input.disabled = false;
        }
      }
    });
  });

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
        backgroundColor: "var(--color-surface-subtle)",
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
        borderTopLeftRadius: "16px",
        borderTopRightRadius: "16px",
        padding: isKeyboardOpen
          ? "12px 16px 8px 16px"
          : "18px 20px calc(20px + env(safe-area-inset-bottom, 0px)) 20px",
        background: "var(--color-surface-default)",
        border: "1px solid var(--color-border-subtle)",
        borderBottom: "none",
        boxShadow: "0 -10px 40px var(--color-shadow)",
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

        {/* Banner Peringatan Non-Operasional (Jika Terkunci) */}
        {form.isLocked && form.nonOpBannerType !== "NONE" && (
          <div
            data-testid="non-operational-banner"
            style={{
              margin: "10px 0 0 0",
              padding: "10px 12px",
              borderRadius: "12px",
              background: "var(--color-warning-bg)",
              border: "1px solid var(--color-warning-border)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                fontSize: "13px",
                lineHeight: 1.45,
                color: "var(--color-warning-fg)",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span style={{ flex: 1, fontWeight: 500 }}>
                {form.nonOpBannerType === "OFF_LIBUR"
                  ? TEXT_ALERTS.BUS_INPUT_MODAL.NON_OPERATIONAL_BANNER_OFF_LIBUR
                  : TEXT_ALERTS.BUS_INPUT_MODAL.NON_OPERATIONAL_BANNER_EMPTY_RITASE}
              </span>
            </div>
            <button
              type="button"
              data-testid="btn-activate-input"
              onClick={handlePromptActivateInput}
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "var(--color-warning-fg)",
                color: "var(--color-text-secondary)",
                fontWeight: 700,
                fontSize: "12px",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span>{TEXT_ALERTS.BUS_INPUT_MODAL.BTN_ACTIVATE_INPUT}</span>
            </button>
          </div>
        )}

        {/* 2. Navigation Tabs */}
        {!form.isSingleMode && (
          <BusInputModalTabs
            activeTab={form.activeTab}
            onSelectTab={form.setActiveTab}
          />
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
                  ? "var(--color-error-bg)"
                  : "var(--color-info-bg)",
              border:
                form.validationErrors.length > 0
                  ? "1px solid var(--color-error-border)"
                  : "1px solid var(--color-info-border)",
              color: form.validationErrors.length > 0 ? "var(--color-error-fg)" : "inherit",
              fontSize: "13px",
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
                  <AlertCircle size={16} />
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
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    background: "var(--color-warning-fg)",
                    color: "var(--color-text-secondary)",
                    fontWeight: 700,
                    fontSize: "12px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Sparkles size={16} />
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
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.bypassOdometerReset}
                  onChange={(e) => {
                    form.handleToggleBypassOdometerReset(e.target.checked);
                  }}
                  style={{ accentColor: "var(--color-action-primary-bg)" }}
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
              <fieldset
                disabled={form.isLocked && activeCategory !== "keterangan"}
                style={{ border: "none", margin: 0, padding: 0 }}
              >
                <BusInputModalSingleFocus
                  form={form}
                  activeCategory={activeCategory}
                  busKmAwal1={bus.kmAwal1 || previousDayKmAkhir2}
                  headerMap={headerMap}
                />
              </fieldset>
            )}

            {!form.isSingleMode && form.activeTab === "shift1" && (
              <fieldset
                disabled={form.isLocked}
                style={{ border: "none", margin: 0, padding: 0 }}
              >
                <BusInputModalShift1 form={form} />
              </fieldset>
            )}

            {!form.isSingleMode && form.activeTab === "shift2" && (
              <fieldset
                disabled={form.isLocked}
                style={{ border: "none", margin: 0, padding: 0 }}
              >
                <BusInputModalShift2 form={form} />
              </fieldset>
            )}

            {!form.isSingleMode && form.activeTab === "trip" && (
              <fieldset
                disabled={form.isLocked}
                style={{ border: "none", margin: 0, padding: 0 }}
              >
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
              </fieldset>
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
