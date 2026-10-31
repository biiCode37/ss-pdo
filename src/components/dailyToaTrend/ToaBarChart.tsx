import React from "react";
import { Award, TrendingDown } from "lucide-react";
import { safeFormatNumber } from "@/utils/numberUtils";
import type { TrendChartMetrics } from "./types";

interface ToaBarChartProps {
  idPrefix: string;
  chartMetrics: TrendChartMetrics;
  onBarClick: (day: string) => void;
  onSelectTab?: (tab: string) => void;
}

export const ToaBarChart: React.FC<ToaBarChartProps> = ({
  idPrefix,
  chartMetrics,
  onBarClick,
  onSelectTab,
}) => {
  const {
    N,
    paddingX,
    maxBarHeight,
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
          {/* Active Highlighted Tapped Pill Bar Gradient (High-Contrast Electric Blue) */}
          <linearGradient
            id={`${idPrefix}activePillGradient`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
          </linearGradient>

          {/* Increase Trend Pill Bar Gradient (Emerald Green - Fully Opaque) */}
          <linearGradient
            id={`${idPrefix}upPillGradient`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#4ade80" stopOpacity="1" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.85" />
          </linearGradient>

          {/* Slight Decrease Pill Bar Gradient (Coral / Amber Red - Fully Opaque) */}
          <linearGradient
            id={`${idPrefix}slightDownPillGradient`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#fb923c" stopOpacity="1" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.85" />
          </linearGradient>

          {/* Drastic Decrease Pill Bar Gradient (Deep Crimson Red - Fully Opaque) */}
          <linearGradient
            id={`${idPrefix}drasticDownPillGradient`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#f87171" stopOpacity="1" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.85" />
          </linearGradient>

          {/* Glowing Drop Shadow Filter for Active Tapped Bar */}
          <filter
            id={`${idPrefix}pillGlow`}
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
          >
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="3"
              floodColor="#0284c7"
              floodOpacity="0.45"
            />
          </filter>
        </defs>

        {/* Subtle Grid Lines */}
        <line
          x1={paddingX}
          y1={24}
          x2={chartWidth - paddingX}
          y2={24}
          stroke="var(--color-border-subtle, rgba(255, 255, 255, 0.08))"
          strokeDasharray="3 3"
          opacity="0.4"
        />
        <line
          x1={paddingX}
          y1={24 + maxBarHeight / 2}
          x2={chartWidth - paddingX}
          y2={24 + maxBarHeight / 2}
          stroke="var(--color-border-subtle, rgba(255, 255, 255, 0.08))"
          strokeDasharray="3 3"
          opacity="0.4"
        />
        <line
          x1={paddingX}
          y1={chartHeight - 20}
          x2={chartWidth - paddingX}
          y2={chartHeight - 20}
          stroke="var(--color-border-control, rgba(255, 255, 255, 0.15))"
          strokeWidth="1"
          opacity="0.5"
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
                onBarClick(bar.day);
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
                stroke={bar.isSelected ? "var(--color-text-primary)" : "none"}
                strokeWidth={bar.isSelected ? 1.5 : 0}
                filter={bar.isSelected ? `url(#${idPrefix}pillGlow)` : undefined}
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
              onBarClick(peakBar.day);
            }}
          >
            <Award
              size={12}
              style={{
                color: "var(--color-success-fg, #22c55e)",
                filter: "drop-shadow(0px 1px 2px rgba(34,197,94,0.4))",
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
                onBarClick(lowestBar.day);
              }}
            >
              <TrendingDown
                size={12}
                style={{
                  color: "var(--color-error-fg, #ef4444)",
                  filter: "drop-shadow(0px 1px 2px rgba(244,63,94,0.4))",
                }}
              />
            </g>
          )}

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
                onBarClick(activeBar.day);
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
                fill="var(--color-surface-raised)"
                stroke="var(--color-shift-1-fg)"
                strokeWidth="1.5"
                filter={`url(#${idPrefix}pillGlow)`}
              />
              <polygon points="0,10 -4,8 4,8" fill="var(--color-surface-raised)" />
              <text
                x="0"
                y="1.5"
                fontSize="10"
                fontWeight="800"
                fill="var(--color-text-primary)"
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
              fontWeight={bar.isSelected || bar.isGlobalTab ? 700 : 500}
              fill={
                bar.isSelected
                  ? "var(--color-shift-1-fg)"
                  : bar.isGlobalTab
                    ? "var(--color-shift-1-fg)"
                    : "var(--color-text-secondary)"
              }
              textAnchor="middle"
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                onBarClick(bar.day);
              }}
            >
              {bar.day}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
