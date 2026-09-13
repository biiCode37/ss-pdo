import { useState, useEffect, useMemo, useId, memo } from "react";
import { DailyToaTrendSkeleton } from "./Skeletons";
import { extractMonthYearLabel } from "@/utils/analytics";
import { useMonthlyTrendData } from "./dailyToaTrend/useMonthlyTrendData";
import { useTrendMetrics } from "./dailyToaTrend/useTrendMetrics";
import { ToaTrendHeader } from "./dailyToaTrend/ToaTrendHeader";
import { ToaExecutiveStats } from "./dailyToaTrend/ToaExecutiveStats";
import { ToaTrendLegend } from "./dailyToaTrend/ToaTrendLegend";
import { ToaBarChart } from "./dailyToaTrend/ToaBarChart";
import { ToaTrendErrorState } from "./dailyToaTrend/ToaTrendErrorState";
import type { DailyToaTrendCardProps } from "./dailyToaTrend/types";

function DailyToaTrendCardComponent({
  sheetId,
  selectedTab,
  refreshKey = 0,
  monthLabel,
  onSelectTab,
  unitFilter,
}: DailyToaTrendCardProps) {
  const rawId = useId();
  const idPrefix = useMemo(
    () => "toa_" + rawId.replace(/[^a-zA-Z0-9]/g, "") + "_",
    [rawId],
  );

  const effectiveMonthLabel = useMemo(() => {
    if (monthLabel) return monthLabel;
    return extractMonthYearLabel(sheetId);
  }, [monthLabel, sheetId]);

  const [activeTooltipDay, setActiveTooltipDay] = useState<string | null>(null);

  const { trendData, isLoading, hasError } = useMonthlyTrendData(
    sheetId,
    selectedTab,
    refreshKey,
    unitFilter,
  );

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

  const chartMetrics = useTrendMetrics(
    trendData,
    activeTooltipDay,
    selectedTab,
  );

  if (isLoading) {
    return <DailyToaTrendSkeleton />;
  }

  if (hasError) {
    return (
      <ToaTrendErrorState
        effectiveMonthLabel={effectiveMonthLabel}
        unitFilter={unitFilter}
      />
    );
  }

  if (!chartMetrics) return null;

  return (
    <div
      className="analytics-card glass"
      style={{ position: "relative", overflow: "hidden" }}
    >
      <ToaTrendHeader
        effectiveMonthLabel={effectiveMonthLabel}
        unitFilter={unitFilter}
      />

      <ToaExecutiveStats
        peakItem={chartMetrics.peakItem}
        lowestItem={chartMetrics.lowestItem}
        avgToa={chartMetrics.avgToa}
      />

      <ToaTrendLegend />

      <ToaBarChart
        idPrefix={idPrefix}
        chartMetrics={chartMetrics}
        onBarClick={(day) =>
          setActiveTooltipDay((prev) => (prev === day ? null : day))
        }
        onSelectTab={onSelectTab}
      />
    </div>
  );
}

export const DailyToaTrendCard = memo(DailyToaTrendCardComponent);
export default DailyToaTrendCard;
