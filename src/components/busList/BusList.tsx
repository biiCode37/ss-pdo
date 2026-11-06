import { useState, useMemo, useCallback, useEffect, memo } from "react";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import { BusCard } from "@/components/BusCard";
import { BusCardSkeleton } from "@/components/Skeletons";
import { getSatsetMode } from "@/utils/modals/busInputModal";
import { showSuccessToast, showWarningToast } from "@/utils/alertUtils";
import { TEXT_DASHBOARD } from "@/constants/texts";
import type { SyncItem } from "@/hooks/useOfflineSync";
import type { OdometerRefInfo } from "@/hooks/usePreviousDayOdometer";

import { isUnitAllowedForInput, isBusFilled } from "./busListUtils";
import { isBusNonOperational } from "@/utils/operationalStatusUtils";
import { useBulkOperations } from "./useBulkOperations";
import { BusListHeader } from "./BusListHeader";
import { BusListSelectionBar } from "./BusListSelectionBar";

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
  routeControlBar,
  headerTarget,
}: BusListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyUnfinished, setShowOnlyUnfinished] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ALL");

  const {
    bulkPergi,
    bulkPulang,
    isSubmittingBulk,
    availableKmS1Buses,
    skippedWithNotesCount,
    handleOpenBulkTripModal,
    handleApplyTripToSelected,
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

  // Mode Pilih Unit (Set Trip Unit Terpilih) — pilihan disimpan per rowIndex.
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(() => new Set());

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedRows((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  // Pilihan tidak boleh terbawa saat pindah rute/tanggal (rowIndex berbeda arti).
  useEffect(() => {
    exitSelectionMode();
  }, [sheetId, tabName, exitSelectionMode]);

  const handleToggleSelectionMode = useCallback(() => {
    if (isSelectionMode) {
      exitSelectionMode();
      return;
    }
    if (tabName === "AKUMULASI") {
      showWarningToast(TEXT_DASHBOARD.BUS_LIST.ACCUMULATION_LOCKED);
      return;
    }
    setIsSelectionMode(true);
  }, [isSelectionMode, tabName, exitSelectionMode]);

  const handleToggleSelect = useCallback((rowIndex: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  }, []);

  const handleApplySelected = useCallback(async () => {
    const selectedBuses = data.filter((bus) => selectedRows.has(bus.rowIndex));
    const saved = await handleApplyTripToSelected(selectedBuses);
    if (saved) exitSelectionMode();
  }, [data, selectedRows, handleApplyTripToSelected, exitSelectionMode]);

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

    // 1. Filter Sisa Unit Belum Selesai (jika tombol Filter aktif)
    if (showOnlyUnfinished) {
      result = result.filter(
        (bus) => checkAllowed(bus) && !checkFilled(bus),
      );
    }

    // 2. Sorting Tampilan
    result = [...result].sort((a, b) => {
      // Auto-park non-operasional selalu ke paling bawah
      const aNonOp = isBusNonOperational(a);
      const bNonOp = isBusNonOperational(b);
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

      // Urutan baris spreadsheet SSOT asli
      return a.rowIndex - b.rowIndex;
    });

    // 3. Filter Pencarian No Body
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

        const isEligible = (b: BusData) =>
          b.rowIndex !== savedBus.rowIndex &&
          !checkFilled(b) &&
          !isBusNonOperational(b);

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
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={handleToggleSelectionMode}
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
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedRows.has(bus.rowIndex)}
                  onToggleSelect={handleToggleSelect}
                />
              );
            })
          ) : (
            <div className="empty-state">
              <p>
                {TEXT_DASHBOARD.BUS_LIST.EMPTY_SEARCH(searchQuery)}
              </p>
            </div>
          )}
          {/* Ruang kosong agar kartu terakhir tidak tertutup bar aksi pilihan */}
          {isSelectionMode && <div aria-hidden="true" style={{ height: "72px" }} />}
        </div>
      )}

      {isSelectionMode && (
        <BusListSelectionBar
          selectedCount={selectedRows.size}
          isSubmitting={isSubmittingBulk}
          onApply={handleApplySelected}
          onCancel={exitSelectionMode}
        />
      )}
    </div>
  );
}

export const BusList = memo(BusListComponent);
export default BusList;
