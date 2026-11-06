import { memo } from "react";
import { slugifyUnitId } from "@/utils/analytics";
import { FormattedNoteText } from "@/components/FormattedNoteText";
import { hasMeaningfulNote, isUnitOff, isUnitTo } from "@/utils/keteranganUtils";
import { TEXT_DASHBOARD } from "@/constants/texts";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
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
  previousDayKmAkhir2,
  previousDayDateLabel,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
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
    handleSaveUpdates,
  });

  const { lockedClass, statusClass } = getBusCardStyles({
    formData,
    bus,
    targetTrip,
    isShiftConfirmed,
    isNonSgo,
  });

  // Mode pilih: ketukan di mana pun pada kartu hanya memilih/membatalkan pilihan unit.
  const handleCardTap = (tab?: Parameters<typeof handleOpenModal>[0]) => {
    if (isSelectionMode) {
      onToggleSelect?.(bus.rowIndex);
      return;
    }
    handleOpenModal(tab);
  };

  return (
    <>
      <div
        id={`bus-card-${slugifyUnitId(bus.unit)}`}
      data-bus-row={bus.rowIndex}
      data-selected={isSelectionMode ? String(isSelected) : undefined}
      className={`bus-card glass ${statusClass} ${lockedClass}`.trim()}
      onClick={() => handleCardTap()}
      style={{
        cursor: tabName === "AKUMULASI" ? "default" : "pointer",
        transition: "all 0.18s var(--ease-spring)",
        outline: isSelectionMode && isSelected ? "2px solid var(--color-action-primary-bg)" : undefined,
        outlineOffset: isSelectionMode && isSelected ? "-2px" : undefined,
      }}
    >
        <div
          className="bus-card-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {isSelectionMode && (
              <span
                role="checkbox"
                aria-checked={isSelected}
                aria-label={TEXT_DASHBOARD.BUS_LIST.SELECT_UNIT_ARIA(bus.unit)}
                data-testid={`select-unit-${bus.rowIndex}`}
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "6px",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isSelected ? "var(--color-action-primary-bg)" : "transparent",
                  border: isSelected
                    ? "2px solid var(--color-action-primary-bg)"
                    : "2px solid var(--color-text-muted)",
                  color: "var(--color-action-primary-fg)",
                  transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
                }}
              >
                {isSelected && <Check size={14} strokeWidth={3} />}
              </span>
            )}
            <span className="bus-card-unit" style={{ fontWeight: 800, fontSize: "16px" }}>{bus.unit}</span>
            {(saveStatus === "queued" || isQueued) && (
              <span className="bus-card-status status-queued">
                {TEXT_DASHBOARD.BUS_CARD_ACTIONS.WAITING_SIGNAL}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {activeCategory !== "ALL" && (
              <BusCardSummary
                formData={formData}
                bus={bus}
                tabName={tabName}
                activeCategory={activeCategory}
                targetTrip={targetTrip}
                activeShiftStatus={activeShiftStatus}
                onOpenTripModal={() => handleCardTap("trip")}
              />
            )}
            {isNonSgo && (
              isUnitOff(activeShiftStatus) ? (
                <span
                  className="unit-status-badge unit-status-badge-off"
                  title={TEXT_DASHBOARD.BUS_CARD_ACTIONS.UNIT_STATUS_TOOLTIP(activeShiftStatus)}
                >
                  OFF
                </span>
              ) : isUnitTo(activeShiftStatus) ? (
                <span
                  className="unit-status-badge unit-status-badge-to"
                  title={TEXT_DASHBOARD.BUS_CARD_ACTIONS.UNIT_STATUS_TOOLTIP(activeShiftStatus)}
                >
                  T.O
                </span>
              ) : null
            )}
            {isLoading && (
              <Loader2
                size={14}
                className="spinner"
                style={{ color: "var(--accent-color)", flexShrink: 0 }}
              />
            )}
          </div>
        </div>

        {activeCategory === "ALL" && (
          <BusCardSummary
            formData={formData}
            bus={bus}
            tabName={tabName}
            activeCategory={activeCategory}
            targetTrip={targetTrip}
            activeShiftStatus={activeShiftStatus}
            onOpenTripModal={() => handleCardTap("trip")}
          />
        )}

      {hasMeaningfulNote(formData.keterangan) && (
        <div
          style={{
            padding: "8px 16px 10px 16px",
            borderTop: "1px solid var(--card-border)",
            fontSize: "11.5px",
            color: "var(--warning-text)",
            fontWeight: 600,
            letterSpacing: "0.01em",
            display: "flex",
            gap: "8px",
            alignItems: "flex-start",
            background: "rgba(245, 158, 11, 0.04)",
          }}
        >
          <AlertTriangle
            size={13}
            style={{
              color: "var(--orange-color)",
              flexShrink: 0,
              marginTop: "2px",
            }}
          />
          <div
            style={{
              flex: 1,
              lineHeight: "1.35",
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
          previousDayDateLabel={previousDayDateLabel}
        />
      )}
    </>
  );
}

export const BusCard = memo(BusCardComponent);
export default BusCard;
