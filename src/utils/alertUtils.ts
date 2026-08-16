import Swal from "sweetalert2";
import type { SweetAlertIcon, SweetAlertPosition } from "sweetalert2";
import type { BusData, HeaderMap } from "../services/googleSheets";

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

export interface BusInputModalOptions {
  bus: BusData;
  activeCategory: string;
  tabName: string;
  headerMap?: HeaderMap;
}

const CATEGORY_META: Record<
  string,
  { label: string; placeholder: string; key: keyof BusData }
> = {
  toaShift1: {
    label: "TOA Shift 1",
    placeholder: "Contoh: 120",
    key: "toaShift1",
  },
  totalToa: {
    label: "Total TOA",
    placeholder: "Contoh: 250",
    key: "totalToa",
  },
  kmAwal1: {
    label: "KM Awal Shift 1",
    placeholder: "Contoh: 12450",
    key: "kmAwal1",
  },
  kmAkhir1: {
    label: "KM Akhir Shift 1",
    placeholder: "Contoh: 12580",
    key: "kmAkhir1",
  },
  kmAwal2: {
    label: "KM Awal Shift 2",
    placeholder: "Contoh: 12580",
    key: "kmAwal2",
  },
  kmAkhir2: {
    label: "KM Akhir Shift 2",
    placeholder: "Contoh: 12710",
    key: "kmAkhir2",
  },
};

/**
 * Dialog SweetAlert2 untuk Form Input Data Bus yang dinamis menyesuaikan kategori kolom aktif
 */
