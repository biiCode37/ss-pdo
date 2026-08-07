import type { BusData } from "../services/googleSheets";
import { calculateAnalytics } from "../utils/analytics";
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
}: Props) {
  const summary = calculateAnalytics(
    busData,
    selectedTab === "AKUMULASI" ? undefined : sheetSummary,
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
      <KPICard summary={summary} />
      <ShiftComparisonCard summary={summary} />
      <CompletionStatusCard summary={summary} onSelectUnit={onSelectUnit} />
    </div>
  );
}
