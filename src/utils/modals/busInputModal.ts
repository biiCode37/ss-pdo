import { pdoSwal } from "../alertUtils";
import type { BusData } from "@/services/googleSheets";
import { TEXT_ALERTS } from "@/constants/texts";
import {
  type BusModalOptions,
  getSatsetMode,
  setSatsetMode,
  MAX_SHIFT_DISTANCE_KM,
  MAX_TOA_VALUE,
  MAX_TRIP_COUNT,
  SINGLE_COLUMN_META,
} from "./busInput/busModalTypes";
import {
  escapeHtml,
  validateKmPair,
  validateToaValue,
  validateToaPair,
  validateTripCount,
} from "./busInput/busModalValidation";
import {
  renderSatsetToggle,
  renderModalHeader,
  renderFullModalHtml,
  renderSpecificModalHtml,
} from "./busInput/busModalTemplate";
import {
  setupModalEventListeners,
  handleModalPreConfirm,
} from "./busInput/busModalHandlers";

// Re-export untuk kompatibilitas penuh (Zero Breaking Change)
export type { BusModalOptions };
export {
  getSatsetMode,
  setSatsetMode,
  renderSatsetToggle,
  MAX_SHIFT_DISTANCE_KM,
  MAX_TOA_VALUE,
  MAX_TRIP_COUNT,
  validateKmPair,
  validateToaValue,
  validateToaPair,
  validateTripCount,
  escapeHtml,
};

/**
 * Modal SweetAlert2 untuk Entri Data Unit Bus (Facade Orchestrator)
 */
export async function showBusInputModal(
  options: BusModalOptions,
): Promise<Partial<BusData> | null> {
  const { bus, activeCategory = "all", headerMap, initialTab = "shift1" } = options;
  const isAll = !activeCategory || activeCategory.toUpperCase() === "ALL";
  const singleMeta = SINGLE_COLUMN_META[activeCategory];

  const tripPergiLabel = headerMap?.tripPergiLabel || "Trip Pergi";
  const tripPulangLabel = headerMap?.tripPulangLabel || "Trip Pulang";

  const hasManual1 = Boolean(
    bus.manualShift1 &&
      bus.manualShift1 !== "0" &&
      bus.manualShift1.trim() !== "",
  );
  const hasManual2 = Boolean(
    bus.manualShift2 &&
      bus.manualShift2 !== "0" &&
      bus.manualShift2.trim() !== "",
  );
  const hasKeterangan = Boolean(bus.keterangan && bus.keterangan.trim() !== "");
  const isSatset = getSatsetMode();
  const headerHtml = renderModalHeader(bus.unit, isSatset);

  const formHtml = isAll
    ? renderFullModalHtml(
        bus,
        headerHtml,
        initialTab,
        tripPergiLabel,
        tripPulangLabel,
      )
    : renderSpecificModalHtml(
        bus,
        headerHtml,
        activeCategory,
        singleMeta,
        tripPergiLabel,
        tripPulangLabel,
        hasManual1,
        hasManual2,
        hasKeterangan,
      );

  const result = await pdoSwal.fire({
    html: formHtml,
    showCancelButton: true,
    confirmButtonText: TEXT_ALERTS.BUS_INPUT_MODAL.SAVE_BTN,
    cancelButtonText: TEXT_ALERTS.BUS_INPUT_MODAL.CANCEL_BTN,
    reverseButtons: true,
    focusConfirm: false,
    customClass: {
      container: "pdo-swal-container",
      popup: isAll
        ? "pdo-swal-popup pdo-swal-bus-modal pdo-swal-popup-wide"
        : "pdo-swal-popup pdo-swal-bus-modal",
      confirmButton: "pdo-swal-confirm-btn",
      cancelButton: "pdo-swal-cancel-btn",
    },
    didOpen: () => {
      const popup = pdoSwal.getPopup();
      if (!popup) return;
      setupModalEventListeners(popup, options, isAll, initialTab);
    },
    preConfirm: () => {
      const popup = pdoSwal.getPopup();
      if (!popup) return null;
      return handleModalPreConfirm(popup, options, isAll, singleMeta);
    },
  });

  if (result.isConfirmed && result.value) {
    return result.value as Partial<BusData>;
  }

  return null;
}
