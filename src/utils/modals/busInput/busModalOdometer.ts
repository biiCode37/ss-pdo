import { parseIndonesianNumber } from "@/utils/numberUtils";
import { TEXT_ALERTS } from "@/constants/texts";
import { MAX_SHIFT_DISTANCE_KM } from "./busModalTypes";

export interface KmDistanceResult {
  diff: number | null;
  status: "empty" | "normal" | "negative" | "extreme";
  formattedText: string | null;
}

export interface ToaLiveResult {
  s2: number | null;
  status: "empty" | "valid" | "invalid";
  formattedText: string | null;
}

/**
 * Mengekstrak 3 digit awal dari nilai KM odometer (misal "145.820" -> "145").
 * Jika kurang dari 3 digit, kembalikan digit yang ada.
 */
export function extractLeading3Digits(val?: string | null): string {
  if (!val || typeof val !== "string") return "";
  const digitsOnly = val.replace(/\D/g, "");
  if (!digitsOnly) return "";
  return digitsOnly.slice(0, 3);
}

/**
 * Menghitung selisih jarak real-time antara KM Akhir dan KM Awal
 * serta mengembalikan status validasi visual (normal, negative, extreme).
 */
export function computeRealtimeDistance(
  awalRaw?: string | null,
  akhirRaw?: string | null,
): KmDistanceResult {
  if (!awalRaw || !akhirRaw) {
    return { diff: null, status: "empty", formattedText: null };
  }

  const numAwal = parseIndonesianNumber(awalRaw, NaN);
  const numAkhir = parseIndonesianNumber(akhirRaw, NaN);

  if (isNaN(numAwal) || isNaN(numAkhir)) {
    return { diff: null, status: "empty", formattedText: null };
  }

  const diff = numAkhir - numAwal;

  if (diff < 0) {
    return {
      diff,
      status: "negative",
      formattedText: TEXT_ALERTS.BUS_INPUT_MODAL.DIFF_NEGATIVE(diff),
    };
  }

  if (diff > MAX_SHIFT_DISTANCE_KM) {
    return {
      diff,
      status: "extreme",
      formattedText: TEXT_ALERTS.BUS_INPUT_MODAL.DIFF_EXTREME(
        diff,
        MAX_SHIFT_DISTANCE_KM,
      ),
    };
  }

  return {
    diff,
    status: "normal",
    formattedText: TEXT_ALERTS.BUS_INPUT_MODAL.DIFF_NORMAL(diff),
  };
}

/**
 * Menghitung live kalkulasi penumpang TOA Shift 2 dari (Total TOA - TOA Shift 1).
 */
export function computeLiveToaShift2(
  totalToaRaw?: string | null,
  toaS1Raw?: string | null,
): ToaLiveResult {
  if (!totalToaRaw || !toaS1Raw) {
    return { s2: null, status: "empty", formattedText: null };
  }

  const numTot = parseIndonesianNumber(totalToaRaw, NaN);
  const numS1 = parseIndonesianNumber(toaS1Raw, NaN);

  if (isNaN(numTot) || isNaN(numS1)) {
    return { s2: null, status: "empty", formattedText: null };
  }

  const s2 = numTot - numS1;

  if (s2 < 0) {
    return {
      s2,
      status: "invalid",
      formattedText: TEXT_ALERTS.BUS_INPUT_MODAL.LIVE_TOA_S2_INVALID(
        numTot,
        numS1,
      ),
    };
  }

  return {
    s2,
    status: "valid",
    formattedText: TEXT_ALERTS.BUS_INPUT_MODAL.LIVE_TOA_S2_RESULT(
      numTot,
      numS1,
      s2,
    ),
  };
}
