import type { BusData, HeaderMap } from "@/services/googleSheets";
import { TEXT_ALERTS } from "@/constants/texts";
import { parseIndonesianNumber } from "@/utils/numberUtils";
import {
  validateKmPair,
  validateKmCrossShift,
  validateKmCrossDay,
  validateTripCount,
  validateToaValue,
  validateToaPair,
} from "@/utils/modals/busInput/busModalValidation";

export interface CrossDayValidationParams {
  isSingleMode: boolean;
  effectiveCategory: string;
  kmAwal1: string;
  kmAkhir1: string;
  kmAwal2: string;
  bus: BusData;
  bypassOdometerReset: boolean;
  previousDayKmAkhir2?: string;
  previousDayDateLabel?: string;
}

export interface ValidateBusInputFormParams extends CrossDayValidationParams {
  tripPergi: string;
  tripPulang: string;
  toaShift1: string;
  toaShift2: string;
  totalToa: string;
  manualShift1: string;
  manualShift2: string;
  showManual1: boolean;
  showManual2: boolean;
  kmAkhir2: string;
  headerMap?: HeaderMap;
}

/**
 * Helper murni untuk mengekstrak error lintas hari aktif menggunakan validator yang sama (SSOT)
 */
export function getCrossDayValidationErrors({
  isSingleMode,
  effectiveCategory,
  kmAwal1,
  kmAkhir1,
  kmAwal2,
  bus,
  bypassOdometerReset,
  previousDayKmAkhir2,
  previousDayDateLabel,
}: CrossDayValidationParams): string[] {
  const dateLabel =
    previousDayDateLabel || TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_PREVIOUS_DAY;
  const errors: string[] = [];

  if (isSingleMode) {
    if (
      effectiveCategory === "kmAwal1" ||
      effectiveCategory === "kmAkhir1"
    ) {
      const err = validateKmCrossDay(
        kmAwal1,
        previousDayKmAkhir2,
        TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_1,
        dateLabel,
        bypassOdometerReset,
      );
      if (err) errors.push(err);
    } else if (
      effectiveCategory === "kmAwal2" ||
      effectiveCategory === "kmAkhir2"
    ) {
      // Skenario B: Jika Shift 1 belum dimulai, validasi kmAwal2 terhadap hari kemarin
      const hasShift1 =
        (bus.kmAwal1 && bus.kmAwal1.trim() !== "") ||
        (kmAwal1 && kmAwal1.trim() !== "" && kmAwal1.trim().length > 3);
      if (!hasShift1) {
        const err = validateKmCrossDay(
          kmAwal2,
          previousDayKmAkhir2,
          TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_2,
          dateLabel,
          bypassOdometerReset,
        );
        if (err) errors.push(err);
      }
    }
  } else {
    // Mode All (Semua Kolom)
    const errCrossDay1 = validateKmCrossDay(
      kmAwal1,
      previousDayKmAkhir2,
      TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_1,
      dateLabel,
      bypassOdometerReset,
    );
    if (errCrossDay1) errors.push(errCrossDay1);

    // Skenario B di Mode All: Jika Shift 1 kosong murni tapi Shift 2 terisi
    const hasS1 =
      (kmAwal1 && kmAwal1.trim() !== "" && kmAwal1.trim().length > 3) ||
      (kmAkhir1 && kmAkhir1.trim() !== "" && kmAkhir1.trim().length > 3) ||
      (bus.kmAwal1 && bus.kmAwal1.trim() !== "");
    if (!hasS1 && kmAwal2 && kmAwal2.trim().length > 3) {
      const errCrossDay2 = validateKmCrossDay(
        kmAwal2,
        previousDayKmAkhir2,
        TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_2,
        dateLabel,
        bypassOdometerReset,
      );
      if (errCrossDay2) errors.push(errCrossDay2);
    }
  }

  return errors;
}

/**
 * Validasi murni untuk seluruh form input bus modal (Single Focus dan Mode All).
 * Mengembalikan array pesan kesalahan validasi (kosong jika seluruh nilai valid).
 */
