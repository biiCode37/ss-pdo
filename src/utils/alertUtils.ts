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
 * Helper HTML untuk merender Smart Keterangan Input Group
 * dengan Static Locked Prefix (BA.01-04) & Quick Preset Chips (OFF, NP1, NP2, TO EVDAL)
 */
function renderSmartKeteranganSection(
  initialKeterangan: string = "",
  wrapperId: string = "swal-wrapper-keterangan",
  isRevealed: boolean = true,
) {
  const cleanVal = (initialKeterangan || "").trim();
  const baMatch = cleanVal.match(/^(BA\.0[1-4])(?:\s*(.*))?$/i);
  const initialPrefix = baMatch ? baMatch[1].toUpperCase() : "";
  const initialDetail = baMatch ? baMatch[2] || "" : cleanVal;
  const isFixedVal = ["OFF", "NP1", "NP2", "TO EVDAL"].includes(
    cleanVal.toUpperCase(),
  );

  return `
    <div id="${wrapperId}" class="swal-revealed-field" style="display: ${isRevealed ? "block" : "none"}; margin-top: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <label style="display: block; font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">
          Catatan / Keterangan
        </label>
        <span style="font-size: 10px; color: var(--text-secondary); font-weight: 600;">Opsional</span>
      </div>

      <!-- Quick Preset & Prefix Chips -->
      <div class="swal-note-chips-bar" style="display: flex; flex-wrap: wrap; gap: 5px; align-items: center; margin-bottom: 8px;">
        <button type="button" class="swal-note-chip ${cleanVal.toUpperCase() === "OFF" ? "active" : ""}" data-type="fixed" data-val="OFF">OFF</button>
        <button type="button" class="swal-note-chip ${cleanVal.toUpperCase() === "NP1" ? "active" : ""}" data-type="fixed" data-val="NP1">NP1</button>
        <button type="button" class="swal-note-chip ${cleanVal.toUpperCase() === "NP2" ? "active" : ""}" data-type="fixed" data-val="NP2">NP2</button>
        <button type="button" class="swal-note-chip ${cleanVal.toUpperCase() === "TO EVDAL" ? "active" : ""}" data-type="fixed" data-val="TO EVDAL">TO EVDAL</button>
        
        <button type="button" class="swal-note-chip ${initialPrefix === "BA.01" ? "active" : ""}" data-type="ba" data-val="BA.01">⚠️ BA.01</button>
        <button type="button" class="swal-note-chip ${initialPrefix === "BA.02" ? "active" : ""}" data-type="ba" data-val="BA.02">⚠️ BA.02</button>
        <button type="button" class="swal-note-chip ${initialPrefix === "BA.03" ? "active" : ""}" data-type="ba" data-val="BA.03">⚠️ BA.03</button>
        <button type="button" class="swal-note-chip ${initialPrefix === "BA.04" ? "active" : ""}" data-type="ba" data-val="BA.04">⚠️ BA.04</button>

        <button type="button" class="swal-note-chip-clear" id="swal-btn-clear-note">✕ Hapus</button>
      </div>

      <!-- Input Group with Static Locked Prefix (Prefix tidak bisa diedit/dihapus di input) -->
      <div id="swal-note-input-group" style="display: flex; align-items: center; width: 100%; border: 1.5px solid var(--card-border); border-radius: 10px; background: var(--input-bg, var(--card-bg)); overflow: hidden; height: 40px; transition: border-color 0.2s;">
        <div id="swal-note-prefix-badge" style="display: ${initialPrefix ? "flex" : "none"}; padding: 0 8px; height: 100%; align-items: center; justify-content: center; background: rgba(239, 68, 68, 0.15); color: #f87171; font-weight: 800; font-size: 11.5px; border-right: 1px solid rgba(239, 68, 68, 0.3); white-space: nowrap; user-select: none; gap: 4px;">
          <span id="swal-note-prefix-text">${initialPrefix}</span>
          <button type="button" id="swal-btn-remove-prefix" title="Lepas prefix" style="background: none; border: none; color: inherit; cursor: pointer; padding: 0; font-weight: 800; font-size: 11px; opacity: 0.7;">✕</button>
        </div>

        <input
          id="swal-input-keterangan"
          type="text"
          class="input-field"
          placeholder="${isFixedVal ? "Nilai tetap terkunci" : initialPrefix ? "Ketik detail kendala/alasan..." : "Catatan unit..."}"
          value="${isFixedVal ? cleanVal.toUpperCase() : initialDetail}"
          ${isFixedVal ? "readonly" : ""}
          style="flex: 1; border: none; background: transparent; padding: 0 10px; font-size: 13px; height: 100%; border-radius: 0; outline: none; box-shadow: none; ${isFixedVal ? "cursor: default; font-weight: 700;" : ""}"
        />
      </div>
    </div>
  `;
}

