import React, { useRef } from "react";
import {
  Bus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  RefreshCw,
  CloudDownload,
  ArrowLeft,
} from "lucide-react";
import { TEXT_MONITORING, TEXT_COMMON } from "@/constants/texts";
import { formatIndonesianDateLabel } from "./monitoringUtils";

export interface MonitoringHeaderProps {
  onBackToRouteView?: () => void;
  selectedDate: string;
  onStepDate: (days: number) => void;
  onDateInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRefresh: () => void;
  refreshing: boolean;
  loading: boolean;
  onOpenWaModal?: () => void;
  hasData?: boolean;
  onSync18Routes?: () => void;
  syncing18Routes?: boolean;
}

export const MonitoringHeader: React.FC<MonitoringHeaderProps> = ({
  onBackToRouteView,
  selectedDate,
  onStepDate,
  onDateInputChange,
  onRefresh,
  refreshing,
  loading,
  onSync18Routes,
  syncing18Routes,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleOpenDatePicker = () => {
    if (!dateInputRef.current) return;
    try {
      if (typeof dateInputRef.current.showPicker === "function") {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.focus();
        dateInputRef.current.click();
      }
    } catch {
      dateInputRef.current?.click();
    }
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "var(--card-bg, rgba(23, 23, 23, 0.95))",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
        padding: "12px 16px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        {/* Pojok Kiri: Judul & Subtitle */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {onBackToRouteView && (
            <button
              type="button"
              onClick={onBackToRouteView}
              data-testid="monitoring-back-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
                border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
                color: "var(--text-primary, #ededed)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              title={TEXT_COMMON.BUTTONS.BACK}
              aria-label={TEXT_COMMON.BUTTONS.BACK}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1
              style={{
                fontSize: "17px",
                fontWeight: 800,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--text-primary, #ededed)",
                letterSpacing: "-0.3px",
              }}
            >
              <Bus
                size={20}
                style={{ color: "var(--accent-color, #3ECF8E)", flexShrink: 0 }}
              />
              <span>{TEXT_MONITORING.HEADER.TITLE}</span>
            </h1>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-secondary, #8b8b8b)",
                fontWeight: 500,
                display: "block",
                marginTop: "1px",
              }}
            >
              {TEXT_MONITORING.HEADER.SUBTITLE}
            </span>
          </div>
        </div>

        {/* 1 Blok Baris Komponen: Datepicker + Refresh + Load All (Responsive & No Blank Space) */}
        <div
          data-testid="monitoring-control-bar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "nowrap",
            flex: "1 1 320px",
            maxWidth: "520px",
            width: "100%",
          }}
        >
          {/* Date Navigator Box (Interactive Date Picker - Mengisi ruang fleksibel) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flex: 1,
              minWidth: 0,
              height: "36px",
              background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
              borderRadius: "12px",
              padding: "2px 4px",
            }}
          >
            <button
              type="button"
              onClick={() => onStepDate(-1)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-primary, #ededed)",
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              title={TEXT_COMMON.NAV.PREV_DAY}
              aria-label={TEXT_COMMON.NAV.PREV_DAY}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Interactive Date Picker Trigger */}
            <div
              role="button"
              tabIndex={0}
              onClick={handleOpenDatePicker}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleOpenDatePicker();
                }
              }}
              data-testid="monitoring-date-picker-trigger"
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                minWidth: 0,
                gap: "6px",
                padding: "4px 6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-primary, #ededed)",
                userSelect: "none",
                borderRadius: "8px",
                transition: "background-color 0.15s ease",
              }}
              title={TEXT_COMMON.NAV.CHOOSE_DATE}
              aria-label={TEXT_COMMON.NAV.CHOOSE_DATE}
            >
              <Calendar
                size={14}
                style={{ color: "var(--accent-color, #3ECF8E)", flexShrink: 0 }}
              />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {formatIndonesianDateLabel(selectedDate)}
              </span>
              <ChevronDown
                size={12}
                style={{
                  color: "var(--text-secondary, #8b8b8b)",
                  opacity: 0.7,
                  flexShrink: 0,
                  marginLeft: "1px",
                }}
              />
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={onDateInputChange}
                tabIndex={-1}
                aria-hidden="true"
                data-testid="monitoring-native-date-input"
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                  pointerEvents: "none",
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => onStepDate(1)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-primary, #ededed)",
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              title={TEXT_COMMON.NAV.NEXT_DAY}
              aria-label={TEXT_COMMON.NAV.NEXT_DAY}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Action Group: Refresh Button & Load All Button in the same row with clean gap */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            {/* Refresh Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing || loading || syncing18Routes}
              data-testid="monitoring-refresh-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "12px",
                background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
                border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
                color: "var(--text-primary, #ededed)",
                cursor: refreshing || loading || syncing18Routes ? "wait" : "pointer",
                opacity: refreshing || loading || syncing18Routes ? 0.6 : 1,
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
              title={TEXT_MONITORING.HEADER.REFRESH_TITLE}
              aria-label={TEXT_MONITORING.HEADER.REFRESH_TITLE}
            >
              <RefreshCw
                size={16}
                style={{
                  animation: refreshing ? "spin 1s linear infinite" : "none",
                }}
              />
            </button>

            {/* Load All Button (Icon Only for Compact Row) */}
            {onSync18Routes && (
              <button
                type="button"
                onClick={onSync18Routes}
                disabled={syncing18Routes || loading || refreshing}
                data-testid="monitoring-load-all-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "12px",
                  background: "rgba(62, 207, 142, 0.14)",
                  border: "1px solid rgba(62, 207, 142, 0.3)",
                  color: "var(--accent-color, #3ECF8E)",
                  cursor: syncing18Routes || loading || refreshing ? "not-allowed" : "pointer",
                  opacity: syncing18Routes || loading || refreshing ? 0.6 : 1,
                  transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
                  flexShrink: 0,
                }}
                title={TEXT_MONITORING.INGESTION.TOOLTIP}
                aria-label={TEXT_MONITORING.INGESTION.BUTTON_LABEL}
              >
                <CloudDownload
                  size={16}
                  style={{
                    animation: syncing18Routes ? "bounce 1s infinite ease-in-out" : "none",
                  }}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MonitoringHeader;
