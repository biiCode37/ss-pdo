import { memo } from "react";
import type { WaReportModalProps } from "./types";
import {
  useWaReportData,
  WaReportHeader,
  WaReportFormatTabs,
  WaReportPreview,
} from "./index";

function WaReportModalComponent({
  isOpen,
  onClose,
  regionalData,
  selectedDate,
}: WaReportModalProps) {
  const {
    formatType,
    setFormatType,
    selectedShift,
    setSelectedShift,
    supervisorFilter,
    setSupervisorFilter,
    copied,
    filteredRoutes,
    unconfirmedRoutes,
    isFormat3Blocked,
    unsubmittedCount,
    messageText,
    handleCopy,
    handleOpenWa,
  } = useWaReportData({
    regionalData,
    selectedDate,
  });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 0,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          maxHeight: "min(92dvh, 780px)",
          background: "var(--surface-color, #171717)",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
          borderBottom: "none",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          padding: "18px 16px 20px 16px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.35)",
          animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <WaReportHeader onClose={onClose} />

        <WaReportFormatTabs
          formatType={formatType}
          onSelectFormat={setFormatType}
          selectedShift={selectedShift}
          onSelectShift={setSelectedShift}
          supervisorFilter={supervisorFilter}
          onSelectSupervisor={setSupervisorFilter}
          unsubmittedCount={unsubmittedCount}
          totalRoutesCount={filteredRoutes.length}
          isFormat3Blocked={isFormat3Blocked}
          unconfirmedRoutes={unconfirmedRoutes}
        />

        <WaReportPreview
          messageText={messageText}
          isFormat3Blocked={isFormat3Blocked}
          copied={copied}
          onCopy={handleCopy}
          onOpenWa={handleOpenWa}
        />
      </div>
    </div>
  );
}

export const WaReportModal = memo(WaReportModalComponent);
export default WaReportModal;
