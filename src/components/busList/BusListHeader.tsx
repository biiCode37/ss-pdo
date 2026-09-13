import React from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  Loader2,
  ChevronDown,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { TEXT_DASHBOARD, TEXT_FLEET_STATUS } from "@/constants/texts";
import { BUS_CATEGORIES } from "./busListUtils";

interface BusListHeaderProps {
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
  isShiftConfirmed,
  activeShift = 1,
  onOpenFleetStatus,
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
        <div
          style={{
            background: "rgba(234, 179, 8, 0.15)",
            border: "1px solid rgba(234, 179, 8, 0.4)",
            color: "var(--warning-color, #eab308)",
            padding: "10px 14px",
            borderRadius: "12px",
            fontSize: "12.5px",
            fontWeight: 600,
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            boxShadow: "0 2px 8px rgba(234, 179, 8, 0.15)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: 1,
              minWidth: "240px",
            }}
          >
            <span style={{ fontSize: "16px" }}>⚠️</span>
            <span>
              Rekap Akumulasi (Tgl{" "}
              {(() => {
                const sDay = accRange?.startDay ?? 1;
                const eDay = accRange?.endDay ?? new Date().getDate();
                if (
                  accRange?.startMonth &&
                  accRange?.endMonth &&
                  (accRange.startMonth !== accRange.endMonth ||
                    accRange.startYear !== accRange.endYear)
                ) {
                  return `${sDay}/${accRange.startMonth} - ${eDay}/${accRange.endMonth}`;
                }
                return `${sDay} - ${eDay}`;
              })()}
              ) aktif. Penginputan dikunci pada mode akumulasi.
            </span>
          </div>
          {onExitAccumulation && (
            <button
              type="button"
              onClick={onExitAccumulation}
              style={{
                background: "rgba(234, 179, 8, 0.2)",
                border: "1px solid rgba(234, 179, 8, 0.45)",
                color: "var(--warning-color, #eab308)",
                borderRadius: "8px",
                padding: "5px 12px",
                fontSize: "11.5px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Kembali ke Harian ➔
            </button>
          )}
        </div>
      )}

      {/* 2. Hairline Progress Indicator */}
      {(isShiftConfirmed || tabName === "AKUMULASI") && (
        <div data-testid="daily-progress-container">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "2px 4px 6px 4px",
              fontSize: "12px",
              color: "var(--text-secondary)",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: "-0.1px",
              }}
            >
              {activeCategory === "ALL"
                ? TEXT_DASHBOARD.BUS_LIST.DAILY_PROGRESS
                : TEXT_DASHBOARD.BUS_LIST.COLUMN_PREFIX(
                    BUS_CATEGORIES.find((c) => c.id === activeCategory)?.label ||
                      activeCategory,
                  )}
            </span>
            <span className="tabular-nums" style={{ fontSize: "11.5px" }}>
              <strong
                style={{
                  color:
                    filledCount === totalCount
                      ? "var(--success-color)"
                      : "var(--text-primary)",
                }}
              >
                {filledCount}
              </strong>
              /{totalCount} Unit ({progressPercent}%)
            </span>
          </div>

          {/* 3px Hairline Progress Bar */}
          <div
            style={{
              height: "3px",
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: "2px",
              overflow: "hidden",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                height: "100%",
                background:
                  filledCount === totalCount
                    ? "var(--success-color)"
                    : "var(--accent-color)",
                width: `${progressPercent}%`,
                transition: "width 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
              }}
            />
          </div>
        </div>
      )}

      {/* 3. Banner Peringatan Status Armada Belum Dikonfirmasi */}
      {!isShiftConfirmed && tabName !== "AKUMULASI" && (
        <div
          className="shift-lock-banner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            padding: "10px 14px",
            borderRadius: "12px",
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            color: "var(--warning-text, #f59e0b)",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: "1 1 auto",
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span
              style={{ fontSize: "12px", fontWeight: 600, lineHeight: 1.35 }}
            >
              {TEXT_FLEET_STATUS.MODAL.LOCK_BANNER_MESSAGE(activeShift || 1)}
            </span>
          </div>
          {onOpenFleetStatus && (
            <button
              type="button"
              onClick={onOpenFleetStatus}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 12px",
                borderRadius: "8px",
                background: "rgba(245, 158, 11, 0.22)",
                border: "1px solid rgba(245, 158, 11, 0.45)",
                color: "inherit",
                fontSize: "11.5px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <span>{TEXT_FLEET_STATUS.ALERT_BAR.ACTION_BTN}</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      )}

      {/* 4. Controls Container: Row 1 & Row 2 */}
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
    </div>
  );
};
