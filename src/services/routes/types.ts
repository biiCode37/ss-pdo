import type { BusData } from '../googleSheets';

export interface CrossPeriodSummaryResult {
  data: BusData[];
  totalDays: number;
}
