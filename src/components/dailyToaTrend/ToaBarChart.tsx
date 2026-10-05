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
          <linearGradient
            id={`${idPrefix}upPillGradient`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
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
                onBarClick(lowestBar.day);
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
