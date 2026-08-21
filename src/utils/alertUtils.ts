import Swal from "sweetalert2";
import type { SweetAlertIcon, SweetAlertPosition } from "sweetalert2";
import type { HeaderMap } from "../services/googleSheets";
import {
  showBusInputModal,
  escapeHtml,
  type BusModalOptions,
} from "./modals/busInputModal";

export { showBusInputModal, escapeHtml };
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
    confirmButtonText: options.confirmButtonText || "Lanjutkan",
    cancelButtonText: options.cancelButtonText || "Batal",
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
    title: "Yakin Ingin Logout?",
    icon: "warning",
    confirmButtonText: "Ya, Keluar",
    cancelButtonText: "Batal",
    isDanger: true,
  });
}

/**
 * Dialog Konfirmasi Hapus Item Antrean Offline
 */
export async function showDeleteQueueConfirm(): Promise<boolean> {
  return showConfirmDialog({
    title: "Hapus Antrean",
    text: "Apakah Anda yakin ingin menghapus perubahan ini dari antrean offline?",
    icon: "warning",
    confirmButtonText: "Hapus",
    cancelButtonText: "Batal",
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
    confirmButtonText: "Mengerti",
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
    title: "Sesi Telah Berakhir",
    text: "Sesi akses Google Sheets Anda telah kedaluwarsa. Silakan perbarui sesi untuk melanjutkan sinkronisasi.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Perbarui Sesi",
    cancelButtonText: "Nanti",
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
    title: "Tabrakan Data (Conflict)",
    text: options.unitName
      ? `Data unit ${options.unitName} di Google Sheets telah berubah saat Anda offline. Pilih tindakan penyelesaian:`
      : "Data di Google Sheets telah berubah saat Anda offline. Pilih tindakan penyelesaian:",
    icon: "warning",
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: "Force Save (Timpa)",
    denyButtonText: "Gunakan Data Server",
    cancelButtonText: "Batal",
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
        Nilai di bawah akan langsung diterapkan ke seluruh <strong>${escapeHtml(unitCount)} unit bus</strong> pada rute ini dan disimpan ke spreadsheet.
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
    title: "Set Jumlah Trip Armada",
    html: formHtml,
    showCancelButton: true,
    confirmButtonText: "Terapkan",
    cancelButtonText: "Batal",
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
          "Harap isi nilai Trip Pergi dan Trip Pulang!",
        );
        return false;
      }

      const pNum = Number(pVal);
      const qNum = Number(qVal);

      if (isNaN(pNum) || isNaN(qNum) || pNum < 0 || qNum < 0) {
        pdoSwal.showValidationMessage("Nilai trip harus berupa angka positif!");
        return false;
      }

      if (pNum > 20 || qNum > 20) {
        pdoSwal.showValidationMessage(
          "Jumlah trip tidak boleh lebih dari 20!",
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
}

/**
 * Modal konfirmasi Bulk Copy KM Akhir Shift 1 ke KM Awal Shift 2
 */
export async function showBulkCopyKmModal(
  options: BulkCopyKmModalOptions,
): Promise<"only_empty" | "all" | null> {
  const { totalUnitsWithKmS1, emptyKmAwal2Count } = options;

  const formHtml = `
    <div class="swal-bus-input-container" style="display: flex; flex-direction: column; gap: 12px; text-align: left;">
      <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5;">
        Ditemukan <strong>${escapeHtml(totalUnitsWithKmS1)} unit bus</strong> yang memiliki data <strong>KM Akhir Shift 1</strong>.
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; padding: 12px; border-radius: 14px; background: rgba(56, 189, 248, 0.06); border: 1px solid var(--shift1-border, rgba(56, 189, 248, 0.25));">
        <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; user-select: none;">
          <input type="radio" name="swal-bulk-copy-mode" value="only_empty" checked style="margin-top: 3px; accent-color: var(--accent-color); transform: scale(1.1);" />
          <div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">Hanya isi yang masih kosong (${escapeHtml(emptyKmAwal2Count)} unit)</div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Direkomendasikan agar tidak menimpa data yang sudah diisi manual.</div>
          </div>
        </label>

        <div style="height: 1px; background: var(--card-border); margin: 4px 0;"></div>

        <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; user-select: none;">
          <input type="radio" name="swal-bulk-copy-mode" value="all" style="margin-top: 3px; accent-color: var(--accent-color); transform: scale(1.1);" />
          <div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">Salin & perbarui semua (${escapeHtml(totalUnitsWithKmS1)} unit)</div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Menimpa seluruh nilai KM Awal Shift 2 dengan KM Akhir Shift 1.</div>
          </div>
        </label>
      </div>
    </div>
  `;

  const result = await pdoSwal.fire({
    title: "Salin Massal KM S1 ➔ KM S2",
    html: formHtml,
    showCancelButton: true,
    confirmButtonText: "Terapkan Salin KM",
    cancelButtonText: "Batal",
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
      return selected ? (selected.value as "only_empty" | "all") : "only_empty";
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
    title: "Rapikan & Format Spreadsheet?",
    html: `
      <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.6; text-align: left;">
        Sistem akan merapikan seluruh baris data pada tanggal <strong>${tabName}</strong> di Google Sheets asli:
        <div style="margin-top: 10px; padding: 10px; border-radius: 10px; background: rgba(62, 207, 142, 0.08); border: 1px solid rgba(62, 207, 142, 0.2);">
          <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Standar Format yang Diterapkan:</div>
          <div style="font-size: 12px; color: var(--text-secondary);">
            • <strong>Teks & Perataan:</strong> Normal (tidak bold), Rata Tengah Horizontal & Vertikal, Wrap Text.<br/>
            • <strong>Warna Baris (No Body s/d Total KM S2):</strong><br/>
            &nbsp;&nbsp;🔵 Skyblue untuk <code>BA.01-04</code>, <code>NP1</code>, <code>NP2</code><br/>
            &nbsp;&nbsp;🟡 Kuning untuk <code>OFF</code><br/>
            &nbsp;&nbsp;🔴 Merah untuk <code>TO EVDAL</code><br/>
            &nbsp;&nbsp;🟢 Hijau Muda untuk Catatan Lainnya / Bebas
          </div>
        </div>
      </div>
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Rapikan Sheet",
    cancelButtonText: "Batal",
    customClass: {
      popup: "pdo-swal-popup",
      confirmButton: "pdo-swal-confirm-btn",
      cancelButton: "pdo-swal-cancel-btn",
    },
  });

  return result.isConfirmed;
}
