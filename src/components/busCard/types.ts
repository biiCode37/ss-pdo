import type { BusData, HeaderMap } from "@/services/googleSheets";

export interface BusCardProps {
  bus: BusData;
  sheetId: string;
  tabName: string;
  headerMap: HeaderMap;
  isQueued: boolean;
  addToQueue: (item: any) => void;
  activeCategory: string;
  targetTrip?: { pergi: number; pulang: number } | null;
  onUpdateBus?: (updates: Partial<BusData>) => void;
  onSaveAndNext?: (savedBus: BusData) => void;
  isShiftConfirmed?: boolean;
  activeShift?: 1 | 2;
  onOpenFleetStatus?: () => void;
}
