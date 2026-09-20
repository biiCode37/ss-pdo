import { useState, useMemo, useCallback, memo } from "react";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import { BusCard } from "@/components/BusCard";
import { BusCardSkeleton } from "@/components/Skeletons";
import { getSatsetMode } from "@/utils/modals/busInputModal";
import { showSuccessToast } from "@/utils/alertUtils";
import { TEXT_DASHBOARD } from "@/constants/texts";
import type { SyncItem } from "@/hooks/useOfflineSync";
import type { OdometerRefInfo } from "@/hooks/usePreviousDayOdometer";

import { isUnitAllowedForInput, isBusFilled } from "./busListUtils";
import { useBulkOperations } from "./useBulkOperations";
import { BusListHeader } from "./BusListHeader";

export interface BusListProps {
  data: BusData[];
  sheetId: string;
  tabName: string;
  headerMap: HeaderMap;
  syncQueue: SyncItem[];
  addToQueue: (item: Omit<SyncItem, "id" | "status" | "retryCount">) => void;
  isLoading?: boolean;
  onUpdateBus?: (rowIndex: number, updates: Partial<BusData>) => void;
  accRange?: {
    startDay?: number;
    startMonth?: number;
    startYear?: number;
    endDay?: number;
    endMonth?: number;
    endYear?: number;
  } | null;
  onExitAccumulation?: () => void;
  isShiftConfirmed?: boolean;
  activeShift?: 1 | 2;
  onOpenFleetStatus?: () => void;
  previousDayKmMap?: Record<string, string>;
  previousDayRefMap?: Record<string, OdometerRefInfo>;
}

