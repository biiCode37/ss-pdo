import type { BusData, HeaderMap } from "@/services/googleSheets";

export interface BusCardProps {
  bus: BusData;
  sheetId: string;
  tabName: string;
  headerMap: HeaderMap;
  isQueued: boolean;
  addToQueue: (item: any) => void;
  activeCategory: string;
  onUpdateBus?: (updates: Partial<BusData>) => void;
  onSaveAndNext?: (savedBus: BusData) => void;
  isShiftConfirmed?: boolean;
  activeShift?: 1 | 2;
  previousDayKmAkhir2?: string;
  previousDayDateLabel?: string;
  /** Mode pilih unit (Set Trip Terpilih): ketuk kartu = pilih/batal pilih, bukan buka modal. */
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (rowIndex: number) => void;
}
