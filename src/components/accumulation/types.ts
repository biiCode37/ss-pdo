export interface AccumulationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (
    startDay: number,
    startMonth: number,
    startYear: number,
    endDay: number,
    endMonth: number,
    endYear: number,
  ) => void;
  currentMonth?: number;
  currentYear?: number;
  isAccumulationActive?: boolean;
  onResetAccumulation?: () => void;
}
