import Swal from "sweetalert2";
import type { SweetAlertIcon, SweetAlertPosition } from "sweetalert2";
import type { HeaderMap } from "../services/googleSheets";
import {
  showBusInputModal,
  escapeHtml,
  getSatsetMode,
  setSatsetMode,
  type BusModalOptions,
} from "./modals/busInputModal";
import { TEXT_ALERTS } from "../constants/texts";

export { showBusInputModal, escapeHtml, getSatsetMode, setSatsetMode };
export type { BusModalOptions };

/**
 * Mendapatkan tema aktif aplikasi (light atau dark) dari atribut HTML
 */
export function getCurrentTheme(): "light" | "dark" {
  if (typeof document !== "undefined") {
    return (
      (document.documentElement.getAttribute("data-theme") as
        | "light"
        | "dark") || "dark"
    );
  }
  return "dark";
}

/**
 * Base SweetAlert instance dengan custom class styling SS_PDO
 */
export const pdoSwal = Swal.mixin({
  customClass: {
    container: "pdo-swal-container",
    popup: "pdo-swal-popup",
    confirmButton: "pdo-swal-confirm-btn",
    cancelButton: "pdo-swal-cancel-btn",
  },
  buttonsStyling: false,
  showClass: {
    popup: "swal2-show",
    backdrop: "swal2-backdrop-show",
  },
  hideClass: {
    popup: "swal2-hide",
    backdrop: "swal2-backdrop-hide",
  },
});

/**
 * Base Toast instance SweetAlert2
 */
