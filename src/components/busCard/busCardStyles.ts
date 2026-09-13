import type { BusData } from "@/services/googleSheets";
import { parseIndonesianNumber } from "@/utils/numberUtils";

interface BusCardStyleOptions {
  formData: Partial<BusData>;
  bus: BusData;
  targetTrip?: { pergi: number; pulang: number } | null;
  isShiftConfirmed?: boolean;
  isNonSgo: boolean;
}

export function getBusCardStyles({
  formData,
  bus,
  targetTrip,
  isShiftConfirmed,
  isNonSgo,
}: BusCardStyleOptions) {
  // Visual Hierarchy: Left-border status accent stripe (Fase 1 UI Refactor)
  const ketLower = (formData.keterangan || bus.keterangan || "").toLowerCase();
  const hasKendala =
    ketLower.includes("laka") ||
    ketLower.includes("mogok") ||
    ketLower.includes("rusak") ||
    ketLower.includes("batal");

  const cardPergiVal = formData.tripPergi ?? bus.tripPergi;
  const cardPulangVal = formData.tripPulang ?? bus.tripPulang;
  const cardPergiNum = parseIndonesianNumber(cardPergiVal, 0);
  const cardPulangNum = parseIndonesianNumber(cardPulangVal, 0);
  const cardTargetP = targetTrip ? targetTrip.pergi : 0;
  const cardTargetQ = targetTrip ? targetTrip.pulang : 0;
  const cardHasTarget = cardTargetP > 0 && cardTargetQ > 0;
  const cardHasTrip = Boolean(cardPergiVal || cardPulangVal);

  const cardIsBelowTarget =
    cardHasTarget &&
    cardHasTrip &&
    (cardPergiNum < cardTargetP || cardPulangNum < cardTargetQ);
  const cardIsTargetAchieved =
    cardHasTarget &&
    cardHasTrip &&
    cardPergiNum >= cardTargetP &&
    cardPulangNum >= cardTargetQ;

  const hasWarning =
    !hasKendala &&
    (ketLower.includes("cadangan") ||
      ketLower.includes("bko") ||
      cardIsBelowTarget);

  const lockedClass =
    isShiftConfirmed === false
      ? "bus-card-locked"
      : isNonSgo
        ? "bus-card-non-sgo"
        : "";

  const statusClass = hasKendala
    ? "status-kendala"
    : hasWarning
      ? "status-warning"
      : cardIsTargetAchieved
        ? "status-achieved"
        : "";

  return {
    lockedClass,
    statusClass,
    cardIsBelowTarget,
    cardIsTargetAchieved,
  };
}
