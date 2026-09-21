import { useEffect, memo } from "react";
import { createPortal } from "react-dom";
import { useMobileBackHandler } from "@/hooks/useMobileBackHandler";
import {
  type FleetStatusModalProps,
  type BrushMode,
  useFleetStatusData,
  FleetStatusHeader,
  FleetStatusToolbar,
  FleetStatusGrid,
  FleetStatusFooter,
} from "./index";

export type { FleetStatusModalProps, BrushMode };

const isTestEnv =
  import.meta.env?.MODE === "test" ||
  Boolean((globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT);

function FleetStatusModalComponent({
  isOpen,
  onClose,
  routeCode,
  selectedDate,
  renopsTarget,
  dayLabel,
  buses,
  initialShift = 1,
  isConfirmedS1 = false,
  isConfirmedS2 = false,
  confirmedByS1,
  confirmedByS2,
  confirmedAtS1,
  confirmedAtS2,
  onConfirmStatus,
}: FleetStatusModalProps) {
  useMobileBackHandler({
    id: "fleet_status_modal",
    isOpen,
    onClose,
  });

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const {
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
  } = useFleetStatusData({
    buses,
    initialShift,
    renopsTarget,
    isConfirmedS1,
    isConfirmedS2,
    confirmedByS1,
    confirmedByS2,
    confirmedAtS1,
    confirmedAtS2,
    onConfirmStatus,
    onClose,
  });

  const modalContent = (
    <div
      className="modal-overlay fleet-status-modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: isOpen ? "flex" : "none",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 99999,
        touchAction: "none",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="glass fleet-status-card"
        style={{
          width: "100%",
          maxWidth: "580px",
          height: "min(92dvh, 760px)",
          maxHeight: "min(92dvh, 760px)",
          display: "flex",
          flexDirection: "column",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          backgroundColor: "var(--bg-card, #171717)",
          border: "1px solid var(--border-color)",
          borderBottom: "none",
          boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.6)",
          animation: "slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <FleetStatusHeader
          routeCode={routeCode}
          renopsTarget={renopsTarget}
          targetRenops={targetRenops}
          onTargetRenopsChange={setTargetRenops}
          selectedDate={selectedDate}
          dayLabel={dayLabel}
          isLocked={isLocked}
          confirmedBy={confirmedBy}
          confirmedAt={confirmedAt}
          onClose={onClose}
        />

        <FleetStatusToolbar
          currentShift={currentShift}
          onSelectShift={setCurrentShift}
          activeBrush={activeBrush}
          onSelectBrush={setActiveBrush}
          onSgoAll={handleSgoAll}
          isLocked={isLocked}
        />

        <FleetStatusGrid
          buses={buses}
          unitMap={unitMap}
          currentShift={currentShift}
          activeBrush={activeBrush}
          isLocked={isLocked}
          onCardTap={handleCardTap}
        />

        <FleetStatusFooter
          currentShift={currentShift}
          summaryCounts={summaryCounts}
          isSaving={isSaving}
          isLocked={isLocked}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );

  if (isTestEnv || !isOpen) {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
}

export const FleetStatusModal = memo(FleetStatusModalComponent);
export default FleetStatusModal;
