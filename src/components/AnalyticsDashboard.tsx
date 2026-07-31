import type { BusData } from '../services/googleSheets';
import { calculateAnalytics } from '../utils/analytics';
import { KPICard } from './KPICard';
import { ShiftComparisonCard } from './ShiftComparisonCard';
import { CompletionStatusCard } from './CompletionStatusCard';

interface Props {
  busData: BusData[];
  onSelectUnit?: (unit: string) => void;
}

export function AnalyticsDashboard({ busData, onSelectUnit }: Props) {
  const summary = calculateAnalytics(busData);

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto sm:max-w-xl">
      <KPICard summary={summary} />
      <ShiftComparisonCard summary={summary} />
      <CompletionStatusCard summary={summary} onSelectUnit={onSelectUnit} />
    </div>
  );
}
