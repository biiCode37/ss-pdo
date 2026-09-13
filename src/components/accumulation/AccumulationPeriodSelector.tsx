import React from "react";
import { TEXT_DASHBOARD, TEXT_COMMON } from "@/constants/texts";

const MONTH_NAMES_ID = TEXT_COMMON.MONTHS;

interface AccumulationPeriodSelectorProps {
  safeStartDay: number;
  setStartDay: (day: number) => void;
  startMonth: number;
  setStartMonth: (month: number) => void;
  startYear: number;
  setStartYear: (year: number) => void;
  days: number[];
  safeEndDay: number;
  setEndDay: (day: number) => void;
  endMonth: number;
  setEndMonth: (month: number) => void;
  endYear: number;
  setEndYear: (year: number) => void;
  endDays: number[];
  availableMonths: number[];
  availableYears: number[];
}

export const AccumulationPeriodSelector: React.FC<
  AccumulationPeriodSelectorProps
> = ({
  safeStartDay,
  setStartDay,
  startMonth,
  setStartMonth,
  startYear,
  setStartYear,
  days,
  safeEndDay,
  setEndDay,
  endMonth,
  setEndMonth,
  endYear,
  setEndYear,
  endDays,
  availableMonths,
  availableYears,
}) => {
  const renderMonthOptions = (selectedVal: number) => {
    const list = availableMonths.length > 0 ? availableMonths : [selectedVal];
    return list.map((m) => (
      <option key={m} value={m}>
        {MONTH_NAMES_ID[m] || `Bulan ${m}`}
      </option>
    ));
  };

  const renderYearOptions = (selectedVal: number) => {
    const list = availableYears.length > 0 ? availableYears : [selectedVal];
    return list.map((y) => (
      <option key={y} value={y}>
        {y}
      </option>
    ));
  };

  return (
    <>
      {/* Section 1: Dari Periode */}
      <div style={{ marginBottom: "16px" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--accent-color)",
            display: "block",
            marginBottom: "6px",
          }}
        >
          {TEXT_DASHBOARD.ACCUMULATION_SHEET.FROM_LABEL}
        </span>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "80px 1fr 90px",
            gap: "8px",
          }}
        >
          <div>
            <label
              style={{
                fontSize: "10px",
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: "2px",
              }}
            >
              {TEXT_DASHBOARD.ROUTE_SELECTOR.DATE_LABEL}
            </label>
            <select
              className="input-field"
              value={safeStartDay}
              onChange={(e) => setStartDay(Number(e.target.value))}
              style={{ width: "100%", padding: "8px", fontSize: "12.5px" }}
            >
              {days.map((d) => (
                <option key={d} value={d}>
                  {TEXT_DASHBOARD.TOA_TREND.DATE_PREFIX}
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                fontSize: "10px",
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: "2px",
              }}
            >
              {TEXT_DASHBOARD.ROUTE_SELECTOR.MONTH_LABEL}
            </label>
            <select
              className="input-field"
              value={startMonth}
              onChange={(e) => setStartMonth(Number(e.target.value))}
              style={{ width: "100%", padding: "8px", fontSize: "12.5px" }}
            >
              {renderMonthOptions(startMonth)}
            </select>
          </div>
          <div>
            <label
              style={{
                fontSize: "10px",
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: "2px",
              }}
            >
              {TEXT_DASHBOARD.ROUTE_SELECTOR.YEAR_LABEL}
            </label>
            <select
              className="input-field"
              value={startYear}
              onChange={(e) => setStartYear(Number(e.target.value))}
              style={{ width: "100%", padding: "8px", fontSize: "12.5px" }}
            >
              {renderYearOptions(startYear)}
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Sampai Periode */}
      <div style={{ marginBottom: "16px" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--accent-color)",
            display: "block",
            marginBottom: "6px",
          }}
        >
          {TEXT_DASHBOARD.ACCUMULATION_SHEET.TO_LABEL}
        </span>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "80px 1fr 90px",
            gap: "8px",
          }}
        >
          <div>
            <label
              style={{
                fontSize: "10px",
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: "2px",
              }}
            >
              {TEXT_DASHBOARD.ROUTE_SELECTOR.DATE_LABEL}
            </label>
            <select
              className="input-field"
              value={safeEndDay}
              onChange={(e) => setEndDay(Number(e.target.value))}
              style={{ width: "100%", padding: "8px", fontSize: "12.5px" }}
            >
              {endDays.map((d) => (
                <option key={d} value={d}>
                  {TEXT_DASHBOARD.TOA_TREND.DATE_PREFIX}
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                fontSize: "10px",
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: "2px",
              }}
            >
              {TEXT_DASHBOARD.ROUTE_SELECTOR.MONTH_LABEL}
            </label>
            <select
              className="input-field"
              value={endMonth}
              onChange={(e) => setEndMonth(Number(e.target.value))}
              style={{ width: "100%", padding: "8px", fontSize: "12.5px" }}
            >
              {renderMonthOptions(endMonth)}
            </select>
          </div>
          <div>
            <label
              style={{
                fontSize: "10px",
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: "2px",
              }}
            >
              {TEXT_DASHBOARD.ROUTE_SELECTOR.YEAR_LABEL}
            </label>
            <select
              className="input-field"
              value={endYear}
              onChange={(e) => setEndYear(Number(e.target.value))}
              style={{ width: "100%", padding: "8px", fontSize: "12.5px" }}
            >
              {renderYearOptions(endYear)}
            </select>
          </div>
        </div>
      </div>
    </>
  );
};
