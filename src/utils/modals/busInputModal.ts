import { pdoSwal } from "../alertUtils";
import type { BusData, HeaderMap } from "../../services/googleSheets";
import { parseIndonesianNumber } from "../numberUtils";
import { normalizeKeterangan, parseKeterangan } from "../keteranganUtils";

export interface BusModalOptions {
  bus: BusData;
  headerMap?: HeaderMap;
  activeCategory?: string; // 'all' | 'ALL' | 'toaShift1' | 'totalToa' | 'kmAwal1' | etc.
  tabName?: string;
}

const SINGLE_COLUMN_META: Record<
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
 * Helper to escape HTML characters in dynamic strings
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
 * Helper HTML untuk merender Smart Keterangan Input Group
 * dengan Static Locked Prefix (BA.01-04) & Quick Preset Chips (OFF, NP1, NP2, TO EVDAL)
 */
function renderSmartKeteranganSection(
  initialKeterangan: string = "",
  wrapperId: string = "swal-wrapper-keterangan",
  isRevealed: boolean = true,
) {
  const parsed = parseKeterangan(initialKeterangan);
  const initialPrefix = parsed.prefix || "";
  const initialDetail = parsed.detail;
  const isFixedVal = parsed.isFixed;
  const cleanVal = parsed.fixedValue || parsed.normalized;

  const isBa02 = initialPrefix === "BA.02";
  const isNp1 = isBa02 && initialDetail.toUpperCase() === "NP1";
  const isNp2 = isBa02 && initialDetail.toUpperCase() === "NP2";
  const isCustomBa02 =
    isBa02 && !isNp1 && !isNp2 && initialDetail.trim() !== "";
  const ba02SelectedOption = isNp1
    ? "NP1"
    : isNp2
      ? "NP2"
      : isCustomBa02
        ? "__CUSTOM__"
        : "";

  return `
    <div id="${escapeHtml(wrapperId)}" class="swal-revealed-field" style="display: ${isRevealed ? "block" : "none"}; margin-top: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <label style="display: block; font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">
          Catatan / Keterangan
        </label>
        <span style="font-size: 10px; color: var(--text-secondary); font-weight: 600;">Opsional</span>
      </div>

      <!-- Quick Preset & Prefix Chips -->
      <div class="swal-note-chips-bar" style="display: flex; flex-wrap: wrap; gap: 5px; align-items: center; margin-bottom: 8px;">
        <button type="button" class="swal-note-chip ${cleanVal.toUpperCase() === "OFF" ? "active" : ""}" data-type="fixed" data-val="OFF">OFF</button>
        <button type="button" class="swal-note-chip ${cleanVal.toUpperCase() === "TO EVDAL" ? "active" : ""}" data-type="fixed" data-val="TO EVDAL">TO EVDAL</button>
        
        <button type="button" class="swal-note-chip ${initialPrefix === "BA.01" ? "active" : ""}" data-type="ba" data-val="BA.01">BA.01</button>
        <button type="button" class="swal-note-chip ${initialPrefix === "BA.02" ? "active" : ""}" data-type="ba" data-val="BA.02">BA.02</button>
        <button type="button" class="swal-note-chip ${initialPrefix === "BA.03" ? "active" : ""}" data-type="ba" data-val="BA.03">BA.03</button>
        <button type="button" class="swal-note-chip ${initialPrefix === "BA.04" ? "active" : ""}" data-type="ba" data-val="BA.04">BA.04</button>

        <button type="button" class="swal-note-chip-clear" id="swal-btn-clear-note">✕ Hapus</button>
      </div>

      <!-- Input Group with Static Locked Prefix & Conditional BA.02 Dropdown -->
      <div id="swal-note-input-group" style="display: flex; align-items: center; width: 100%; border: 1.5px solid var(--card-border); border-radius: 10px; background: var(--input-bg, var(--card-bg)); overflow: hidden; min-height: 40px; transition: border-color 0.2s;">
        <div id="swal-note-prefix-badge" style="display: ${initialPrefix ? "flex" : "none"}; padding: 0 8px; height: 40px; align-items: center; justify-content: center; background: rgba(239, 68, 68, 0.15); color: #f87171; font-weight: 800; font-size: 11.5px; border-right: 1px solid rgba(239, 68, 68, 0.3); white-space: nowrap; user-select: none; gap: 4px;">
          <span id="swal-note-prefix-text">${escapeHtml(initialPrefix)}</span>
          <button type="button" id="swal-btn-remove-prefix" title="Lepas prefix" style="background: none; border: none; color: inherit; cursor: pointer; padding: 0; font-weight: 800; font-size: 11px; opacity: 0.7;">✕</button>
        </div>

        <!-- Container Dropdown khusus BA.02 dengan Custom Chevron Icon -->
        <div
          id="swal-select-ba02-wrapper"
          style="display: ${isBa02 && !isCustomBa02 ? "flex" : "none"}; align-items: center; position: relative; width: 100%; flex: 1; height: 40px;"
        >
          <select
            id="swal-select-ba02-detail"
            class="input-field pdo-swal-select"
            style="width: 100%; height: 100%; border: none; background: transparent; padding: 0 28px 0 10px; font-size: 13px; font-weight: 700; border-radius: 0; outline: none; box-shadow: none; cursor: pointer; appearance: none; -webkit-appearance: none; color: ${ba02SelectedOption === "" ? "var(--text-secondary)" : "var(--text-primary)"};"
          >
            <option value="" ${ba02SelectedOption === "" ? "selected" : ""} style="color: var(--text-secondary);">-- Pilih Keterangan BA.02 --</option>
            <option value="NP1" ${ba02SelectedOption === "NP1" ? "selected" : ""}>NP1</option>
            <option value="NP2" ${ba02SelectedOption === "NP2" ? "selected" : ""}>NP2</option>
            <option value="__CUSTOM__" ${ba02SelectedOption === "__CUSTOM__" ? "selected" : ""}>Lainnya... (ketik manual)</option>
          </select>
          <div style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-secondary); display: flex; align-items: center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        <!-- Input Text Field (Full Width saat mode manual atau BA lainnya) -->
        <input
          id="swal-input-keterangan"
          type="text"
          class="input-field"
          placeholder="${isFixedVal ? "Nilai tetap terkunci" : isBa02 ? "Ketik alasan/kendala..." : initialPrefix ? "Ketik detail kendala/alasan..." : "Catatan unit..."}"
          value="${escapeHtml(isFixedVal ? cleanVal.toUpperCase() : isBa02 && !isCustomBa02 ? "" : initialDetail)}"
          ${isFixedVal ? "readonly" : ""}
          style="display: ${isBa02 && !isCustomBa02 ? "none" : "block"}; flex: 1; border: none; background: transparent; padding: 0 10px; font-size: 13px; height: 40px; border-radius: 0; outline: none; box-shadow: none; ${isFixedVal ? "cursor: default; font-weight: 700;" : ""}"
        />

        <!-- Tombol Kembali ke Dropdown (Icon Only, borderless, transparan dengan padding pemisah) -->
        <button
          type="button"
          id="swal-btn-switch-dropdown"
          title="Kembali ke pilihan dropdown"
          style="display: ${isCustomBa02 ? "flex" : "none"}; align-items: center; justify-content: center; width: 34px; height: 40px; background: transparent; color: var(--text-secondary); border: none; outline: none; box-shadow: none; cursor: pointer; padding: 0 10px 0 4px; flex-shrink: 0; transition: color 0.2s;"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

/**
 * Setup event listeners untuk Smart Keterangan Input (Chips, Prefix Badge, Clear, BA.02 Dropdown)
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
  const ba02Wrapper = popup.querySelector<HTMLElement>(
    "#swal-select-ba02-wrapper",
  );
  const ba02Select = popup.querySelector<HTMLSelectElement>(
    "#swal-select-ba02-detail",
  );
  const switchDropdownBtn = popup.querySelector<HTMLButtonElement>(
    "#swal-btn-switch-dropdown",
  );
  const noteInput = popup.querySelector<HTMLInputElement>(
    "#swal-input-keterangan",
  );

  const updateBa02UI = () => {
    if (!ba02Select || !ba02Wrapper || !noteInput) return;
    const val = ba02Select.value;
    if (val === "__CUSTOM__") {
      ba02Wrapper.style.display = "none";
      noteInput.style.display = "block";
      noteInput.readOnly = false;
      noteInput.style.cursor = "text";
      noteInput.style.fontWeight = "normal";
      noteInput.placeholder = "Ketik alasan/kendala...";
      if (switchDropdownBtn) switchDropdownBtn.style.display = "flex";
      noteInput.focus();
    } else if (val === "NP1" || val === "NP2") {
      ba02Wrapper.style.display = "flex";
      ba02Wrapper.style.width = "100%";
      ba02Wrapper.style.flex = "1";
      if (switchDropdownBtn) switchDropdownBtn.style.display = "none";
      noteInput.style.display = "none";
      noteInput.value = "";
      ba02Select.style.color = "var(--text-primary)";
    } else {
      // Placeholder selected ("")
      ba02Wrapper.style.display = "flex";
      ba02Wrapper.style.width = "100%";
      ba02Wrapper.style.flex = "1";
      if (switchDropdownBtn) switchDropdownBtn.style.display = "none";
      noteInput.style.display = "none";
      noteInput.value = "";
      ba02Select.style.color = "var(--text-secondary)";
    }
  };

  if (ba02Select) {
    ba02Select.addEventListener("change", updateBa02UI);
  }

  if (switchDropdownBtn) {
    switchDropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (ba02Select) {
        ba02Select.value = "";
        ba02Select.style.color = "var(--text-secondary)";
      }
      if (noteInput) {
        noteInput.value = "";
        noteInput.style.display = "none";
      }
      if (switchDropdownBtn) switchDropdownBtn.style.display = "none";
      if (ba02Wrapper) {
        ba02Wrapper.style.display = "flex";
        ba02Wrapper.style.width = "100%";
        ba02Wrapper.style.flex = "1";
      }
    });
  }

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

        if (val === "BA.02") {
          updateBa02UI();
        } else {
          if (ba02Wrapper) {
            ba02Wrapper.style.display = "none";
          }
          if (switchDropdownBtn) {
            switchDropdownBtn.style.display = "none";
          }
          if (noteInput) {
            noteInput.style.display = "block";
            noteInput.readOnly = false;
            noteInput.style.cursor = "text";
            noteInput.style.fontWeight = "normal";
            noteInput.placeholder = "Ketik detail kendala/alasan...";
            if (
              ["OFF", "TO EVDAL", "NP1", "NP2"].includes(
                noteInput.value.trim().toUpperCase(),
              )
            ) {
              noteInput.value = "";
            }
            noteInput.focus();
          }
        }
      } else if (type === "fixed") {
        // Fixed preset mode (OFF, TO EVDAL)
        if (prefixBadge) {
          prefixBadge.style.display = "none";
        }
        if (ba02Wrapper) {
          ba02Wrapper.style.display = "none";
        }
        if (switchDropdownBtn) {
          switchDropdownBtn.style.display = "none";
        }
        if (noteInput) {
          noteInput.style.display = "block";
          noteInput.value = val;
          noteInput.readOnly = true;
          noteInput.style.cursor = "default";
          noteInput.style.fontWeight = "700";
          noteInput.placeholder = "Nilai tetap terkunci";
        }
      }
    });
  });

  if (removePrefixBtn) {
    removePrefixBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (prefixBadge) prefixBadge.style.display = "none";
      if (ba02Wrapper) ba02Wrapper.style.display = "none";
      if (switchDropdownBtn) switchDropdownBtn.style.display = "none";
      chips.forEach((c) => c.classList.remove("active"));
      if (noteInput) {
        noteInput.style.display = "block";
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
      chips.forEach((c) => c.classList.remove("active"));
      if (prefixBadge) prefixBadge.style.display = "none";
      if (ba02Wrapper) ba02Wrapper.style.display = "none";
      if (switchDropdownBtn) switchDropdownBtn.style.display = "none";
      if (ba02Select) {
        ba02Select.value = "";
        ba02Select.style.color = "var(--text-secondary)";
      }
      if (noteInput) {
        noteInput.style.display = "block";
        noteInput.value = "";
        noteInput.readOnly = false;
        noteInput.style.cursor = "text";
        noteInput.style.fontWeight = "normal";
        noteInput.placeholder = "Catatan unit...";
        noteInput.focus();
      }
    });
  }
}

/**
 * Modal SweetAlert2 untuk Entri Data Unit Bus
 */
export async function showBusInputModal(
  options: BusModalOptions,
): Promise<Partial<BusData> | null> {
  const { bus, activeCategory = "all", headerMap } = options;
  const isAll = !activeCategory || activeCategory.toUpperCase() === "ALL";
  const singleMeta = SINGLE_COLUMN_META[activeCategory];

  const tripPergiLabel = headerMap?.tripPergiLabel || "Trip Pergi";
  const tripPulangLabel = headerMap?.tripPulangLabel || "Trip Pulang";

  // Progressive Disclosure: cek apakah kolom opsional sudah terisi
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

  // Tentukan HTML Formulir berdasarkan Mode Kolom Aktif
  let formHtml = "";

  if (isAll) {
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
              <input id="swal-input-toaShift1" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${escapeHtml(bus.toaShift1 || "")}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 3px;">Manual S1</label>
              <input id="swal-input-manualShift1" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${escapeHtml(bus.manualShift1 || "")}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 3px;">KM Awal S1</label>
              <input id="swal-input-kmAwal1" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${escapeHtml(bus.kmAwal1 || "")}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 3px;">KM Akhir S1</label>
              <input id="swal-input-kmAkhir1" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${escapeHtml(bus.kmAkhir1 || "")}" placeholder="0" />
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
              <input id="swal-input-totalToa" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${escapeHtml(bus.totalToa || "")}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 3px;">Manual S2</label>
              <input id="swal-input-manualShift2" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${escapeHtml(bus.manualShift2 || "")}" placeholder="0" />
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary);">KM Awal S2</label>
                <button type="button" id="swal-btn-copy-km-all" class="swal-copy-km-chip" title="Salin nilai KM Akhir Shift 1">
                  📋 Salin KM S1
                </button>
              </div>
              <input id="swal-input-kmAwal2" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${escapeHtml(bus.kmAwal2 || "")}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 3px;">KM Akhir S2</label>
              <input id="swal-input-kmAkhir2" type="number" inputmode="numeric" class="input-field" style="padding: 8px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${escapeHtml(bus.kmAkhir2 || "")}" placeholder="0" />
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
                ${escapeHtml(tripPergiLabel)}
              </label>
              <input id="swal-input-tripPergi" type="number" inputmode="numeric" class="input-field" style="padding: 8px 10px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${escapeHtml(bus.tripPergi || "")}" placeholder="0" />
            </div>
            <div>
              <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 3px; line-height: 1.3;">
                ${escapeHtml(tripPulangLabel)}
              </label>
              <input id="swal-input-tripPulang" type="number" inputmode="numeric" class="input-field" style="padding: 8px 10px; font-size: 14px; font-weight: 700; height: 38px; text-align: center;" value="${escapeHtml(bus.tripPulang || "")}" placeholder="0" />
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
  } else if (activeCategory === "toaShift1") {
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
            value="${escapeHtml(bus.toaShift1 || "")}"
            style="font-size: 20px; font-weight: 700; text-align: center; height: 48px; border-radius: 12px; border: 1.5px solid var(--shift1-border, #38bdf8); width: 100%;"
          />
        </div>

        <div id="swal-wrapper-manualShift1" class="swal-revealed-field" style="display: ${hasManual1 ? "block" : "none"};">
          <label style="display: block; font-size: 11px; font-weight: 700; color: var(--shift1-color, #38bdf8); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            Manual Shift 1
          </label>
          <input
            id="swal-input-manualShift1"
            type="number"
            inputmode="numeric"
            pattern="[0-9]*"
            class="input-field"
            placeholder="0"
            value="${escapeHtml(bus.manualShift1 || "")}"
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
            value="${escapeHtml(bus.totalToa || "")}"
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
            value="${escapeHtml(bus.manualShift2 || "")}"
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
              ${escapeHtml(singleMeta.label)}
            </label>
            ${
              activeCategory === "kmAwal2" && bus.kmAkhir1
                ? `
              <button type="button" id="swal-btn-copy-km-single" class="swal-copy-km-chip" title="Salin nilai KM Akhir Shift 1">
                📋 Salin KM S1 (${escapeHtml(bus.kmAkhir1)})
              </button>
            `
                : ""
            }
          </div>

          ${
            activeCategory === "kmAkhir1"
              ? `
            <div id="swal-info-km-reference" style="display: flex; align-items: center; justify-content: space-between; padding: 7px 12px; border-radius: 10px; background: rgba(56, 189, 248, 0.08); border: 1px solid var(--shift1-border, rgba(56, 189, 248, 0.25)); margin-bottom: 8px; font-size: 12px;">
              <span style="font-weight: 700; color: var(--text-secondary); display: flex; align-items: center; gap: 5px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--shift1-color, #38bdf8);"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                KM Awal S1 (Acuan):
              </span>
              <span id="swal-km-ref-val" style="font-weight: 800; color: var(--shift1-color, #38bdf8); font-size: 13px; letter-spacing: 0.3px;">
                ${bus.kmAwal1 ? `${escapeHtml(bus.kmAwal1)}` : '<span style="color: var(--text-secondary); font-weight: 600;">(Belum Diisi)</span>'}
              </span>
            </div>
          `
              : activeCategory === "kmAkhir2"
              ? `
            <div id="swal-info-km-reference" style="display: flex; align-items: center; justify-content: space-between; padding: 7px 12px; border-radius: 10px; background: rgba(192, 132, 252, 0.08); border: 1px solid var(--shift2-border, rgba(192, 132, 252, 0.25)); margin-bottom: 8px; font-size: 12px;">
              <span style="font-weight: 700; color: var(--text-secondary); display: flex; align-items: center; gap: 5px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--shift2-color, #c084fc);"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                KM Awal S2 (Acuan):
              </span>
              <span id="swal-km-ref-val" style="font-weight: 800; color: var(--shift2-color, #c084fc); font-size: 13px; letter-spacing: 0.3px;">
                ${bus.kmAwal2 ? `${escapeHtml(bus.kmAwal2)}` : '<span style="color: var(--text-secondary); font-weight: 600;">(Belum Diisi)</span>'}
              </span>
            </div>
          `
              : ""
          }
          <input
            id="swal-input-single"
            type="number"
            inputmode="numeric"
            pattern="[0-9]*"
            class="input-field"
            placeholder="${escapeHtml(singleMeta.placeholder)}"
            value="${escapeHtml(currentVal)}"
            style="font-size: 20px; font-weight: 700; text-align: center; height: 48px; border-radius: 12px; border: 1.5px solid var(--accent-color); width: 100%;"
          />
        </div>

        ${renderSmartKeteranganSection(bus.keterangan || "", "swal-wrapper-keterangan", hasKeterangan)}

        <div class="pdo-swal-chips-container">
          ${!hasKeterangan ? `<button type="button" id="swal-chip-keterangan" class="pdo-swal-chip pdo-swal-chip-right">+ Catatan</button>` : ""}
        </div>
      </div>
    `;
  }

  // Tampilkan Modal SweetAlert2
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
      const popup = pdoSwal.getPopup();
      if (!popup) return;

      // Inisialisasi logika Smart Keterangan (Chips, Lock Prefix, Reset)
      setupSmartKeteranganLogic(popup);

      // Inisialisasi Segmented Tab Switcher untuk Mode ALL
      if (isAll) {
        const segBtns =
          popup.querySelectorAll<HTMLButtonElement>(".swal-segment-btn");
        const panelSections = popup.querySelectorAll<HTMLElement>(
          ".swal-panel-section",
        );

        segBtns.forEach((btn) => {
          btn.addEventListener("click", () => {
            const targetPanel = btn.getAttribute("data-target");
            segBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            panelSections.forEach((panel) => {
              const panelType = panel.getAttribute("data-panel");
              if (panelType === targetPanel) {
                panel.style.display = "block";
                // Auto focus pada input pertama di panel yang aktif
                const firstInput =
                  panel.querySelector<HTMLInputElement>("input");
                if (firstInput) {
                  firstInput.focus();
                  firstInput.select();
                }
              } else {
                panel.style.display = "none";
              }
            });
          });
        });
      }

      // Auto focus ke input utama sesuai kategori
      let primaryInput: HTMLInputElement | null = null;
      if (isAll) {
        primaryInput = popup.querySelector("#swal-input-toaShift1");
      } else if (activeCategory === "toaShift1") {
        primaryInput = popup.querySelector("#swal-input-toaShift1");
      } else if (activeCategory === "totalToa") {
        primaryInput = popup.querySelector("#swal-input-totalToa");
      } else {
        primaryInput = popup.querySelector("#swal-input-single");
      }

      if (primaryInput) {
        primaryInput.focus();
        primaryInput.select();
      }

      // Enter keydown handler & smart auto-scroll on inputs
      const allInputs = popup.querySelectorAll<HTMLInputElement>("input");
      allInputs.forEach((elem) => {
        elem.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            pdoSwal.clickConfirm();
          }
        });

        // Mobile keyboard focus helper: pastikan elemen input berada di tengah viewport
        elem.addEventListener("focus", () => {
          setTimeout(() => {
            elem.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 180);
        });
      });

      // Quick Copy KM S1 to KM Awal S2 buttons
      const copyBtnAll = popup.querySelector<HTMLButtonElement>(
        "#swal-btn-copy-km-all",
      );
      if (copyBtnAll) {
        copyBtnAll.addEventListener("click", () => {
          const kmAkhir1Val = (
            popup.querySelector(
              "#swal-input-kmAkhir1",
            ) as HTMLInputElement | null
          )?.value;
          const kmAwal2Input = popup.querySelector(
            "#swal-input-kmAwal2",
          ) as HTMLInputElement | null;
          if (kmAwal2Input && kmAkhir1Val) {
            kmAwal2Input.value = kmAkhir1Val;
            kmAwal2Input.focus();
            kmAwal2Input.select();
          }
        });
      }

      const copyBtnSingle = popup.querySelector<HTMLButtonElement>(
        "#swal-btn-copy-km-single",
      );
      if (copyBtnSingle) {
        copyBtnSingle.addEventListener("click", () => {
          const singleInput = popup.querySelector(
            "#swal-input-single",
          ) as HTMLInputElement | null;
          if (singleInput && bus.kmAkhir1) {
            singleInput.value = bus.kmAkhir1;
            singleInput.focus();
            singleInput.select();
            singleInput.dispatchEvent(new Event("input"));
          }
        });
      }

      // Live KM diff preview untuk KM Akhir S1 & KM Akhir S2
      if (activeCategory === "kmAkhir1" || activeCategory === "kmAkhir2") {
        const singleInput =
          popup.querySelector<HTMLInputElement>("#swal-input-single");
        const refValSpan = popup.querySelector<HTMLElement>("#swal-km-ref-val");
        const kmAwalRaw =
          activeCategory === "kmAkhir1" ? bus.kmAwal1 : bus.kmAwal2;
        const kmAwalNum = parseIndonesianNumber(kmAwalRaw, NaN);

        const updateDiffDisplay = () => {
          if (!singleInput || !refValSpan || isNaN(kmAwalNum)) return;
          const inputVal = singleInput.value.trim();
          if (!inputVal) {
            refValSpan.innerHTML = `${escapeHtml(kmAwalRaw)}`;
            return;
          }
          const inputNum = parseIndonesianNumber(inputVal, NaN);
          if (isNaN(inputNum)) {
            refValSpan.innerHTML = `${escapeHtml(kmAwalRaw)}`;
            return;
          }
          const diff = inputNum - kmAwalNum;
          if (diff < 0) {
            refValSpan.innerHTML = `${escapeHtml(kmAwalRaw)} <span style="font-size: 11px; color: var(--danger-color, #ef4444); font-weight: 700;">(⚠️ Lebih kecil)</span>`;
          } else {
            refValSpan.innerHTML = `${escapeHtml(kmAwalRaw)} <span style="font-size: 11px; color: var(--success-color, #22c55e); font-weight: 700;">(+${diff} KM)</span>`;
          }
        };

        if (singleInput) {
          singleInput.addEventListener("input", updateDiffDisplay);
          updateDiffDisplay();
        }
      }

      // Handler chip progressive disclosure di mode spesifik
      const chipManual1 = popup.querySelector<HTMLButtonElement>(
        "#swal-chip-manualShift1",
      );
      if (chipManual1) {
        chipManual1.addEventListener("click", () => {
          const wrapper = popup.querySelector<HTMLElement>(
            "#swal-wrapper-manualShift1",
          );
          if (wrapper) {
            wrapper.style.display = "block";
            const input = wrapper.querySelector<HTMLInputElement>("input");
            if (input) input.focus();
          }
          chipManual1.style.display = "none";
        });
      }

      const chipManual2 = popup.querySelector<HTMLButtonElement>(
        "#swal-chip-manualShift2",
      );
      if (chipManual2) {
        chipManual2.addEventListener("click", () => {
          const wrapper = popup.querySelector<HTMLElement>(
            "#swal-wrapper-manualShift2",
          );
          if (wrapper) {
            wrapper.style.display = "block";
            const input = wrapper.querySelector<HTMLInputElement>("input");
            if (input) input.focus();
          }
          chipManual2.style.display = "none";
        });
      }

      const chipKet = popup.querySelector<HTMLButtonElement>(
        "#swal-chip-keterangan",
      );
      if (chipKet) {
        chipKet.addEventListener("click", () => {
          const wrapper = popup.querySelector<HTMLElement>(
            "#swal-wrapper-keterangan",
          );
          if (wrapper) {
            wrapper.style.display = "block";
            const input = wrapper.querySelector<HTMLInputElement>(
              "#swal-input-keterangan",
            );
            if (input) input.focus();
          }
          chipKet.style.display = "none";
        });
      }
    },
    preConfirm: () => {
      const popup = pdoSwal.getPopup();
      if (!popup) return null;

      const updates: Partial<BusData> = {};

      // Ekstraksi nilai Keterangan (Prefix + Detail)
      const prefixBadge = popup.querySelector<HTMLElement>(
        "#swal-note-prefix-badge",
      );
      const prefixText = popup.querySelector<HTMLElement>(
        "#swal-note-prefix-text",
      );
      const isPrefixActive =
        prefixBadge && prefixBadge.style.display !== "none";
      const prefix =
        isPrefixActive && prefixText ? prefixText.innerText.trim() : "";
      const ba02Select = popup.querySelector<HTMLSelectElement>(
        "#swal-select-ba02-detail",
      );
      const ba02Wrapper = popup.querySelector<HTMLElement>(
        "#swal-select-ba02-wrapper",
      );
      const isBa02Active =
        prefix === "BA.02" &&
        ba02Wrapper &&
        ba02Wrapper.style.display !== "none";

      const noteInput = popup.querySelector<HTMLInputElement>(
        "#swal-input-keterangan",
      );

      let rawNote = "";
      if (isBa02Active && ba02Select) {
        if (ba02Select.value === "NP1") {
          rawNote = "NP1";
        } else if (ba02Select.value === "NP2") {
          rawNote = "NP2";
        } else if (ba02Select.value === "__CUSTOM__") {
          rawNote = noteInput ? noteInput.value.trim() : "";
        } else {
          // Placeholder "-- Pilih Keterangan BA.02 --" ("")
          rawNote = "";
        }
      } else {
        rawNote = noteInput ? noteInput.value.trim() : "";
      }

      let resolvedKeterangan = rawNote;
      if (prefix) {
        resolvedKeterangan = rawNote ? `${prefix} ${rawNote}` : prefix;
      }
      resolvedKeterangan = normalizeKeterangan(resolvedKeterangan);

      // Validasi logika berdasarkan status Keterangan (OFF, NP1, NP2, dll)
      const upperKet = resolvedKeterangan.toUpperCase();
      const isOffUnit = upperKet === "OFF";
      const isNp1Unit = /\bNP1\b/i.test(upperKet);
      const isNp2Unit = /\bNP2\b/i.test(upperKet);

      if (!isAll && singleMeta) {
        // --- Single Column Mode PreConfirm ---
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
          singleInput =
            popup.querySelector<HTMLInputElement>("#swal-input-single");
        }

        if (!singleInput) {
          singleInput = popup.querySelector<HTMLInputElement>(
            ".swal-bus-input-container input[type='number']",
          );
        }

        const val = singleInput ? singleInput.value.trim() : "";

        // Validasi input angka jika diisi
        if (val !== "") {
          const numVal = parseIndonesianNumber(val, NaN);
          if (isNaN(numVal) || numVal < 0) {
            pdoSwal.showValidationMessage("Nilai harus berupa angka positif!");
            return false;
          }
        }

        // Simpan nilai kolom spesifik
        const isTargetOff =
          isOffUnit ||
          (activeCategory === "toaShift1" && isNp1Unit) ||
          (activeCategory === "totalToa" && isOffUnit);
        (updates as any)[singleMeta.key] = isTargetOff ? "" : val;

        // Simpan catatan jika ada perubahan/terbuka
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

        // Khusus kolom TOA Shift 1: cek manualShift1 jika di-reveal atau berubah
        if (activeCategory === "toaShift1") {
          const m1Wrapper = popup.querySelector<HTMLElement>(
            "#swal-wrapper-manualShift1",
          );
          const m1Input = popup.querySelector<HTMLInputElement>(
            "#swal-input-manualShift1",
          );
          if (m1Input) {
            const m1Val = m1Input.value.trim();
            const isM1Revealed =
              m1Wrapper && m1Wrapper.style.display !== "none";
            if (isM1Revealed || m1Val !== (bus.manualShift1 || "")) {
              if (m1Val !== "") {
                const numM1 = parseIndonesianNumber(m1Val, NaN);
                if (isNaN(numM1) || numM1 < 0) {
                  pdoSwal.showValidationMessage(
                    "Manual Shift 1 harus berupa angka!",
                  );
                  return false;
                }
                updates.manualShift1 = isOffUnit || isNp1Unit ? "" : m1Val;
              } else {
                updates.manualShift1 = "";
              }
            }
          }
        }

        // Khusus kolom Total TOA: cek manualShift2 jika di-reveal atau berubah
        if (activeCategory === "totalToa") {
          const m2Wrapper = popup.querySelector<HTMLElement>(
            "#swal-wrapper-manualShift2",
          );
          const m2Input = popup.querySelector<HTMLInputElement>(
            "#swal-input-manualShift2",
          );
          if (m2Input) {
            const m2Val = m2Input.value.trim();
            const isM2Revealed =
              m2Wrapper && m2Wrapper.style.display !== "none";
            if (isM2Revealed || m2Val !== (bus.manualShift2 || "")) {
              if (m2Val !== "") {
                const numM2 = parseIndonesianNumber(m2Val, NaN);
                if (isNaN(numM2) || numM2 < 0) {
                  pdoSwal.showValidationMessage(
                    "Manual Shift 2 harus berupa angka!",
                  );
                  return false;
                }
                updates.manualShift2 = isOffUnit || isNp2Unit ? "" : m2Val;
              } else {
                updates.manualShift2 = "";
              }
            }
          }
        }
      } else {
        // --- Full (ALL) Mode PreConfirm ---
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

        // Validasi KM Akhir >= KM Awal Shift 1
        if (kmAwal1 !== "" && kmAkhir1 !== "") {
          const numAwal1 = parseIndonesianNumber(kmAwal1, NaN);
          const numAkhir1 = parseIndonesianNumber(kmAkhir1, NaN);
          if (
            !isNaN(numAwal1) &&
            !isNaN(numAkhir1) &&
            numAkhir1 > 0 &&
            numAkhir1 < numAwal1
          ) {
            pdoSwal.showValidationMessage(
              "KM Akhir Shift 1 tidak boleh lebih kecil dari KM Awal!",
            );
            return false;
          }
        }

        // Validasi KM Akhir >= KM Awal Shift 2
        if (kmAwal2 !== "" && kmAkhir2 !== "") {
          const numAwal2 = parseIndonesianNumber(kmAwal2, NaN);
          const numAkhir2 = parseIndonesianNumber(kmAkhir2, NaN);
          if (
            !isNaN(numAwal2) &&
            !isNaN(numAkhir2) &&
            numAkhir2 > 0 &&
            numAkhir2 < numAwal2
          ) {
            pdoSwal.showValidationMessage(
              "KM Akhir Shift 2 tidak boleh lebih kecil dari KM Awal!",
            );
            return false;
          }
        }

        // Validasi Total TOA Shift 2 >= TOA Shift 1
        if (toaShift1 !== "" && totalToa !== "") {
          const numToaS1 = parseIndonesianNumber(toaShift1, NaN);
          const numTotToa = parseIndonesianNumber(totalToa, NaN);
          if (
            !isNaN(numToaS1) &&
            !isNaN(numTotToa) &&
            numTotToa > 0 &&
            numTotToa < numToaS1
          ) {
            pdoSwal.showValidationMessage(
              "Total TOA Shift 2 tidak boleh lebih kecil dari TOA Shift 1!",
            );
            return false;
          }
        }

        if (headerMap?.tripPergi !== undefined && headerMap.tripPergi !== -1) {
          updates.tripPergi = tripPergi;
        }
        if (
          headerMap?.tripPulang !== undefined &&
          headerMap.tripPulang !== -1
        ) {
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
      }

      return updates;
    },
  });

  if (result.isConfirmed && result.value) {
    return result.value as Partial<BusData>;
  }

  return null;
}
