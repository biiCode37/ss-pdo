import { useMemo, memo } from "react";
import type { BusData } from "../services/googleSheets";
import { calculateAnalytics, getFormattedDateBadge } from "../utils/analytics";
import { KPICard } from "./KPICard";
import { ShiftComparisonCard } from "./ShiftComparisonCard";
import { CompletionStatusCard } from "./CompletionStatusCard";
import { DailyToaTrendCard } from "./DailyToaTrendCard";

interface Props {
  busData: BusData[];
  sheetSummary?: Record<string, number>;
  sheetId?: string;
  selectedTab?: string;
  refreshKey?: number;
  monthLabel?: string;
  onSelectTab?: (tab: string) => void;
  onSelectUnit?: (unit: string) => void;
  activeMonth?: number;
  activeYear?: number;
  accRange?: {
    startDay?: number;
    startMonth?: number;
    startYear?: number;
    endDay?: number;
    endMonth?: number;
    endYear?: number;
  } | null;
}

function AnalyticsDashboardComponent({
  busData,
  sheetSummary,
  sheetId = "",
  selectedTab = "1",
  refreshKey = 0,
  monthLabel,
  onSelectTab,
  onSelectUnit,
  activeMonth = new Date().getMonth() + 1,
  activeYear = new Date().getFullYear(),
  accRange,
}: Props) {
  const summary = useMemo(
    () =>
      calculateAnalytics(
        busData,
        selectedTab === "AKUMULASI" ? undefined : sheetSummary,
      ),
    [busData, selectedTab, sheetSummary],
  );

  const dateBadge = useMemo(
    () =>
      getFormattedDateBadge(
        selectedTab,
        activeMonth,
        activeYear,
        accRange,
      ),
    [selectedTab, activeMonth, activeYear, accRange],
  );

  return (
    <div className="analytics-container">
      {sheetId && (
        <DailyToaTrendCard
          sheetId={sheetId}
          selectedTab={selectedTab}
          refreshKey={refreshKey}
          monthLabel={monthLabel}
          onSelectTab={onSelectTab}
        />
      )}
      <KPICard summary={summary} dateBadge={dateBadge} />
      <ShiftComparisonCard summary={summary} dateBadge={dateBadge} />
      <CompletionStatusCard
        summary={summary}
        onSelectUnit={onSelectUnit}
        dateBadge={dateBadge}
      />
    </div>
  );
}

export const AnalyticsDashboard = memo(AnalyticsDashboardComponent);
