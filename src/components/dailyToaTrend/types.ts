export interface DailyToaTrendCardProps {
  sheetId: string;
  selectedTab: string;
  refreshKey?: number;
  monthLabel?: string;
  onSelectTab?: (tab: string) => void;
  unitFilter?: string;
}

export type TrendDirection = "up" | "slight_down" | "drastic_down";

export interface TrendItem {
  day: string;
  totalToa: number;
}

export interface TrendBarData {
  day: string;
  dayNum: number;
  totalToa: number;
  x: number;
  y: number;
  barHeight: number;
  isSelected: boolean;
  isGlobalTab: boolean;
  trendType: TrendDirection;
  diffFromPrev: number;
  pctChange: number;
}

export interface TrendChartMetrics {
  N: number;
  paddingX: number;
  maxBarHeight: number;
  maxVal: number;
  avgToa: number;
  peakItem?: TrendItem;
  lowestItem?: TrendItem;
  chartHeight: number;
  chartWidth: number;
  barWidth: number;
  bars: TrendBarData[];
  activeBar: TrendBarData | null;
  peakBar: TrendBarData | null;
  lowestBar: TrendBarData | null;
}
