import { useState, useEffect, useMemo } from "react";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import { updateBulkBusData } from "@/services/googleSheets";
import { parseIndonesianNumber } from "@/utils/numberUtils";
import { detectTargetTrip } from "@/utils/unitAnalytics";
import { filterBusesForKmCopy, isUnitOffOrToEvdal } from "@/utils/keteranganUtils";
import {
  showSuccessToast,
  showErrorAlert,
  showWarningToast,
  showBulkTripModal,
  showBulkCopyKmModal,
} from "@/utils/alertUtils";
import { TEXT_DASHBOARD } from "@/constants/texts";
import type { SyncItem } from "@/hooks/useOfflineSync";

interface UseBulkOperationsProps {
  data: BusData[];
  sheetId: string;
  tabName: string;
  headerMap: HeaderMap;
  addToQueue: (item: Omit<SyncItem, "id" | "status" | "retryCount">) => void;
  onUpdateBus?: (rowIndex: number, updates: Partial<BusData>) => void;
  isShiftConfirmed?: boolean;
}

export function useBulkOperations({
  data,
  sheetId,
  tabName,
  headerMap,
  addToQueue,
  onUpdateBus,
}: UseBulkOperationsProps) {
  const [bulkPergi, setBulkPergi] = useState("");
  const [bulkPulang, setBulkPulang] = useState("");
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

  // Menentukan target trip operasional rute saat ini
  const targetTrip = useMemo(() => {
    // Mode akumulasi menyajikan akumulasi total lintas hari sehingga perbandingan target ritase harian dinonaktifkan
    if (tabName === "AKUMULASI") return null;

    const manualP = parseIndonesianNumber(bulkPergi, 0);
    const manualQ = parseIndonesianNumber(bulkPulang, 0);
    if (manualP > 0 && manualQ > 0) {
      return { pergi: manualP, pulang: manualQ };
    }

    return detectTargetTrip(data);
  }, [bulkPergi, bulkPulang, data, tabName]);

  // Otomatis sinkronkan bulkPergi & bulkPulang jika masih kosong tapi targetTrip terdeteksi dari data armada
  useEffect(() => {
    if (!bulkPergi && !bulkPulang && targetTrip) {
      setBulkPergi(String(targetTrip.pergi));
      setBulkPulang(String(targetTrip.pulang));
    }
  }, [targetTrip, bulkPergi, bulkPulang]);

  // Filter unit yang eligible untuk salin KM S1 (lewati yang berketerangan)
  const { availableKmS1Buses, skippedWithNotesCount } = useMemo(() => {
    const { eligibleBuses, skippedWithNotesCount: skipped } =
      filterBusesForKmCopy(data || []);
    return {
      availableKmS1Buses: eligibleBuses,
      skippedWithNotesCount: skipped,
    };
  }, [data]);

  const emptyKmAwal2Count = useMemo(() => {
    return availableKmS1Buses.filter(
      (b) => !b.kmAwal2 || String(b.kmAwal2).trim() === "",
    ).length;
  }, [availableKmS1Buses]);

  type TripUpdate = {
    rowIndex: number;
    updates: { tripPergi: string; tripPulang: string };
  };

  /**
   * Menyimpan mutasi trip massal: 1x updateBulkBusData saat online (1 log audit per batch),
   * antrean offline per baris saat offline, lalu perbarui state in-memory.
   * Hanya kolom input trip pergi/pulang yang disentuh (bukan kolom berumus).
   */
  const persistTripUpdates = async (updatesList: TripUpdate[]) => {
    if (navigator.onLine) {
      await updateBulkBusData(sheetId, tabName, updatesList, headerMap);
    } else {
      updatesList.forEach(({ rowIndex, updates }) => {
        addToQueue({ sheetId, tabName, rowIndex, updates, headerMap });
      });
    }
    updatesList.forEach(({ rowIndex, updates }) => onUpdateBus?.(rowIndex, updates));
  };

  const handleOpenBulkTripModal = async () => {
    if (!data || data.length === 0) return;
    if (tabName === "AKUMULASI") {
      showWarningToast(TEXT_DASHBOARD.BUS_LIST.ACCUMULATION_LOCKED);
      return;
    }
    // ponytail: [bulk trip diizinkan saat status armada belum dikonfirmasi]

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
      const isOff = isUnitOffOrToEvdal(bus.keterangan);
      return {
        rowIndex: bus.rowIndex,
        updates: {
          tripPergi: isOff ? "" : result.tripPergi,
          tripPulang: isOff ? "" : result.tripPulang,
        },
      };
    });

    try {
      await persistTripUpdates(updatesList);
      showSuccessToast(
        TEXT_DASHBOARD.BUS_LIST.SET_TRIP_SUCCESS(
          result.tripPergi,
          result.tripPulang,
          data.length,
        ),
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

  /**
   * Set Trip Unit Terpilih: terapkan trip pergi/pulang hanya ke unit pilihan.
   * Unit OFF/TO EVDAL dilewati (tidak diubah). Target rute (bulkPergi/bulkPulang) tidak berubah.
   * Mengembalikan true jika tersimpan agar pemanggil bisa menutup mode pilih.
   */
  const handleApplyTripToSelected = async (selectedBuses: BusData[]): Promise<boolean> => {
    if (selectedBuses.length === 0 || isSubmittingBulk) return false;
    if (tabName === "AKUMULASI") {
      showWarningToast(TEXT_DASHBOARD.BUS_LIST.ACCUMULATION_LOCKED);
      return false;
    }

    const eligible = selectedBuses.filter((bus) => !isUnitOffOrToEvdal(bus.keterangan));
    const skippedCount = selectedBuses.length - eligible.length;
    if (eligible.length === 0) {
      showWarningToast(TEXT_DASHBOARD.BUS_LIST.SELECTED_ALL_SKIPPED);
      return false;
    }

    const result = await showBulkTripModal({
      currentPergi: bulkPergi,
      currentPulang: bulkPulang,
      headerMap,
      unitCount: eligible.length,
      isSelection: true,
      skippedCount,
    });
    if (!result) return false;

    setIsSubmittingBulk(true);
    try {
      await persistTripUpdates(
        eligible.map((bus) => ({
          rowIndex: bus.rowIndex,
          updates: { tripPergi: result.tripPergi, tripPulang: result.tripPulang },
        })),
      );
      // ponytail: 1 Ritase = 2 Trip (PP)
      const ritase = String(
        (parseIndonesianNumber(result.tripPergi, 0) +
          parseIndonesianNumber(result.tripPulang, 0)) / 2,
      );
      showSuccessToast(
        TEXT_DASHBOARD.BUS_LIST.SET_TRIP_SELECTED_SUCCESS(
          result.tripPergi,
          result.tripPulang,
          ritase,
          eligible.length,
        ) +
          (skippedCount > 0
            ? TEXT_DASHBOARD.BUS_LIST.SET_TRIP_SELECTED_SKIPPED(skippedCount)
            : ""),
      );
      return true;
    } catch (err: any) {
      showErrorAlert(
        TEXT_DASHBOARD.BUS_LIST.SET_TRIP_FAILED,
        err.message || TEXT_DASHBOARD.BUS_LIST.SAVE_ERROR_GENERIC,
      );
      return false;
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleBulkCopyKmS1 = async () => {
    if (tabName === "AKUMULASI") {
      showWarningToast(TEXT_DASHBOARD.BUS_LIST.ACCUMULATION_LOCKED);
      return;
    }
    // ponytail: [bulk copy KM S1 diizinkan saat status armada belum dikonfirmasi]

    if (availableKmS1Buses.length === 0) {
      if (skippedWithNotesCount > 0) {
        showWarningToast(
          TEXT_DASHBOARD.BUS_LIST.COPY_KM_SKIPPED_ALL(skippedWithNotesCount),
        );
      } else {
        showWarningToast(TEXT_DASHBOARD.BUS_LIST.COPY_KM_NO_DATA);
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

  return {
    bulkPergi,
    bulkPulang,
    isSubmittingBulk,
    targetTrip,
    availableKmS1Buses,
    emptyKmAwal2Count,
    skippedWithNotesCount,
    handleOpenBulkTripModal,
    handleApplyTripToSelected,
    handleBulkCopyKmS1,
  };
}
