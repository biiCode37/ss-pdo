import { useState, useEffect, useRef, useCallback } from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import { useAccumulationRange } from "./useAccumulationRange";
import { AccumulationHeader } from "./AccumulationHeader";
import { AccumulationPeriodSelector } from "./AccumulationPeriodSelector";
import { AccumulationFooter } from "./AccumulationFooter";
import type { AccumulationSheetProps } from "./types";

export function AccumulationSheet({
  isOpen,
  onClose,
  onApply,
  currentMonth,
  currentYear,
  isAccumulationActive,
  onResetAccumulation,
}: AccumulationSheetProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isClosingRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDismiss = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
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

  const {
    startMonth,
    setStartMonth,
    startYear,
    setStartYear,
    setStartDay,
    endMonth,
    setEndMonth,
    endYear,
    setEndYear,
    setEndDay,
    availableMonths,
    availableYears,
    rangeError,
    days,
    endDays,
    safeStartDay,
    safeEndDay,
    handleApply,
  } = useAccumulationRange({
    isOpen,
    currentMonth,
    currentYear,
    onApply,
    onDismiss: handleDismiss,
  });

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleDismiss}
      id="accumulation_sheet_modal"
      backHandlerId="accumulation_sheet_modal"
      ariaLabelledBy="accumulation-sheet-title"
      zIndex={99999}
      backdropClassName="modal-overlay accumulation-sheet-overlay"
      backdropStyle={{
        alignItems: "flex-end",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        opacity: isClosing ? 0 : isMounted ? 1 : 0,
        transition:
          "opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
        willChange: "opacity, background-color",
      }}
      contentClassName="glass accumulation-sheet-content"
      contentStyle={{
        width: "100%",
        maxWidth: "560px",
        maxHeight: "min(88dvh, 760px)",
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderTopLeftRadius: "24px",
        borderTopRightRadius: "24px",
        padding: "16px 20px calc(24px + env(safe-area-inset-bottom, 0px)) 20px",
        background: "var(--card-bg, #171717)",
        border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
        borderBottom: "none",
        boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.5)",
        transform:
          isClosing || !isMounted
            ? "translateY(100%) scale(0.95)"
            : "translateY(0px) scale(1)",
        transition: "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AccumulationHeader onDismiss={handleDismiss} />

      <AccumulationPeriodSelector
        safeStartDay={safeStartDay}
        setStartDay={setStartDay}
        startMonth={startMonth}
        setStartMonth={setStartMonth}
        startYear={startYear}
        setStartYear={setStartYear}
        days={days}
        safeEndDay={safeEndDay}
        setEndDay={setEndDay}
        endMonth={endMonth}
        setEndMonth={setEndMonth}
        endYear={endYear}
        setEndYear={setEndYear}
        endDays={endDays}
        availableMonths={availableMonths}
        availableYears={availableYears}
      />

      <AccumulationFooter
        safeStartDay={safeStartDay}
        startMonth={startMonth}
        startYear={startYear}
        safeEndDay={safeEndDay}
        endMonth={endMonth}
        endYear={endYear}
        rangeError={rangeError}
        handleApply={handleApply}
        isAccumulationActive={isAccumulationActive}
        onResetAccumulation={onResetAccumulation}
        onDismiss={handleDismiss}
      />
    </ModalShell>
  );
}

export default AccumulationSheet;
