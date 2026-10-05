import type { RegionalMonitoringResult } from "@/services/allRouteMonitoringService";

export type FormatType = "format1" | "format2" | "format3";
export type SupervisorFilter = "ALL" | "RANTO" | "ABDUL" | "MOAMAR";

export interface WaReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  regionalData: RegionalMonitoringResult;
  selectedDate: string;
}
