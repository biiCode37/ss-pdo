import { useState, useEffect, useMemo, useCallback, memo } from "react";
import type { BusData, HeaderMap } from "../services/googleSheets";
import { parseIndonesianNumber } from "../utils/numberUtils";
import { updateBulkBusData } from "../services/googleSheets";
import { BusCard } from "./BusCard";
import {
  Search,
  Filter,
  CheckCircle2,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  showSuccessToast,
  showErrorAlert,
  showWarningToast,
  showBulkTripModal,
  showBulkCopyKmModal,
} from "../utils/alertUtils";
import { getSatsetMode } from "../utils/modals/busInputModal";
import { BusCardSkeleton } from "./Skeletons";
import { detectTargetTrip } from "../utils/unitAnalytics";
import { filterBusesForKmCopy } from "../utils/keteranganUtils";
import { TEXT_DASHBOARD } from "../constants/texts";

import type { SyncItem } from "../hooks/useOfflineSync";

interface Props {
  data: BusData[];
  sheetId: string;
  tabName: string;
  headerMap: HeaderMap;
  syncQueue: SyncItem[];
  addToQueue: (item: Omit<SyncItem, "id" | "status" | "retryCount">) => void;
  isLoading?: boolean;
  onUpdateBus?: (rowIndex: number, updates: Partial<BusData>) => void;
  accRange?: {
    startDay?: number;
    startMonth?: number;
    startYear?: number;
    endDay?: number;
    endMonth?: number;
    endYear?: number;
  } | null;
  onExitAccumulation?: () => void;
}

