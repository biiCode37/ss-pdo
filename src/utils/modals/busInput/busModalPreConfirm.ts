import { pdoSwal } from "@/utils/alertUtils";
import type { BusData } from "@/services/googleSheets";
import { parseIndonesianNumber } from "@/utils/numberUtils";
import { TEXT_ALERTS } from "@/constants/texts";
import type { BusModalOptions } from "./busModalTypes";
import {
  validateKmPair,
  validateToaValue,
  validateToaPair,
  validateTripCount,
} from "./busModalValidation";
import { extractKeteranganFromForm } from "./busModalKeterangan";

interface SingleColumnMeta {
  label: string;
  placeholder: string;
  key: keyof BusData;
}

/**
 * Validasi dan ekstraksi pembaruan untuk Mode Input Trip Pergi & Pulang
 */
function validateAndExtractTripMode(
  popup: HTMLElement,
  options: BusModalOptions,
  isOffUnit: boolean,
  resolvedKeterangan: string,
): Partial<BusData> | false {
  const { bus, headerMap } = options;
  const updates: Partial<BusData> = {};

  const tripPergiInput = popup.querySelector<HTMLInputElement>(
    "#swal-input-tripPergi",
  );
  const tripPulangInput = popup.querySelector<HTMLInputElement>(
    "#swal-input-tripPulang",
  );
  const tripPergiVal = tripPergiInput ? tripPergiInput.value.trim() : "";
  const tripPulangVal = tripPulangInput ? tripPulangInput.value.trim() : "";

  const tripPergiErr = validateTripCount(tripPergiVal, "Trip Pergi");
  if (tripPergiErr) {
    pdoSwal.showValidationMessage(tripPergiErr);
    return false;
  }
  const tripPulangErr = validateTripCount(tripPulangVal, "Trip Pulang");
  if (tripPulangErr) {
    pdoSwal.showValidationMessage(tripPulangErr);
    return false;
  }

  if (headerMap?.tripPergi !== undefined && headerMap.tripPergi !== -1) {
    updates.tripPergi = isOffUnit ? "" : tripPergiVal;
  }
  if (headerMap?.tripPulang !== undefined && headerMap.tripPulang !== -1) {
    updates.tripPulang = isOffUnit ? "" : tripPulangVal;
  }

  const wrapperKet = popup.querySelector<HTMLElement>(
    "#swal-wrapper-keterangan",
  );
  if (
    wrapperKet &&
    (wrapperKet.style.display !== "none" ||
      resolvedKeterangan !== (bus.keterangan || ""))
  ) {
    updates.keterangan = resolvedKeterangan;
  }

  return updates;
}

/**
 * Validasi dan ekstraksi pembaruan untuk Mode Input Kolom Tunggal
 */
