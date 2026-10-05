import { useMemo } from "react";
import type {
  TrendItem,
  TrendChartMetrics,
  TrendBarData,
  TrendDirection,
} from "./types";

export function useTrendMetrics(
  trendData: TrendItem[],
  activeTooltipDay: string | null,
  selectedTab: string,
): TrendChartMetrics | null {
  return useMemo(() => {
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

    const bars: TrendBarData[] = trendData.map((d, idx) => {
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

      let trendType: TrendDirection = "up";
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
      ? bars.find((b) => b.day === activeTooltipDay) || null
      : null;
    const peakBar = peakItem
      ? bars.find((b) => b.day === peakItem.day) || null
      : null;
    const lowestBar = lowestItem
      ? bars.find((b) => b.day === lowestItem.day) || null
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
}