/**
 * Setup event listeners untuk Smart Keterangan Input (Chips, Prefix Badge, Clear)
 */
function setupSmartKeteranganLogic(popup: HTMLElement) {
  const chips = popup.querySelectorAll<HTMLButtonElement>(".swal-note-chip");
  const clearBtn = popup.querySelector<HTMLButtonElement>(
    "#swal-btn-clear-note",
  );
  const prefixBadge = popup.querySelector<HTMLElement>(
    "#swal-note-prefix-badge",
  );
  const prefixText = popup.querySelector<HTMLElement>("#swal-note-prefix-text");
  const removePrefixBtn = popup.querySelector<HTMLButtonElement>(
    "#swal-btn-remove-prefix",
  );
  const noteInput = popup.querySelector<HTMLInputElement>(
    "#swal-input-keterangan",
  );

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const type = chip.getAttribute("data-type");
      const val = chip.getAttribute("data-val") || "";

      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");

      if (type === "ba") {
        // Locked prefix mode
        if (prefixBadge && prefixText) {
          prefixText.innerText = val;
          prefixBadge.style.display = "flex";
        }
        if (noteInput) {
          noteInput.readOnly = false;
          noteInput.style.cursor = "text";
          noteInput.style.fontWeight = "normal";
          noteInput.placeholder = "Ketik detail kendala/alasan...";
          // Jika sebelumnya isi input adalah preset fixed, bersihkan input detail
          if (
            ["OFF", "NP1", "NP2", "TO EVDAL"].includes(
              noteInput.value.trim().toUpperCase(),
            )
          ) {
            noteInput.value = "";
          }
          noteInput.focus();
        }
      } else if (type === "fixed") {
        // Fixed preset mode: nilai tetap, terkunci read-only, tidak dapat diedit atau ditambah teks
        if (prefixBadge) {
          prefixBadge.style.display = "none";
        }
        if (noteInput) {
          noteInput.value = val;
          noteInput.readOnly = true;
          noteInput.style.cursor = "default";
          noteInput.style.fontWeight = "700";
          noteInput.placeholder = "Nilai tetap terkunci";
        }
      }
    });
  });

  if (removePrefixBtn && prefixBadge) {
    removePrefixBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      prefixBadge.style.display = "none";
      chips.forEach((c) => c.classList.remove("active"));
      if (noteInput) {
        noteInput.readOnly = false;
        noteInput.style.cursor = "text";
        noteInput.style.fontWeight = "normal";
        noteInput.placeholder = "Catatan unit...";
        noteInput.focus();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (prefixBadge) prefixBadge.style.display = "none";
      if (noteInput) {
        noteInput.value = "";
        noteInput.readOnly = false;
        noteInput.style.cursor = "text";
        noteInput.style.fontWeight = "normal";
        noteInput.placeholder = "Catatan unit...";
        noteInput.focus();
      }
      chips.forEach((c) => c.classList.remove("active"));
    });
  }
}

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

        ${renderSmartKeteranganSection(bus.keterangan || "", "swal-wrapper-keterangan", hasKeterangan)}

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

        ${renderSmartKeteranganSection(bus.keterangan || "", "swal-wrapper-keterangan", hasKeterangan)}

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
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">
              ${singleMeta.label}
            </label>
            ${activeCategory === "kmAwal2" && bus.kmAkhir1 ? `
              <button type="button" id="swal-btn-copy-km-single" class="swal-copy-km-chip" title="Salin nilai KM Akhir Shift 1">
                📋 Salin KM S1 (${bus.kmAkhir1})
              </button>
            ` : ""}
          </div>
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

        ${renderSmartKeteranganSection(bus.keterangan || "", "swal-wrapper-keterangan", hasKeterangan)}

        <div class="pdo-swal-chips-container">
          ${!hasKeterangan ? `<button type="button" id="swal-chip-keterangan" class="pdo-swal-chip pdo-swal-chip-right">+ Catatan</button>` : ""}
        </div>
      </div>
    `;
  } else {
    // Mode Semua Kolom (ALL): Segmented Quick-Switch Tabs
    formHtml = `
      <div class="swal-bus-input-container" style="display: flex; flex-direction: column; gap: 8px; text-align: left;">
        
        <!-- Segmented Tab Switcher -->
        <div class="swal-segmented-bar">
          <button type="button" class="swal-segment-btn active" data-target="shift1">🔵 Shift 1</button>
          <button type="button" class="swal-segment-btn" data-target="shift2">🟣 Shift 2</button>
          <button type="button" class="swal-segment-btn" data-target="trip">🚌 Trip</button>
          <button type="button" class="swal-segment-btn" data-target="notes">📝 Catatan</button>
        </div>

        <!-- Panel 1: Shift 1 (Default Active) -->
        <div id="swal-panel-shift1" class="swal-panel-section" data-panel="shift1" style="display: block; padding: 12px; border-radius: 14px; background: rgba(56, 189, 248, 0.06); border: 1px solid var(--shift1-border, rgba(56, 189, 248, 0.25));">
          <div style="font-size: 11px; font-weight: 800; color: var(--shift1-color, #38bdf8); margin-bottom: 8px; text-transform: uppercase;">
            Data Shift 1
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div>
              <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 3px;">TOA S1</label>
              <input id="swal-input-toaShift1" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${bus.toaShift1 || ""}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 3px;">Manual S1</label>
              <input id="swal-input-manualShift1" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${bus.manualShift1 || ""}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 3px;">KM Awal S1</label>
              <input id="swal-input-kmAwal1" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${bus.kmAwal1 || ""}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 3px;">KM Akhir S1</label>
              <input id="swal-input-kmAkhir1" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${bus.kmAkhir1 || ""}" placeholder="0" />
            </div>
          </div>
        </div>

        <!-- Panel 2: Shift 2 -->
        <div id="swal-panel-shift2" class="swal-panel-section" data-panel="shift2" style="display: none; padding: 12px; border-radius: 14px; background: rgba(192, 132, 252, 0.06); border: 1px solid var(--shift2-border, rgba(192, 132, 252, 0.25));">
          <div style="font-size: 11px; font-weight: 800; color: var(--shift2-color, #c084fc); margin-bottom: 8px; text-transform: uppercase;">
            Data Shift 2
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div>
              <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 3px;">Total TOA</label>
              <input id="swal-input-totalToa" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${bus.totalToa || ""}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 3px;">Manual S2</label>
              <input id="swal-input-manualShift2" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${bus.manualShift2 || ""}" placeholder="0" />
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary);">KM Awal S2</label>
                <button type="button" id="swal-btn-copy-km-all" class="swal-copy-km-chip" title="Salin nilai KM Akhir Shift 1">
                  📋 Salin KM S1
                </button>
              </div>
              <input id="swal-input-kmAwal2" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${bus.kmAwal2 || ""}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 3px;">KM Akhir S2</label>
              <input id="swal-input-kmAkhir2" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${bus.kmAkhir2 || ""}" placeholder="0" />
            </div>
          </div>
        </div>

        <!-- Panel 3: Trip Operasional -->
        <div id="swal-panel-trip" class="swal-panel-section" data-panel="trip" style="display: none; padding: 12px; border-radius: 14px; background: rgba(56, 189, 248, 0.06); border: 1px solid var(--shift1-border, rgba(56, 189, 248, 0.25));">
          <div style="font-size: 11px; font-weight: 800; color: var(--accent-color); margin-bottom: 8px; text-transform: uppercase;">
            Trip Operasional
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div>
              <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 3px; line-height: 1.3;">
                ${tripPergiLabel}
              </label>
              <input id="swal-input-tripPergi" type="number" inputmode="numeric" class="input-field" style="padding: 8px 10px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${bus.tripPergi || ""}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 3px; line-height: 1.3;">
                ${tripPulangLabel}
              </label>
              <input id="swal-input-tripPulang" type="number" inputmode="numeric" class="input-field" style="padding: 8px 10px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${bus.tripPulang || ""}" placeholder="0" />
            </div>
          </div>
        </div>

        <!-- Panel 4: Catatan / Keterangan -->
        <div id="swal-panel-notes" class="swal-panel-section" data-panel="notes" style="display: none; padding: 12px; border-radius: 14px; background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.25);">
          <div style="font-size: 11px; font-weight: 800; color: var(--warning-text, #f59e0b); margin-bottom: 8px; text-transform: uppercase;">
            Catatan Khusus Unit
          </div>
          ${renderSmartKeteranganSection(bus.keterangan || "", "swal-wrapper-keterangan-notes", true)}
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
        if ((primaryInput as HTMLInputElement).select) {
          (primaryInput as HTMLInputElement).select();
        }
      }

      // Mode ALL: Setup Segmented Tabs Switcher
      if (isAll && popup) {
        const segButtons = popup.querySelectorAll<HTMLButtonElement>(".swal-segment-btn");
        const panels = popup.querySelectorAll<HTMLElement>(".swal-panel-section");
        segButtons.forEach((btn) => {
          btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-target");
            segButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            panels.forEach((p) => {
              if (p.getAttribute("data-panel") === target) {
                p.style.display = "block";
                const firstInput = p.querySelector<HTMLInputElement>("input");
                if (firstInput) {
                  firstInput.focus();
                  if (firstInput.select) firstInput.select();
                }
              } else {
                p.style.display = "none";
              }
            });
          });
        });
      }

      // Copy KM S1 to KM Awal S2 listeners
      const copyKmSingleBtn = document.getElementById("swal-btn-copy-km-single");
      if (copyKmSingleBtn) {
        copyKmSingleBtn.addEventListener("click", () => {
          const singleInput = document.getElementById("swal-input-single") as HTMLInputElement | null;
          if (singleInput && bus.kmAkhir1) {
            singleInput.value = bus.kmAkhir1;
            singleInput.focus();
            if (singleInput.select) singleInput.select();
          }
        });
      }

      const copyKmAllBtn = document.getElementById("swal-btn-copy-km-all");
      if (copyKmAllBtn) {
        copyKmAllBtn.addEventListener("click", () => {
          const kmAkhir1Input = document.getElementById("swal-input-kmAkhir1") as HTMLInputElement | null;
          const kmAwal2Input = document.getElementById("swal-input-kmAwal2") as HTMLInputElement | null;
          const valToCopy = kmAkhir1Input?.value || bus.kmAkhir1 || "";
          if (kmAwal2Input && valToCopy) {
            kmAwal2Input.value = valToCopy;
            kmAwal2Input.focus();
            if (kmAwal2Input.select) kmAwal2Input.select();
          }
        });
      }

      // Smart Keterangan logic (Chips, Prefix Badge, Clear)
      if (popup) {
        setupSmartKeteranganLogic(popup);
      }
    },
    preConfirm: () => {
      const updates: Record<string, string> = {};

      const getVal = (id: string) => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        return el ? el.value : "";
      };

      const noteInput = document.getElementById(
        "swal-input-keterangan",
      ) as HTMLInputElement | null;
      const prefixBadge = document.getElementById("swal-note-prefix-badge");
      const prefixText = document.getElementById("swal-note-prefix-text");

      let resolvedKeterangan = "";
      if (noteInput) {
        const rawDetail = noteInput.value
          .replace(/\s+/g, " ")
          .trim()
          .toUpperCase();
        const hasActivePrefix =
          prefixBadge &&
          prefixBadge.style.display !== "none" &&
          prefixText &&
          prefixText.innerText.trim() !== "";
        if (hasActivePrefix) {
          const prefix = prefixText.innerText.trim().toUpperCase();
          resolvedKeterangan = rawDetail ? `${prefix} ${rawDetail}` : prefix;
        } else {
          resolvedKeterangan = rawDetail;
        }
      }

      if (activeCategory === "toaShift1") {
        const rawToa1 = getVal("swal-input-toaShift1").trim();
        const manualElem = document.getElementById(
          "swal-input-manualShift1",
        ) as HTMLInputElement | null;
        const rawManual1 = manualElem ? manualElem.value.trim() : "";

        // Validasi batas maksimal 3 digit angka (0 - 999)
        if (
          rawToa1 &&
          (isNaN(Number(rawToa1)) ||
            Number(rawToa1) < 0 ||
            Number(rawToa1) > 999)
        ) {
          Swal.showValidationMessage(
            "TOA Shift 1 maksimal 3 digit angka (0 - 999)!",
          );
          return false;
        }
        if (
          rawManual1 &&
          (isNaN(Number(rawManual1)) ||
            Number(rawManual1) < 0 ||
            Number(rawManual1) > 999)
        ) {
          Swal.showValidationMessage(
            "Manual Shift 1 maksimal 3 digit angka (0 - 999)!",
          );
          return false;
        }

        // Korelasi: TOA S1 tidak boleh melebihi Total TOA jika Total TOA sudah terisi
        if (
          rawToa1 &&
          bus.totalToa &&
          !isNaN(Number(bus.totalToa)) &&
          Number(rawToa1) > Number(bus.totalToa)
        ) {
          Swal.showValidationMessage(
            `TOA Shift 1 (${rawToa1}) tidak boleh melebihi Total TOA (${bus.totalToa})!`,
          );
          return false;
        }

        const isOff = resolvedKeterangan === "OFF";
        const isNp1 = resolvedKeterangan === "NP1";

        // Unit OFF atau NP1 atau nilai 0/kosong: biarkan kosong ("") di spreadsheet
        updates.toaShift1 = isOff || isNp1 ? "" : rawToa1;
        updates.manualShift1 =
          isOff || isNp1 || rawManual1 === "0" ? "" : rawManual1;
        if (noteInput) updates.keterangan = resolvedKeterangan;
      } else if (activeCategory === "totalToa") {
        const rawTotalToa = getVal("swal-input-totalToa").trim();
        const manualElem = document.getElementById(
          "swal-input-manualShift2",
        ) as HTMLInputElement | null;
        const rawManual2 = manualElem ? manualElem.value.trim() : "";

        // Validasi Total TOA (maksimal 4 digit / 0 - 9999)
        if (
          rawTotalToa &&
          (isNaN(Number(rawTotalToa)) ||
            Number(rawTotalToa) < 0 ||
            Number(rawTotalToa) > 9999)
        ) {
          Swal.showValidationMessage(
            "Total TOA maksimal 4 digit angka (0 - 9999)!",
          );
          return false;
        }

        // Validasi Manual Shift 2 (maksimal 3 digit / 0 - 999)
        if (
          rawManual2 &&
          (isNaN(Number(rawManual2)) ||
            Number(rawManual2) < 0 ||
            Number(rawManual2) > 999)
        ) {
          Swal.showValidationMessage(
            "Manual Shift 2 maksimal 3 digit angka (0 - 999)!",
          );
          return false;
        }

        // Korelasi: Total TOA tidak boleh lebih kecil dari TOA Shift 1
        if (
          rawTotalToa &&
          bus.toaShift1 &&
          !isNaN(Number(bus.toaShift1)) &&
          Number(rawTotalToa) < Number(bus.toaShift1)
        ) {
          Swal.showValidationMessage(
            `Total TOA (${rawTotalToa}) tidak boleh lebih kecil dari TOA Shift 1 (${bus.toaShift1})!`,
          );
          return false;
        }

        const isOff = resolvedKeterangan === "OFF";
        const isNp2 = resolvedKeterangan === "NP2";

        // Unit OFF atau NP2 atau nilai 0/kosong: biarkan kosong ("") di spreadsheet
        updates.totalToa = isOff ? "" : rawTotalToa;
        updates.manualShift2 =
          isOff || isNp2 || rawManual2 === "0" ? "" : rawManual2;
        if (noteInput) updates.keterangan = resolvedKeterangan;
      } else if (!isAll && singleMeta) {
        const inputElem = document.getElementById(
          "swal-input-single",
        ) as HTMLInputElement | null;
        if (inputElem) {
          updates[singleMeta.key] = inputElem.value;
        }
        if (noteInput) {
          updates.keterangan = resolvedKeterangan;
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

        if (kmA1 && kmAk1) {
          const numA1 = Number(kmA1);
          const numAk1 = Number(kmAk1);
          if (numAk1 < numA1) {
            Swal.showValidationMessage(
              "KM Akhir S1 tidak boleh lebih kecil dari KM Awal S1!",
            );
            return false;
          }
          if (numAk1 - numA1 > 150) {
            Swal.showValidationMessage(
              `Jarak tempuh Shift 1 (${numAk1 - numA1} km) tidak boleh lebih dari 150 km!`,
            );
            return false;
          }
        }
        if (kmA2 && kmAk2) {
          const numA2 = Number(kmA2);
          const numAk2 = Number(kmAk2);
          if (numAk2 < numA2) {
            Swal.showValidationMessage(
              "KM Akhir S2 tidak boleh lebih kecil dari KM Awal S2!",
            );
            return false;
          }
          if (numAk2 - numA2 > 150) {
            Swal.showValidationMessage(
              `Jarak tempuh Shift 2 (${numAk2 - numA2} km) tidak boleh lebih dari 150 km!`,
            );
            return false;
          }
        }
        if (kmAk1 && kmA2 && Number(kmA2) < Number(kmAk1)) {
          Swal.showValidationMessage(
            "KM Awal S2 tidak boleh lebih kecil dari KM Akhir S1!",
          );
          return false;
        }

        const isOff = resolvedKeterangan === "OFF";
        if (isOff) {
          updates[singleMeta.key] = "";
        }
      } else {
        // Mode ALL
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

        if (kmAwal1 && kmAkhir1) {
          const numA1 = Number(kmAwal1);
          const numAk1 = Number(kmAkhir1);
          if (numAk1 < numA1) {
            Swal.showValidationMessage(
              "KM Akhir S1 tidak boleh lebih kecil dari KM Awal S1!",
            );
            return false;
          }
          if (numAk1 - numA1 > 150) {
            Swal.showValidationMessage(
              `Jarak tempuh Shift 1 (${numAk1 - numA1} km) tidak boleh lebih dari 150 km!`,
            );
            return false;
          }
        }
        if (kmAwal2 && kmAkhir2) {
          const numA2 = Number(kmAwal2);
          const numAk2 = Number(kmAkhir2);
          if (numAk2 < numA2) {
            Swal.showValidationMessage(
              "KM Akhir S2 tidak boleh lebih kecil dari KM Awal S2!",
            );
            return false;
          }
          if (numAk2 - numA2 > 150) {
            Swal.showValidationMessage(
              `Jarak tempuh Shift 2 (${numAk2 - numA2} km) tidak boleh lebih dari 150 km!`,
            );
            return false;
          }
        }
        if (kmAkhir1 && kmAwal2 && Number(kmAwal2) < Number(kmAkhir1)) {
          Swal.showValidationMessage(
            "KM Awal S2 tidak boleh lebih kecil dari KM Akhir S1!",
          );
          return false;
        }

        // Validasi batasan trip (0 s/d 20)
        if (
          tripPergi &&
          (isNaN(Number(tripPergi)) ||
            Number(tripPergi) < 0 ||
            Number(tripPergi) > 20)
        ) {
          Swal.showValidationMessage(
            "Trip Pergi harus berupa angka antara 0 sampai 20!",
          );
          return false;
        }
        if (
          tripPulang &&
          (isNaN(Number(tripPulang)) ||
            Number(tripPulang) < 0 ||
            Number(tripPulang) > 20)
        ) {
          Swal.showValidationMessage(
            "Trip Pulang harus berupa angka antara 0 sampai 20!",
          );
          return false;
        }

        // Validasi batasan TOA S1 (max 3 digit / 999) & Manual S1 (max 3 digit / 999)
        if (
          toaShift1 &&
          (isNaN(Number(toaShift1)) ||
            Number(toaShift1) < 0 ||
            Number(toaShift1) > 999)
        ) {
          Swal.showValidationMessage(
            "TOA Shift 1 maksimal 3 digit angka (0 - 999)!",
          );
          return false;
        }
        if (
          manualShift1 &&
          (isNaN(Number(manualShift1)) ||
            Number(manualShift1) < 0 ||
            Number(manualShift1) > 999)
        ) {
          Swal.showValidationMessage(
            "Manual Shift 1 maksimal 3 digit angka (0 - 999)!",
          );
          return false;
        }

        // Validasi batasan Total TOA (max 4 digit / 9999) & Manual S2 (max 3 digit / 999)
        if (
          totalToa &&
          (isNaN(Number(totalToa)) ||
            Number(totalToa) < 0 ||
            Number(totalToa) > 9999)
        ) {
          Swal.showValidationMessage(
            "Total TOA maksimal 4 digit angka (0 - 9999)!",
          );
          return false;
        }
        if (
          manualShift2 &&
          (isNaN(Number(manualShift2)) ||
            Number(manualShift2) < 0 ||
            Number(manualShift2) > 999)
        ) {
          Swal.showValidationMessage(
            "Manual Shift 2 maksimal 3 digit angka (0 - 999)!",
          );
          return false;
        }

        // Jika Total TOA terisi & TOA S1 terisi, validasi Total TOA >= TOA S1
        if (
          toaShift1 &&
          totalToa &&
          !isNaN(Number(toaShift1)) &&
          !isNaN(Number(totalToa)) &&
          Number(totalToa) < Number(toaShift1)
        ) {
          Swal.showValidationMessage(
            `Total TOA (${totalToa}) tidak boleh lebih kecil dari TOA Shift 1 (${toaShift1})!`,
          );
          return false;
        }

        // Unit OFF / NP: Trip, Transaksi, dan KM otomatis disesuaikan sesuai standar SS asli
        const isOffUnit = resolvedKeterangan === "OFF";
        const isNp1Unit = resolvedKeterangan === "NP1";
        const isNp2Unit = resolvedKeterangan === "NP2";

        updates.tripPergi = isOffUnit ? "" : tripPergi;
        updates.tripPulang = isOffUnit ? "" : tripPulang;

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
        Ditemukan <strong>${totalUnitsWithKmS1} unit bus</strong> yang memiliki data <strong>KM Akhir Shift 1</strong>.
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; padding: 12px; border-radius: 14px; background: rgba(56, 189, 248, 0.06); border: 1px solid var(--shift1-border, rgba(56, 189, 248, 0.25));">
        <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; user-select: none;">
          <input type="radio" name="swal-bulk-copy-mode" value="only_empty" checked style="margin-top: 3px; accent-color: var(--accent-color); transform: scale(1.1);" />
          <div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">Hanya isi yang masih kosong (${emptyKmAwal2Count} unit)</div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Direkomendasikan agar tidak menimpa data yang sudah diisi manual.</div>
          </div>
        </label>

        <div style="height: 1px; background: var(--card-border); margin: 4px 0;"></div>

        <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; user-select: none;">
          <input type="radio" name="swal-bulk-copy-mode" value="all" style="margin-top: 3px; accent-color: var(--accent-color); transform: scale(1.1);" />
          <div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">Salin & perbarui semua (${totalUnitsWithKmS1} unit)</div>
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
        <div style="margin-top: 10px; padding: 10px; border-radius: 10px; background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2);">
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