function validateAndExtractSingleMode(
  popup: HTMLElement,
  options: BusModalOptions,
  singleMeta: SingleColumnMeta,
  isOffUnit: boolean,
  isNp1Unit: boolean,
  isNp2Unit: boolean,
  resolvedKeterangan: string,
): Partial<BusData> | false {
  const { bus, activeCategory = "all" } = options;
  const updates: Partial<BusData> = {};

  let singleInput: HTMLInputElement | null = null;
  if (activeCategory === "toaShift1") {
    singleInput = popup.querySelector<HTMLInputElement>(
      "#swal-input-toaShift1",
    );
  } else if (activeCategory === "totalToa") {
    singleInput = popup.querySelector<HTMLInputElement>(
      "#swal-input-totalToa",
    );
  } else {
    singleInput = popup.querySelector<HTMLInputElement>(
      "#swal-input-single",
    );
  }

  if (!singleInput) {
    singleInput = popup.querySelector<HTMLInputElement>(
      ".swal-bus-input-container input[type='number']",
    );
  }

  const val = singleInput ? singleInput.value.trim() : "";

  if (val !== "") {
    const numVal = parseIndonesianNumber(val, NaN);
    if (isNaN(numVal) || numVal < 0) {
      pdoSwal.showValidationMessage(
        TEXT_ALERTS.BUS_INPUT_MODAL.POSITIVE_NUMBER,
      );
      return false;
    }
  }

  if (val !== "" && !isOffUnit) {
    if (activeCategory === "kmAkhir1") {
      const kmErr = validateKmPair(bus.kmAwal1 || "", val, "Shift 1");
      if (kmErr) {
        pdoSwal.showValidationMessage(kmErr);
        return false;
      }
    } else if (activeCategory === "kmAkhir2") {
      const kmErr = validateKmPair(bus.kmAwal2 || "", val, "Shift 2");
      if (kmErr) {
        pdoSwal.showValidationMessage(kmErr);
        return false;
      }
    } else if (activeCategory === "kmAwal1" && bus.kmAkhir1) {
      const kmErr = validateKmPair(val, bus.kmAkhir1, "Shift 1");
      if (kmErr) {
        pdoSwal.showValidationMessage(kmErr);
        return false;
      }
    } else if (activeCategory === "kmAwal2" && bus.kmAkhir2) {
      const kmErr = validateKmPair(val, bus.kmAkhir2, "Shift 2");
      if (kmErr) {
        pdoSwal.showValidationMessage(kmErr);
        return false;
      }
    } else if (activeCategory === "toaShift1") {
      const toaValErr = validateToaValue(val, "TOA Shift 1");
      if (toaValErr) {
        pdoSwal.showValidationMessage(toaValErr);
        return false;
      }
      if (bus.totalToa) {
        const toaErr = validateToaPair(val, bus.totalToa);
        if (toaErr) {
          pdoSwal.showValidationMessage(toaErr);
          return false;
        }
      }
    } else if (activeCategory === "totalToa") {
      const totValErr = validateToaValue(val, "Total TOA");
      if (totValErr) {
        pdoSwal.showValidationMessage(totValErr);
        return false;
      }
      if (bus.toaShift1) {
        const toaErr = validateToaPair(bus.toaShift1, val);
        if (toaErr) {
          pdoSwal.showValidationMessage(toaErr);
          return false;
        }
      }
    } else if (
      activeCategory === "manualShift1" ||
      activeCategory === "manualShift2"
    ) {
      const manErr = validateToaValue(val, singleMeta.label);
      if (manErr) {
        pdoSwal.showValidationMessage(manErr);
        return false;
      }
    } else if (
      activeCategory === "tripPergi" ||
      activeCategory === "tripPulang"
    ) {
      const tripErr = validateTripCount(val, singleMeta.label);
      if (tripErr) {
        pdoSwal.showValidationMessage(tripErr);
        return false;
      }
    }
  }

  const isTargetOff =
    isOffUnit ||
    (activeCategory === "toaShift1" && isNp1Unit) ||
    (activeCategory === "totalToa" && isOffUnit);
  (updates as any)[singleMeta.key] = isTargetOff ? "" : val;

  const wrapperKet = popup.querySelector<HTMLElement>(
    "#swal-wrapper-keterangan",
  );
  if (
    wrapperKet &&
    (wrapperKet.style.display !== "none" ||
      resolvedKeterangan !== (bus.keterangan || ""))
  ) {
    updates.keterangan = resolvedKeterangan;
  }

  if (activeCategory === "toaShift1") {
    const m1Wrapper = popup.querySelector<HTMLElement>(
      "#swal-wrapper-manualShift1",
    );
    const m1Input = popup.querySelector<HTMLInputElement>(
      "#swal-input-manualShift1",
    );
    if (m1Input) {
      const m1Val = m1Input.value.trim();
      const isM1Revealed = m1Wrapper && m1Wrapper.style.display !== "none";
      if (isM1Revealed || m1Val !== (bus.manualShift1 || "")) {
        if (m1Val !== "") {
          const m1Err = validateToaValue(m1Val, "Manual Shift 1");
          if (m1Err) {
            pdoSwal.showValidationMessage(m1Err);
            return false;
          }
          updates.manualShift1 = isOffUnit || isNp1Unit ? "" : m1Val;
        } else {
          updates.manualShift1 = "";
        }
      }
    }
  }

  if (activeCategory === "totalToa") {
    const m2Wrapper = popup.querySelector<HTMLElement>(
      "#swal-wrapper-manualShift2",
    );
    const m2Input = popup.querySelector<HTMLInputElement>(
      "#swal-input-manualShift2",
    );
    if (m2Input) {
      const m2Val = m2Input.value.trim();
      const isM2Revealed = m2Wrapper && m2Wrapper.style.display !== "none";
      if (isM2Revealed || m2Val !== (bus.manualShift2 || "")) {
        if (m2Val !== "") {
          const m2Err = validateToaValue(m2Val, "Manual Shift 2");
          if (m2Err) {
            pdoSwal.showValidationMessage(m2Err);
            return false;
          }
          updates.manualShift2 = isOffUnit || isNp2Unit ? "" : m2Val;
        } else {
          updates.manualShift2 = "";
        }
      }
    }
  }

  return updates;
}

/**
 * Validasi dan ekstraksi pembaruan untuk Mode Input Penuh (ALL)
 */
