import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  useAccumulationRange,
  useAccumulationGesture,
  AccumulationHeader,
  AccumulationPeriodSelector,
  AccumulationFooter,
} from "./accumulation/index";
import type { AccumulationSheetProps } from "./accumulation/types";

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
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleDismiss = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    setTimeout(onClose, 220);
  };

  // Ref agar listener Escape selalu memanggil handleDismiss terbaru
  const handleDismissRef = useRef(handleDismiss);
  handleDismissRef.current = handleDismiss;

  const { handleTouchStart, handleTouchMove, handleTouchEnd } =
    useAccumulationGesture({
      contentRef,
      overlayRef,
      onDismiss: handleDismiss,
    });

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

  useEffect(() => {
    if (!isOpen) {
      setIsMounted(false);
      setIsClosing(false);
      isClosingRef.current = false;
      return;
    }

    // Trigger entrance morphing animation after mount
    // BUG-53: simpan frame id & batalkan di cleanup (konsisten ProfileMenuSheet)
    const frameId = requestAnimationFrame(() => setIsMounted(true));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismissRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);

    // Lock body scrolling when modal is active (blokir sentuhan halaman belakang)
    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="modal-overlay accumulation-sheet-overlay"
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
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="glass accumulation-sheet-content"
        style={{
          width: "100%",
          maxWidth: "560px",
          maxHeight: "min(88dvh, 760px)",
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          padding:
            "20px 20px calc(24px + env(safe-area-inset-bottom, 0px)) 20px",
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderBottom: "none",
          boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.4)",
          transform:
            isClosing || !isMounted
              ? "translateY(100%) scale(0.95)"
              : "translateY(0px) scale(1)",
          transition: "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
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
      </div>
    </div>,
    document.body,
  );
}

export default AccumulationSheet;
