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
 * Dialog Alert Sukses (Success Alert Modal)
 */
export async function showSuccessAlert(title: string, message?: string | null) {
  if (!message) return;
  return pdoSwal.fire({
    title,
    text: message,
    icon: "success",
    confirmButtonText: TEXT_ALERTS.MODAL_COMMON.UNDERSTAND,
    customClass: {
      container: "pdo-swal-container",
      popup: "pdo-swal-popup",
      confirmButton: "pdo-swal-confirm-btn",
    },
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

export interface ConflictDiffItem {
  field: string;
  label: string;
  serverValue: string;
  userValue: string;
}

/**
 * Membangun representasi HTML visual perbandingan kolom (Side-by-Side Diff)
 * untuk dialog resolusi konflik SweetAlert2.
 */
export function buildConflictDiffHtml(
  diffs: ConflictDiffItem[],
  explanationText?: string,
): string {
  const introHtml = explanationText
    ? `<div style="font-size: 13px; color: var(--color-text-secondary); margin-bottom: 12px; text-align: left; line-height: 1.5;">${explanationText}</div>`
    : "";

  if (!diffs || diffs.length === 0) {
    return introHtml;
  }

  const itemsHtml = diffs
    .map((item) => {
      const serverDisplay = item.serverValue
        ? escapeHtml(item.serverValue)
        : `<span style="color: var(--color-text-muted); font-style: italic;">${TEXT_ALERTS.CONFLICT_DIFF.EMPTY_VALUE}</span>`;
      const userDisplay = item.userValue
        ? escapeHtml(item.userValue)
        : `<span style="color: var(--color-text-muted); font-style: italic;">${TEXT_ALERTS.CONFLICT_DIFF.EMPTY_VALUE}</span>`;

      return `
        <div style="padding: 10px 0; border-bottom: 1px solid var(--color-border-subtle);">
          <div style="font-weight: 700; color: var(--color-text-primary); font-size: 12.5px; margin-bottom: 6px; text-align: left;">
            🔹 ${escapeHtml(item.label)}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; text-align: left;">
            <div style="background: var(--color-surface-raised); padding: 8px; border-radius: 8px; border: 1px solid var(--color-border-subtle);">
              <div style="color: var(--color-text-muted); font-size: 10.5px; margin-bottom: 2px;">${TEXT_ALERTS.CONFLICT_DIFF.SERVER_HEADER}</div>
              <div style="font-weight: 600; color: var(--color-text-primary); word-break: break-word;">${serverDisplay}</div>
            </div>
            <div style="background: var(--color-surface-raised); padding: 8px; border-radius: 8px; border: 1px solid var(--color-warning-border);">
              <div style="color: var(--color-warning-fg); font-size: 10.5px; margin-bottom: 2px;">${TEXT_ALERTS.CONFLICT_DIFF.USER_HEADER}</div>
              <div style="font-weight: 600; color: var(--color-warning-fg); word-break: break-word;">${userDisplay}</div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div style="font-family: inherit;">
      ${introHtml}
      <div style="background: var(--color-surface-subtle); border-radius: 12px; padding: 10px 12px; border: 1px solid var(--color-border-subtle); max-height: 240px; overflow-y: auto;">
        <div style="font-weight: 700; color: var(--color-text-secondary); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; text-align: left;">
          ${TEXT_ALERTS.CONFLICT_DIFF.SECTION_TITLE}
        </div>
        ${itemsHtml}
      </div>
    </div>
  `;
}

/**
 * Dialog Resolusi Konflik Sinkronisasi Data Antrean Offline
 */
export async function showQueueConflictDialog(options: {
  unitName?: string;
  isOnline?: boolean;
  diffs?: ConflictDiffItem[];
  onUseServer: () => void;
  onForceSave: () => void;
}) {
  const isOnline = options.isOnline ?? false;
  const alertTextDict = isOnline
    ? TEXT_ALERTS.CONFLICT_ONLINE
    : TEXT_ALERTS.CONFLICT;

  const introText = options.unitName
    ? alertTextDict.UNIT_TEXT(escapeHtml(options.unitName))
    : alertTextDict.GENERAL_TEXT;

  const htmlContent = buildConflictDiffHtml(options.diffs || [], introText);

  const result = await pdoSwal.fire({
    title: alertTextDict.TITLE,
    html: htmlContent,
    icon: "warning",
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: alertTextDict.CONFIRM_BTN,
    denyButtonText: alertTextDict.DENY_BTN,
    cancelButtonText: alertTextDict.CANCEL_BTN,
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
