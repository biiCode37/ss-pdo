import type { BusData } from "@/services/googleSheets";
import { parseIndonesianNumber, safeFormatNumber } from "@/utils/numberUtils";
import { TEXT_DASHBOARD } from "@/constants/texts";
import {
  Navigation,
  AlertCircle,
  ArrowRightLeft,
} from "lucide-react";
import { isUnitOff, isUnitTo, isUnitOffOrToEvdal } from "@/utils/keteranganUtils";

interface BusCardSummaryProps {
  formData: Partial<BusData>;
  bus: BusData;
  tabName: string;
  activeCategory: string;
  targetTrip?: { pergi: number; pulang: number } | null;
  activeShiftStatus?: string;
  onOpenTripModal: () => void;
}

export function BusCardSummary({
  formData,
  bus,
  tabName,
  activeCategory,
  targetTrip,
  activeShiftStatus,
  onOpenTripModal,
}: BusCardSummaryProps) {
  const toaShift1Num = parseIndonesianNumber(
    formData.toaShift1 || bus.toaShift1,
  );
  const totalToaNum = parseIndonesianNumber(
    formData.totalToa || bus.totalToa,
  );
  const manual1Num = parseIndonesianNumber(
    formData.manualShift1 || bus.manualShift1,
  );
  const manual2Num = parseIndonesianNumber(
    formData.manualShift2 || bus.manualShift2,
  );

  const totalToa = totalToaNum > 0 ? totalToaNum : toaShift1Num;
  const totalPnp = totalToa + manual1Num + manual2Num;

  const kmA1 = parseIndonesianNumber(formData.kmAwal1 || bus.kmAwal1);
  const kmAk1 = parseIndonesianNumber(formData.kmAkhir1 || bus.kmAkhir1);
  const kmS1 = kmAk1 > kmA1 ? kmAk1 - kmA1 : 0;

  const kmA2 = parseIndonesianNumber(formData.kmAwal2 || bus.kmAwal2);
  const kmAk2 = parseIndonesianNumber(formData.kmAkhir2 || bus.kmAkhir2);
  const kmS2 = kmAk2 > kmA2 ? kmAk2 - kmA2 : 0;

  const totalKm = kmS1 + kmS2;
  const hasKm = totalKm > 0;
  const hasPnp = totalPnp > 0;

  const pergiVal = formData.tripPergi ?? bus.tripPergi;
  const pulangVal = formData.tripPulang ?? bus.tripPulang;
  const hasPergi = Boolean(pergiVal && String(pergiVal).trim() !== "");
  const hasPulang = Boolean(pulangVal && String(pulangVal).trim() !== "");
  const hasTrip = hasPergi || hasPulang;
  const pergiNum = parseIndonesianNumber(pergiVal, 0);
  const pulangNum = parseIndonesianNumber(pulangVal, 0);

  const targetP = targetTrip ? targetTrip.pergi : 0;
  const targetQ = targetTrip ? targetTrip.pulang : 0;
  const hasTarget = targetP > 0 && targetQ > 0;

  // Evaluasi apakah mencapai target atau berada di bawah target ritase rute
  const isBelowTarget = hasTarget && hasTrip && (pergiNum < targetP || pulangNum < targetQ);
  const isTargetAchieved = hasTarget && hasTrip && pergiNum >= targetP && pulangNum >= targetQ;
  const isImbalanced = hasTrip && (pergiVal !== pulangVal || isBelowTarget);

  const tripStatusTitle = isBelowTarget
    ? TEXT_DASHBOARD.BUS_CARD_ACTIONS.RITASE_DEFICIT_TOOLTIP(pergiVal || 0, pulangVal || 0, targetP, targetQ)
    : isTargetAchieved
    ? TEXT_DASHBOARD.BUS_CARD_ACTIONS.FULL_TARGET_TOOLTIP(pergiVal || 0, pulangVal || 0, targetP, targetQ)
    : hasTarget
    ? TEXT_DASHBOARD.BUS_CARD_ACTIONS.RITASE_TARGET_TOOLTIP(targetP, targetQ)
    : TEXT_DASHBOARD.BUS_CARD_ACTIONS.DEFAULT_TRIP_TITLE;

  // Mode Spesifik Kolom Aktif (selain ALL)
  if (activeCategory !== "ALL") {
    const isCurrentShiftOffOrTo = activeShiftStatus !== undefined
      ? (isUnitOff(activeShiftStatus) || isUnitTo(activeShiftStatus))
      : isUnitOffOrToEvdal(formData.keterangan || bus.keterangan);

    if (activeCategory === "trip") {
      // Jika unit berstatus OFF atau T.O dan tidak ada trip, sembunyikan badge "Trip: Kosong" (redundant & pemborosan space)
      if (!hasTrip && isCurrentShiftOffOrTo) {
        return null;
      }
      return (
        <div
          style={{
            fontSize: "11.5px",
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: "8px",
            backgroundColor: isBelowTarget || isImbalanced
              ? "rgba(245, 158, 11, 0.12)"
              : isTargetAchieved || (hasTrip && !hasTarget)
              ? "rgba(16, 185, 129, 0.12)"
              : "rgba(239, 68, 68, 0.12)",
            color: isBelowTarget || isImbalanced
              ? "var(--warning-text, #f59e0b)"
              : isTargetAchieved || (hasTrip && !hasTarget)
              ? "#10b981"
              : "var(--danger-color)",
            border: `1px solid ${
              isBelowTarget || isImbalanced
                ? "rgba(245, 158, 11, 0.3)"
                : isTargetAchieved || (hasTrip && !hasTarget)
                ? "rgba(16, 185, 129, 0.25)"
                : "rgba(239, 68, 68, 0.25)"
            }`,
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <ArrowRightLeft size={12} style={{ flexShrink: 0 }} />
          <span>
            Trip:{" "}
            {isBelowTarget
              ? TEXT_DASHBOARD.BUS_CARD_ACTIONS.TRIP_BADGE_DEFICIT(pergiVal || 0, pulangVal || 0)
              : isTargetAchieved
              ? TEXT_DASHBOARD.BUS_CARD_ACTIONS.TRIP_BADGE_ACHIEVED(pergiVal || 0, pulangVal || 0)
              : hasTrip
              ? TEXT_DASHBOARD.BUS_CARD_ACTIONS.TRIP_BADGE_NORMAL(pergiVal || 0, pulangVal || 0)
              : TEXT_DASHBOARD.BUS_CARD_ACTIONS.EMPTY_BADGE}
          </span>
        </div>
      );
    }

    const val = formData[activeCategory as keyof BusData] || bus[activeCategory as keyof BusData];
    const isFilled = val !== undefined && val !== null && String(val).trim() !== "";

    // Jika unit berstatus OFF atau T.O dan field ini kosong, sembunyikan badge "[Label]: Kosong" (redundant & pemborosan space)
    if (!isFilled && isCurrentShiftOffOrTo) {
      return null;
    }

    const isAccumulation = tabName.toUpperCase() === "AKUMULASI";
    const categoryLabels: Record<string, string> = {
      toaShift1: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.TOA_S1,
      totalToa: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.TOTAL_TOA,
      manualShift1: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.MANUAL_S1,
      manualShift2: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.MANUAL_S2,
      kmAwal1: isAccumulation ? `${TEXT_DASHBOARD.BUS_LIST.CATEGORIES.KM_AWAL_1} (Akumulasi)` : TEXT_DASHBOARD.BUS_LIST.CATEGORIES.KM_AWAL_1,
      kmAkhir1: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.KM_AKHIR_1,
      kmAwal2: isAccumulation ? `${TEXT_DASHBOARD.BUS_LIST.CATEGORIES.KM_AWAL_2} (Akumulasi)` : TEXT_DASHBOARD.BUS_LIST.CATEGORIES.KM_AWAL_2,
      kmAkhir2: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.KM_AKHIR_2,
    };
    const label = categoryLabels[activeCategory] || activeCategory;

    return (
      <div
        style={{
          fontSize: "11.5px",
          fontWeight: 700,
          padding: "4px 10px",
          borderRadius: "8px",
          backgroundColor: isFilled ? "var(--shift1-bg)" : "rgba(239, 68, 68, 0.12)",
          color: isFilled ? "var(--shift1-color)" : "var(--danger-color)",
          border: `1px solid ${isFilled ? "var(--shift1-border)" : "rgba(239, 68, 68, 0.25)"}`,
          display: "flex",
          alignItems: "center",
          gap: "5px",
        }}
      >
        {isFilled ? (
          <Navigation size={12} style={{ flexShrink: 0 }} />
        ) : (
          <AlertCircle size={12} style={{ flexShrink: 0 }} />
        )}
        <span>
          {label}: {isFilled ? String(val) : TEXT_DASHBOARD.BUS_CARD_ACTIONS.EMPTY_BADGE}
        </span>
      </div>
    );
  }

  // Mode ALL: Modern 3-Column Glanceable Metric Strip
  return (
    <div className="bus-metric-strip">
      {/* Kolom 1: Ritase (Interactive tap to open Trip Modal) */}
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          if (tabName !== "AKUMULASI") {
            e.stopPropagation();
            onOpenTripModal();
          }
        }}
        onKeyDown={(e) => {
          if (tabName !== "AKUMULASI" && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            e.stopPropagation();
            onOpenTripModal();
          }
        }}
        className={`bus-metric-col ${tabName !== "AKUMULASI" ? "bus-metric-interactive" : ""}`.trim()}
        title={tripStatusTitle}
      >
        <span className="bus-metric-label">
          {TEXT_DASHBOARD.BUS_CARD_ACTIONS.LABEL_RITASE}
        </span>
        <span
          className="bus-metric-value"
          style={{
            color: isBelowTarget || isImbalanced
              ? "var(--warning-text, #f59e0b)"
              : isTargetAchieved || (hasTrip && !hasTarget)
              ? "var(--success-color, #10b981)"
              : "var(--text-primary)",
          }}
        >
          {hasTrip ? (
            <>
              {isBelowTarget && "⚠️ "}
              {pergiVal || 0}/{pulangVal || 0}
              <span className="bus-metric-unit">{TEXT_DASHBOARD.BUS_CARD_ACTIONS.RIT_UNIT}</span>
            </>
          ) : (
            <span className="bus-metric-empty">-</span>
          )}
        </span>
      </div>

      {/* Kolom 2: Total KM Tempuh */}
      <div className="bus-metric-col">
        <span className="bus-metric-label">
          {TEXT_DASHBOARD.BUS_CARD_ACTIONS.LABEL_KM}
        </span>
        <span
          className="bus-metric-value"
          style={{ color: "var(--shift1-color)" }}
        >
          {hasKm ? (
            <>
              {safeFormatNumber(totalKm)}
              <span className="bus-metric-unit">{TEXT_DASHBOARD.BUS_CARD_ACTIONS.KM_UNIT}</span>
            </>
          ) : (
            <span className="bus-metric-empty">-</span>
          )}
        </span>
      </div>

      {/* Kolom 3: Total Pelanggan (TOA + Manual) */}
      <div className="bus-metric-col">
        <span className="bus-metric-label">
          {TEXT_DASHBOARD.BUS_CARD_ACTIONS.LABEL_PASSENGER}
        </span>
        <span
          className="bus-metric-value"
          style={{ color: "var(--text-primary)" }}
        >
          {hasPnp ? (
            <>
              {safeFormatNumber(totalPnp)}
              <span className="bus-metric-unit">{TEXT_DASHBOARD.BUS_CARD_ACTIONS.PNP_UNIT}</span>
            </>
          ) : (
            <span className="bus-metric-empty">-</span>
          )}
        </span>
      </div>
    </div>
  );
}
