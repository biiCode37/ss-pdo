import React from "react";
import { createPortal } from "react-dom";
import { BusListAccumulationBanner } from "./BusListAccumulationBanner";
import { BusListProgressBar } from "./BusListProgressBar";
import { BusListControlBar } from "./BusListControlBar";
import type { FleetSortView } from "./busListUtils";

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
  sortView?: FleetSortView;
  onSortViewChange?: (view: FleetSortView) => void;
  endpointA?: string;
  endpointB?: string;
  countBaseA?: number;
  countBaseB?: number;
  totalFleetCount?: number;
  routeControlBar?: React.ReactNode;
  headerTarget?: HTMLDivElement | null;
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
  sortView,
  onSortViewChange,
  endpointA,
  endpointB,
  countBaseA,
  countBaseB,
  totalFleetCount,
  routeControlBar,
  headerTarget,
}) => {
  const controls = (
    <div className="buslist-header">
      {/* 1. Rekap Akumulasi Warning Banner */}
      {tabName === "AKUMULASI" && (
        <BusListAccumulationBanner
          accRange={accRange}
          onExitAccumulation={onExitAccumulation}
        />
      )}

      {/* Controls share the dashboard's sticky shell through the header slot. */}
      <div className="unified-input-control-panel">
        {/* Elemen 1: Datepicker & Status Laporan Operasional */}
        {routeControlBar}

        {/* Elemen 2: Hairline Progress Indicator */}
        <BusListProgressBar
          activeCategory={activeCategory}
          filledCount={filledCount}
          totalCount={totalCount}
          progressPercent={progressPercent}
        />

        {/* Elemen 3: Controls Container (Set Trip, Fokus Kolom, Sort View, & Pencarian) */}
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
          sortView={sortView}
          onSortViewChange={onSortViewChange}
          endpointA={endpointA}
          endpointB={endpointB}
          countBaseA={countBaseA}
          countBaseB={countBaseB}
          totalFleetCount={totalFleetCount}
        />
      </div>
    </div>
  );
  return headerTarget ? createPortal(controls, headerTarget) : controls;
};
