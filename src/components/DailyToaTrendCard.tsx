import { useState, useEffect, useMemo, useId, memo } from "react";
import { safeFormatNumber } from "../utils/numberUtils";
import { BarChart2, Calendar, AlertCircle } from "lucide-react";
import { getMonthlyToaTrend } from "../services/googleSheets";
import { DailyToaTrendSkeleton } from "./Skeletons";
import { extractMonthYearLabel } from "../utils/analytics";
import { TEXT_DASHBOARD } from "../constants/texts";

interface Props {
  sheetId: string;
  selectedTab: string;
  refreshKey?: number;
  monthLabel?: string;
  onSelectTab?: (tab: string) => void;
  unitFilter?: string;
}

// ponytail: helper sederhana agar "AKUMULASI" → today, angka → parseInt
function parseSelectedDay(tab: string): number {
  if (tab === "AKUMULASI") return new Date().getDate();
  return parseInt(tab, 10) || new Date().getDate();
}

function DailyToaTrendCardComponent({
  sheetId,
  selectedTab,
  refreshKey = 0,
  monthLabel,
  onSelectTab,
  unitFilter,
}: Props) {
  const rawId = useId();
  const idPrefix = useMemo(() => "toa_" + rawId.replace(/[^a-zA-Z0-9]/g, "") + "_", [rawId]);

  const effectiveMonthLabel = useMemo(() => {
    if (monthLabel) return monthLabel;
    return extractMonthYearLabel(sheetId);
  }, [monthLabel, sheetId]);

  const [trendData, setTrendData] = useState<
    { day: string; totalToa: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [activeTooltipDay, setActiveTooltipDay] = useState<string | null>(null);

  // Track max day for the chart so internal bar/badge clicks don't shrink the chart
  const [chartMaxDay, setChartMaxDay] = useState<number>(() => {
    return Math.max(1, Math.min(31, parseSelectedDay(selectedTab)));
  });

  // When sheetId or refreshKey changes (e.g. user clicks "LOAD DATA" in header), reset chartMaxDay to selectedTab
  useEffect(() => {
    const selectedNum = parseSelectedDay(selectedTab);
    setChartMaxDay(Math.max(1, Math.min(31, selectedNum)));
  }, [sheetId, refreshKey, selectedTab]);

  // When selectedTab increases beyond current chartMaxDay, expand chartMaxDay
  useEffect(() => {
    const selectedNum = parseSelectedDay(selectedTab);
    if (selectedNum > chartMaxDay) {
      setChartMaxDay(Math.min(31, selectedNum));
    }
  }, [selectedTab, chartMaxDay]);

  useEffect(() => {
    // Reset tooltip when active tab changes
    setActiveTooltipDay(null);
  }, [selectedTab]);

  useEffect(() => {
    if (!activeTooltipDay) return;

    const handleDismiss = () => {
      setActiveTooltipDay(null);
    };

    window.addEventListener("click", handleDismiss);
    return () => {
      window.removeEventListener("click", handleDismiss);
    };
  }, [activeTooltipDay]);

  useEffect(() => {
    if (!sheetId || chartMaxDay < 1) return;

    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    getMonthlyToaTrend(sheetId, chartMaxDay, unitFilter)
      .then((data) => {
        if (isMounted) {
          setTrendData(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn("[DailyToaTrendCard] Gagal memuat tren:", err);
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sheetId, chartMaxDay, unitFilter, refreshKey]);

  const chartMetrics = useMemo(() => {
    if (trendData.length === 0) return null;

    const N = trendData.length;
    const maxVal = Math.max(...trendData.map((d) => d.totalToa), 1);
    const totalSum = trendData.reduce((acc, d) => acc + d.totalToa, 0);
    const avgToa = Math.round(totalSum / Math.max(N, 1));
    const peakItem = [...trendData].sort((a, b) => b.totalToa - a.totalToa)[0];
    const nonZeroData = trendData.filter((d) => d.totalToa > 0);
    const lowestItem = (nonZeroData.length > 0 ? nonZeroData : trendData).sort(
      (a, b) => a.totalToa - b.totalToa,
    )[0];

    const chartHeight = 150;
    const chartWidth = 340;
    const paddingX = 14;
    const usableWidth = chartWidth - paddingX * 2;
    const gap = N > 20 ? 2 : 4;
    const barWidth = Math.max(4, (usableWidth - (N - 1) * gap) / N);
    const maxBarHeight = chartHeight - 46;

    const bars = trendData.map((d, idx) => {
      const dayNum = parseInt(d.day) || idx + 1;
      const isSelected = d.day === activeTooltipDay;
      const isGlobalTab = d.day === selectedTab;
      const heightRatio = d.totalToa / maxVal;
      const calculatedHeight = heightRatio * maxBarHeight;
      const barHeight = Math.max(3, calculatedHeight);
      const x = paddingX + idx * (barWidth + gap);
      const y = chartHeight - 20 - barHeight;

      const prevToa = idx > 0 ? trendData[idx - 1].totalToa : d.totalToa;
      const diffFromPrev = idx > 0 ? d.totalToa - prevToa : 0;
      const pctChange = prevToa > 0 ? (diffFromPrev / prevToa) * 100 : 0;

      let trendType: "up" | "slight_down" | "drastic_down" = "up";
      if (idx > 0 && diffFromPrev < 0) {
        if (pctChange <= -20) {
          trendType = "drastic_down";
        } else {
          trendType = "slight_down";
        }
      }

      return {
        day: d.day,
        dayNum,
        totalToa: d.totalToa,
        x,
        y,
        barHeight,
        isSelected,
        isGlobalTab,
        trendType,
        diffFromPrev,
        pctChange,
      };
    });

    const activeBar = activeTooltipDay
      ? bars.find((b) => b.day === activeTooltipDay)
      : null;
    return {
      N,
      paddingX,
      maxBarHeight,
      maxVal,
      avgToa,
      peakItem,
      lowestItem,
      chartHeight,
      chartWidth,
      barWidth,
      bars,
      activeBar,
    };
  }, [trendData, activeTooltipDay, selectedTab]);

  if (isLoading) {
    return <DailyToaTrendSkeleton />;
  }

  if (hasError) {
    return (
      <div
        className="analytics-card glass"
        style={{ position: "relative", overflow: "hidden" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div className="analytics-card-title">
              <BarChart2 size={18} />
              <span>Grafik Pelanggan Harian</span>
            </div>
            {unitFilter && (
              <div
                style={{
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: "var(--accent-color)",
                  paddingLeft: "24px",
                }}
              >
                {unitFilter}
              </div>
            )}
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Calendar size={12} />
            {effectiveMonthLabel}
          </span>
        </div>
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "10px",
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            color: "var(--warning-text, #d97706)",
            fontSize: "12.5px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "4px",
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{TEXT_DASHBOARD.TOA_TREND.ERROR_MESSAGE}</span>
        </div>
      </div>
    );
  }

  if (!chartMetrics) return null;

  const {
    N,
    paddingX,
    maxBarHeight,
    avgToa,
    peakItem,
    lowestItem,
    chartHeight,
    chartWidth,
    barWidth,
    bars,
    activeBar,
  } = chartMetrics;

  return (
    <div
      className="analytics-card glass"
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* Card Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div className="analytics-card-title">
            <BarChart2 size={18} />
            <span>{TEXT_DASHBOARD.TOA_TREND.TITLE}</span>
          </div>
          {unitFilter && (
            <div
              style={{
                fontSize: "11.5px",
                fontWeight: 600,
                color: "var(--accent-color)",
                paddingLeft: "24px",
              }}
            >
              {unitFilter}
            </div>
          )}
        </div>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Calendar size={12} />
          {effectiveMonthLabel}
        </span>
      </div>

      {/* Modern 3-Column Executive Stats Grid (Max, Min, Avg) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        {/* Tertinggi (Peak) Card */}
        <div
          style={{
            background: "var(--total-bg)",
            border: "1px solid var(--total-border)",
            borderRadius: "10px",
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {/* ponytail: clean label without decorative Award icon */}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            {TEXT_DASHBOARD.TOA_TREND.PEAK_LABEL}
          </span>
          <span
            className="tabular-nums"
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--total-color)",
              lineHeight: "1.2",
            }}
          >
            {peakItem ? safeFormatNumber(peakItem.totalToa) : "0"}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            {TEXT_DASHBOARD.TOA_TREND.DATE_PREFIX}{peakItem ? peakItem.day : "-"}
          </span>
        </div>

        {/* Terendah (Min) Card */}
        <div
          style={{
            background: "var(--danger-badge-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "10px",
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {/* ponytail: clean label without decorative TrendingDown icon */}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            {TEXT_DASHBOARD.TOA_TREND.LOWEST_LABEL}
          </span>
          <span
            className="tabular-nums"
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--danger-text)",
              lineHeight: "1.2",
            }}
          >
            {lowestItem ? safeFormatNumber(lowestItem.totalToa) : "0"}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            {TEXT_DASHBOARD.TOA_TREND.DATE_PREFIX}{lowestItem ? lowestItem.day : "-"}
          </span>
        </div>

        {/* Rata-rata (Avg) Card */}
        <div
          style={{
            background: "var(--info-badge-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "10px",
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {/* ponytail: clean label without decorative Zap icon */}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            {TEXT_DASHBOARD.TOA_TREND.AVG_LABEL}
          </span>
          <span
            className="tabular-nums"
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--info-text)",
              lineHeight: "1.2",
            }}
          >
            {safeFormatNumber(avgToa)}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            {TEXT_DASHBOARD.TOA_TREND.AVG_UNIT}
          </span>
        </div>
      </div>

      {/* Legend Indicator for Increase, Slight Decrease, Drastic Decrease */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          marginBottom: "8px",
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--text-secondary)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "var(--total-color, #4ade80)",
            }}
          ></span>
          {TEXT_DASHBOARD.TOA_TREND.LEGEND_UP}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "var(--orange-color, #fb923c)",
            }}
          ></span>
          {TEXT_DASHBOARD.TOA_TREND.LEGEND_SLIGHT_DOWN}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "var(--danger-color, #f43f5e)",
            }}
          ></span>
          {TEXT_DASHBOARD.TOA_TREND.LEGEND_DRASTIC_DOWN}
        </span>
      </div>

      {/* Modern iOS Pill Bar Chart Container */}
      <div
        style={{ width: "100%", overflowX: "auto" }}
        className="no-scrollbar no-swipe"
      >
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{
            width: "100%",
            height: "auto",
            minWidth: "300px",
            overflow: "visible",
          }}
        >
          <defs>
            {/* Active Highlighted Tapped Pill Bar Gradient (Vibrant Electric Blue) */}
            <linearGradient
              id={`${idPrefix}activePillGradient`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.85" />
            </linearGradient>

            {/* Increase Trend Pill Bar Gradient (Emerald Green) */}
            <linearGradient id={`${idPrefix}upPillGradient`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#22c55e" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.25" />
            </linearGradient>

            {/* Slight Decrease Pill Bar Gradient (Coral / Amber Red) */}
            <linearGradient
              id={`${idPrefix}slightDownPillGradient`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#fb923c" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#ef4444" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.25" />
            </linearGradient>

            {/* Drastic Decrease Pill Bar Gradient (Deep Crimson Red) */}
            <linearGradient
              id={`${idPrefix}drasticDownPillGradient`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#dc2626" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.3" />
            </linearGradient>

            {/* Glowing Drop Shadow Filter for Active Tapped Bar (Blue Glow) */}
            <filter
              id={`${idPrefix}pillGlow`}
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feDropShadow
                dx="0"
                dy="2.5"
                stdDeviation="3.5"
                floodColor="#38bdf8"
                floodOpacity="0.8"
              />
            </filter>
          </defs>

          {/* Subtle Grid Lines */}
          <line
            x1={paddingX}
            y1={24}
            x2={chartWidth - paddingX}
            y2={24}
            stroke="var(--border-color, rgba(255, 255, 255, 0.1))"
            strokeDasharray="3 3"
            opacity="0.3"
          />
          <line
            x1={paddingX}
            y1={24 + maxBarHeight / 2}
            x2={chartWidth - paddingX}
            y2={24 + maxBarHeight / 2}
            stroke="var(--border-color, rgba(255, 255, 255, 0.1))"
            strokeDasharray="3 3"
            opacity="0.3"
          />
          <line
            x1={paddingX}
            y1={chartHeight - 20}
            x2={chartWidth - paddingX}
            y2={chartHeight - 20}
            stroke="var(--border-color, rgba(255, 255, 255, 0.15))"
            strokeWidth="1"
            opacity="0.4"
          />

          {/* Render Column Bars */}
          {bars.map((bar, idx) => {
            const rx = Math.min(3, barWidth / 2);
            const fillUrl = bar.isSelected
              ? `url(#${idPrefix}activePillGradient)`
              : bar.trendType === "up"
                ? `url(#${idPrefix}upPillGradient)`
                : bar.trendType === "slight_down"
                  ? `url(#${idPrefix}slightDownPillGradient)`
                  : `url(#${idPrefix}drasticDownPillGradient)`;

            return (
              <g
                key={bar.day}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTooltipDay((prev) =>
                    prev === bar.day ? null : bar.day,
                  );
                }}
                style={{ cursor: "pointer", transition: "all 0.2s ease" }}
              >
                <rect
                  x={bar.x}
                  y={bar.y}
                  width={barWidth}
                  height={bar.barHeight}
                  rx={rx}
                  ry={rx}
                  fill={fillUrl}
                  filter={bar.isSelected ? `url(#${idPrefix}pillGlow)` : undefined}
                  className="trend-bar-rect"
                  style={{ animationDelay: `${idx * 16}ms` }}
                />
              </g>
            );
          })}

          {/* Active Day Floating Metric Tooltip Badge */}
          {activeBar && (() => {
            const badgeText = safeFormatNumber(activeBar.totalToa);
            const badgeWidth = Math.max(54, badgeText.length * 8 + 18);
            const halfWidth = badgeWidth / 2;
            const clampedX = Math.min(
              Math.max(activeBar.x + barWidth / 2, halfWidth + 4),
              chartWidth - halfWidth - 4,
            );
            const clampedY = Math.max(activeBar.y - 24, 16);

            return (
              <g
                transform={`translate(${clampedX}, ${clampedY})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTooltipDay(null);
                  onSelectTab?.(activeBar.day);
                }}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={-halfWidth}
                  y="-13"
                  width={badgeWidth}
                  height="21"
                  rx="7"
                  fill="#1d4ed8"
                  stroke="#60a5fa"
                  strokeWidth="1.5"
                  filter={`url(#${idPrefix}pillGlow)`}
                />
                <polygon points="0,10 -4,8 4,8" fill="#1d4ed8" />
                <text
                  x="0"
                  y="1.5"
                  fontSize="10"
                  fontWeight="800"
                  fill="#ffffff"
                  textAnchor="middle"
                >
                  {badgeText}
                </text>
              </g>
            );
          })()}

          {/* Render X-Axis Date Labels */}
          {bars.map((bar) => {
            const isFirst = bar.dayNum === 1;
            const isLast = bar.dayNum === N;
            const showLabel =
              bar.isSelected ||
              bar.isGlobalTab ||
              isFirst ||
              isLast ||
              (N > 15 ? bar.dayNum % 5 === 0 : bar.dayNum % 2 === 1);

            if (!showLabel) return null;

            return (
              <text
                key={`label-${bar.day}`}
                x={bar.x + barWidth / 2}
                y={chartHeight - 4}
                fontSize="9"
                fontWeight={bar.isSelected || bar.isGlobalTab ? 700 : 400}
                fill={
                  bar.isSelected
                    ? "#60a5fa"
                    : bar.isGlobalTab
                      ? "var(--orange-color)"
                      : "var(--text-secondary)"
                }
                textAnchor="middle"
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTooltipDay((prev) =>
                    prev === bar.day ? null : bar.day,
                  );
                }}
              >
                {bar.day}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export const DailyToaTrendCard = memo(DailyToaTrendCardComponent);
