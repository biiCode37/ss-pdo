import { parseIndonesianNumber } from "@/utils/numberUtils";
import { TEXT_ALERTS } from "@/constants/texts";
import {
  MAX_SHIFT_DISTANCE_KM,
  MAX_TOA_VALUE,
  MAX_TRIP_COUNT,
  MAX_ROLLOVER_FORWARD_DIFF_KM,
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
 * Bypass otomatis jika salah satu kosong atau masih berupa draft prefill (<= 3 digit).
 */
export function validateKmPair(
  kmAwalRaw: string,
  kmAkhirRaw: string,
  shiftLabel: string,
): string | null {
  const awal = kmAwalRaw ? kmAwalRaw.trim() : "";
  const akhir = kmAkhirRaw ? kmAkhirRaw.trim() : "";

  // Jika salah satu kosong, bypass (valid - misal di pagi hari baru isi KM Awal)
  if (!awal || !akhir) return null;

  // Jika KM Akhir atau KM Awal hanyalah draft prefill kepala angka dari pasangannya
  // maka salah satu field belum selesai diisi, sehingga jangan bandingkan sebagai error.
  const isDraftPrefill =
    (akhir.length <= 3 && awal.length > akhir.length && awal.startsWith(akhir)) ||
    (awal.length <= 3 && akhir.length > awal.length && akhir.startsWith(awal)) ||
    (awal.length <= 3 && akhir.length <= 3 && awal === akhir);
  if (isDraftPrefill) return null;

  const numAwal = parseIndonesianNumber(awal, NaN);
  const numAkhir = parseIndonesianNumber(akhir, NaN);
  if (isNaN(numAwal) || isNaN(numAkhir)) return null;

  if (numAkhir > 0 && numAkhir < numAwal) {
    return TEXT_ALERTS.BUS_INPUT_MODAL.KM_AKHIR_LESS_THAN_AWAL(shiftLabel, akhir, awal);
  }

  const diff = numAkhir - numAwal;
  if (diff > MAX_SHIFT_DISTANCE_KM) {
    return TEXT_ALERTS.BUS_INPUT_MODAL.KM_DIFF_EXCEEDS_MAX(shiftLabel, diff, MAX_SHIFT_DISTANCE_KM);
  }

  return null;
}

/**
 * Memvalidasi konsistensi antar-shift:
 * Jika Shift 1 memiliki KM Awal (> 3 digit), maka KM Akhir Shift 1 wajib diisi
 * sebelum pengguna boleh mengisi KM Shift 2 (kmAwal2 atau kmAkhir2).
 * Namun jika Shift 1 kosong total (kasus bus hanya berdinas di Shift 2), lolos validasi.
 */
export function validateKmCrossShift(
  kmAwal1Raw?: string,
  kmAkhir1Raw?: string,
  kmAwal2Raw?: string,
  kmAkhir2Raw?: string,
): string | null {
  const awal1 = kmAwal1Raw ? kmAwal1Raw.trim() : "";
  const akhir1 = kmAkhir1Raw ? kmAkhir1Raw.trim() : "";
  const awal2 = kmAwal2Raw ? kmAwal2Raw.trim() : "";
  const akhir2 = kmAkhir2Raw ? kmAkhir2Raw.trim() : "";

  const isS1Started = awal1.length > 3;
  const isS1Closed = akhir1.length > 3;
  const isS2Attempted = awal2.length > 3 || akhir2.length > 3;

  if (isS1Started && !isS1Closed && isS2Attempted) {
    return TEXT_ALERTS.BUS_INPUT_MODAL.VALIDATION_KM_S2_REQUIRES_S1_CLOSED;
  }

  return null;
}

/**
 * Memvalidasi konsistensi KM Awal hari ini terhadap KM hari sebelumnya (Cross-Day Validation Guard):
 * Mencegah data mundur jika terjadi pergantian kepala angka ribuan (rollover).
 * Mengembalikan pesan error edukatif jika KM Awal < KM Hari Sebelumnya, atau null jika valid.
 */
export function validateKmCrossDay(
  kmAwalTodayRaw?: string,
  kmPreviousDayRaw?: string,
  shiftLabel: string = "Shift 1",
  dateLabel: string = "hari sebelumnya",
  bypassReset: boolean = false,
): string | null {
  if (bypassReset) return null;
  const awal = kmAwalTodayRaw ? kmAwalTodayRaw.trim() : "";
  const prev = kmPreviousDayRaw ? kmPreviousDayRaw.trim() : "";

  // Jika salah satu kosong atau belum selesai diisi (> 3 digit), jangan blokir
  if (!awal || !prev || awal.length <= 3 || prev.length <= 3) return null;

  const numAwal = parseIndonesianNumber(awal, NaN);
  const numPrev = parseIndonesianNumber(prev, NaN);
  if (isNaN(numAwal) || isNaN(numPrev)) return null;

  if (numAwal < numPrev) {
    const diff = numPrev - numAwal;
    return TEXT_ALERTS.BUS_INPUT_MODAL.KM_AWAL_LESS_THAN_PREVIOUS_DAY(
      shiftLabel,
      awal,
      prev,
      dateLabel,
      diff,
    );
  }

  return null;
}

/**
 * Deteksi Rollover Cerdas (Smart Rollover Suggestion):
 * Jika angka input KM Awal hari ini lebih kecil dari KM hari sebelumnya,
 * tetapi menaikkan 3 digit prefix + 1 menghasilkan selisih positif wajar (<= 100 KM):
 * Mengembalikan saran angka koreksi beserta selisih majunya, atau null jika tidak terdeteksi rollover.
 */
export function detectSmartRollover(
  kmAwalTodayRaw?: string,
  kmPreviousDayRaw?: string,
): { suggestedKm: string; diff: number } | null {
  const awal = kmAwalTodayRaw ? kmAwalTodayRaw.trim() : "";
  const prev = kmPreviousDayRaw ? kmPreviousDayRaw.trim() : "";

  // Butuh input minimal 4 digit agar prefix dan suffix terdefinisi
  if (!awal || !prev || awal.length <= 3 || prev.length <= 3) return null;

  const numAwal = parseIndonesianNumber(awal, NaN);
  const numPrev = parseIndonesianNumber(prev, NaN);
  if (isNaN(numAwal) || isNaN(numPrev)) return null;

  // Hanya periksa jika nilai saat ini lebih kecil dari kemarin (mengalami kemunduran semu)
  if (numAwal >= numPrev) return null;

  // Analisis 3 digit prefix
  const prefixStr = awal.slice(0, 3);
  const prefixNum = parseInt(prefixStr, 10);
  if (isNaN(prefixNum)) return null;

  const suffix = awal.slice(3);
  const nextPrefixStr = String(prefixNum + 1);
  const candidateKmStr = nextPrefixStr + suffix;
  const candidateKmNum = parseIndonesianNumber(candidateKmStr, NaN);

  if (isNaN(candidateKmNum)) return null;

  const forwardDiff = candidateKmNum - numPrev;
  if (forwardDiff > 0 && forwardDiff <= MAX_ROLLOVER_FORWARD_DIFF_KM) {
    return {
      suggestedKm: candidateKmStr,
      diff: forwardDiff,
    };
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
