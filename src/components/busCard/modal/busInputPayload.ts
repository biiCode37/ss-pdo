import type { BusData } from "@/services/googleSheets";
import { parseIndonesianNumber } from "@/utils/numberUtils";
import {
  sanitizeKmAwal,
  sanitizeKmAkhir,
} from "@/utils/modals/busInput/busModalOdometer";

export interface BuildBusInputPayloadParams {
  isSingleMode: boolean;
  effectiveCategory: string;
  tripPergi: string;
  tripPulang: string;
  toaShift1: string;
  toaShift2: string;
  totalToa: string;
  manualShift1: string;
  manualShift2: string;
  showManual1: boolean;
  showManual2: boolean;
  kmAwal1: string;
  kmAkhir1: string;
  kmAwal2: string;
  kmAkhir2: string;
  isKmAwal1Valid: boolean;
  isKmAwal2Valid: boolean;
  isKmAwal2Locked: boolean;
  showKmAkhir1InSingle: boolean;
  showKmAkhir2InSingle: boolean;
  keterangan: string;
  showKeterangan: boolean;
  bus: BusData;
  previousDayKmAkhir2?: string;
}

/**
 * Menghitung Total TOA efektif:
 * Pada Mode All, otomatis menghitung jumlah numerik shift 1 + shift 2 jika > 0,
 * atau mempertahankan totalToa manual jika tidak ada penjumlahan shift.
 * Pada Single Mode kategori totalToa, mengembalikan totalToa langsung.
 */
export function computeEffectiveTotalToa(
  toaShift1: string,
  toaShift2: string,
  totalToa: string,
  isSingleMode: boolean,
  effectiveCategory: string,
): string {
  if (isSingleMode && effectiveCategory === "totalToa") {
    return totalToa.trim();
  }
  const toaS1Num = parseIndonesianNumber(toaShift1);
  const toaS2Num = parseIndonesianNumber(toaShift2);
  const finalToaS1 = isNaN(toaS1Num) ? 0 : toaS1Num;
  const finalToaS2 = isNaN(toaS2Num) ? 0 : toaS2Num;
  const computedTotal = finalToaS1 + finalToaS2;
  return computedTotal > 0 ? String(computedTotal) : totalToa.trim();
}

/**
 * Membentuk payload pembaruan data bus (Partial<BusData>) murni.
 * Menerapkan Scoped Updates (hanya kolom yang relevan) pada Single Focus Mode,
 * atau seluruh kolom yang berhak diisi pada Mode All.
 */
export function buildBusInputPayload(params: BuildBusInputPayloadParams): Partial<BusData> {
  const {
    isSingleMode,
    effectiveCategory,
    tripPergi,
    tripPulang,
    toaShift1,
    toaShift2,
    totalToa,
    manualShift1,
    manualShift2,
    showManual1,
    showManual2,
    kmAwal1,
    kmAkhir1,
    kmAwal2,
    kmAkhir2,
    isKmAwal1Valid,
    isKmAwal2Valid,
    isKmAwal2Locked,
    showKmAkhir1InSingle,
    showKmAkhir2InSingle,
    keterangan,
    showKeterangan,
    bus,
    previousDayKmAkhir2,
  } = params;

  const effectiveTotalToa = computeEffectiveTotalToa(
    toaShift1,
    toaShift2,
    totalToa,
    isSingleMode,
    effectiveCategory,
  );

  const updates: Partial<BusData> = {};

  if (isSingleMode) {
    if (
      effectiveCategory === "trip" ||
      effectiveCategory === "tripPergi" ||
      effectiveCategory === "tripPulang"
    ) {
      updates.tripPergi = tripPergi.trim();
      updates.tripPulang = tripPulang.trim();
    } else if (effectiveCategory === "toaShift1") {
      updates.toaShift1 = toaShift1.trim();
      if (showManual1) {
        updates.manualShift1 = manualShift1.trim();
      }
    } else if (effectiveCategory === "totalToa") {
      updates.totalToa = effectiveTotalToa;
      if (showManual2) {
        updates.manualShift2 = manualShift2.trim();
      }
    } else if (effectiveCategory === "kmAwal1") {
      updates.kmAwal1 = sanitizeKmAwal(
        kmAwal1,
        bus.kmAwal1,
        previousDayKmAkhir2,
      );
      if (showKmAkhir1InSingle && isKmAwal1Valid) {
        updates.kmAkhir1 = sanitizeKmAkhir(kmAkhir1, kmAwal1, bus.kmAkhir1);
      }
    } else if (effectiveCategory === "kmAkhir1") {
      if (isKmAwal1Valid) {
        updates.kmAkhir1 = sanitizeKmAkhir(kmAkhir1, kmAwal1, bus.kmAkhir1);
      }
    } else if (effectiveCategory === "kmAwal2") {
      if (!isKmAwal2Locked) {
        updates.kmAwal2 = sanitizeKmAwal(
          kmAwal2,
          bus.kmAwal2,
          previousDayKmAkhir2,
        );
      }
      if (showKmAkhir2InSingle && isKmAwal2Valid) {
        updates.kmAkhir2 = sanitizeKmAkhir(kmAkhir2, kmAwal2, bus.kmAkhir2);
      }
    } else if (effectiveCategory === "kmAkhir2") {
      if (isKmAwal2Valid) {
        updates.kmAkhir2 = sanitizeKmAkhir(kmAkhir2, kmAwal2, bus.kmAkhir2);
      }
    } else if (effectiveCategory === "keterangan") {
      updates.keterangan = keterangan.trim();
    }

    // Jika chip keterangan dibuka pada mode single focus, sertakan keterangan
    if (showKeterangan) {
      updates.keterangan = keterangan.trim();
    }
  } else {
    // Mode All (Semua Kolom): kirim seluruh kolom yang berhak diisi
    updates.tripPergi = tripPergi.trim();
    updates.tripPulang = tripPulang.trim();
    updates.toaShift1 = toaShift1.trim();
    updates.manualShift1 = showManual1 ? manualShift1.trim() : "";
    updates.kmAwal1 = sanitizeKmAwal(
      kmAwal1,
      bus.kmAwal1,
      previousDayKmAkhir2,
    );
    updates.kmAkhir1 = isKmAwal1Valid
      ? sanitizeKmAkhir(kmAkhir1, kmAwal1, bus.kmAkhir1)
      : "";
    updates.toaShift2 = toaShift2.trim();
    updates.manualShift2 = showManual2 ? manualShift2.trim() : "";
    updates.kmAwal2 = !isKmAwal2Locked
      ? sanitizeKmAwal(kmAwal2, bus.kmAwal2, previousDayKmAkhir2)
      : "";
    updates.kmAkhir2 = isKmAwal2Valid
      ? sanitizeKmAkhir(kmAkhir2, kmAwal2, bus.kmAkhir2)
      : "";
    updates.totalToa = effectiveTotalToa;
    updates.keterangan = keterangan.trim();
  }

  return updates;
}
