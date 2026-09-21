import type { BusData } from "@/services/googleSheets";

export type BrushMode = "SGO" | "OFF" | "TO" | "SO";

export type StatusMap = Map<number, { s1: string; s2: string }>;

export interface FleetStatusConfirmationPayload {
  targetRenops: number;
  realops: number;
  sgoCount: number;
  toCount: number;
  offCount: number;
  soCount: number;
  otherCount: number;
  nonSgoUnits: Array<{
    unit_body: string;
    status_id: number;
    status_code: string;
    note: string;
  }>;
}

export interface FleetStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeCode: string;
  selectedDate: string; // YYYY-MM-DD
  renopsTarget: number;
  dayLabel?: string;
  buses: BusData[];
  initialShift?: 1 | 2;
  isConfirmedS1?: boolean;
  isConfirmedS2?: boolean;
  confirmedByS1?: string;
  confirmedByS2?: string;
  confirmedAtS1?: string;
  confirmedAtS2?: string;
  onConfirmStatus: (
    shift: 1 | 2,
    statusMap: StatusMap,
    payload?: FleetStatusConfirmationPayload,
  ) => Promise<void>;
}
