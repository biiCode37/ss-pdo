import { useState, useMemo } from "react";
import type { BusData, HeaderMap } from "../services/googleSheets";
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
} from "../utils/alertUtils";
import { BusCardSkeleton } from "./Skeletons";

import type { SyncItem } from "../hooks/useOfflineSync";

interface Props {
  data: BusData[];
  sheetId: string;
  tabName: string;
  headerMap: HeaderMap;
  syncQueue: SyncItem[];
  addToQueue: (item: Omit<SyncItem, "id" | "status">) => void;
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
}

export function BusList({
  data,
  sheetId,
  tabName,
  headerMap,
  syncQueue,
  addToQueue,
  isLoading = false,
  onUpdateBus,
  accRange,
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
      showWarningToast("Penginputan dikunci pada mode Rekap Akumulasi.");
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
    const updatesList = data.map((bus) => ({
      rowIndex: bus.rowIndex,
      updates: {
        tripPergi: result.tripPergi,
        tripPulang: result.tripPulang,
      },
    }));

    try {
      if (navigator.onLine) {
        await updateBulkBusData(sheetId, tabName, updatesList, headerMap);
      } else {
        data.forEach((bus) => {
          addToQueue({
            sheetId,
            tabName,
            rowIndex: bus.rowIndex,
            updates: {
              tripPergi: result.tripPergi,
              tripPulang: result.tripPulang,
            },
            headerMap,
            retryCount: 0,
          });
        });
      }

      if (onUpdateBus) {
        data.forEach((bus) => {
          onUpdateBus(bus.rowIndex, {
            tripPergi: result.tripPergi,
            tripPulang: result.tripPulang,
          });
        });
      }

      showSuccessToast(
        `Trip Operasional (${result.tripPergi}/${result.tripPulang}) berhasil disimpan ke Spreadsheet untuk ${data.length} unit!`,
      );
    } catch (err: any) {
      showErrorAlert(
        "Gagal Menyimpan Set Jumlah Trip",
        err.message || "Terjadi kesalahan saat menyimpan data ke spreadsheet.",
      );
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const categories = [
    { id: "ALL", label: "Semua Kolom" },
    { id: "toaShift1", label: "TOA S1" },
    { id: "totalToa", label: "Total TOA" },
    { id: "kmAwal1", label: "KM Awal S1" },
    { id: "kmAkhir1", label: "KM Akhir S1" },
    { id: "kmAwal2", label: "KM Awal S2" },
    { id: "kmAkhir2", label: "KM Akhir S2" },
  ];

  // Logic selesai bergantung pada kategori yang aktif
  const isBusFilled = (bus: BusData) => {
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
    } else {
      return hasValue(bus[activeCategory as keyof BusData]);
    }
  };

  const filledCount = data.filter(isBusFilled).length;
  const totalCount = data.length;
  const progressPercent =
    totalCount === 0 ? 0 : Math.round((filledCount / totalCount) * 100);

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
  }, [data, searchQuery, showOnlyUnfinished, activeCategory]);

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
              gap: "8px",
              boxShadow: "0 2px 8px rgba(234, 179, 8, 0.15)",
            }}
          >
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
              ) aktif. Pilih tanggal harian spesifik untuk menginput data.
            </span>
          </div>
        )}

        <div
          className="progress-section glass"
          style={{ padding: "16px", marginBottom: "12px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <div style={{ fontWeight: "600", fontSize: "14px" }}>
              {activeCategory === "ALL"
                ? "Progres Harian"
                : `Progres Kolom: ${categories.find((c) => c.id === activeCategory)?.label || activeCategory}`}
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              <span
                style={{
                  color:
                    filledCount === totalCount
                      ? "var(--success-color)"
                      : "var(--text-primary)",
                  fontWeight: "bold",
                }}
              >
                {filledCount}
              </span>{" "}
              / {totalCount} Unit
            </div>
          </div>
          <div
            className="progress-bar-bg"
            style={{
              height: "8px",
              background: "rgba(0,0,0,0.1)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              className="progress-bar-fill"
              style={{
                height: "100%",
                background: "var(--accent-color)",
                width: `${progressPercent}%`,
                transition: "width 0.5s ease-out",
              }}
            ></div>
          </div>
        </div>

        {/* Controls Container: Row 1 (Fokus Kolom + Set Jumlah Trip) & Row 2 (Search + Filter) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Row 1: Set Jumlah Trip (Kiri) & Fokus Kolom (Kanan) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "8px",
              alignItems: "center",
            }}
          >
            {/* Set Jumlah Trip Trigger Button (Kiri) */}
            <button
              type="button"
              onClick={handleOpenBulkTripModal}
              disabled={isSubmittingBulk}
              style={{
                height: "40px",
                padding: "0 12px",
                borderRadius: "12px",
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
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
                opacity: isSubmittingBulk ? 0.7 : 1,
              }}
              title={
                bulkPergi && bulkPulang
                  ? `Set Jumlah Trip: Pergi ${bulkPergi} · Pulang ${bulkPulang}`
                  : "Set Jumlah Trip Armada"
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
                Set Jumlah Trip
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
                  height: "40px",
                  padding: "0 34px 0 12px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "12px",
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  width: "100%",
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
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
                size={16}
                style={{
                  position: "absolute",
                  right: "12px",
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
            style={{ display: "flex", gap: "8px", margin: 0 }}
          >
            <div className="search-input-wrapper" style={{ flex: 1 }}>
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="input-field search-input"
                placeholder="Cari No. Body Unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ height: "40px", fontSize: "13.5px" }}
              />
            </div>
            <button
              className={`btn ${showOnlyUnfinished ? "" : "btn-outline"}`}
              style={{
                width: "auto",
                padding: "0 14px",
                display: "flex",
                gap: "6px",
                alignItems: "center",
                height: "40px",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "12px",
                whiteSpace: "nowrap",
              }}
              onClick={() => setShowOnlyUnfinished(!showOnlyUnfinished)}
            >
              {showOnlyUnfinished ? (
                <CheckCircle2 size={16} />
              ) : (
                <Filter size={16} />
              )}
              {showOnlyUnfinished ? "Sisa Unit" : "Filter"}
            </button>
          </div>
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
                onUpdateBus={
                  onUpdateBus
                    ? (updates) => onUpdateBus(bus.rowIndex, updates)
                    : undefined
                }
              />
            ))
          ) : (
            <div className="empty-state">
              <p>Tidak ada unit yang ditemukan dengan nomor "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
