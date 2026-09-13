import React from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  Loader2,
  ChevronDown,
} from "lucide-react";
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
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "clamp(6px, 1.5vw, 8px)",
      }}
    >
      {/* Row 1: Set Jumlah Trip (Kiri) & Fokus Kolom (Kanan) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "clamp(6px, 1.5vw, 8px)",
          alignItems: "center",
        }}
      >
        {/* Set Jumlah Trip Trigger Button (Kiri) */}
        <button
          type="button"
          onClick={onOpenBulkTripModal}
          disabled={isSubmittingBulk}
          style={{
            height: "38px",
            padding: "0 12px",
            borderRadius: "11px",
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            color: "var(--text-primary)",
            fontWeight: 600,
            fontSize: "12.5px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            whiteSpace: "nowrap",
            cursor: "pointer",
            boxShadow: "none",
            transition: "opacity 0.12s ease",
            opacity: isSubmittingBulk ? 0.7 : 1,
          }}
          title={
            bulkPergi && bulkPulang
              ? TEXT_DASHBOARD.BUS_LIST.SET_TRIP_WITH_COUNT(
                  bulkPergi,
                  bulkPulang,
                )
              : TEXT_DASHBOARD.BUS_LIST.SET_TRIP_TITLE
          }
        >
          {isSubmittingBulk && (
            <Loader2
              size={14}
              className="spinner"
              style={{ color: "var(--accent-color)" }}
            />
          )}
          <span style={{ color: "var(--text-primary)" }}>
            {TEXT_DASHBOARD.BUS_LIST.SET_TRIP_BTN}
            {bulkPergi && bulkPulang ? ` (${bulkPergi}/${bulkPulang})` : ""}
          </span>
        </button>

        {/* Dropdown Fokus Kolom (Kanan) */}
        <div style={{ position: "relative", width: "100%", minWidth: 0 }}>
          <select
            value={activeCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="input-field"
            style={{
              height: "38px",
              padding: "0 32px 0 12px",
              fontSize: "12.5px",
              fontWeight: 600,
              borderRadius: "11px",
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              color: "var(--text-primary)",
              cursor: "pointer",
              width: "100%",
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
            }}
          >
            {BUS_CATEGORIES.map((cat) => (
              <option
                key={cat.id}
                value={cat.id}
                style={{
                  background: "var(--surface-color, #1e293b)",
                  color: "var(--text-primary, #f8fafc)",
                }}
              >
                {cat.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={15}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-secondary)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* Row 2: Pencarian & Filter Sisa Unit */}
      <div
        className="search-container"
        style={{ display: "flex", gap: "clamp(6px, 1.5vw, 8px)", margin: 0 }}
      >
        <div className="search-input-wrapper" style={{ flex: 1 }}>
          <Search className="search-icon" size={17} />
          <input
            type="text"
            className="input-field search-input"
            placeholder={TEXT_DASHBOARD.BUS_LIST.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ height: "38px", fontSize: "13px" }}
          />
        </div>
        <button
          className={`btn ${showOnlyUnfinished ? "" : "btn-outline"}`}
          style={{
            width: "auto",
            padding: "0 12px",
            display: "flex",
            gap: "5px",
            alignItems: "center",
            height: "38px",
            fontSize: "12.5px",
            fontWeight: 600,
            borderRadius: "11px",
            whiteSpace: "nowrap",
          }}
          onClick={onToggleUnfinished}
        >
          {showOnlyUnfinished ? (
            <CheckCircle2 size={15} />
          ) : (
            <Filter size={15} />
          )}
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
                  fontSize: "11px",
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
