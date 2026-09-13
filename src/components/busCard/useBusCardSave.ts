import { useState, useEffect } from "react";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import { updateBusData, getBusRowData } from "@/services/googleSheets";
import { isNetworkError } from "@/hooks/useOfflineSync";
import { formatUserError } from "@/utils/errorFormatter";
import { normalizeFieldValue } from "@/utils/numberUtils";
import { mergeRemoteBusDataWithLocalUpdates } from "@/utils/conflictMerge";
import {
  showErrorToast,
  showInfoToast,
  showQueueConflictDialog,
  escapeHtml,
} from "@/utils/alertUtils";
import { getSatsetMode } from "@/utils/modals/busInputModal";
import { TEXT_DASHBOARD } from "@/constants/texts";

interface UseBusCardSaveOptions {
  bus: BusData;
  sheetId: string;
  tabName: string;
  headerMap: HeaderMap;
  addToQueue: (item: any) => void;
  onUpdateBus?: (updates: Partial<BusData>) => void;
  onSaveAndNext?: (savedBus: BusData) => void;
}

export function useBusCardSave({
  bus,
  sheetId,
  tabName,
  headerMap,
  addToQueue,
  onUpdateBus,
  onSaveAndNext,
}: UseBusCardSaveOptions) {
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "queued">("idle");

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

  return {
    formData,
    setFormData,
    isLoading,
    saveStatus,
    handleSaveUpdates,
  };
}