export function validateBusInputForm(params: ValidateBusInputFormParams): string[] {
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
    headerMap,
  } = params;

  const errors: string[] = [];

  if (isSingleMode) {
    if (effectiveCategory === "toaShift1") {
      const err = validateToaValue(
        toaShift1,
        TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S1,
      );
      if (err) errors.push(err);
      if (showManual1) {
        const errM = validateToaValue(
          manualShift1,
          TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S1,
        );
        if (errM) errors.push(errM);
      }
      if (totalToa) {
        const errPair = validateToaPair(toaShift1, totalToa);
        if (errPair) errors.push(errPair);
      }
    } else if (effectiveCategory === "totalToa") {
      const err = validateToaValue(
        totalToa,
        TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOTAL_TOA,
      );
      if (err) errors.push(err);
      if (showManual2) {
        const errM = validateToaValue(
          manualShift2,
          TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S2,
        );
        if (errM) errors.push(errM);
      }
      const errPair = validateToaPair(toaShift1, totalToa);
      if (errPair) errors.push(errPair);
    } else if (
      effectiveCategory === "kmAwal1" ||
      effectiveCategory === "kmAkhir1"
    ) {
      const crossDayErrs = getCrossDayValidationErrors(params);
      if (crossDayErrs.length > 0) errors.push(...crossDayErrs);

      const err = validateKmPair(
        kmAwal1,
        kmAkhir1,
        TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_1,
      );
      if (err) errors.push(err);
      const errCross = validateKmCrossShift(
        kmAwal1,
        kmAkhir1,
        kmAwal2,
        kmAkhir2,
      );
      if (errCross) errors.push(errCross);
    } else if (
      effectiveCategory === "kmAwal2" ||
      effectiveCategory === "kmAkhir2"
    ) {
      const crossDayErrs = getCrossDayValidationErrors(params);
      if (crossDayErrs.length > 0) errors.push(...crossDayErrs);

      const errCross = validateKmCrossShift(
        kmAwal1,
        kmAkhir1,
        kmAwal2,
        kmAkhir2,
      );
      if (errCross) errors.push(errCross);
      const err = validateKmPair(
        kmAwal2,
        kmAkhir2,
        TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_2,
      );
      if (err) errors.push(err);
    }
  } else {
    // Mode All (Semua Kolom)
    const errTp = validateTripCount(
      tripPergi,
      headerMap?.tripPergiLabel || TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TRIP_PERGI,
    );
    if (errTp) errors.push(errTp);
    const errTpl = validateTripCount(
      tripPulang,
      headerMap?.tripPulangLabel || TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TRIP_PULANG,
    );
    if (errTpl) errors.push(errTpl);

    const errToaS1 = validateToaValue(
      toaShift1,
      TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S1,
    );
    if (errToaS1) errors.push(errToaS1);
    if (showManual1) {
      const errManS1 = validateToaValue(
        manualShift1,
        TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S1,
      );
      if (errManS1) errors.push(errManS1);
    }

    const crossDayErrs = getCrossDayValidationErrors(params);
    if (crossDayErrs.length > 0) errors.push(...crossDayErrs);

    const errKmS1 = validateKmPair(
      kmAwal1,
      kmAkhir1,
      TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_1,
    );
    if (errKmS1) errors.push(errKmS1);

    const errCross = validateKmCrossShift(
      kmAwal1,
      kmAkhir1,
      kmAwal2,
      kmAkhir2,
    );
    if (errCross) errors.push(errCross);

    const errToaS2 = validateToaValue(
      toaShift2,
      TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S2,
    );
    if (errToaS2) errors.push(errToaS2);
    if (showManual2) {
      const errManS2 = validateToaValue(
        manualShift2,
        TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S2,
      );
      if (errManS2) errors.push(errManS2);
    }

    const errKmS2 = validateKmPair(
      kmAwal2,
      kmAkhir2,
      TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_2,
    );
    if (errKmS2) errors.push(errKmS2);

    const toaS1Num = parseIndonesianNumber(toaShift1);
    const toaS2Num = parseIndonesianNumber(toaShift2);
    const finalToaS1 = isNaN(toaS1Num) ? 0 : toaS1Num;
    const finalToaS2 = isNaN(toaS2Num) ? 0 : toaS2Num;
    const computedTotal = finalToaS1 + finalToaS2;
    const prospectiveTotal =
      computedTotal > 0 ? String(computedTotal) : totalToa;
    if (prospectiveTotal) {
      const errPair = validateToaPair(toaShift1, prospectiveTotal);
      if (errPair) errors.push(errPair);
    }
  }

  return errors;
}