export const pdoToast = Swal.mixin({
  toast: true,
  position: "top" as SweetAlertPosition,
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: "pdo-swal-toast",
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

/**
 * Menampilkan Toast notifikasi singkat non-blocking
 */
export function showToast(options: {
  title: string;
  icon?: SweetAlertIcon;
  timer?: number;
  position?: SweetAlertPosition;
}) {
  return pdoToast.fire({
    title: options.title,
    icon: options.icon || "info",
    timer: options.timer ?? 3000,
    position: options.position || "top",
  });
}

/**
 * Menampilkan Toast Sukses
 */
export function showSuccessToast(title: string, timer: number = 2500) {
  return showToast({ title, icon: "success", timer });
}

/**
 * Menampilkan Toast Error
 */
export function showErrorToast(title: string, timer: number = 3500) {
  return showToast({ title, icon: "error", timer });
}

/**
 * Menampilkan Toast Peringatan
 */
export function showWarningToast(title: string, timer: number = 3000) {
  return showToast({ title, icon: "warning", timer });
}

/**
 * Menampilkan Toast Info
 */
export function showInfoToast(title: string, timer: number = 2500) {
  return showToast({ title, icon: "info", timer });
}

/**
 * Menampilkan Dialog Konfirmasi (Dua tombol: Batal & Lanjutkan)
 */
export async function showConfirmDialog(options: {
  title: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: SweetAlertIcon;
  isDanger?: boolean;
}): Promise<boolean> {
  const result = await pdoSwal.fire({
    title: options.title,
    text: options.text,
    icon: options.icon ?? (options.isDanger ? "warning" : "question"),
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText || TEXT_ALERTS.MODAL_COMMON.CONTINUE,
    cancelButtonText: options.cancelButtonText || TEXT_ALERTS.MODAL_COMMON.CANCEL,
    reverseButtons: true,
    customClass: {
      container: "pdo-swal-container",
      popup: "pdo-swal-popup",
      confirmButton: options.isDanger
        ? "pdo-swal-confirm-btn pdo-swal-confirm-danger-btn"
        : "pdo-swal-confirm-btn",
      cancelButton: "pdo-swal-cancel-btn",
    },
  });

  return result.isConfirmed;
}

/**
 * Dialog Yakin Ingin Logout? (Logout)
 */
export async function showLogoutConfirm(): Promise<boolean> {
  return showConfirmDialog({
    title: TEXT_ALERTS.LOGOUT.TITLE,
    icon: "warning",
    confirmButtonText: TEXT_ALERTS.LOGOUT.CONFIRM_BTN,
    cancelButtonText: TEXT_ALERTS.LOGOUT.CANCEL_BTN,
    isDanger: true,
  });
}

/**
 * Dialog Konfirmasi Hapus Item Antrean Offline
 */
export async function showDeleteQueueConfirm(): Promise<boolean> {
  return showConfirmDialog({
    title: TEXT_ALERTS.DELETE_QUEUE.TITLE,
    text: TEXT_ALERTS.DELETE_QUEUE.TEXT,
    icon: "warning",
    confirmButtonText: TEXT_ALERTS.DELETE_QUEUE.CONFIRM_BTN,
    cancelButtonText: TEXT_ALERTS.DELETE_QUEUE.CANCEL_BTN,
    isDanger: true,
  });
}

/**
 * Dialog Alert Kesalahan (Error Alert Modal)
 */
export async function showErrorAlert(title: string, message?: string | null) {
  if (!message) return;
  return pdoSwal.fire({
    title,
    text: message,
    icon: "error",
    confirmButtonText: TEXT_ALERTS.MODAL_COMMON.UNDERSTAND,
    customClass: {
      container: "pdo-swal-container",
      popup: "pdo-swal-popup",
      confirmButton: "pdo-swal-confirm-btn",
    },
  });
}

/**
 * Dialog Sesi Kedaluwarsa dengan tombol Aksi Re-autentikasi
 */
export async function showAuthExpiredAlert(
  onReauth: () => Promise<void> | void,
) {
  const result = await pdoSwal.fire({
    title: TEXT_ALERTS.AUTH_EXPIRED.TITLE,
    text: TEXT_ALERTS.AUTH_EXPIRED.TEXT,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: TEXT_ALERTS.AUTH_EXPIRED.CONFIRM_BTN,
    cancelButtonText: TEXT_ALERTS.AUTH_EXPIRED.CANCEL_BTN,
    reverseButtons: true,
    customClass: {
      container: "pdo-swal-container",
      popup: "pdo-swal-popup",
      confirmButton: "pdo-swal-confirm-btn",
      cancelButton: "pdo-swal-cancel-btn",
    },
  });

  if (result.isConfirmed) {
    await onReauth();
  }
}

/**
 * Dialog Resolusi Konflik Sinkronisasi Data Antrean Offline
 */
export async function showQueueConflictDialog(options: {
  unitName?: string;
  onUseServer: () => void;
  onForceSave: () => void;
}) {
  const result = await pdoSwal.fire({
    title: TEXT_ALERTS.CONFLICT.TITLE,
    text: options.unitName
      ? TEXT_ALERTS.CONFLICT.UNIT_TEXT(options.unitName)
      : TEXT_ALERTS.CONFLICT.GENERAL_TEXT,
    icon: "warning",
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: TEXT_ALERTS.CONFLICT.CONFIRM_BTN,
    denyButtonText: TEXT_ALERTS.CONFLICT.DENY_BTN,
    cancelButtonText: TEXT_ALERTS.CONFLICT.CANCEL_BTN,
    customClass: {
      container: "pdo-swal-container",
      popup: "pdo-swal-popup",
      confirmButton: "pdo-swal-confirm-btn pdo-swal-confirm-danger-btn",
      denyButton: "pdo-swal-confirm-btn",
      cancelButton: "pdo-swal-cancel-btn",
    },
  });

  if (result.isConfirmed) {
    options.onForceSave();
  } else if (result.isDenied) {
    options.onUseServer();
  }
}

export interface BulkTripModalOptions {
  currentPergi?: string;
  currentPulang?: string;
  headerMap?: HeaderMap;
  unitCount: number;
}

/**
 * Modal SweetAlert2 untuk mengatur target Trip Operasional secara Bulk ke seluruh armada unit bus
 */
export async function showBulkTripModal(
  options: BulkTripModalOptions,
): Promise<{ tripPergi: string; tripPulang: string } | null> {
  const {
    currentPergi = "",
    currentPulang = "",
    headerMap,
    unitCount,
  } = options;
  const tripPergiLabel = escapeHtml(headerMap?.tripPergiLabel || "Trip Pergi");
  const tripPulangLabel = escapeHtml(headerMap?.tripPulangLabel || "Trip Pulang");

  const formHtml = `
    <div class="swal-bus-input-container" style="display: flex; flex-direction: column; gap: 12px; text-align: left;">
      <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45;">
        ${TEXT_ALERTS.BULK_TRIP.DESCRIPTION(escapeHtml(unitCount))}
      </div>

      <div style="padding: 12px; border-radius: 14px; background: rgba(56, 189, 248, 0.06); border: 1px solid var(--shift1-border, rgba(56, 189, 248, 0.25)); display: flex; flex-direction: column; gap: 10px;">
        <div>
          <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px; line-height: 1.3;">
            ${tripPergiLabel}
          </label>
          <input
            id="swal-bulk-tripPergi"
            type="number"
            inputmode="numeric"
            class="input-field"
            style="font-size: 16px; font-weight: 700; text-align: center; height: 42px; border-radius: 10px; border: 1.5px solid var(--accent-color); width: 100%;"
            value="${escapeHtml(currentPergi)}"
            placeholder="0"
          />
        </div>

        <div>
          <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px; line-height: 1.3;">
            ${tripPulangLabel}
          </label>
          <input
            id="swal-bulk-tripPulang"
            type="number"
            inputmode="numeric"
            class="input-field"
            style="font-size: 16px; font-weight: 700; text-align: center; height: 42px; border-radius: 10px; border: 1.5px solid var(--accent-color); width: 100%;"
            value="${escapeHtml(currentPulang)}"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  `;

  const result = await pdoSwal.fire({
    title: TEXT_ALERTS.BULK_TRIP.TITLE,
    html: formHtml,
    showCancelButton: true,
    confirmButtonText: TEXT_ALERTS.BULK_TRIP.APPLY_BTN,
    cancelButtonText: TEXT_ALERTS.BULK_TRIP.CANCEL_BTN,
    focusConfirm: false,
    customClass: {
      container: "pdo-swal-container",
      popup: "pdo-swal-popup pdo-swal-bus-modal",
      confirmButton: "pdo-swal-confirm-btn",
      cancelButton: "pdo-swal-cancel-btn",
    },
    didOpen: () => {
      const input = document.getElementById(
        "swal-bulk-tripPergi",
      ) as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.select();
      }

      // Enter keydown handler & smart auto-scroll on inputs
      const bulkPopup = pdoSwal.getPopup();
      if (bulkPopup) {
        const bulkInputs =
          bulkPopup.querySelectorAll<HTMLInputElement>("input");
        bulkInputs.forEach((elem) => {
          elem.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") {
              e.preventDefault();
              pdoSwal.clickConfirm();
            }
          });

          elem.addEventListener("focus", () => {
            setTimeout(() => {
              elem.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 180);
          });
        });
      }
    },
    preConfirm: () => {
      const pElem = document.getElementById(
        "swal-bulk-tripPergi",
      ) as HTMLInputElement | null;
      const qElem = document.getElementById(
        "swal-bulk-tripPulang",
      ) as HTMLInputElement | null;

      const pVal = pElem ? pElem.value : "";
      const qVal = qElem ? qElem.value : "";

      if (pVal.trim() === "" || qVal.trim() === "") {
        pdoSwal.showValidationMessage(
          TEXT_ALERTS.BULK_TRIP.REQUIRED,
        );
        return false;
      }

      const pNum = Number(pVal);
      const qNum = Number(qVal);

      if (isNaN(pNum) || isNaN(qNum) || pNum < 0 || qNum < 0) {
        pdoSwal.showValidationMessage(TEXT_ALERTS.BULK_TRIP.VALIDATION_POSITIVE);
        return false;
      }

      if (pNum > 20 || qNum > 20) {
        pdoSwal.showValidationMessage(
          TEXT_ALERTS.BULK_TRIP.VALIDATION_MAX(20),
        );
        return false;
      }

      return {
        tripPergi: String(Math.floor(pNum)),
        tripPulang: String(Math.floor(qNum)),
      };
    },
  });

  if (result.isConfirmed && result.value) {
    return result.value;
  }
  return null;
}

