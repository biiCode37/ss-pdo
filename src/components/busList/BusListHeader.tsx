import React from "react";
import { BusListAccumulationBanner } from "./BusListAccumulationBanner";
import { BusListProgressBar } from "./BusListProgressBar";
import { BusListControlBar } from "./BusListControlBar";

export interface BusListHeaderProps {
  tabName: string;
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
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  filledCount: number;
  totalCount: number;
  progressPercent: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showOnlyUnfinished: boolean;
  onToggleUnfinished: () => void;
  bulkPergi: string;
  bulkPulang: string;
  isSubmittingBulk: boolean;
  onOpenBulkTripModal: () => void;
  availableKmS1Count: number;
  skippedWithNotesCount: number;
  onBulkCopyKmS1: () => void;
}

export const BusListHeader: React.FC<BusListHeaderProps> = ({
  tabName,
  accRange,
  onExitAccumulation,
  activeCategory,
  onCategoryChange,
  filledCount,
  totalCount,
  progressPercent,
  searchQuery,
  onSearchChange,
  showOnlyUnfinished,
  onToggleUnfinished,
  bulkPergi,
  bulkPulang,
  isSubmittingBulk,
  onOpenBulkTripModal,
  availableKmS1Count,
  skippedWithNotesCount,
  onBulkCopyKmS1,
}) => {
  return (
    <div className="sticky-buslist-header">
      {/* 1. Rekap Akumulasi Warning Banner */}
      {tabName === "AKUMULASI" && (
        <BusListAccumulationBanner
          accRange={accRange}
          onExitAccumulation={onExitAccumulation}
        />
      )}

      {/* 2. Hairline Progress Indicator */}
      <BusListProgressBar
        activeCategory={activeCategory}
        filledCount={filledCount}
        totalCount={totalCount}
        progressPercent={progressPercent}
      />

      {/* 4. Controls Container: Row 1 & Row 2 */}
      <BusListControlBar
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        showOnlyUnfinished={showOnlyUnfinished}
        onToggleUnfinished={onToggleUnfinished}
        bulkPergi={bulkPergi}
        bulkPulang={bulkPulang}
        isSubmittingBulk={isSubmittingBulk}
        onOpenBulkTripModal={onOpenBulkTripModal}
        availableKmS1Count={availableKmS1Count}
        skippedWithNotesCount={skippedWithNotesCount}
        onBulkCopyKmS1={onBulkCopyKmS1}
      />
    </div>
  );
};
