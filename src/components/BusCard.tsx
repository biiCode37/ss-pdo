import { useState, useEffect, memo } from "react";
import type { BusData, HeaderMap } from "../services/googleSheets";
import { updateBusData, getBusRowData } from "../services/googleSheets";
import { isNetworkError } from "../hooks/useOfflineSync";
import { formatUserError } from "../utils/errorFormatter";
import { slugifyUnitId } from "../utils/analytics";
import { FormattedNoteText } from "./FormattedNoteText";
import { parseIndonesianNumber, safeFormatNumber, normalizeFieldValue } from "../utils/numberUtils";
import { mergeRemoteBusDataWithLocalUpdates } from "../utils/conflictMerge";
import {
  showErrorToast,
  showInfoToast,
  showWarningToast,
  showBusInputModal,
  showQueueConflictDialog,
  escapeHtml,
  pdoSwal,
} from "../utils/alertUtils";
import { getSatsetMode } from "../utils/modals/busInputModal";
import { TEXT_DASHBOARD } from "../constants/texts";
import {
  AlertTriangle,
  Navigation,
  Users,
  AlertCircle,
  Loader2,
  ArrowRightLeft,
} from "lucide-react";

interface Props {
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
}

function BusCardComponent({
  bus,
  sheetId,
  tabName,
  headerMap,
  isQueued,
  addToQueue,
  activeCategory,
  targetTrip,
  onUpdateBus,
  onSaveAndNext,
}: Props) {
  const [formData, setFormData] = useState<Partial<BusData>>({
    toaShift1: bus.toaShift1 || "",
    manualShift1: bus.manualShift1 || "",
    manualShift2: bus.manualShift2 || "",
    totalToa: bus.totalToa || "",
    kmAwal1: bus.kmAwal1 || "",
    kmAkhir1: bus.kmAkhir1 || "",
    kmAwal2: bus.kmAwal2 || "",
    kmAkhir2: bus.kmAkhir2 || "",
    tripPergi: bus.tripPergi || "",
    tripPulang: bus.tripPulang || "",
    keterangan: bus.keterangan || "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "queued">(
    "idle",
  );

  // Sync formData when bus prop updates
  useEffect(() => {
    setFormData({
      toaShift1: bus.toaShift1 || "",
      manualShift1: bus.manualShift1 || "",
      manualShift2: bus.manualShift2 || "",
      totalToa: bus.totalToa || "",
      kmAwal1: bus.kmAwal1 || "",
      kmAkhir1: bus.kmAkhir1 || "",
      kmAwal2: bus.kmAwal2 || "",
      kmAkhir2: bus.kmAkhir2 || "",
      tripPergi: bus.tripPergi || "",
      tripPulang: bus.tripPulang || "",
      keterangan: bus.keterangan || "",
    });
  }, [bus]);

  const handleSaveUpdates = async (
    updates: Partial<BusData>,
    forceOverwrite = false,
  ) => {
    if (tabName === "AKUMULASI") return;

    // 1. Optimistic Update Instan di UI (0 ms latency)
    const mergedData = { ...formData, ...updates };
    setFormData(mergedData);
    // BUG-62: Jangan tandai 'success' sebelum tersimpan — biarkan netral
    // hingga hasil aktual (sukses / queued / error) diketahui.
    if (onUpdateBus) {
      onUpdateBus(mergedData);
    }

    // 2. Jika Mode Satset aktif, langsung picu navigasi ke bus berikutnya
    if (getSatsetMode() && onSaveAndNext) {
      onSaveAndNext({ ...bus, ...mergedData });
    }

    // 3. Sinkronisasi ke Google Sheets di Background (Non-blocking)
    setIsLoading(true);
    try {
      if (!forceOverwrite) {
        const remoteData = await getBusRowData(
          sheetId,
          tabName,
          bus.rowIndex,
          headerMap,
        );

        // BUG-12 (revisied): Compare ONLY the fields the user is actually updating.
        // Previously checked all 10 columns → false positive collision when other fields changed.
        const fieldsToCheck = Object.keys(updates) as (keyof BusData)[];

        let hasCollision = false;
        for (const field of fieldsToCheck) {
          const remoteNorm = normalizeFieldValue(remoteData[field]);
          const localBaseNorm = normalizeFieldValue(bus[field]);
          if (remoteNorm !== localBaseNorm) {
            hasCollision = true;
            break;
          }
        }

        if (hasCollision) {
          setIsLoading(false);
          showQueueConflictDialog({
            unitName: bus.unit,
            onUseServer: () => {
              const mergedUpdates = mergeRemoteBusDataWithLocalUpdates(
                remoteData,
                updates,
              );
              handleSaveUpdates(mergedUpdates, true);
            },
            onForceSave: () => {
              handleSaveUpdates(updates, true);
            },
          });
          return;
        }
      }

      // BUG-11: Apply success status only after API succeeds
      try {
        await updateBusData(
          sheetId,
          tabName,
          bus.rowIndex,
          updates,
          headerMap,
          bus,
        );
        setSaveStatus("success");
      } catch (apiErr) {
        // Mark failure; existing catch below will queue if network
        setSaveStatus("idle");
        const formattedErr = formatUserError(apiErr, TEXT_DASHBOARD.BUS_CARD_ACTIONS.SAVE_FAILED);
        if (formattedErr) {
          showErrorToast(formattedErr);
        }
        throw apiErr;
      }
    } catch (err: any) {
      if (isNetworkError(err)) {
        const originalSnapshot: Partial<BusData> = {};
        for (const field of Object.keys(updates) as (keyof BusData)[]) {
          (originalSnapshot as any)[field] = bus[field];
        }
        addToQueue({
          sheetId,
          tabName,
          rowIndex: bus.rowIndex,
          updates,
          headerMap,
          originalSnapshot,
        });
        setSaveStatus("queued");
        showInfoToast(TEXT_DASHBOARD.BUS_CARD_ACTIONS.SAVED_TO_OFFLINE_QUEUE(escapeHtml(bus.unit)));
      } else {
        setSaveStatus("idle");
        const formattedErr = formatUserError(
          err,
          TEXT_DASHBOARD.BUS_CARD_ACTIONS.SAVE_FAILED,
        );
        if (formattedErr) {
          showErrorToast(formattedErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = async (
    initialTab?: "shift1" | "shift2" | "trip" | "notes",
  ) => {
    if (tabName === "AKUMULASI") {
      showWarningToast(TEXT_DASHBOARD.BUS_LIST.ACCUMULATION_LOCKED);
      return;
    }

    const currentKet = (formData.keterangan || bus.keterangan || "").trim();
    const upperKet = currentKet.toUpperCase();
    const isNonSgo = upperKet.includes("OFF") || upperKet.includes("TO");

    let activeFormData = { ...formData };

    // Opsi B: Konfirmasi ramah non-blocking jika unit berstatus OFF atau TO
    if (isNonSgo) {
      const confirmResult = await pdoSwal.fire({
        icon: "question",
        title: TEXT_DASHBOARD.BUS_CARD_ACTIONS.SGO_CONFIRM_TITLE,
        html: TEXT_DASHBOARD.BUS_CARD_ACTIONS.SGO_CONFIRM_HTML(escapeHtml(bus.unit), escapeHtml(currentKet)),
        showCancelButton: true,
        confirmButtonText: TEXT_DASHBOARD.BUS_CARD_ACTIONS.SGO_CONFIRM_BTN,
        cancelButtonText: TEXT_DASHBOARD.BUS_CARD_ACTIONS.SGO_CANCEL_INPUT_BTN,
        showDenyButton: true,
        denyButtonText: TEXT_DASHBOARD.BUS_CARD_ACTIONS.SGO_DENY_BTN,
        confirmButtonColor: "#3ECF8E",
        cancelButtonColor: "#38bdf8",
        denyButtonColor: "#71717a",
      });

      if (confirmResult.isDenied || confirmResult.isDismissed) {
        return; // Batal
      }

      if (confirmResult.isConfirmed) {
        // Jadikan SGO & simpan update keterangan kosong
        activeFormData = { ...activeFormData, keterangan: "" };
        await handleSaveUpdates({ keterangan: "" });
      }
    }

    const updates = await showBusInputModal({
      bus: { ...bus, ...activeFormData },
      activeCategory,
      tabName,
      headerMap,
      initialTab,
    });

    if (updates) {
      await handleSaveUpdates(updates);
    }
  };

  const renderServerSummary = () => {
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
      if (activeCategory === "trip") {
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
      const isAccumulation = tabName.toUpperCase() === "AKUMULASI";
      const categoryLabels: Record<string, string> = {
        toaShift1: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.TOA_S1,
        totalToa: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.TOTAL_TOA,
        manualShift1: "Manual S1",
        manualShift2: "Manual S2",
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

    if (!hasKm && !hasPnp && !hasTrip) {
      return (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: "8px",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            color: "var(--danger-color)",
          }}
        >
          {TEXT_DASHBOARD.BUS_CARD_ACTIONS.EMPTY_BADGE}
        </span>
      );
    }

    return (
      <div
        className="tabular-nums"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "clamp(5px, 1.2vw, 8px)",
          fontSize: "12px",
          padding: "3px 8px",
          borderRadius: "10px",
          background: "var(--input-bg, rgba(255, 255, 255, 0.04))",
          border: "1px solid var(--card-border)",
        }}
      >
        {/* Interactive Trip Shortcut */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenModal("trip");
          }}
          className="bus-card-badge-trip"
          title={tripStatusTitle}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            background: "transparent",
            border: "none",
            cursor: tabName === "AKUMULASI" ? "default" : "pointer",
            fontWeight: 700,
            fontSize: "11.5px",
            color: isBelowTarget || isImbalanced
              ? "var(--warning-text, #f59e0b)"
              : isTargetAchieved || (hasTrip && !hasTarget)
              ? "var(--success-color, #10b981)"
              : "var(--text-secondary)",
            padding: "2px 4px",
            borderRadius: "6px",
          }}
        >
          <ArrowRightLeft size={11} style={{ flexShrink: 0, opacity: 0.85 }} />
          <span>
            {isBelowTarget
              ? `⚠️ ${pergiVal || 0}/${pulangVal || 0}`
              : `${pergiVal || 0}/${pulangVal || 0}`}
          </span>
        </button>

        <span style={{ opacity: 0.25, color: "var(--text-secondary)" }}>•</span>

        {/* KM Readout */}
        <span
          style={{
            fontWeight: 600,
            fontSize: "11.5px",
            color: "var(--shift1-color)",
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
          }}
        >
          <Navigation size={11} style={{ opacity: 0.85, flexShrink: 0 }} />
          <span>{totalKm > 0 ? `${safeFormatNumber(totalKm)} ${TEXT_DASHBOARD.BUS_CARD_ACTIONS.KM_UNIT}` : `0 ${TEXT_DASHBOARD.BUS_CARD_ACTIONS.KM_UNIT}`}</span>
        </span>

        <span style={{ opacity: 0.25, color: "var(--text-secondary)" }}>•</span>

        {/* Pnp Readout */}
        <span
          style={{
            fontWeight: 600,
            fontSize: "11.5px",
            color: "var(--text-primary)",
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
          }}
        >
          <Users size={11} style={{ color: "var(--text-secondary)", opacity: 0.85, flexShrink: 0 }} />
          <span>{totalPnp > 0 ? `${safeFormatNumber(totalPnp)} ${TEXT_DASHBOARD.BUS_CARD_ACTIONS.PNP_UNIT}` : `0 ${TEXT_DASHBOARD.BUS_CARD_ACTIONS.PNP_UNIT}`}</span>
        </span>
      </div>
    );
  };

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
    cardHasTarget && cardHasTrip && (cardPergiNum < cardTargetP || cardPulangNum < cardTargetQ);
  const cardIsTargetAchieved =
    cardHasTarget && cardHasTrip && cardPergiNum >= cardTargetP && cardPulangNum >= cardTargetQ;

  const hasWarning =
    !hasKendala &&
    (ketLower.includes("cadangan") ||
      ketLower.includes("bko") ||
      cardIsBelowTarget);

  const statusClass = hasKendala
    ? "status-kendala"
    : hasWarning
    ? "status-warning"
    : cardIsTargetAchieved
    ? "status-achieved"
    : "";

  return (
    <div
      id={`bus-card-${slugifyUnitId(bus.unit)}`}
      data-bus-row={bus.rowIndex}
      className={`bus-card glass ${statusClass}`.trim()}
      onClick={() => handleOpenModal()}
      style={{
        cursor: tabName === "AKUMULASI" ? "default" : "pointer",
        transition: "all 0.18s var(--ease-spring)",
      }}
    >
        <div
          className="bus-card-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 800, fontSize: "16px" }}>{bus.unit}</span>
            {(saveStatus === "queued" || isQueued) && (
              <span className="bus-card-status status-queued">
                {TEXT_DASHBOARD.BUS_CARD_ACTIONS.WAITING_SIGNAL}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {renderServerSummary()}
            {isLoading && (
              <Loader2
                size={14}
                className="spinner"
                style={{ color: "var(--accent-color)", flexShrink: 0 }}
              />
            )}
          </div>
        </div>

        {formData.keterangan && formData.keterangan.trim() !== "" && (
          <div
            style={{
              margin: "0 16px 14px 16px",
              fontSize: "12px",
              color: "var(--warning-text)",
              fontWeight: 600,
              letterSpacing: "0.01em",
              display: "flex",
              gap: "8px",
              alignItems: "flex-start",
            }}
          >
            <AlertTriangle
              size={14}
              style={{
                color: "var(--orange-color)",
                flexShrink: 0,
                marginTop: "2px",
              }}
            />
            <div
              style={{
                flex: 1,
                lineHeight: "1.4",
                wordBreak: "break-word",
                textTransform: "uppercase",
              }}
            >
              <FormattedNoteText text={formData.keterangan} />
            </div>
          </div>
        )}
      </div>
  );
}

export const BusCard = memo(BusCardComponent);
