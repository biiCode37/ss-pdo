import type { BusData } from "@/services/googleSheets";

export type BrushMode = "SGO" | "OFF" | "TO";

export type StatusMap = Map<number, { s1: string; s2: string }>;

export interface FleetStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeCode: string;
  selectedDate: string; // YYYY-MM-DD
  renopsTarget: number;
  dayLabel?: string;
  buses: BusData[];
  initialShift?: 1 | 2;
  onConfirmStatus: (
    shift: 1 | 2,
    statusMap: StatusMap,
  ) => Promise<void>;
}
