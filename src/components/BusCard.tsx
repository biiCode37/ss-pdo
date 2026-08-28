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
} from "../utils/alertUtils";
import { getSatsetMode } from "../utils/modals/busInputModal";
import {
  AlertTriangle,
  Navigation,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface Props {
  bus: BusData;
  sheetId: string;
  tabName: string;
  headerMap: HeaderMap;
  isQueued: boolean;
  addToQueue: (item: any) => void;
  activeCategory: string;
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

        // BUG-12: Compare complete editable row to prevent silent overwrites
        const fieldsToCheck: (keyof BusData)[] = [
          "toaShift1", "toaShift2", "manualShift1", "manualShift2", "totalToa",
          "kmAwal1", "kmAkhir1", "kmAwal2", "kmAkhir2", "keterangan",
        ];

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
        const formattedErr = formatUserError(apiErr, "Gagal menyimpan data bus ke Google Sheets.");
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
        showInfoToast(`Unit ${escapeHtml(bus.unit)} disimpan ke antrean offline`);
      } else {
        setSaveStatus("idle");
        const formattedErr = formatUserError(
          err,
          "Gagal menyimpan data bus ke Google Sheets.",
        );
        if (formattedErr) {
          showErrorToast(formattedErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = async () => {
    if (tabName === "AKUMULASI") {
      showWarningToast("Penginputan dikunci pada mode Rekap Akumulasi.");
      return;
    }

    const updates = await showBusInputModal({
      bus: { ...bus, ...formData },
      activeCategory,
      tabName,
      headerMap,
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

    // Mode Spesifik Kolom Aktif (selain ALL)
    if (activeCategory !== "ALL") {
      const val = formData[activeCategory as keyof BusData] || bus[activeCategory as keyof BusData];
      const isFilled = val !== undefined && val !== null && String(val).trim() !== "";
      const isAccumulation = tabName.toUpperCase() === "AKUMULASI";
      const categoryLabels: Record<string, string> = {
        toaShift1: "TOA S1",
        totalToa: "Total TOA",
        manualShift1: "Manual S1",
        manualShift2: "Manual S2",
        kmAwal1: isAccumulation ? "KM Awal S1 (Akumulasi)" : "KM Awal S1",
        kmAkhir1: "KM Akhir S1",
        kmAwal2: isAccumulation ? "KM Awal S2 (Akumulasi)" : "KM Awal S2",
        kmAkhir2: "KM Akhir S2",
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
            {label}: {isFilled ? String(val) : "Kosong"}
          </span>
        </div>
      );
    }

    if (!hasKm && !hasPnp) {
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
          Kosong
        </span>
      );
    }

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "8px",
            backgroundColor: "var(--shift1-bg)",
            color: "var(--shift1-color)",
            border: "1px solid var(--shift1-border)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Navigation size={12} style={{ flexShrink: 0 }} />
          <span>{totalKm > 0 ? `${safeFormatNumber(totalKm)} KM` : `0 KM`}</span>
        </div>

        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "8px",
            backgroundColor: "var(--input-bg)",
            color: "var(--text-primary)",
            border: "1px solid var(--card-border)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Users size={12} style={{ color: "var(--shift1-color)", flexShrink: 0 }} />
          <span>{totalPnp > 0 ? `${safeFormatNumber(totalPnp)} Pnp` : `0 Pnp`}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      id={`bus-card-${slugifyUnitId(bus.unit)}`}
      data-bus-row={bus.rowIndex}
      className="bus-card glass"
      onClick={handleOpenModal}
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
                Menunggu Sinyal
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
