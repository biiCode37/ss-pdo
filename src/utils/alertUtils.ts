import type { SweetAlertIcon, SweetAlertPosition } from "sweetalert2";
import { getCurrentTheme, pdoSwal, pdoToast } from "./swalBase";
import {
  showBusInputModal,
  escapeHtml,
  getSatsetMode,
  setSatsetMode,
  type BusModalOptions,
} from "./modals/busInputModal";
import {
  showBulkTripModal,
  showBulkCopyKmModal,
  showFormatSheetConfirm,
  type BulkTripModalOptions,
  type BulkCopyKmModalOptions,
} from "./modals/bulkModals";
import {
  showRegionalSyncModal,
  type RegionalSyncModalOptions,
  type RegionalSyncModalResult,
} from "./modals/regionalSyncModal";
import { TEXT_ALERTS } from "../constants/texts";

// Re-exports untuk kompatibilitas penuh (Zero Breaking Change)
export {
  getCurrentTheme,
  pdoSwal,
  pdoToast,
  showBusInputModal,
  escapeHtml,
  getSatsetMode,
  setSatsetMode,
  showBulkTripModal,
  showBulkCopyKmModal,
  showFormatSheetConfirm,
  showRegionalSyncModal,
};
export type {
  BusModalOptions,
  BulkTripModalOptions,
  BulkCopyKmModalOptions,
  RegionalSyncModalOptions,
  RegionalSyncModalResult,
};

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
    confirmButtonText:
      options.confirmButtonText || TEXT_ALERTS.MODAL_COMMON.CONTINUE,
    cancelButtonText:
      options.cancelButtonText || TEXT_ALERTS.MODAL_COMMON.CANCEL,
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
