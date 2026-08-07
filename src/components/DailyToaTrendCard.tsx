import { useState, useEffect, useMemo } from "react";
import { safeFormatNumber } from "../utils/numberUtils";
import {
  BarChart2,
  Calendar,
  Award,
  Zap,
  TrendingDown,
} from "lucide-react";
import { getMonthlyToaTrend } from "../services/googleSheets";
import { DailyToaTrendSkeleton } from "./Skeletons";
import { extractMonthYearLabel } from "../utils/analytics";

interface Props {
  sheetId: string;
  selectedTab: string;
  refreshKey?: number;
  monthLabel?: string;
  onSelectTab?: (tab: string) => void;
  unitFilter?: string;
}

export function DailyToaTrendCard({
  sheetId,
  selectedTab,
  refreshKey = 0,
  monthLabel,
  onSelectTab,
  unitFilter,
}: Props) {
  const effectiveMonthLabel = useMemo(() => {
    if (monthLabel) return monthLabel;
    return extractMonthYearLabel(sheetId);
  }, [monthLabel, sheetId]);

  const [trendData, setTrendData] = useState<
    { day: string; totalToa: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTooltipDay, setActiveTooltipDay] = useState<string | null>(null);

  // Track max day for the chart so internal bar/badge clicks don't shrink the chart
  const [chartMaxDay, setChartMaxDay] = useState<number>(() => {
    return Math.max(1, Math.min(31, parseInt(selectedTab, 10) || 1));
  });

  // When sheetId or refreshKey changes (e.g. user clicks "LOAD DATA" in header), reset chartMaxDay to selectedTab
  useEffect(() => {
    const selectedNum = parseInt(selectedTab, 10) || 1;
    setChartMaxDay(Math.max(1, Math.min(31, selectedNum)));
  }, [sheetId, refreshKey]);

  // When selectedTab increases beyond current chartMaxDay, expand chartMaxDay
  useEffect(() => {
    const selectedNum = parseInt(selectedTab, 10) || 1;
    if (selectedNum > chartMaxDay) {
      setChartMaxDay(Math.min(31, selectedNum));
    }
  }, [selectedTab]);

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

    getMonthlyToaTrend(sheetId, chartMaxDay, unitFilter).then((data) => {
      if (isMounted) {
        setTrendData(data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [sheetId, chartMaxDay, unitFilter]);

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
    const peakBar = peakItem ? bars.find((b) => b.day === peakItem.day) : null;
    const lowestBar = lowestItem
      ? bars.find((b) => b.day === lowestItem.day)
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
      peakBar,
      lowestBar,
    };
  }, [trendData, activeTooltipDay, selectedTab]);

  if (isLoading) {
    return <DailyToaTrendSkeleton />;
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
    peakBar,
    lowestBar,
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
        <div className="analytics-card-title">
          <BarChart2 size={18} />
          <span>{unitFilter ? `Grafik TOA Harian (${unitFilter})` : 'Grafik TOA Harian 1 Rute'}</span>
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
        {/* Terbanyak (Max) Card */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)",
            border: "1px solid rgba(34, 197, 94, 0.22)",
            borderRadius: "10px",
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            backdropFilter: "blur(4px)",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <Award size={11} style={{ color: "#4ade80" }} />
            Tertinggi
          </span>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#4ade80",
              lineHeight: "1.2",
            }}
          >
            {peakItem ? safeFormatNumber(peakItem.totalToa) : "0"}
          </span>
          <span style={{ fontSize: "9.5px", color: "var(--text-secondary)" }}>
            Tgl {peakItem ? peakItem.day : "-"}
          </span>
        </div>

        {/* Terendah (Min) Card */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(225, 29, 72, 0.04) 100%)",
            border: "1px solid rgba(244, 63, 94, 0.22)",
            borderRadius: "10px",
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            backdropFilter: "blur(4px)",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <TrendingDown size={11} style={{ color: "#fb7185" }} />
            Terendah
          </span>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#fb7185",
              lineHeight: "1.2",
            }}
          >
            {lowestItem ? safeFormatNumber(lowestItem.totalToa) : "0"}
          </span>
          <span style={{ fontSize: "9.5px", color: "var(--text-secondary)" }}>
            Tgl {lowestItem ? lowestItem.day : "-"}
          </span>
        </div>

        {/* Rata-rata (Avg) Card */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(99, 102, 241, 0.04) 100%)",
            border: "1px solid rgba(59, 130, 246, 0.22)",
            borderRadius: "10px",
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            backdropFilter: "blur(4px)",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <Zap size={11} style={{ color: "#60a5fa" }} />
            Rata-rata
          </span>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#60a5fa",
              lineHeight: "1.2",
            }}
          >
            {safeFormatNumber(avgToa)}
          </span>
          <span style={{ fontSize: "9.5px", color: "var(--text-secondary)" }}>
            Pnp/Hari
          </span>
        </div>
      </div>

      {/* Legend Indicator for Increase, Slight Decrease, Drastic Decrease */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          marginBottom: "6px",
          fontSize: "9px",
          fontWeight: 600,
          color: "var(--text-secondary)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "2px",
              background: "linear-gradient(180deg, #4ade80 0%, #059669 100%)",
            }}
          ></span>
          Naik
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "2px",
              background: "linear-gradient(180deg, #fb923c 0%, #ea580c 100%)",
            }}
          ></span>
          Turun Sedikit
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "2px",
              background: "linear-gradient(180deg, #f43f5e 0%, #991b1b 100%)",
            }}
          ></span>
          Turun Drastis (≥20%)
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
            {/* Active Tapped Pill Bar Gradient (Electric / Royal Blue) */}
            <linearGradient
              id="activeBluePillGradient"
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
            <linearGradient id="upPillGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#22c55e" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.25" />
            </linearGradient>

            {/* Slight Decrease Pill Bar Gradient (Coral / Amber Red) */}
            <linearGradient
              id="slightDownPillGradient"
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
              id="drasticDownPillGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#dc2626" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.3" />
            </linearGradient>

            {/* Glowing Drop Shadow Filter for Active Tapped Blue Bar */}
            <filter
              id="pillBlueGlow"
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feDropShadow
                dx="0"
                dy="2.5"
                stdDeviation="3.5"
                floodColor="#3b82f6"
                floodOpacity="0.75"
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
              ? "url(#activeBluePillGradient)"
              : bar.trendType === "up"
                ? "url(#upPillGradient)"
                : bar.trendType === "slight_down"
                  ? "url(#slightDownPillGradient)"
                  : "url(#drasticDownPillGradient)";

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
                  filter={bar.isSelected ? "url(#pillBlueGlow)" : undefined}
                  className="trend-bar-rect"
                  style={{ animationDelay: `${idx * 16}ms` }}
                />
              </g>
            );
          })}

          {/* Peak Bar Indicator Icon (Award / Green) */}
          {peakBar && (!activeBar || activeBar.day !== peakBar.day) && (
            <g
              transform={`translate(${peakBar.x + barWidth / 2 - 6}, ${Math.max(peakBar.y - 14, 2)})`}
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTooltipDay((prev) =>
                  prev === peakBar.day ? null : peakBar.day,
                );
              }}
            >
              <Award
                size={12}
                style={{
                  color: "#4ade80",
                  filter: "drop-shadow(0px 1px 2px rgba(34,197,94,0.5))",
                }}
              />
            </g>
          )}

          {/* Lowest Bar Indicator Icon (TrendingDown / Rose) */}
          {lowestBar &&
            lowestBar.day !== peakBar?.day &&
            (!activeBar || activeBar.day !== lowestBar.day) && (
              <g
                transform={`translate(${lowestBar.x + barWidth / 2 - 6}, ${Math.max(lowestBar.y - 14, 2)})`}
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTooltipDay((prev) =>
                    prev === lowestBar.day ? null : lowestBar.day,
                  );
                }}
              >
                <TrendingDown
                  size={12}
                  style={{
                    color: "#fb7185",
                    filter: "drop-shadow(0px 1px 2px rgba(244,63,94,0.5))",
                  }}
                />
              </g>
            )}

          {/* Active Day Floating Metric Tooltip Badge */}
          {activeBar && (
            <g
              transform={`translate(${Math.min(Math.max(activeBar.x + barWidth / 2, 52), chartWidth - 52)}, ${Math.max(activeBar.y - 24, 16)})`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTooltipDay(null);
                onSelectTab?.(activeBar.day);
              }}
              style={{ cursor: "pointer" }}
            >
              <rect
                x="-48"
                y="-13"
                width="96"
                height="20"
                rx="6"
                fill="var(--card-bg, #0f172a)"
                stroke="#60a5fa"
                strokeWidth="1.5"
                filter="url(#pillBlueGlow)"
              />
              <polygon points="0,9 -4,7 4,7" fill="#60a5fa" />
              <text
                x="0"
                y="1.5"
                fontSize="9.5"
                fontWeight="700"
                fill="#60a5fa"
                textAnchor="middle"
              >
                Tgl {activeBar.day}:{" "}
                {safeFormatNumber(activeBar.totalToa)} Pnp
              </text>
            </g>
          )}

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
