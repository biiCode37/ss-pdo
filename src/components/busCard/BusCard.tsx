import { memo } from "react";
import { slugifyUnitId } from "@/utils/analytics";
import { FormattedNoteText } from "@/components/FormattedNoteText";
import { TEXT_DASHBOARD, TEXT_FLEET_STATUS } from "@/constants/texts";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { BusCardProps } from "./types";
import {
  getBusCardStyles,
  useBusCardSave,
  useBusCardModal,
  BusCardSummary,
  BusInputModal,
} from "./index";

function BusCardComponent({
  bus,
  sheetId,
  tabName,
  headerMap,
  isQueued,
  addToQueue,
  activeCategory,
  targetTrip,
  onUpdateBus,
  onSaveAndNext,
  isShiftConfirmed,
  activeShift = 1,
  onOpenFleetStatus,
  previousDayKmAkhir2,
}: BusCardProps) {
  const { formData, isLoading, saveStatus, handleSaveUpdates } = useBusCardSave({
    bus,
    sheetId,
    tabName,
    headerMap,
    addToQueue,
    onUpdateBus,
    onSaveAndNext,
  });

  const {
    isNonSgo,
    activeShiftStatus,
    handleOpenModal,
    isModalOpen,
    modalInitialTab,
    handleCloseModal,
    handleSaveModalUpdates,
  } = useBusCardModal({
    bus,
    formData,
    tabName,
    headerMap,
    activeCategory,
    activeShift,
    isShiftConfirmed,
    onOpenFleetStatus,
    handleSaveUpdates,
  });

  const { lockedClass, statusClass } = getBusCardStyles({
    formData,
    bus,
    targetTrip,
    isShiftConfirmed,
    isNonSgo,
  });

  return (
    <>
      <div
        id={`bus-card-${slugifyUnitId(bus.unit)}`}
      data-bus-row={bus.rowIndex}
      className={`bus-card glass ${statusClass} ${lockedClass}`.trim()}
      onClick={() => handleOpenModal()}
      style={{
        cursor: tabName === "AKUMULASI" ? "default" : "pointer",
        transition: "all 0.18s var(--ease-spring)",
      }}
    >
      <div
        className="bus-card-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, fontSize: "16px" }}>{bus.unit}</span>
          {isShiftConfirmed === false && (
            <span
              className="unit-status-badge unit-status-badge-to"
              title={TEXT_FLEET_STATUS.MODAL.LOCK_CARD_TOOLTIP}
            >
              {TEXT_DASHBOARD.BUS_CARD_ACTIONS.UNCONFIRMED_BADGE}
            </span>
          )}
          {isShiftConfirmed !== false && isNonSgo && (
            activeShiftStatus.toUpperCase().includes("OFF") ? (
              <span
                className="unit-status-badge unit-status-badge-off"
                title={TEXT_DASHBOARD.BUS_CARD_ACTIONS.UNIT_STATUS_TOOLTIP(activeShiftStatus)}
              >
                OFF
              </span>
            ) : activeShiftStatus.toUpperCase().includes("TO") ? (
              <span
                className="unit-status-badge unit-status-badge-to"
                title={TEXT_DASHBOARD.BUS_CARD_ACTIONS.UNIT_STATUS_TOOLTIP(activeShiftStatus)}
              >
                T.O
              </span>
            ) : null
          )}
          {(saveStatus === "queued" || isQueued) && (
            <span className="bus-card-status status-queued">
              {TEXT_DASHBOARD.BUS_CARD_ACTIONS.WAITING_SIGNAL}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BusCardSummary
            formData={formData}
            bus={bus}
            tabName={tabName}
            activeCategory={activeCategory}
            targetTrip={targetTrip}
            onOpenTripModal={() => handleOpenModal("trip")}
          />
          {isLoading && (
            <Loader2
              size={14}
              className="spinner"
              style={{ color: "var(--accent-color)", flexShrink: 0 }}
            />
          )}
        </div>
      </div>

      {formData.keterangan && formData.keterangan.trim() !== "" && (
        <div
          style={{
            margin: "0 16px 14px 16px",
            fontSize: "12px",
            color: "var(--warning-text)",
            fontWeight: 600,
            letterSpacing: "0.01em",
            display: "flex",
            gap: "8px",
            alignItems: "flex-start",
          }}
        >
          <AlertTriangle
            size={14}
            style={{
              color: "var(--orange-color)",
              flexShrink: 0,
              marginTop: "2px",
            }}
          />
          <div
            style={{
              flex: 1,
              lineHeight: "1.4",
              wordBreak: "break-word",
              textTransform: "uppercase",
            }}
          >
            <FormattedNoteText text={formData.keterangan} />
          </div>
        </div>
      )}
      </div>
      {isModalOpen && (
        <BusInputModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          bus={{ ...bus, ...formData }}
          headerMap={headerMap}
          activeCategory={activeCategory}
          initialTab={modalInitialTab}
          onSave={handleSaveModalUpdates}
          isShiftConfirmed={isShiftConfirmed}
          activeShift={activeShift}
          previousDayKmAkhir2={previousDayKmAkhir2}
        />
      )}
    </>
  );
}

export const BusCard = memo(BusCardComponent);
export default BusCard;