export async function showBusInputModal(
  options: BusInputModalOptions,
): Promise<Partial<BusData> | null> {
  const { bus, activeCategory, headerMap } = options;
  const isAll = activeCategory === "ALL";
  const singleMeta = CATEGORY_META[activeCategory];

  const tripPergiLabel = headerMap?.tripPergiLabel || "Trip Pergi";
  const tripPulangLabel = headerMap?.tripPulangLabel || "Trip Pulang";

  const hasManual1 = Boolean(
    bus.manualShift1 && bus.manualShift1.trim() !== "",
  );
  const hasManual2 = Boolean(
    bus.manualShift2 && bus.manualShift2.trim() !== "",
  );
  const hasKeterangan = Boolean(bus.keterangan && bus.keterangan.trim() !== "");

  let formHtml = "";

  if (activeCategory === "toaShift1") {
    // Mode Khusus TOA S1: TOA Shift 1 + Progressive Chips (Manual S1 & Keterangan)
    formHtml = `
      <div class="swal-bus-input-container" style="text-align: left; display: flex; flex-direction: column; gap: 10px;">
        <div>
          <label style="display: block; font-size: 11px; font-weight: 700; color: var(--shift1-color, #38bdf8); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            TOA Shift 1
          </label>
          <input
            id="swal-input-toaShift1"
            type="number"
            inputmode="numeric"
            pattern="[0-9]*"
            class="input-field"
            placeholder="0"
            value="${bus.toaShift1 || ""}"
            style="font-size: 20px; font-weight: 700; text-align: center; height: 48px; border-radius: 12px; border: 1.5px solid var(--shift1-border, #38bdf8); width: 100%;"
          />
        </div>

        <div id="swal-wrapper-manualShift1" class="swal-revealed-field" style="display: ${hasManual1 ? "block" : "none"};">
          <label style="display: block; font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            Manual Shift 1
          </label>
          <input
            id="swal-input-manualShift1"
            type="number"
            inputmode="numeric"
            pattern="[0-9]*"
            class="input-field"
            placeholder="0"
            value="${bus.manualShift1 || ""}"
            style="font-size: 16px; font-weight: 700; text-align: center; height: 42px; border-radius: 10px; width: 100%;"
          />
        </div>

        <div id="swal-wrapper-keterangan" class="swal-revealed-field" style="display: ${hasKeterangan ? "block" : "none"};">
          <label style="display: block; font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            Catatan / Keterangan (Opsional)
          </label>
          <input
            id="swal-input-keterangan"
            type="text"
            class="input-field"
            placeholder="Catatan unit..."
            value="${bus.keterangan || ""}"
            style="font-size: 13px; height: 38px; border-radius: 10px; width: 100%;"
          />
        </div>

        <div class="pdo-swal-chips-container">
          ${!hasManual1 ? `<button type="button" id="swal-chip-manualShift1" class="pdo-swal-chip">+ Manual S1</button>` : ""}
          ${!hasKeterangan ? `<button type="button" id="swal-chip-keterangan" class="pdo-swal-chip pdo-swal-chip-right">+ Catatan</button>` : ""}
        </div>
      </div>
    `;
  } else if (activeCategory === "totalToa") {
    // Mode Khusus Total TOA: Total TOA + Progressive Chips (Manual S2 & Keterangan)
    formHtml = `
      <div class="swal-bus-input-container" style="text-align: left; display: flex; flex-direction: column; gap: 10px;">
        <div>
          <label style="display: block; font-size: 11px; font-weight: 700; color: var(--shift1-color, #38bdf8); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            Total TOA
          </label>
          <input
            id="swal-input-totalToa"
            type="number"
            inputmode="numeric"
            pattern="[0-9]*"
            class="input-field"
            placeholder="0"
            value="${bus.totalToa || ""}"
            style="font-size: 20px; font-weight: 700; text-align: center; height: 48px; border-radius: 12px; border: 1.5px solid var(--shift1-border, #38bdf8); width: 100%;"
          />
        </div>

        <div id="swal-wrapper-manualShift2" class="swal-revealed-field" style="display: ${hasManual2 ? "block" : "none"};">
          <label style="display: block; font-size: 11px; font-weight: 700; color: var(--shift2-color, #c084fc); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            Manual Shift 2
          </label>
          <input
            id="swal-input-manualShift2"
            type="number"
            inputmode="numeric"
            pattern="[0-9]*"
            class="input-field"
            placeholder="0"
            value="${bus.manualShift2 || ""}"
            style="font-size: 16px; font-weight: 700; text-align: center; height: 42px; border-radius: 10px; width: 100%;"
          />
        </div>

        <div id="swal-wrapper-keterangan" class="swal-revealed-field" style="display: ${hasKeterangan ? "block" : "none"};">
          <label style="display: block; font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            Catatan / Keterangan (Opsional)
          </label>
          <input
            id="swal-input-keterangan"
            type="text"
            class="input-field"
            placeholder="Catatan unit..."
            value="${bus.keterangan || ""}"
            style="font-size: 13px; height: 38px; border-radius: 10px; width: 100%;"
          />
        </div>

        <div class="pdo-swal-chips-container">
          ${!hasManual2 ? `<button type="button" id="swal-chip-manualShift2" class="pdo-swal-chip">+ Manual S2</button>` : ""}
          ${!hasKeterangan ? `<button type="button" id="swal-chip-keterangan" class="pdo-swal-chip pdo-swal-chip-right">+ Catatan</button>` : ""}
        </div>
      </div>
    `;
  } else if (!isAll && singleMeta) {
    // Mode Kolom Tunggal KM: Input KM + Progressive Chip Catatan
    const currentVal = (bus[singleMeta.key] as string) || "";
    formHtml = `
      <div class="swal-bus-input-container" style="text-align: left; display: flex; flex-direction: column; gap: 10px;">
        <div>
          <label style="display: block; font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${singleMeta.label}
          </label>
          <input
            id="swal-input-single"
            type="number"
            inputmode="numeric"
            pattern="[0-9]*"
            class="input-field"
            placeholder="${singleMeta.placeholder}"
            value="${currentVal}"
            style="font-size: 20px; font-weight: 700; text-align: center; height: 48px; border-radius: 12px; border: 1.5px solid var(--accent-color); width: 100%;"
          />
        </div>

        <div id="swal-wrapper-keterangan" class="swal-revealed-field" style="display: ${hasKeterangan ? "block" : "none"};">
          <label style="display: block; font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            Catatan / Keterangan (Opsional)
          </label>
          <input
            id="swal-input-keterangan"
            type="text"
            class="input-field"
            placeholder="Catatan unit..."
            value="${bus.keterangan || ""}"
            style="font-size: 13px; height: 38px; border-radius: 10px; width: 100%;"
          />
        </div>

        <div class="pdo-swal-chips-container">
          ${!hasKeterangan ? `<button type="button" id="swal-chip-keterangan" class="pdo-swal-chip pdo-swal-chip-right">+ Catatan</button>` : ""}
        </div>
      </div>
    `;
  } else {
    // Mode Semua Kolom (ALL)
    formHtml = `
      <div class="swal-bus-input-container" style="display: flex; flex-direction: column; gap: 10px; text-align: left;">
        <div style="padding: 10px 12px; border-radius: 12px; background: rgba(56, 189, 248, 0.06); border: 1px solid var(--shift1-border, rgba(56, 189, 248, 0.25));">
          <div style="font-size: 11px; font-weight: 800; color: var(--accent-color); margin-bottom: 8px; text-transform: uppercase;">
            Trip Operasional
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div>
              <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 3px; line-height: 1.3;">
                ${tripPergiLabel}
              </label>
              <input id="swal-input-tripPergi" type="number" inputmode="numeric" class="input-field" style="padding: 8px 10px; font-size: 14px; font-weight: 700; height: 36px;" value="${bus.tripPergi || ""}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 3px; line-height: 1.3;">
                ${tripPulangLabel}
              </label>
              <input id="swal-input-tripPulang" type="number" inputmode="numeric" class="input-field" style="padding: 8px 10px; font-size: 14px; font-weight: 700; height: 36px;" value="${bus.tripPulang || ""}" placeholder="0" />
            </div>
          </div>
        </div>

        <div style="padding: 10px; border-radius: 12px; background: rgba(56, 189, 248, 0.08); border: 1px solid var(--shift1-border);">
          <div style="font-size: 11px; font-weight: 800; color: var(--shift1-color); margin-bottom: 8px; text-transform: uppercase;">
            Shift 1
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div>
              <label style="font-size: 10.5px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 2px;">TOA S1</label>
              <input id="swal-input-toaShift1" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 13.5px; height: 36px;" value="${bus.toaShift1 || ""}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 10.5px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 2px;">Manual S1</label>
              <input id="swal-input-manualShift1" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 13.5px; height: 36px;" value="${bus.manualShift1 || ""}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 10.5px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 2px;">KM Awal S1</label>
              <input id="swal-input-kmAwal1" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 13.5px; height: 36px;" value="${bus.kmAwal1 || ""}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 10.5px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 2px;">KM Akhir S1</label>
              <input id="swal-input-kmAkhir1" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 13.5px; height: 36px;" value="${bus.kmAkhir1 || ""}" placeholder="0" />
            </div>
          </div>
        </div>

        <div style="padding: 10px; border-radius: 12px; background: rgba(192, 132, 252, 0.08); border: 1px solid var(--shift2-border);">
          <div style="font-size: 11px; font-weight: 800; color: var(--shift2-color); margin-bottom: 8px; text-transform: uppercase;">
            Shift 2
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div>
              <label style="font-size: 10.5px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 2px;">Total TOA</label>
              <input id="swal-input-totalToa" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 13.5px; height: 36px;" value="${bus.totalToa || ""}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 10.5px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 2px;">Manual S2</label>
              <input id="swal-input-manualShift2" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 13.5px; height: 36px;" value="${bus.manualShift2 || ""}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 10.5px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 2px;">KM Awal S2</label>
              <input id="swal-input-kmAwal2" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 13.5px; height: 36px;" value="${bus.kmAwal2 || ""}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 10.5px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 2px;">KM Akhir S2</label>
              <input id="swal-input-kmAkhir2" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 13.5px; height: 36px;" value="${bus.kmAkhir2 || ""}" placeholder="0" />
            </div>
          </div>
        </div>

        <div>
          <label style="font-size: 10.5px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 2px;">Catatan / Keterangan</label>
          <input id="swal-input-keterangan" type="text" class="input-field" style="padding: 8px; font-size: 13px; height: 36px;" value="${bus.keterangan || ""}" placeholder="Catatan unit..." />
        </div>
      </div>
    `;
  }

  const result = await pdoSwal.fire({
    title: bus.unit,
    html: formHtml,
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal",
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
      // Toggle progressive disclosure chips
      const setupChipToggle = (
        chipId: string,
        wrapperId: string,
        inputId: string,
      ) => {
        const chip = document.getElementById(chipId);
        const wrapper = document.getElementById(wrapperId);
        const input = document.getElementById(inputId);
        if (chip && wrapper) {
          chip.addEventListener("click", () => {
            chip.style.display = "none";
            wrapper.style.display = "block";
            if (input) input.focus();
          });
        }
      };

      setupChipToggle(
        "swal-chip-manualShift1",
        "swal-wrapper-manualShift1",
        "swal-input-manualShift1",
      );
      setupChipToggle(
        "swal-chip-manualShift2",
        "swal-wrapper-manualShift2",
        "swal-input-manualShift2",
      );
      setupChipToggle(
        "swal-chip-keterangan",
        "swal-wrapper-keterangan",
        "swal-input-keterangan",
      );

      // Keydown Enter listener to trigger clickConfirm()
      const popup = pdoSwal.getPopup();
      if (popup) {
        popup.addEventListener("keydown", (e: KeyboardEvent) => {
          if (
            e.key === "Enter" &&
            (e.target as HTMLElement)?.tagName === "INPUT"
          ) {
            e.preventDefault();
            pdoSwal.clickConfirm();
          }
        });

        // Smart auto-scroll when input focused (Mobile Virtual Keyboard Friendly)
        const inputs = popup.querySelectorAll<HTMLInputElement>("input");
        inputs.forEach((input) => {
          input.addEventListener("focus", () => {
            setTimeout(() => {
              input.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 180);
          });
        });
      }

      // Auto-focus primary input
      let primaryInput: HTMLElement | null = null;
      if (activeCategory === "toaShift1") {
        primaryInput = document.getElementById("swal-input-toaShift1");
      } else if (activeCategory === "totalToa") {
        primaryInput = document.getElementById("swal-input-totalToa");
      } else if (isAll) {
        primaryInput = document.getElementById("swal-input-toaShift1");
      } else {
        primaryInput = document.getElementById("swal-input-single");
      }
      if (primaryInput) {
        primaryInput.focus();
      }
    },
    preConfirm: () => {
      const updates: Record<string, string> = {};

      const getVal = (id: string) => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        return el ? el.value : "";
      };

      if (activeCategory === "toaShift1") {
        updates.toaShift1 = getVal("swal-input-toaShift1");
        const manualElem = document.getElementById(
          "swal-input-manualShift1",
        ) as HTMLInputElement | null;
        if (manualElem) updates.manualShift1 = manualElem.value;
        const ketElem = document.getElementById(
          "swal-input-keterangan",
        ) as HTMLInputElement | null;
        if (ketElem) updates.keterangan = ketElem.value;
      } else if (activeCategory === "totalToa") {
        updates.totalToa = getVal("swal-input-totalToa");
        const manualElem = document.getElementById(
          "swal-input-manualShift2",
        ) as HTMLInputElement | null;
        if (manualElem) updates.manualShift2 = manualElem.value;
        const ketElem = document.getElementById(
          "swal-input-keterangan",
        ) as HTMLInputElement | null;
        if (ketElem) updates.keterangan = ketElem.value;
      } else if (!isAll && singleMeta) {
        const inputElem = document.getElementById(
          "swal-input-single",
        ) as HTMLInputElement | null;
        if (inputElem) {
          updates[singleMeta.key] = inputElem.value;
        }
        const ketElem = document.getElementById(
          "swal-input-keterangan",
        ) as HTMLInputElement | null;
        if (ketElem) {
          updates.keterangan = ketElem.value;
        }

        // Validation for single KM fields against existing bus data
        const kmA1 =
          singleMeta.key === "kmAwal1" ? inputElem?.value : bus.kmAwal1;
        const kmAk1 =
          singleMeta.key === "kmAkhir1" ? inputElem?.value : bus.kmAkhir1;
        const kmA2 =
          singleMeta.key === "kmAwal2" ? inputElem?.value : bus.kmAwal2;
        const kmAk2 =
          singleMeta.key === "kmAkhir2" ? inputElem?.value : bus.kmAkhir2;

        if (kmA1 && kmAk1 && Number(kmAk1) < Number(kmA1)) {
          Swal.showValidationMessage(
            "KM Akhir S1 tidak boleh lebih kecil dari KM Awal S1",
          );
          return false;
        }
        if (kmA2 && kmAk2 && Number(kmAk2) < Number(kmA2)) {
          Swal.showValidationMessage(
            "KM Akhir S2 tidak boleh lebih kecil dari KM Awal S2",
          );
          return false;
        }
        if (kmAk1 && kmA2 && Number(kmA2) < Number(kmAk1)) {
          Swal.showValidationMessage(
            "KM Awal S2 tidak boleh lebih kecil dari KM Akhir S1",
          );
          return false;
        }
        const tripPergi = getVal("swal-input-tripPergi");
        const tripPulang = getVal("swal-input-tripPulang");
        const toaShift1 = getVal("swal-input-toaShift1");
        const totalToa = getVal("swal-input-totalToa");
        const manualShift1 = getVal("swal-input-manualShift1");
        const manualShift2 = getVal("swal-input-manualShift2");
        const kmAwal1 = getVal("swal-input-kmAwal1");
        const kmAkhir1 = getVal("swal-input-kmAkhir1");
        const kmAwal2 = getVal("swal-input-kmAwal2");
        const kmAkhir2 = getVal("swal-input-kmAkhir2");
        const keterangan = getVal("swal-input-keterangan");

        if (kmAwal1 && kmAkhir1 && Number(kmAkhir1) < Number(kmAwal1)) {
          Swal.showValidationMessage(
            "KM Akhir S1 tidak boleh lebih kecil dari KM Awal S1",
          );
          return false;
        }
        if (kmAwal2 && kmAkhir2 && Number(kmAkhir2) < Number(kmAwal2)) {
          Swal.showValidationMessage(
            "KM Akhir S2 tidak boleh lebih kecil dari KM Awal S2",
          );
          return false;
        }
        if (kmAkhir1 && kmAwal2 && Number(kmAwal2) < Number(kmAkhir1)) {
          Swal.showValidationMessage(
            "KM Awal S2 tidak boleh lebih kecil dari KM Akhir S1",
          );
          return false;
        }

        updates.tripPergi = tripPergi;
        updates.tripPulang = tripPulang;
        updates.toaShift1 = toaShift1;
        updates.totalToa = totalToa;
        updates.manualShift1 = manualShift1;
        updates.manualShift2 = manualShift2;
        updates.kmAwal1 = kmAwal1;
        updates.kmAkhir1 = kmAkhir1;
        updates.kmAwal2 = kmAwal2;
        updates.kmAkhir2 = kmAkhir2;
        updates.keterangan = keterangan;
      }

      return updates;
    },
  });

  if (result.isConfirmed && result.value) {
    return result.value as Partial<BusData>;
  }

  return null;
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
  const tripPergiLabel = headerMap?.tripPergiLabel || "Trip Pergi";
  const tripPulangLabel = headerMap?.tripPulangLabel || "Trip Pulang";

  const formHtml = `
    <div class="swal-bus-input-container" style="display: flex; flex-direction: column; gap: 12px; text-align: left;">
      <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45;">
        Nilai di bawah akan langsung diterapkan ke seluruh <strong>${unitCount} unit bus</strong> pada rute ini dan disimpan ke spreadsheet.
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
            value="${currentPergi}"
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
            value="${currentPulang}"
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
    confirmButtonText: "Terapkan ke Semua Unit",
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
        const bulkInputs = bulkPopup.querySelectorAll<HTMLInputElement>("input");
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

      return {
        tripPergi: pVal,
        tripPulang: qVal,
      };
    },
  });

  if (result.isConfirmed && result.value) {
    return result.value;
  }
  return null;
}
