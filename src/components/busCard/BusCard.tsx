import { memo } from "react";
import { slugifyUnitId } from "@/utils/analytics";
import { FormattedNoteText } from "@/components/FormattedNoteText";
import { classifyUnitKeterangan, shouldShowKeteranganStrip } from "@/utils/keteranganUtils";
import { UnitStatusBadge } from "@/components/ui/UnitStatusBadge";
import { UNIT_STATUS_CARD_CLASS } from "@/components/ui/unitStatusClass";
import { TEXT_DASHBOARD } from "@/constants/texts";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import type { BusCardProps } from "./types";
import {
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

  const keteranganHariIni = formData.keterangan ?? bus.keterangan;
  // Warna kartu = riwayat keterangan SEPANJANG HARI (S1+S2), bukan shift aktif.
  const unitStatusClass = UNIT_STATUS_CARD_CLASS[classifyUnitKeterangan(keteranganHariIni)];

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
      className={`bus-card glass ${unitStatusClass}`.trim()}
      onClick={() => handleCardTap()}
      style={{
        cursor: tabName === "AKUMULASI" ? "default" : "pointer",
        transition: "all 0.18s var(--ease-spring)",
        outline: isSelectionMode && isSelected ? "2px solid var(--color-action-primary-bg)" : undefined,
        outlineOffset: isSelectionMode && isSelected ? "-2px" : undefined,
      }}
    >
        <div className="bus-card-header">
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
                  borderRadius: "8px",
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
                {isSelected && <Check size={16} strokeWidth={3} />}
              </span>
            )}
            <span className="bus-card-unit" style={{ fontWeight: 700, fontSize: "16px" }}>{bus.unit}</span>
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
                activeShiftStatus={activeShiftStatus}
                onOpenTripModal={() => handleCardTap("trip")}
              />
            )}
            <UnitStatusBadge keterangan={keteranganHariIni} />
            {isLoading && (
              <Loader2
                size={16}
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
            activeShiftStatus={activeShiftStatus}
            onOpenTripModal={() => handleCardTap("trip")}
          />
        )}

      {shouldShowKeteranganStrip(keteranganHariIni) && (
        <div
          style={{
            padding: "8px 16px 10px 16px",
            borderTop: "1px solid var(--card-border)",
            fontSize: "12px",
            color: "var(--color-text-primary)",
            fontWeight: 600,
            letterSpacing: "0.01em",
            display: "flex",
            gap: "8px",
            alignItems: "flex-start",
          }}
        >
          <AlertTriangle
            size={16}
            style={{
              color: "var(--color-text-secondary)",
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
            <FormattedNoteText text={keteranganHariIni} />
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
