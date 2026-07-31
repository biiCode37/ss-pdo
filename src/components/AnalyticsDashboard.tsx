import type { BusData } from '../services/googleSheets';
import { calculateAnalytics } from '../utils/analytics';
import { KPICard } from './KPICard';
import { ShiftComparisonCard } from './ShiftComparisonCard';
import { CompletionStatusCard } from './CompletionStatusCard';

interface Props {
  busData: BusData[];
  sheetSummary?: Record<string, number>;
  onSelectUnit?: (unit: string) => void;
}

export function AnalyticsDashboard({ busData, sheetSummary, onSelectUnit }: Props) {
  const summary = calculateAnalytics(busData, sheetSummary);

  return (
    <div className="analytics-container">
      <KPICard summary={summary} />
      <ShiftComparisonCard summary={summary} />
      <CompletionStatusCard summary={summary} onSelectUnit={onSelectUnit} />
    </div>
  );
}
