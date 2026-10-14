import React, { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { TEXT_MONITORING, TEXT_COMMON } from "@/constants/texts";
import { type MonitoringPeriodFilter } from "@/services/allRouteMonitoringService";

export interface MonitoringMonthPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPeriod: MonitoringPeriodFilter;
  onSelectMonth: (filter: MonitoringPeriodFilter) => void;
  referenceDate?: string;
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const MonitoringMonthPickerModal: React.FC<MonitoringMonthPickerModalProps> = ({
  isOpen,
  onClose,
  currentPeriod,
  onSelectMonth,
  referenceDate,
}) => {
  const today = new Date();
  const initialDateStr = currentPeriod.startDate || currentPeriod.date || referenceDate || today.toISOString().split("T")[0];
  const [initY, initM] = initialDateStr.split("-").map(Number);

  const [selectedYear, setSelectedYear] = useState<number>(initY || today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(initM || today.getMonth() + 1);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const dateStr = currentPeriod.startDate || currentPeriod.date || referenceDate || today.toISOString().split("T")[0];
      const [y, m] = dateStr.split("-").map(Number);
      setSelectedYear(y || today.getFullYear());
      setSelectedMonth(m || today.getMonth() + 1);
    }
  }, [isOpen, currentPeriod.startDate, currentPeriod.date, referenceDate]);

  // Listener tombol Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const handleStepYear = (delta: number) => {
    setSelectedYear((prev) => prev + delta);
  };

  const handleApply = (targetYear = selectedYear, targetMonth = selectedMonth) => {
    const padMonth = String(targetMonth).padStart(2, "0");
    const startDate = `${targetYear}-${padMonth}-01`;
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

    const isCurrent = targetYear === currentYear && targetMonth === currentMonth;
    const refDay = referenceDate && referenceDate.startsWith(`${targetYear}-${padMonth}`)
      ? parseInt(referenceDate.split("-")[2], 10) || daysInMonth
      : daysInMonth;

    const lastDay = isCurrent ? Math.min(refDay, daysInMonth) : daysInMonth;
    const endDate = `${targetYear}-${padMonth}-${String(lastDay).padStart(2, "0")}`;

    onSelectMonth({
      mode: "monthly",
      date: endDate,
      startDate,
      endDate,
      label: `${startDate} s.d. ${endDate}`,
    });
    onClose();
  };

  const handleQuickSelect = (offsetMonths: number) => {
    const d = new Date(currentYear, currentMonth - 1 - offsetMonths, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    setSelectedYear(y);
    setSelectedMonth(m);
    handleApply(y, m);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="month-picker-modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.68)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          background: "var(--card-bg, #1a1a1a)",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
          borderRadius: "20px",
          padding: "20px",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5)",
          animation: "modalFadeIn 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
          boxSizing: "border-box",
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h3
            data-testid="month-picker-modal-title"
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 800,
              color: "var(--text-primary, #ededed)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Calendar size={18} style={{ color: "var(--accent-color, #3ECF8E)" }} />
            {TEXT_MONITORING.PERIOD.MONTHLY_MODAL_TITLE}
          </h3>
          <button
            type="button"
            onClick={onClose}
            data-testid="month-picker-close-btn"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary, #888)",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              borderRadius: "8px",
            }}
            title={TEXT_COMMON.BUTTONS.CLOSE}
            aria-label={TEXT_COMMON.BUTTONS.CLOSE}
          >
            <X size={18} />
          </button>
        </div>

        {/* Kontrol Navigasi Tahun */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
            borderRadius: "12px",
            padding: "4px 8px",
            marginBottom: "14px",
          }}
        >
          <button
            type="button"
            onClick={() => handleStepYear(-1)}
            data-testid="month-picker-prev-year"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-primary, #ededed)",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Tahun Sebelumnya"
            aria-label="Tahun Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>

          <span
            data-testid="month-picker-current-year"
            style={{
              fontSize: "15px",
              fontWeight: 800,
              color: "var(--text-primary, #ededed)",
              letterSpacing: "0.5px",
            }}
          >
            {selectedYear}
          </span>

          <button
            type="button"
            onClick={() => handleStepYear(1)}
            data-testid="month-picker-next-year"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-primary, #ededed)",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Tahun Berikutnya"
            aria-label="Tahun Berikutnya"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Quick Pills (Bulan Ini, Bulan Lalu, 2 Bulan Lalu) */}
        <div style={{ marginBottom: "14px" }}>
          <span
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-secondary, #888)",
              marginBottom: "6px",
            }}
          >
            {TEXT_MONITORING.PERIOD.QUICK_MONTHS_LABEL}
          </span>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button
              type="button"
              data-testid="quick-month-this"
              onClick={() => handleQuickSelect(0)}
              style={{
                padding: "4px 10px",
                borderRadius: "9999px",
                fontSize: "11.5px",
                fontWeight: 600,
                border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
                background:
                  selectedYear === currentYear && selectedMonth === currentMonth
                    ? "rgba(62, 207, 142, 0.16)"
                    : "var(--input-bg, rgba(255, 255, 255, 0.04))",
                color:
                  selectedYear === currentYear && selectedMonth === currentMonth
                    ? "var(--accent-color, #3ECF8E)"
                    : "var(--text-secondary, #aaa)",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
              }}
            >
              {TEXT_MONITORING.PERIOD.CURRENT_MONTH}
            </button>
            <button
              type="button"
              data-testid="quick-month-prev"
              onClick={() => handleQuickSelect(1)}
              style={{
                padding: "4px 10px",
                borderRadius: "9999px",
                fontSize: "11.5px",
                fontWeight: 600,
                border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
                background: "var(--input-bg, rgba(255, 255, 255, 0.04))",
                color: "var(--text-secondary, #aaa)",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
              }}
            >
              {TEXT_MONITORING.PERIOD.PREV_MONTH}
            </button>
            <button
              type="button"
              data-testid="quick-month-prev2"
              onClick={() => handleQuickSelect(2)}
              style={{
                padding: "4px 10px",
                borderRadius: "9999px",
                fontSize: "11.5px",
                fontWeight: 600,
                border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
                background: "var(--input-bg, rgba(255, 255, 255, 0.04))",
                color: "var(--text-secondary, #aaa)",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
              }}
            >
              {TEXT_MONITORING.PERIOD.PREV_TWO_MONTH}
            </button>
          </div>
        </div>

        {/* Grid 12 Bulan */}
        <div
          data-testid="month-picker-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          {MONTH_NAMES.map((name, index) => {
            const monthNum = index + 1;
            const isSelected = selectedMonth === monthNum;
            const isCurrent = selectedYear === currentYear && currentMonth === monthNum;

            return (
              <button
                key={monthNum}
                type="button"
                data-testid={`month-btn-${monthNum}`}
                onClick={() => setSelectedMonth(monthNum)}
                style={{
                  padding: "10px 4px",
                  borderRadius: "12px",
                  border: isSelected
                    ? "1px solid var(--accent-color, #3ECF8E)"
                    : "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
                  background: isSelected
                    ? "var(--accent-color, #3ECF8E)"
                    : isCurrent
                    ? "rgba(62, 207, 142, 0.12)"
                    : "var(--input-bg, rgba(255, 255, 255, 0.03))",
                  color: isSelected
                    ? "#062817"
                    : isCurrent
                    ? "var(--accent-color, #3ECF8E)"
                    : "var(--text-primary, #ededed)",
                  fontSize: "12.5px",
                  fontWeight: isSelected ? 800 : isCurrent ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  boxShadow: isSelected ? "0 2px 10px rgba(62, 207, 142, 0.3)" : "none",
                }}
              >
                <span>{name.slice(0, 3)}</span>
                {isSelected && <Check size={12} strokeWidth={3} />}
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <button
            type="button"
            onClick={onClose}
            data-testid="month-picker-cancel-btn"
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
            data-testid="month-picker-apply-btn"
            onClick={() => handleApply()}
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
              gap: "6px",
              boxShadow: "0 2px 8px rgba(62, 207, 142, 0.3)",
            }}
          >
            {TEXT_MONITORING.PERIOD.APPLY_BTN}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonitoringMonthPickerModal;