function validateAndExtractAllMode(
  popup: HTMLElement,
  options: BusModalOptions,
  isOffUnit: boolean,
  isNp1Unit: boolean,
  isNp2Unit: boolean,
  resolvedKeterangan: string,
): Partial<BusData> | false {
  const { headerMap } = options;
  const updates: Partial<BusData> = {};

  const tripPergi =
    popup
      .querySelector<HTMLInputElement>("#swal-input-tripPergi")
      ?.value.trim() || "";
  const tripPulang =
    popup
      .querySelector<HTMLInputElement>("#swal-input-tripPulang")
      ?.value.trim() || "";
  const toaShift1 =
    popup
      .querySelector<HTMLInputElement>("#swal-input-toaShift1")
      ?.value.trim() || "";
  const manualShift1 =
    popup
      .querySelector<HTMLInputElement>("#swal-input-manualShift1")
      ?.value.trim() || "";
  const totalToa =
    popup
      .querySelector<HTMLInputElement>("#swal-input-totalToa")
      ?.value.trim() || "";
  const manualShift2 =
    popup
      .querySelector<HTMLInputElement>("#swal-input-manualShift2")
      ?.value.trim() || "";
  const kmAwal1 =
    popup
      .querySelector<HTMLInputElement>("#swal-input-kmAwal1")
      ?.value.trim() || "";
  const kmAkhir1 =
    popup
      .querySelector<HTMLInputElement>("#swal-input-kmAkhir1")
      ?.value.trim() || "";
  const kmAwal2 =
    popup
      .querySelector<HTMLInputElement>("#swal-input-kmAwal2")
      ?.value.trim() || "";
  const kmAkhir2 =
    popup
      .querySelector<HTMLInputElement>("#swal-input-kmAkhir2")
      ?.value.trim() || "";

  const tripPergiErr = validateTripCount(tripPergi, "Trip Pergi");
  if (tripPergiErr) {
    pdoSwal.showValidationMessage(tripPergiErr);
    return false;
  }
  const tripPulangErr = validateTripCount(tripPulang, "Trip Pulang");
  if (tripPulangErr) {
    pdoSwal.showValidationMessage(tripPulangErr);
    return false;
  }

  const toa1ValErr = validateToaValue(toaShift1, "TOA Shift 1");
  if (toa1ValErr) {
    pdoSwal.showValidationMessage(toa1ValErr);
    return false;
  }
  const man1ValErr = validateToaValue(manualShift1, "Manual Shift 1");
  if (man1ValErr) {
    pdoSwal.showValidationMessage(man1ValErr);
    return false;
  }
  const totToaValErr = validateToaValue(totalToa, "Total TOA");
  if (totToaValErr) {
    pdoSwal.showValidationMessage(totToaValErr);
    return false;
  }
  const man2ValErr = validateToaValue(manualShift2, "Manual Shift 2");
  if (man2ValErr) {
    pdoSwal.showValidationMessage(man2ValErr);
    return false;
  }

  if (!isOffUnit) {
    const km1Err = validateKmPair(kmAwal1, kmAkhir1, "Shift 1");
    if (km1Err) {
      pdoSwal.showValidationMessage(km1Err);
      return false;
    }

    const km2Err = validateKmPair(kmAwal2, kmAkhir2, "Shift 2");
    if (km2Err) {
      pdoSwal.showValidationMessage(km2Err);
      return false;
    }

    const toaErr = validateToaPair(toaShift1, totalToa);
    if (toaErr) {
      pdoSwal.showValidationMessage(toaErr);
      return false;
    }
  }

  if (headerMap?.tripPergi !== undefined && headerMap.tripPergi !== -1) {
    updates.tripPergi = tripPergi;
  }
  if (headerMap?.tripPulang !== undefined && headerMap.tripPulang !== -1) {
    updates.tripPulang = tripPulang;
  }

  updates.toaShift1 = isOffUnit || isNp1Unit ? "" : toaShift1;
  updates.totalToa = isOffUnit ? "" : totalToa;
  updates.manualShift1 =
    isOffUnit || isNp1Unit || manualShift1 === "0" ? "" : manualShift1;
  updates.manualShift2 =
    isOffUnit || isNp2Unit || manualShift2 === "0" ? "" : manualShift2;
  updates.kmAwal1 = isOffUnit ? "" : kmAwal1;
  updates.kmAkhir1 = isOffUnit ? "" : kmAkhir1;
  updates.kmAwal2 = isOffUnit ? "" : kmAwal2;
  updates.kmAkhir2 = isOffUnit ? "" : kmAkhir2;
  updates.keterangan = resolvedKeterangan;

  return updates;
}

/**
 * Handle preConfirm modal SweetAlert2
 */
export function handleModalPreConfirm(
  popup: HTMLElement,
  options: BusModalOptions,
  isAll: boolean,
  singleMeta?: SingleColumnMeta,
): Partial<BusData> | false | null {
  const { activeCategory = "all" } = options;

  const resolvedKeterangan = extractKeteranganFromForm(popup);
  const upperKet = resolvedKeterangan.toUpperCase();
  const isOffUnit = upperKet === "OFF";
  const isNp1Unit = /\bNP1\b/i.test(upperKet);
  const isNp2Unit = /\bNP2\b/i.test(upperKet);

  if (!isAll && activeCategory === "trip") {
    return validateAndExtractTripMode(
      popup,
      options,
      isOffUnit,
      resolvedKeterangan,
    );
  }

  if (!isAll && singleMeta) {
    return validateAndExtractSingleMode(
      popup,
      options,
      singleMeta,
      isOffUnit,
      isNp1Unit,
      isNp2Unit,
      resolvedKeterangan,
    );
  }

  return validateAndExtractAllMode(
    popup,
    options,
    isOffUnit,
    isNp1Unit,
    isNp2Unit,
    resolvedKeterangan,
  );
}
