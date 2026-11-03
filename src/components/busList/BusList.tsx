import { useState, useMemo, useCallback, memo } from "react";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import { BusCard } from "@/components/BusCard";
import { BusCardSkeleton } from "@/components/Skeletons";
import { getSatsetMode } from "@/utils/modals/busInputModal";
import { showSuccessToast } from "@/utils/alertUtils";
import { TEXT_DASHBOARD } from "@/constants/texts";
import type { SyncItem } from "@/hooks/useOfflineSync";
import type { OdometerRefInfo } from "@/hooks/usePreviousDayOdometer";
import type { DailyRoutePlotting, UnitPlottingItem } from "@/types/supabase";

import { isUnitAllowedForInput, isBusFilled, type FleetSortView } from "./busListUtils";
import { isBusNonOperational } from "@/utils/operationalStatusUtils";
import { extractEndpointNames } from "@/utils/routeEndpointUtils";
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
  previousDayKmMap?: Record<string, string>;
  previousDayRefMap?: Record<string, OdometerRefInfo>;
  plotting?: DailyRoutePlotting | null;
  routeControlBar?: React.ReactNode;
  headerTarget?: HTMLDivElement | null;
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
  previousDayKmMap,
  previousDayRefMap,
  plotting,
  routeControlBar,
  headerTarget,
}: BusListProps) {
  const plottingMap = useMemo(() => {
    const map = new Map<string, UnitPlottingItem>();
    if (plotting?.units_data) {
      plotting.units_data.forEach((item) => {
        map.set(item.unit.trim().toUpperCase(), item);
      });
    }
    return map;
  }, [plotting]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyUnfinished, setShowOnlyUnfinished] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [sortView, setSortView] = useState<FleetSortView>("sheet");

  const extractedEndpoints = useMemo(() => {
    return extractEndpointNames(
      headerMap?.tripPergiLabel,
      headerMap?.tripPulangLabel
    );
  }, [headerMap?.tripPergiLabel, headerMap?.tripPulangLabel]);

  const endpointAName =
    plotting?.endpoint_a_name || extractedEndpoints.endpointA || "Titik A";
  const endpointBName =
    plotting?.endpoint_b_name || extractedEndpoints.endpointB || "Titik B";

  const { countBaseA, countBaseB } = useMemo(() => {
    let a = 0;
    let b = 0;
    data.forEach((bus) => {
      const norm = bus.unit?.trim().toUpperCase();
      const item = plottingMap.get(norm);
      if (item?.start_point === "A") a++;
      else if (item?.start_point === "B") b++;
    });
    return { countBaseA: a, countBaseB: b };
  }, [data, plottingMap]);

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

    // 1. Filter Titik Start (Opsi B: Base A atau Base B)
    if (sortView === "base_a") {
      result = result.filter((bus) => {
        const norm = bus.unit?.trim().toUpperCase();
        return plottingMap.get(norm)?.start_point === "A";
      });
    } else if (sortView === "base_b") {
      result = result.filter((bus) => {
        const norm = bus.unit?.trim().toUpperCase();
        return plottingMap.get(norm)?.start_point === "B";
      });
    }

    // 2. Filter Sisa Unit Belum Selesai (jika tombol Filter aktif)
    if (showOnlyUnfinished) {
      result = result.filter(
        (bus) => checkAllowed(bus) && !checkFilled(bus),
      );
    }

    // 3. Sorting Tampilan (Sesuai Opsi B Hybrid)
    result = [...result].sort((a, b) => {
      // Auto-park non-operasional selalu ke paling bawah
      const aNonOp = isBusNonOperational(a, plottingMap.get(a.unit?.trim().toUpperCase()));
      const bNonOp = isBusNonOperational(b, plottingMap.get(b.unit?.trim().toUpperCase()));
      if (aNonOp !== bNonOp) {
        return aNonOp ? 1 : -1;
      }

      // Jika showOnlyUnfinished aktif, utamakan unit yang boleh diinput tapi belum selesai
      if (showOnlyUnfinished) {
        const aAllowed = checkAllowed(a);
        const bAllowed = checkAllowed(b);
        if (aAllowed !== bAllowed) return aAllowed ? -1 : 1;

        const aFilled = checkFilled(a);
        const bFilled = checkFilled(b);
        if (aFilled !== bFilled) return aFilled ? 1 : -1;
      }

      // Jika sortView base_a atau base_b: urutkan strictly berdasarkan nomor antrean plotting #1..#N
      if (sortView === "base_a" || sortView === "base_b") {
        const normA = a.unit?.trim().toUpperCase();
        const normB = b.unit?.trim().toUpperCase();
        const orderA = plottingMap.get(normA)?.order ?? 9999;
        const orderB = plottingMap.get(normB)?.order ?? 9999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
      }

      // Default (sheet view) atau fallback: urutan baris spreadsheet SSOT asli
      return a.rowIndex - b.rowIndex;
    });

    // 4. Filter Pencarian No Body
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((bus) =>
        bus.unit.toLowerCase().includes(lowerQuery),
      );
    }

    return result;
  }, [data, sortView, searchQuery, showOnlyUnfinished, checkAllowed, checkFilled, plottingMap]);

  // Handler Auto-Next Bus ketika Mode Satset aktif
  const handleSaveAndNext = useCallback(
    (savedBus: BusData) => {
      if (!getSatsetMode()) return;

      setTimeout(() => {
        const currentIndex = filteredData.findIndex(
          (b) => b.rowIndex === savedBus.rowIndex,
        );

        const isEligible = (b: BusData) =>
          b.rowIndex !== savedBus.rowIndex &&
          !checkFilled(b) &&
          !isBusNonOperational(b, plottingMap.get(b.unit?.trim().toUpperCase()));

        let nextBus = filteredData
          .slice(currentIndex + 1)
          .find(isEligible);

        if (!nextBus) {
          nextBus = filteredData
            .slice(0, currentIndex)
            .find(isEligible);
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
    [filteredData, checkFilled, plottingMap],
  );

  return (
    <div>
      <BusListHeader
        tabName={tabName}
        accRange={accRange}
        onExitAccumulation={onExitAccumulation}
        isShiftConfirmed={isShiftConfirmed}
        activeShift={activeShift}
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
        sortView={sortView}
        onSortViewChange={setSortView}
        endpointA={endpointAName}
        endpointB={endpointBName}
        countBaseA={countBaseA}
        countBaseB={countBaseB}
        totalFleetCount={data.length}
        routeControlBar={routeControlBar}
        headerTarget={headerTarget}
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
                  previousDayKmAkhir2={prevKm}
                  previousDayDateLabel={prevDateLabel}
                  plottingItem={plottingMap.get(normUnit)}
                  endpointAName={endpointAName}
                  endpointBName={endpointBName}
                />
              );
            })
          ) : (
            <div className="empty-state">
              <p>
                {searchQuery
                  ? TEXT_DASHBOARD.BUS_LIST.EMPTY_SEARCH(searchQuery)
                  : sortView === "base_a"
                    ? TEXT_DASHBOARD.BUS_LIST.SORT_VIEWS.EMPTY_BASE(endpointAName)
                    : sortView === "base_b"
                      ? TEXT_DASHBOARD.BUS_LIST.SORT_VIEWS.EMPTY_BASE(endpointBName)
                      : TEXT_DASHBOARD.BUS_LIST.EMPTY_SEARCH(searchQuery)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const BusList = memo(BusListComponent);
export default BusList;