export interface BulkCopyKmModalOptions {
  totalUnitsWithKmS1: number;
  emptyKmAwal2Count: number;
  skippedWithNotesCount?: number;
}

/**
 * Modal konfirmasi Bulk Copy KM Akhir Shift 1 ke KM Awal Shift 2
 */
export async function showBulkCopyKmModal(
  options: BulkCopyKmModalOptions,
): Promise<"only_empty" | "all" | null> {
  const { totalUnitsWithKmS1, emptyKmAwal2Count, skippedWithNotesCount = 0 } = options;
  const isOnlyEmptyAvailable = emptyKmAwal2Count > 0;

  const formHtml = `
    <div class="swal-bus-input-container" style="display: flex; flex-direction: column; gap: 12px; text-align: left;">
      <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5;">
        ${TEXT_ALERTS.BULK_COPY_KM.ELIGIBLE_UNITS(escapeHtml(totalUnitsWithKmS1))}
      </div>

      ${
        skippedWithNotesCount > 0
          ? `
        <div style="font-size: 11.5px; color: var(--warning-text, #d97706); background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); padding: 8px 12px; border-radius: 10px; line-height: 1.4;">
          ${TEXT_ALERTS.BULK_COPY_KM.SKIPPED_WITH_NOTES(escapeHtml(skippedWithNotesCount))}
        </div>
      `
          : ""
      }

      <div style="display: flex; flex-direction: column; gap: 8px; padding: 12px; border-radius: 14px; background: rgba(56, 189, 248, 0.06); border: 1px solid var(--shift1-border, rgba(56, 189, 248, 0.25));">
        <label style="display: flex; align-items: flex-start; gap: 10px; cursor: ${isOnlyEmptyAvailable ? "pointer" : "default"}; user-select: none; opacity: ${isOnlyEmptyAvailable ? "1" : "0.55"};">
          <input type="radio" name="swal-bulk-copy-mode" value="only_empty" ${isOnlyEmptyAvailable ? "checked" : "disabled"} style="margin-top: 3px; accent-color: var(--accent-color); transform: scale(1.1);" />
          <div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">
              ${TEXT_ALERTS.BULK_COPY_KM.MODE_ONLY_EMPTY(escapeHtml(emptyKmAwal2Count))}
            </div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
              ${isOnlyEmptyAvailable ? TEXT_ALERTS.BULK_COPY_KM.MODE_ONLY_EMPTY_DESC_REC : TEXT_ALERTS.BULK_COPY_KM.MODE_ONLY_EMPTY_DESC_DONE}
            </div>
          </div>
        </label>

        <div style="height: 1px; background: var(--card-border); margin: 4px 0;"></div>

        <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; user-select: none;">
          <input type="radio" name="swal-bulk-copy-mode" value="all" ${!isOnlyEmptyAvailable ? "checked" : ""} style="margin-top: 3px; accent-color: var(--accent-color); transform: scale(1.1);" />
          <div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">${TEXT_ALERTS.BULK_COPY_KM.MODE_ALL(escapeHtml(totalUnitsWithKmS1))}</div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${TEXT_ALERTS.BULK_COPY_KM.MODE_ALL_DESC}</div>
          </div>
        </label>
      </div>
    </div>
  `;

  const result = await pdoSwal.fire({
    title: TEXT_ALERTS.BULK_COPY_KM.TITLE,
    html: formHtml,
    showCancelButton: true,
    confirmButtonText: TEXT_ALERTS.BULK_COPY_KM.APPLY_BTN,
    cancelButtonText: TEXT_ALERTS.BULK_COPY_KM.CANCEL_BTN,
    focusConfirm: false,
    customClass: {
      container: "pdo-swal-container",
      popup: "pdo-swal-popup pdo-swal-bus-modal",
      confirmButton: "pdo-swal-confirm-btn",
      cancelButton: "pdo-swal-cancel-btn",
    },
    preConfirm: () => {
      const selected = document.querySelector<HTMLInputElement>(
        'input[name="swal-bulk-copy-mode"]:checked',
      );
      return selected ? (selected.value as "only_empty" | "all") : (isOnlyEmptyAvailable ? "only_empty" : "all");
    },
  });

  if (result.isConfirmed && result.value) {
    return result.value as "only_empty" | "all";
  }
  return null;
}

/**
 * Modal konfirmasi penerapan standarisasi format spreadsheet
 */
export async function showFormatSheetConfirm(
  tabName: string,
): Promise<boolean> {
  const result = await pdoSwal.fire({
    title: TEXT_ALERTS.FORMAT_SHEET.TITLE,
    html: TEXT_ALERTS.FORMAT_SHEET.HTML_EXPLANATION(escapeHtml(tabName)),
    icon: "question",
    showCancelButton: true,
    confirmButtonText: TEXT_ALERTS.FORMAT_SHEET.CONFIRM_BTN,
    cancelButtonText: TEXT_ALERTS.FORMAT_SHEET.CANCEL_BTN,
    customClass: {
      popup: "pdo-swal-popup",
      confirmButton: "pdo-swal-confirm-btn",
      cancelButton: "pdo-swal-cancel-btn",
    },
  });

  return result.isConfirmed;
}
