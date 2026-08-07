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

export function AnalyticsDashboard({
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
  const summary = calculateAnalytics(
    busData,
    selectedTab === "AKUMULASI" ? undefined : sheetSummary,
  );

  const dateBadge = getFormattedDateBadge(
    selectedTab,
    activeMonth,
    activeYear,
    accRange,
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