function BusListComponent({
  data,
  sheetId,
  tabName,
  headerMap,
  syncQueue,
  addToQueue,
  isLoading = false,
  onUpdateBus,
  accRange,
  onExitAccumulation,
  isShiftConfirmed,
  activeShift = 1,
  onOpenFleetStatus,
  previousDayKmMap,
  previousDayRefMap,
}: BusListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyUnfinished, setShowOnlyUnfinished] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ALL");

  const {
    bulkPergi,
    bulkPulang,
    isSubmittingBulk,
    targetTrip,
    availableKmS1Buses,
    skippedWithNotesCount,
    handleOpenBulkTripModal,
    handleBulkCopyKmS1,
  } = useBulkOperations({
    data,
    sheetId,
    tabName,
    headerMap,
    addToQueue,
    onUpdateBus,
    isShiftConfirmed,
    onOpenFleetStatus,
  });

  const checkAllowed = useCallback(
    (bus: BusData) => isUnitAllowedForInput(bus, activeCategory),
    [activeCategory],
  );

  const checkFilled = useCallback(
    (bus: BusData) => isBusFilled(bus, activeCategory),
    [activeCategory],
  );

  const { filledCount, totalCount, progressPercent } = useMemo(() => {
    const allowedBuses = data.filter(checkAllowed);
    const filled = allowedBuses.filter(checkFilled).length;
    const total = allowedBuses.length;
    const percent = total === 0 ? 0 : Math.round((filled / total) * 100);
    return { filledCount: filled, totalCount: total, progressPercent: percent };
  }, [data, checkAllowed, checkFilled]);

  const filteredData = useMemo(() => {
    let result = data;

    if (showOnlyUnfinished) {
      result = result.filter(
        (bus) => checkAllowed(bus) && !checkFilled(bus),
      );
    }

    // Sort: Unfinished di atas, lalu yang selesai, lalu yang non-SGO
    result = [...result].sort((a, b) => {
      const aAllowed = checkAllowed(a);
      const bAllowed = checkAllowed(b);
      if (aAllowed !== bAllowed) {
        return aAllowed ? -1 : 1;
      }
      const aFilled = checkFilled(a);
      const bFilled = checkFilled(b);
      if (aFilled === bFilled) return 0;
      return aFilled ? 1 : -1;
    });

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((bus) =>
        bus.unit.toLowerCase().includes(lowerQuery),
      );
    }

    return result;
  }, [data, searchQuery, showOnlyUnfinished, checkAllowed, checkFilled]);

  // Handler Auto-Next Bus ketika Mode Satset aktif
  const handleSaveAndNext = useCallback(
    (savedBus: BusData) => {
      if (!getSatsetMode()) return;

      setTimeout(() => {
        const currentIndex = filteredData.findIndex(
          (b) => b.rowIndex === savedBus.rowIndex,
        );

        let nextBus = filteredData
          .slice(currentIndex + 1)
          .find((b) => b.rowIndex !== savedBus.rowIndex && !checkFilled(b));

        if (!nextBus) {
          nextBus = filteredData
            .slice(0, currentIndex)
            .find((b) => b.rowIndex !== savedBus.rowIndex && !checkFilled(b));
        }

        if (nextBus) {
          const nextCardEl = document.querySelector<HTMLElement>(
            `[data-bus-row="${nextBus.rowIndex}"]`,
          );
          if (nextCardEl) {
            nextCardEl.click();
          }
        } else {
          showSuccessToast(TEXT_DASHBOARD.BUS_LIST.ALL_UNITS_FILLED);
        }
      }, 120);
    },
    [filteredData, checkFilled],
  );

  return (
    <div>
      <BusListHeader
        tabName={tabName}
        accRange={accRange}
        onExitAccumulation={onExitAccumulation}
        isShiftConfirmed={isShiftConfirmed}
        activeShift={activeShift}
        onOpenFleetStatus={onOpenFleetStatus}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        filledCount={filledCount}
        totalCount={totalCount}
        progressPercent={progressPercent}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showOnlyUnfinished={showOnlyUnfinished}
        onToggleUnfinished={() => setShowOnlyUnfinished(!showOnlyUnfinished)}
        bulkPergi={bulkPergi}
        bulkPulang={bulkPulang}
        isSubmittingBulk={isSubmittingBulk}
        onOpenBulkTripModal={handleOpenBulkTripModal}
        availableKmS1Count={availableKmS1Buses.length}
        skippedWithNotesCount={skippedWithNotesCount}
        onBulkCopyKmS1={handleBulkCopyKmS1}
      />

      {isLoading ? (
        <BusCardSkeleton count={5} />
      ) : (
        <div className="bus-list">
          {filteredData.length > 0 ? (
            filteredData.map((bus) => {
              const normUnit = bus.unit?.trim().toUpperCase();
              const prevRef =
                previousDayRefMap?.[normUnit] ||
                previousDayRefMap?.[bus.unit?.trim()];
              const prevKm =
                prevRef?.km ||
                previousDayKmMap?.[normUnit] ||
                previousDayKmMap?.[bus.unit?.trim()] ||
                "";
              const prevDateLabel = prevRef?.dateLabel || "Kemarin";

              return (
                <BusCard
                  key={bus.rowIndex}
                  bus={bus}
                  sheetId={sheetId}
                  tabName={tabName}
                  headerMap={headerMap}
                  isQueued={syncQueue.some(
                    (q) =>
                      q.rowIndex === bus.rowIndex &&
                      q.sheetId === sheetId &&
                      q.tabName === tabName,
                  )}
                  addToQueue={addToQueue}
                  activeCategory={activeCategory}
                  targetTrip={targetTrip}
                  onUpdateBus={
                    onUpdateBus
                      ? (updates) => onUpdateBus(bus.rowIndex, updates)
                      : undefined
                  }
                  onSaveAndNext={handleSaveAndNext}
                  isShiftConfirmed={isShiftConfirmed}
                  activeShift={activeShift}
                  onOpenFleetStatus={onOpenFleetStatus}
                  previousDayKmAkhir2={prevKm}
                  previousDayDateLabel={prevDateLabel}
                />
              );
            })
          ) : (
            <div className="empty-state">
              <p>{TEXT_DASHBOARD.BUS_LIST.EMPTY_SEARCH(searchQuery)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const BusList = memo(BusListComponent);
export default BusList;
