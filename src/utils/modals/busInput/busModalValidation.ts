import { parseIndonesianNumber } from "@/utils/numberUtils";
import { TEXT_ALERTS } from "@/constants/texts";
import {
  MAX_SHIFT_DISTANCE_KM,
  MAX_TOA_VALUE,
  MAX_TRIP_COUNT,
} from "./busModalTypes";

/**
 * Helper to escape HTML characters in dynamic strings (Anti-XSS)
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Memvalidasi pasangan KM Awal dan KM Akhir
 * Mengembalikan pesan error (string) jika tidak valid, atau null jika valid.
 */
export function validateKmPair(
  kmAwalRaw: string,
  kmAkhirRaw: string,
  shiftLabel: string,
): string | null {
  if (!kmAwalRaw || !kmAkhirRaw) return null;
  const numAwal = parseIndonesianNumber(kmAwalRaw, NaN);
  const numAkhir = parseIndonesianNumber(kmAkhirRaw, NaN);
  if (isNaN(numAwal) || isNaN(numAkhir)) return null;

  if (numAkhir > 0 && numAkhir < numAwal) {
    return TEXT_ALERTS.BUS_INPUT_MODAL.KM_AKHIR_LESS_THAN_AWAL(shiftLabel, kmAkhirRaw, kmAwalRaw);
  }

  const diff = numAkhir - numAwal;
  if (diff > MAX_SHIFT_DISTANCE_KM) {
    return TEXT_ALERTS.BUS_INPUT_MODAL.KM_DIFF_EXCEEDS_MAX(shiftLabel, diff, MAX_SHIFT_DISTANCE_KM);
  }

  return null;
}

/**
 * Memvalidasi nilai TOA dan Manual (maksimal 3 digit / <= 999)
 * Mengembalikan pesan error (string) jika tidak valid, atau null jika valid.
 */
export function validateToaValue(
  valRaw: string,
  fieldLabel: string,
): string | null {
  if (!valRaw || valRaw.trim() === "") return null;
  const num = parseIndonesianNumber(valRaw, NaN);
  if (isNaN(num) || num < 0) {
    return TEXT_ALERTS.BUS_INPUT_MODAL.TOA_MUST_BE_POSITIVE(fieldLabel);
  }
  if (num > MAX_TOA_VALUE) {
    return TEXT_ALERTS.BUS_INPUT_MODAL.TOA_MAX_DIGITS(fieldLabel, MAX_TOA_VALUE);
  }
  return null;
}

/**
 * Memvalidasi perbandingan Total TOA Shift 2 terhadap TOA Shift 1
 * Mengembalikan pesan error (string) jika tidak valid, atau null jika valid.
 */
export function validateToaPair(
  toaShift1Raw: string,
  totalToaRaw: string,
): string | null {
  if (!toaShift1Raw || !totalToaRaw) return null;
  const numToaS1 = parseIndonesianNumber(toaShift1Raw, NaN);
  const numTotToa = parseIndonesianNumber(totalToaRaw, NaN);
  if (isNaN(numToaS1) || isNaN(numTotToa)) return null;

  if (numTotToa > 0 && numTotToa < numToaS1) {
    return TEXT_ALERTS.BUS_INPUT_MODAL.TOTAL_TOA_LESS_THAN_S1(totalToaRaw, toaShift1Raw);
  }

  return null;
}

/**
 * Memvalidasi nilai trip
 * Mengembalikan pesan error (string) jika tidak valid, atau null jika valid.
 */
export function validateTripCount(
  tripRaw: string,
  fieldLabel: string,
): string | null {
  if (!tripRaw || tripRaw.trim() === "") return null;
  const numTrip = parseIndonesianNumber(tripRaw, NaN);
  if (isNaN(numTrip) || numTrip < 0) {
    return TEXT_ALERTS.BUS_INPUT_MODAL.TOA_MUST_BE_POSITIVE(fieldLabel);
  }
  if (numTrip > MAX_TRIP_COUNT) {
    return TEXT_ALERTS.BUS_INPUT_MODAL.TRIP_MAX_COUNT(fieldLabel, MAX_TRIP_COUNT);
  }
  return null;
}
