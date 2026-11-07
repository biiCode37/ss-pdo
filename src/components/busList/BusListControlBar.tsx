import React from "react";
import { Search, Filter, CheckCircle2, Loader2, ChevronDown } from "lucide-react";
import { TEXT_DASHBOARD } from "@/constants/texts";
import { BUS_CATEGORIES } from "./busListUtils";

interface BusListControlBarProps {
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
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
  isSelectionMode?: boolean;
  onToggleSelectionMode?: () => void;
}

export const BusListControlBar: React.FC<BusListControlBarProps> = ({
  activeCategory,
  onCategoryChange,
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
  isSelectionMode = false,
  onToggleSelectionMode,
}) => {
  return (
    <div className="buslist-controls">
      {/* Baris 1: Set Jumlah Trip, Pilih Unit, Fokus Kolom */}
      <div className="buslist-controls-row buslist-controls-row--actions">
        <button
          type="button"
          className="ui-toolbar-btn"
          onClick={onOpenBulkTripModal}
          disabled={isSubmittingBulk}
          title={
            bulkPergi && bulkPulang
              ? TEXT_DASHBOARD.BUS_LIST.SET_TRIP_WITH_COUNT(
                  bulkPergi,
                  bulkPulang,
                )
              : TEXT_DASHBOARD.BUS_LIST.SET_TRIP_TITLE
          }
        >
          {isSubmittingBulk && <Loader2 size={16} className="spinner" />}
          <span>
            {TEXT_DASHBOARD.BUS_LIST.SET_TRIP_BTN}
            {bulkPergi && bulkPulang ? ` (${bulkPergi}/${bulkPulang})` : ""}
          </span>
        </button>

        <button
          type="button"
          className="ui-toolbar-btn"
          data-testid="btn-toggle-select-mode"
          onClick={onToggleSelectionMode}
          disabled={isSubmittingBulk}
          aria-pressed={isSelectionMode}
          title={TEXT_DASHBOARD.BUS_LIST.SELECT_MODE_TITLE}
        >
          <span>{TEXT_DASHBOARD.BUS_LIST.SELECT_MODE_BTN}</span>
        </button>

        <div className="buslist-select-wrapper">
          <select
            value={activeCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="ui-toolbar-btn ui-toolbar-select"
            aria-label={TEXT_DASHBOARD.BUS_LIST.FOCUS_COLUMN_ARIA}
          >
            {BUS_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="buslist-select-chevron" aria-hidden="true" />
        </div>
      </div>

      {/* Baris 2: Pencarian & Filter Sisa Unit */}
      <div className="buslist-controls-row">
        <div className="search-input-wrapper buslist-search">
          <Search className="search-icon" size={16} aria-hidden="true" />
          <input
            type="text"
            className="input-field search-input"
            placeholder={TEXT_DASHBOARD.BUS_LIST.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="ui-toolbar-btn"
          aria-pressed={showOnlyUnfinished}
          onClick={onToggleUnfinished}
        >
          {showOnlyUnfinished ? <CheckCircle2 size={16} /> : <Filter size={16} />}
          {showOnlyUnfinished
            ? TEXT_DASHBOARD.BUS_LIST.FILTER_UNFINISHED
            : TEXT_DASHBOARD.BUS_LIST.FILTER_BTN}
        </button>
      </div>

      {/* Contextual Action: Bulk Copy KM S1 to KM S2 */}
      {activeCategory === "kmAwal2" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            padding: "8px 12px",
            borderRadius: "12px",
            background: "rgba(56, 189, 248, 0.08)",
            border:
              "1px solid var(--shift1-border, rgba(56, 189, 248, 0.25))",
            animation: "fadeIn 0.2s ease-out forwards",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "6px",
              flex: "1 1 auto",
            }}
          >
            <span
              style={{
                fontWeight: 700,
                color: "var(--shift1-color, #38bdf8)",
              }}
            >
              {TEXT_DASHBOARD.BUS_LIST.COPY_KM_READY_COUNT(availableKmS1Count)}
            </span>
            <span>{TEXT_DASHBOARD.BUS_LIST.COPY_KM_READY_TEXT}</span>
            {skippedWithNotesCount > 0 && (
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--warning-text, #f59e0b)",
                }}
              >
                {TEXT_DASHBOARD.BUS_LIST.COPY_KM_SKIPPED_TEXT(
                  skippedWithNotesCount,
                )}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onBulkCopyKmS1}
            disabled={isSubmittingBulk || availableKmS1Count === 0}
            className="swal-copy-km-chip"
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 700,
              borderRadius: "8px",
              cursor:
                availableKmS1Count === 0 ? "not-allowed" : "pointer",
              opacity: availableKmS1Count === 0 ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            {TEXT_DASHBOARD.BUS_LIST.COPY_KM_BTN}
          </button>
        </div>
      )}
    </div>
  );
};
