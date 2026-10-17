import React, { useState } from "react";
import { Calendar, ChevronRight, X } from "lucide-react";
import { TEXT_MONITORING, TEXT_COMMON } from "@/constants/texts";
import {
  type MonitoringPeriodFilter,
  type MonitoringPeriodMode,
  getRelativeDate,
} from "@/services/allRouteMonitoringService";
import { formatIndonesianDateLabel } from "./monitoringUtils";

import { MonitoringMonthPickerModal } from "./MonitoringMonthPickerModal";

export interface MonitoringPeriodSelectorProps {
  currentPeriod: MonitoringPeriodFilter;
  onPeriodChange: (filter: MonitoringPeriodFilter) => void;
  loading?: boolean;
}

export const MonitoringPeriodSelector: React.FC<MonitoringPeriodSelectorProps> = ({
  currentPeriod,
  onPeriodChange,
  loading = false,
}) => {
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [customStart, setCustomStart] = useState(currentPeriod.startDate);
  const [customEnd, setCustomEnd] = useState(currentPeriod.endDate);

  const handleSelectMode = (mode: MonitoringPeriodMode) => {
    if (loading) return;

    if (mode === "daily") {
      onPeriodChange({
        mode: "daily",
        date: currentPeriod.date,
        startDate: currentPeriod.date,
        endDate: currentPeriod.date,
        label: formatIndonesianDateLabel(currentPeriod.date),
      });
    } else if (mode === "weekly") {
      const startDate = getRelativeDate(currentPeriod.date, -6);
      const endDate = currentPeriod.date;
      onPeriodChange({
        mode: "weekly",
        date: currentPeriod.date,
        startDate,
        endDate,
        label: `${startDate} s.d. ${endDate} (7 Hari)`,
      });
    } else if (mode === "monthly") {
      if (currentPeriod.mode === "monthly") {
        setIsMonthModalOpen(true);
        return;
      }
      const [y, m] = currentPeriod.date.split("-");
      const startDate = `${y}-${m}-01`;
      const endDate = currentPeriod.date;
      onPeriodChange({
        mode: "monthly",
        date: currentPeriod.date,
        startDate,
        endDate,
        label: `${startDate} s.d. ${endDate}`,
      });
    } else if (mode === "custom") {
      setCustomStart(currentPeriod.startDate);
      setCustomEnd(currentPeriod.endDate);
      setIsCustomModalOpen(true);
    }
  };

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) return;
    const start = customStart <= customEnd ? customStart : customEnd;
    const end = customStart <= customEnd ? customEnd : customStart;
    onPeriodChange({
      mode: "custom",
      date: end,
      startDate: start,
      endDate: end,
      label: `${start} s.d. ${end}`,
    });
    setIsCustomModalOpen(false);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        boxSizing: "border-box",
        background: "var(--input-bg, rgba(255, 255, 255, 0.06))",
        borderRadius: "9999px",
        padding: "3px",
        border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
        gap: "4px",
        userSelect: "none",
      }}
    >
      {/* Capsule Daily */}
      <button
        type="button"
        data-testid="period-btn-daily"
        aria-pressed={currentPeriod.mode === "daily"}
        onClick={() => handleSelectMode("daily")}
        disabled={loading}
        style={{
          flex: "1 1 0px",
          minWidth: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "6px 8px",
          borderRadius: "9999px",
          border: "none",
          fontSize: "12px",
          fontWeight: currentPeriod.mode === "daily" ? 700 : 500,
          cursor: loading ? "wait" : "pointer",
          background:
            currentPeriod.mode === "daily"
              ? "var(--accent-color, #3ECF8E)"
              : "transparent",
          color:
            currentPeriod.mode === "daily"
              ? "#062817"
              : "var(--text-secondary, #a3a3a3)",
          transition: "all 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow:
            currentPeriod.mode === "daily"
              ? "0 2px 8px rgba(62, 207, 142, 0.3)"
              : "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {TEXT_MONITORING.PERIOD.DAILY}
      </button>

      {/* Capsule Weekly */}
      <button
        type="button"
        data-testid="period-btn-weekly"
        aria-pressed={currentPeriod.mode === "weekly"}
        onClick={() => handleSelectMode("weekly")}
        disabled={loading}
        style={{
          flex: "1 1 0px",
          minWidth: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "6px 8px",
          borderRadius: "9999px",
          border: "none",
          fontSize: "12px",
          fontWeight: currentPeriod.mode === "weekly" ? 700 : 500,
          cursor: loading ? "wait" : "pointer",
          background:
            currentPeriod.mode === "weekly"
              ? "var(--accent-color, #3ECF8E)"
              : "transparent",
          color:
            currentPeriod.mode === "weekly"
              ? "#062817"
              : "var(--text-secondary, #a3a3a3)",
          transition: "all 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow:
            currentPeriod.mode === "weekly"
              ? "0 2px 8px rgba(62, 207, 142, 0.3)"
              : "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {TEXT_MONITORING.PERIOD.WEEKLY}
      </button>

      {/* Capsule Monthly */}
      <button
        type="button"
        data-testid="period-btn-monthly"
        aria-pressed={currentPeriod.mode === "monthly"}
        onClick={() => handleSelectMode("monthly")}
        disabled={loading}
        style={{
          flex: "1 1 0px",
          minWidth: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "6px 8px",
          borderRadius: "9999px",
          border: "none",
          fontSize: "12px",
          fontWeight: currentPeriod.mode === "monthly" ? 700 : 500,
          cursor: loading ? "wait" : "pointer",
          background:
            currentPeriod.mode === "monthly"
              ? "var(--accent-color, #3ECF8E)"
              : "transparent",
          color:
            currentPeriod.mode === "monthly"
              ? "#062817"
              : "var(--text-secondary, #a3a3a3)",
          transition: "all 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow:
            currentPeriod.mode === "monthly"
              ? "0 2px 8px rgba(62, 207, 142, 0.3)"
              : "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {TEXT_MONITORING.PERIOD.MONTHLY}
      </button>

      {/* Capsule Custom */}
      <button
        type="button"
        data-testid="period-btn-custom"
        aria-pressed={currentPeriod.mode === "custom"}
        onClick={() => handleSelectMode("custom")}
        disabled={loading}
        style={{
          flex: "1 1 0px",
          minWidth: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "6px 8px",
          borderRadius: "9999px",
          border: "none",
          fontSize: "12px",
          fontWeight: currentPeriod.mode === "custom" ? 700 : 500,
          cursor: loading ? "wait" : "pointer",
          background:
            currentPeriod.mode === "custom"
              ? "var(--accent-color, #3ECF8E)"
              : "transparent",
          color:
            currentPeriod.mode === "custom"
              ? "#062817"
              : "var(--text-secondary, #a3a3a3)",
          transition: "all 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow:
            currentPeriod.mode === "custom"
              ? "0 2px 8px rgba(62, 207, 142, 0.3)"
              : "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {TEXT_MONITORING.PERIOD.CUSTOM}
      </button>

      {/* Custom Date Range Modal */}
      {isCustomModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            padding: "16px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "380px",
              background: "var(--card-bg, #1a1a1a)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.4)",
              animation: "modalFadeIn 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <h3
                data-testid="custom-period-modal-title"
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--text-primary, #ededed)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Calendar size={18} style={{ color: "var(--accent-color, #3ECF8E)" }} />
                {TEXT_MONITORING.PERIOD.CUSTOM_MODAL_TITLE}
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary, #888)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                }}
                title={TEXT_COMMON.BUTTONS.CLOSE}
                aria-label={TEXT_COMMON.BUTTONS.CLOSE}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "4px",
                    color: "var(--text-secondary, #a3a3a3)",
                  }}
                >
                  {TEXT_MONITORING.PERIOD.START_DATE}
                </label>
                <input
                  type="date"
                  data-testid="custom-start-date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--card-border, rgba(255, 255, 255, 0.15))",
                    background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
                    color: "var(--text-primary, #ededed)",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "4px",
                    color: "var(--text-secondary, #a3a3a3)",
                  }}
                >
                  {TEXT_MONITORING.PERIOD.END_DATE}
                </label>
                <input
                  type="date"
                  data-testid="custom-end-date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--card-border, rgba(255, 255, 255, 0.15))",
                    background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
                    color: "var(--text-primary, #ededed)",
                    fontSize: "13px",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--card-border, rgba(255, 255, 255, 0.15))",
                  background: "transparent",
                  color: "var(--text-secondary, #a3a3a3)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {TEXT_MONITORING.PERIOD.CANCEL_BTN}
              </button>
              <button
                type="button"
                data-testid="custom-apply-btn"
                onClick={handleApplyCustom}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: "var(--accent-color, #3ECF8E)",
                  color: "#062817",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  boxShadow: "0 2px 8px rgba(62, 207, 142, 0.3)",
                }}
              >
                {TEXT_MONITORING.PERIOD.APPLY_BTN}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Month Picker Modal for Monthly Period */}
      <MonitoringMonthPickerModal
        isOpen={isMonthModalOpen}
        onClose={() => setIsMonthModalOpen(false)}
        currentPeriod={currentPeriod}
        onSelectMonth={(filter) => {
          onPeriodChange(filter);
          setIsMonthModalOpen(false);
        }}
        referenceDate={currentPeriod.date}
      />
    </div>
  );
};

export default MonitoringPeriodSelector;