function BusListComponent({
  data,
  sheetId,
  tabName,
  headerMap,
  syncQueue,
  addToQueue,
  isLoading = false,
  onUpdateBus,
  accRange,
  onExitAccumulation,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyUnfinished, setShowOnlyUnfinished] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [bulkPergi, setBulkPergi] = useState("");
  const [bulkPulang, setBulkPulang] = useState("");
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

  const handleOpenBulkTripModal = async () => {
    if (!data || data.length === 0) return;
    if (tabName === "AKUMULASI") {
      showWarningToast(TEXT_DASHBOARD.BUS_LIST.ACCUMULATION_LOCKED);
      return;
    }

    const result = await showBulkTripModal({
      currentPergi: bulkPergi,
      currentPulang: bulkPulang,
      headerMap,
      unitCount: data.length,
    });

    if (!result) return;

    setBulkPergi(result.tripPergi);
    setBulkPulang(result.tripPulang);

    setIsSubmittingBulk(true);
    const updatesList = data.map((bus) => {
      const isOff =
        bus.keterangan && bus.keterangan.trim().toUpperCase() === "OFF";
      return {
        rowIndex: bus.rowIndex,
        updates: {
          tripPergi: isOff ? "" : result.tripPergi,
          tripPulang: isOff ? "" : result.tripPulang,
        },
      };
    });

    try {
      if (navigator.onLine) {
        await updateBulkBusData(sheetId, tabName, updatesList, headerMap);
      } else {
        data.forEach((bus) => {
          const isOff =
            bus.keterangan && bus.keterangan.trim().toUpperCase() === "OFF";
          addToQueue({
            sheetId,
            tabName,
            rowIndex: bus.rowIndex,
            updates: {
              tripPergi: isOff ? "" : result.tripPergi,
              tripPulang: isOff ? "" : result.tripPulang,
            },
            headerMap,
          });
        });
      }

      if (onUpdateBus) {
        data.forEach((bus) => {
          const isOff =
            bus.keterangan && bus.keterangan.trim().toUpperCase() === "OFF";
          onUpdateBus(bus.rowIndex, {
            tripPergi: isOff ? "" : result.tripPergi,
            tripPulang: isOff ? "" : result.tripPulang,
          });
        });
      }

      showSuccessToast(
        TEXT_DASHBOARD.BUS_LIST.SET_TRIP_SUCCESS(result.tripPergi, result.tripPulang, data.length),
      );
    } catch (err: any) {
      showErrorAlert(
        TEXT_DASHBOARD.BUS_LIST.SET_TRIP_FAILED,
        err.message || TEXT_DASHBOARD.BUS_LIST.SAVE_ERROR_GENERIC,
      );
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  // Menentukan target trip operasional rute saat ini
  const targetTrip = useMemo(() => {
    const manualP = parseIndonesianNumber(bulkPergi, 0);
    const manualQ = parseIndonesianNumber(bulkPulang, 0);
    if (manualP > 0 && manualQ > 0) {
      return { pergi: manualP, pulang: manualQ };
    }

    // ponytail: reuse helper detectTargetTrip terpusat
    return detectTargetTrip(data);
  }, [bulkPergi, bulkPulang, data]);

  // Otomatis sinkronkan bulkPergi & bulkPulang jika masih kosong tapi targetTrip terdeteksi dari data armada
  useEffect(() => {
    if (!bulkPergi && !bulkPulang && targetTrip) {
      setBulkPergi(String(targetTrip.pergi));
      setBulkPulang(String(targetTrip.pulang));
    }
  }, [targetTrip, bulkPergi, bulkPulang]);

  // ponytail: filter unit yang eligible untuk salin KM S1 (lewati yang berketerangan)
  const { availableKmS1Buses, skippedWithNotesCount } = useMemo(() => {
    const { eligibleBuses, skippedWithNotesCount } = filterBusesForKmCopy(data || []);
    return {
      availableKmS1Buses: eligibleBuses,
      skippedWithNotesCount,
    };
  }, [data]);

  const emptyKmAwal2Count = useMemo(() => {
    return availableKmS1Buses.filter(
      (b) => !b.kmAwal2 || String(b.kmAwal2).trim() === "",
    ).length;
  }, [availableKmS1Buses]);

  const handleBulkCopyKmS1 = async () => {
    if (tabName === "AKUMULASI") {
      showWarningToast(TEXT_DASHBOARD.BUS_LIST.ACCUMULATION_LOCKED);
      return;
    }

    if (availableKmS1Buses.length === 0) {
      if (skippedWithNotesCount > 0) {
        showWarningToast(
          TEXT_DASHBOARD.BUS_LIST.COPY_KM_SKIPPED_ALL(skippedWithNotesCount),
        );
      } else {
        showWarningToast(
          TEXT_DASHBOARD.BUS_LIST.COPY_KM_NO_DATA,
        );
      }
      return;
    }

    const mode = await showBulkCopyKmModal({
      totalUnitsWithKmS1: availableKmS1Buses.length,
      emptyKmAwal2Count,
      skippedWithNotesCount,
    });

    if (!mode) return;

    const targetBuses =
      mode === "only_empty"
        ? availableKmS1Buses.filter(
            (b) => !b.kmAwal2 || String(b.kmAwal2).trim() === "",
          )
        : availableKmS1Buses;

    if (targetBuses.length === 0) {
      showWarningToast(TEXT_DASHBOARD.BUS_LIST.COPY_KM_ALL_FILLED);
      return;
    }

    setIsSubmittingBulk(true);
    const updatesList = targetBuses.map((bus) => ({
      rowIndex: bus.rowIndex,
      updates: {
        kmAwal2: bus.kmAkhir1,
      },
    }));

    try {
      if (navigator.onLine) {
        await updateBulkBusData(sheetId, tabName, updatesList, headerMap);
      } else {
        targetBuses.forEach((bus) => {
          addToQueue({
            sheetId,
            tabName,
            rowIndex: bus.rowIndex,
            updates: {
              kmAwal2: bus.kmAkhir1,
            },
            headerMap,
          });
        });
      }

      if (onUpdateBus) {
        targetBuses.forEach((bus) => {
          onUpdateBus(bus.rowIndex, {
            kmAwal2: bus.kmAkhir1,
          });
        });
      }

      const noteSuffix =
        skippedWithNotesCount > 0
          ? ` ${TEXT_DASHBOARD.BUS_LIST.COPY_KM_SKIPPED_TEXT(skippedWithNotesCount)}`
          : "";
      showSuccessToast(
        TEXT_DASHBOARD.BUS_LIST.COPY_KM_SUCCESS(targetBuses.length, noteSuffix),
      );
    } catch (err: any) {
      showErrorAlert(
        TEXT_DASHBOARD.BUS_LIST.COPY_KM_FAILED,
        err.message || TEXT_DASHBOARD.BUS_LIST.SAVE_ERROR_GENERIC,
      );
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const categories = [
    { id: "ALL", label: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.ALL },
    { id: "trip", label: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.TRIP },
    { id: "toaShift1", label: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.TOA_S1 },
    { id: "totalToa", label: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.TOTAL_TOA },
    { id: "kmAwal1", label: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.KM_AWAL_1 },
    { id: "kmAkhir1", label: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.KM_AKHIR_1 },
    { id: "kmAwal2", label: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.KM_AWAL_2 },
    { id: "kmAkhir2", label: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.KM_AKHIR_2 },
  ];

  // Logic selesai bergantung pada kategori yang aktif
  const isBusFilled = useCallback(
    (bus: BusData) => {
      const hasValue = (val: any) =>
        val !== undefined && val !== null && String(val).trim() !== "";
      if (activeCategory === "ALL") {
        return !!(
          hasValue(bus.toaShift1) &&
          hasValue(bus.totalToa) &&
          hasValue(bus.kmAwal1) &&
          hasValue(bus.kmAkhir1) &&
          hasValue(bus.kmAwal2) &&
          hasValue(bus.kmAkhir2)
        );
      } else if (activeCategory === "trip") {
        return hasValue(bus.tripPergi) || hasValue(bus.tripPulang);
      } else {
        return hasValue(bus[activeCategory as keyof BusData]);
      }
    },
    [activeCategory],
  );

  const { filledCount, totalCount, progressPercent } = useMemo(() => {
    const filled = data.filter(isBusFilled).length;
    const total = data.length;
    const percent = total === 0 ? 0 : Math.round((filled / total) * 100);
    return { filledCount: filled, totalCount: total, progressPercent: percent };
  }, [data, isBusFilled]);

  const filteredData = useMemo(() => {
    let result = data;

    if (showOnlyUnfinished) {
      result = result.filter((bus) => !isBusFilled(bus));
    }

    // Sort: Unfinished at the top
    result = [...result].sort((a, b) => {
      const aFilled = isBusFilled(a);
      const bFilled = isBusFilled(b);
      if (aFilled === bFilled) return 0;
      return aFilled ? 1 : -1; // false (0) comes before true (1)
    });

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((bus) =>
        bus.unit.toLowerCase().includes(lowerQuery),
      );
    }

    return result;
  }, [data, searchQuery, showOnlyUnfinished, isBusFilled]);

  // Handler Auto-Next Bus ketika Mode Satset aktif
  const handleSaveAndNext = useCallback(
    (savedBus: BusData) => {
      if (!getSatsetMode()) return;

      // Jeda mikro 120ms agar transisi antar modal terasa sangat mulus
      setTimeout(() => {
        const currentIndex = filteredData.findIndex(
          (b) => b.rowIndex === savedBus.rowIndex,
        );

        // Cari unit berikutnya yang belum terisi di daftar terfilter
        let nextBus = filteredData
          .slice(currentIndex + 1)
          .find((b) => b.rowIndex !== savedBus.rowIndex && !isBusFilled(b));

        // Jika dari posisi saat ini ke bawah sudah terisi semua, cari dari atas daftar
        if (!nextBus) {
          nextBus = filteredData
            .slice(0, currentIndex)
            .find((b) => b.rowIndex !== savedBus.rowIndex && !isBusFilled(b));
        }

        if (nextBus) {
          const nextCardEl = document.querySelector<HTMLElement>(
            `[data-bus-row="${nextBus.rowIndex}"]`,
          );
          if (nextCardEl) {
            nextCardEl.click();
          }
        } else {
          showSuccessToast(TEXT_DASHBOARD.BUS_LIST.ALL_UNITS_FILLED);
        }
      }, 120);
    },
    [filteredData, isBusFilled],
  );

  return (
    <div>
      <div className="sticky-buslist-header">
        {tabName === "AKUMULASI" && (
          <div
            style={{
              background: "rgba(234, 179, 8, 0.15)",
              border: "1px solid rgba(234, 179, 8, 0.4)",
              color: "var(--warning-color, #eab308)",
              padding: "10px 14px",
              borderRadius: "12px",
              fontSize: "12.5px",
              fontWeight: 600,
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
              boxShadow: "0 2px 8px rgba(234, 179, 8, 0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "240px" }}>
              <span style={{ fontSize: "16px" }}>⚠️</span>
              <span>
                Rekap Akumulasi (Tgl{" "}
                {(() => {
                  const sDay = accRange?.startDay ?? 1;
                  const eDay = accRange?.endDay ?? new Date().getDate();
                  if (
                    accRange?.startMonth &&
                    accRange?.endMonth &&
                    (accRange.startMonth !== accRange.endMonth ||
                      accRange.startYear !== accRange.endYear)
                  ) {
                    return `${sDay}/${accRange.startMonth} - ${eDay}/${accRange.endMonth}`;
                  }
                  return `${sDay} - ${eDay}`;
                })()}
                ) aktif. Penginputan dikunci pada mode akumulasi.
              </span>
            </div>
            {onExitAccumulation && (
              <button
                type="button"
                onClick={onExitAccumulation}
                style={{
                  background: "rgba(234, 179, 8, 0.2)",
                  border: "1px solid rgba(234, 179, 8, 0.45)",
                  color: "var(--warning-color, #eab308)",
                  borderRadius: "8px",
                  padding: "5px 12px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Kembali ke Harian ➔
              </button>
            )}
          </div>
        )}

        {/* Hairline Progress Indicator (Ultra-clean, saves vertical space) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "2px 4px 6px 4px",
            fontSize: "12px",
            color: "var(--text-secondary)",
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.1px" }}>
            {activeCategory === "ALL"
              ? "Progres Harian"
              : `Kolom: ${categories.find((c) => c.id === activeCategory)?.label || activeCategory}`}
          </span>
          <span className="tabular-nums" style={{ fontSize: "11.5px" }}>
            <strong style={{ color: filledCount === totalCount ? "var(--success-color)" : "var(--text-primary)" }}>
              {filledCount}
            </strong>
            /{totalCount} Unit ({progressPercent}%)
          </span>
        </div>

        {/* 3px Hairline Progress Bar */}
        <div
          style={{
            height: "3px",
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: "2px",
            overflow: "hidden",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              height: "100%",
              background: filledCount === totalCount ? "var(--success-color)" : "var(--accent-color)",
              width: `${progressPercent}%`,
              transition: "width 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          />
        </div>

        {/* Controls Container: Row 1 (Fokus Kolom + Set Jumlah Trip) & Row 2 (Search + Filter) */}
        {/* Controls Container: Row 1 (Fokus Kolom + Set Jumlah Trip) & Row 2 (Search + Filter) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(6px, 1.5vw, 8px)" }}>
          {/* Row 1: Set Jumlah Trip (Kiri) & Fokus Kolom (Kanan) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "clamp(6px, 1.5vw, 8px)",
              alignItems: "center",
            }}
          >
            {/* Set Jumlah Trip Trigger Button (Kiri) */}
            <button
              type="button"
              onClick={handleOpenBulkTripModal}
              disabled={isSubmittingBulk}
              style={{
                height: "38px",
                padding: "0 12px",
                borderRadius: "11px",
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "12.5px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                whiteSpace: "nowrap",
                cursor: "pointer",
                boxShadow: "none",
                transition: "opacity 0.12s ease",
                opacity: isSubmittingBulk ? 0.7 : 1,
              }}
              title={
                bulkPergi && bulkPulang
                  ? TEXT_DASHBOARD.BUS_LIST.SET_TRIP_WITH_COUNT(bulkPergi, bulkPulang)
                  : TEXT_DASHBOARD.BUS_LIST.SET_TRIP_TITLE
              }
            >
              {isSubmittingBulk && (
                <Loader2
                  size={14}
                  className="spinner"
                  style={{ color: "var(--accent-color)" }}
                />
              )}
              <span style={{ color: "var(--text-primary)" }}>
                {TEXT_DASHBOARD.BUS_LIST.SET_TRIP_BTN}
                {bulkPergi && bulkPulang
                  ? ` (${bulkPergi}/${bulkPulang})`
                  : ""}
              </span>
            </button>

            {/* Dropdown Fokus Kolom (Kanan) */}
            <div style={{ position: "relative", width: "100%", minWidth: 0 }}>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="input-field"
                style={{
                  height: "38px",
                  padding: "0 32px 0 12px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  borderRadius: "11px",
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  width: "100%",
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                }}
              >
                {categories.map((cat) => (
                  <option
                    key={cat.id}
                    value={cat.id}
                    style={{
                      background: "var(--surface-color, #1e293b)",
                      color: "var(--text-primary, #f8fafc)",
                    }}
                  >
                    {cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>

          {/* Row 2: Pencarian & Filter Sisa Unit */}
          <div
            className="search-container"
            style={{ display: "flex", gap: "clamp(6px, 1.5vw, 8px)", margin: 0 }}
          >
            <div className="search-input-wrapper" style={{ flex: 1 }}>
              <Search className="search-icon" size={17} />
              <input
                type="text"
                className="input-field search-input"
                placeholder={TEXT_DASHBOARD.BUS_LIST.SEARCH_PLACEHOLDER}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ height: "38px", fontSize: "13px" }}
              />
            </div>
            <button
              className={`btn ${showOnlyUnfinished ? "" : "btn-outline"}`}
              style={{
                width: "auto",
                padding: "0 12px",
                display: "flex",
                gap: "5px",
                alignItems: "center",
                height: "38px",
                fontSize: "12.5px",
                fontWeight: 600,
                borderRadius: "11px",
                whiteSpace: "nowrap",
              }}
              onClick={() => setShowOnlyUnfinished(!showOnlyUnfinished)}
            >
              {showOnlyUnfinished ? (
                <CheckCircle2 size={15} />
              ) : (
                <Filter size={15} />
              )}
              {showOnlyUnfinished ? TEXT_DASHBOARD.BUS_LIST.FILTER_UNFINISHED : TEXT_DASHBOARD.BUS_LIST.FILTER_BTN}
            </button>
          </div>

          {/* Contextual Action: Bulk Copy KM S1 to KM S2 (Hanya tampil saat tab KM Awal S2 aktif) */}
          {activeCategory === "kmAwal2" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "12px",
                background: "rgba(56, 189, 248, 0.08)",
                border:
                  "1px solid var(--shift1-border, rgba(56, 189, 248, 0.25))",
                animation: "fadeIn 0.2s ease-out forwards",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "6px",
                  flex: "1 1 auto",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color: "var(--shift1-color, #38bdf8)",
                  }}
                >
                  {TEXT_DASHBOARD.BUS_LIST.COPY_KM_READY_COUNT(availableKmS1Buses.length)}
                </span>
                <span>{TEXT_DASHBOARD.BUS_LIST.COPY_KM_READY_TEXT}</span>
                {skippedWithNotesCount > 0 && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--warning-text, #f59e0b)",
                    }}
                  >
                    {TEXT_DASHBOARD.BUS_LIST.COPY_KM_SKIPPED_TEXT(skippedWithNotesCount)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleBulkCopyKmS1}
                disabled={isSubmittingBulk || availableKmS1Buses.length === 0}
                className="swal-copy-km-chip"
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  borderRadius: "8px",
                  cursor:
                    availableKmS1Buses.length === 0 ? "not-allowed" : "pointer",
                  opacity: availableKmS1Buses.length === 0 ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                {TEXT_DASHBOARD.BUS_LIST.COPY_KM_BTN}
              </button>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <BusCardSkeleton count={5} />
      ) : (
        <div className="bus-list">
          {filteredData.length > 0 ? (
            filteredData.map((bus) => (
              <BusCard
                key={bus.rowIndex}
                bus={bus}
                sheetId={sheetId}
                tabName={tabName}
                headerMap={headerMap}
                isQueued={syncQueue.some(
                  (q) =>
                    q.rowIndex === bus.rowIndex &&
                    q.sheetId === sheetId &&
                    q.tabName === tabName,
                )}
                addToQueue={addToQueue}
                activeCategory={activeCategory}
                targetTrip={targetTrip}
                onUpdateBus={
                  onUpdateBus
                    ? (updates) => onUpdateBus(bus.rowIndex, updates)
                    : undefined
                }
                onSaveAndNext={handleSaveAndNext}
              />
            ))
          ) : (
            <div className="empty-state">
              <p>{TEXT_DASHBOARD.BUS_LIST.EMPTY_SEARCH(searchQuery)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const BusList = memo(BusListComponent);
