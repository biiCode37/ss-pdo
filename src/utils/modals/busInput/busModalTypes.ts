import type { BusData, HeaderMap } from "@/services/googleSheets";
import { TEXT_ALERTS } from "@/constants/texts";

export interface BusModalOptions {
  bus: BusData;
  headerMap?: HeaderMap;
  activeCategory?: string; // 'all' | 'ALL' | 'toaShift1' | 'totalToa' | 'kmAwal1' | etc.
  tabName?: string;
  initialTab?: "shift1" | "shift2" | "trip" | "notes";
}

export const SATSET_STORAGE_KEY = "pdo_satset_mode";

/**
 * Mendapatkan status Mode Satset (Auto-Next Bus) dari localStorage
 */
export function getSatsetMode(): boolean {
  try {
    return localStorage.getItem(SATSET_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Menyimpan status Mode Satset ke localStorage
 */
export function setSatsetMode(enabled: boolean): void {
  try {
    localStorage.setItem(SATSET_STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    // Ignore localStorage errors
  }
}

/** Batas maksimal jarak tempuh wajar operasional per shift (KM) */
export const MAX_SHIFT_DISTANCE_KM = 230;

/** Batas maksimal digit/nilai TOA & Manual (maksimal 3 digit angka) */
export const MAX_TOA_VALUE = 999;

/** Batas maksimal ritase trip per hari */
export const MAX_TRIP_COUNT = 20;

/** Batas maksimal toleransi selisih maju (KM) untuk deteksi rollover pergantian kepala angka malam hari */
export const MAX_ROLLOVER_FORWARD_DIFF_KM = 100;

export const SINGLE_COLUMN_META: Record<
  string,
  { label: string; placeholder: string; key: keyof BusData }
> = {
  toaShift1: {
    label: TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S1,
    placeholder: TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.TOA_S1,
    key: "toaShift1",
  },
  totalToa: {
    label: TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOTAL_TOA,
    placeholder: TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.TOTAL_TOA,
    key: "totalToa",
  },
  kmAwal1: {
    label: TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AWAL_S1,
    placeholder: TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AWAL_1,
    key: "kmAwal1",
  },
  kmAkhir1: {
    label: TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AKHIR_S1,
    placeholder: TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AKHIR_1,
    key: "kmAkhir1",
  },
  kmAwal2: {
    label: TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AWAL_S2,
    placeholder: TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AWAL_2,
    key: "kmAwal2",
  },
  kmAkhir2: {
    label: TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AKHIR_S2,
    placeholder: TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.KM_AKHIR_2,
    key: "kmAkhir2",
  },
};
