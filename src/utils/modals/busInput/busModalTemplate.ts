import type { BusData } from "@/services/googleSheets";
import { parseKeterangan } from "@/utils/keteranganUtils";
import { TEXT_ALERTS } from "@/constants/texts";
import { escapeHtml } from "./busModalValidation";

/**
 * Merender tombol toggle Mode Satset / Beruntun (Icon Only)
 */
export function renderSatsetToggle(isSatset: boolean): string {
  return `
    <button
      type="button"
      id="swal-toggle-satset"
      class="pdo-satset-toggle ${isSatset ? "active" : ""}"
      title="${isSatset ? TEXT_ALERTS.BUS_INPUT_MODAL.SATSET_ACTIVE_TITLE : TEXT_ALERTS.BUS_INPUT_MODAL.SATSET_INACTIVE_TITLE}"
      aria-label="${TEXT_ALERTS.BUS_INPUT_MODAL.SATSET_LABEL}"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="satset-icon">
        <path d="m17 2 4 4-4 4"></path>
        <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
        <path d="m7 22-4-4 4-4"></path>
        <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
      </svg>
    </button>
  `;
}

/**
 * Merender header modal dengan nama unit bus dan toggle Satset
 */
export function renderModalHeader(unit: string, isSatset: boolean): string {
  return `
    <div class="swal-bus-modal-header" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; margin-bottom: 10px; border-bottom: 1px solid var(--card-border);">
      <span style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.2px;">${escapeHtml(unit)}</span>
      ${renderSatsetToggle(isSatset)}
    </div>
  `;
}

/**
 * Helper HTML untuk merender Smart Keterangan Input Group
 * dengan Static Locked Prefix (BA.01-04) & Quick Preset Chips (OFF, NP1, NP2, TO EVDAL)
 */
export function renderSmartKeteranganSection(
  initialKeterangan: string = "",
  wrapperId: string = "swal-wrapper-keterangan",
  isRevealed: boolean = true,
): string {
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
          ${TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_NOTES}
        </label>
        <span style="font-size: 10px; color: var(--text-secondary); font-weight: 600;">${TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_OPTIONAL}</span>
      </div>

      <!-- Quick Preset & Prefix Chips -->
      <div class="swal-note-chips-bar" style="display: flex; flex-wrap: wrap; gap: 5px; align-items: center; margin-bottom: 8px;">
        <button type="button" class="swal-note-chip ${cleanVal.toUpperCase() === "OFF" ? "active" : ""}" data-type="fixed" data-val="OFF">OFF</button>
        <button type="button" class="swal-note-chip ${cleanVal.toUpperCase() === "TO EVDAL" ? "active" : ""}" data-type="fixed" data-val="TO EVDAL">TO EVDAL</button>
        
        <button type="button" class="swal-note-chip ${initialPrefix === "BA.01" ? "active" : ""}" data-type="ba" data-val="BA.01">BA.01</button>
        <button type="button" class="swal-note-chip ${initialPrefix === "BA.02" ? "active" : ""}" data-type="ba" data-val="BA.02">BA.02</button>
        <button type="button" class="swal-note-chip ${initialPrefix === "BA.03" ? "active" : ""}" data-type="ba" data-val="BA.03">BA.03</button>
        <button type="button" class="swal-note-chip ${initialPrefix === "BA.04" ? "active" : ""}" data-type="ba" data-val="BA.04">BA.04</button>

        <button type="button" class="swal-note-chip-clear" id="swal-btn-clear-note">${TEXT_ALERTS.BUS_INPUT_MODAL.CLEAR_NOTE}</button>
      </div>

      <!-- Input Group with Static Locked Prefix & Conditional BA.02 Dropdown -->
      <div id="swal-note-input-group" style="display: flex; align-items: center; width: 100%; border: 1.5px solid var(--card-border); border-radius: 10px; background: var(--input-bg, var(--card-bg)); overflow: hidden; min-height: 40px; transition: border-color 0.2s;">
        <div id="swal-note-prefix-badge" style="display: ${initialPrefix ? "flex" : "none"}; padding: 0 8px; height: 40px; align-items: center; justify-content: center; background: rgba(239, 68, 68, 0.15); color: #f87171; font-weight: 800; font-size: 11.5px; border-right: 1px solid rgba(239, 68, 68, 0.3); white-space: nowrap; user-select: none; gap: 4px;">
          <span id="swal-note-prefix-text">${escapeHtml(initialPrefix)}</span>
          <button type="button" id="swal-btn-remove-prefix" title="${TEXT_ALERTS.BUS_INPUT_MODAL.REMOVE_PREFIX_TITLE}" style="background: none; border: none; color: inherit; cursor: pointer; padding: 0; font-weight: 800; font-size: 11px; opacity: 0.7;">✕</button>
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
            <option value="" ${ba02SelectedOption === "" ? "selected" : ""} style="color: var(--text-secondary);">${TEXT_ALERTS.BUS_INPUT_MODAL.BA02_SELECT_DEFAULT}</option>
            <option value="NP1" ${ba02SelectedOption === "NP1" ? "selected" : ""}>NP1</option>
            <option value="NP2" ${ba02SelectedOption === "NP2" ? "selected" : ""}>NP2</option>
            <option value="__CUSTOM__" ${ba02SelectedOption === "__CUSTOM__" ? "selected" : ""}>${TEXT_ALERTS.BUS_INPUT_MODAL.BA02_CUSTOM_OPTION}</option>
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
          placeholder="${isFixedVal ? TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_FIXED : isBa02 ? TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_BA02 : initialPrefix ? TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_PREFIX : TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_DEFAULT}"
          value="${escapeHtml(isFixedVal ? cleanVal.toUpperCase() : isBa02 && !isCustomBa02 ? "" : initialDetail)}"
          ${isFixedVal ? "readonly" : ""}
          style="display: ${isBa02 && !isCustomBa02 ? "none" : "block"}; flex: 1; border: none; background: transparent; padding: 0 10px; font-size: 13px; height: 40px; border-radius: 0; outline: none; box-shadow: none; ${isFixedVal ? "cursor: default; font-weight: 700;" : ""}"
        />

        <!-- Tombol Kembali ke Dropdown (Icon Only, borderless, transparan dengan padding pemisah) -->
        <button
          type="button"
          id="swal-btn-switch-dropdown"
          title="${TEXT_ALERTS.BUS_INPUT_MODAL.SWITCH_DROPDOWN_TITLE}"
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
 * Merender Form Modal untuk Mode SEMUA KOLOM (ALL) dengan Segmented Tabs
 */
export function renderFullModalHtml(
  bus: BusData,
  headerHtml: string,
  initTab: string,
  tripPergiLabel: string,
  tripPulangLabel: string,
): string {
  return `
    <div class="swal-bus-input-container" style="display: flex; flex-direction: column; gap: 8px; text-align: left;">
      ${headerHtml}
      
      <!-- Segmented Tab Switcher -->
      <div class="swal-segmented-bar">
        <button type="button" class="swal-segment-btn ${initTab === "shift1" ? "active" : ""}" data-target="shift1">${TEXT_ALERTS.BUS_INPUT_MODAL.TAB_SHIFT1}</button>
        <button type="button" class="swal-segment-btn ${initTab === "shift2" ? "active" : ""}" data-target="shift2">${TEXT_ALERTS.BUS_INPUT_MODAL.TAB_SHIFT2}</button>
        <button type="button" class="swal-segment-btn ${initTab === "trip" ? "active" : ""}" data-target="trip">${TEXT_ALERTS.BUS_INPUT_MODAL.TAB_TRIP}</button>
        <button type="button" class="swal-segment-btn ${initTab === "notes" ? "active" : ""}" data-target="notes">${TEXT_ALERTS.BUS_INPUT_MODAL.TAB_NOTES}</button>
      </div>

      <!-- Panel 1: Shift 1 -->
      <div id="swal-panel-shift1" class="swal-panel-section" data-panel="shift1" style="display: ${initTab === "shift1" ? "block" : "none"}; padding: 12px; border-radius: 14px; background: rgba(56, 189, 248, 0.06); border: 1px solid var(--shift1-border, rgba(56, 189, 248, 0.25));">
        <div style="font-size: 11px; font-weight: 800; color: var(--shift1-color, #38bdf8); margin-bottom: 8px; text-transform: uppercase;">
          ${TEXT_ALERTS.BUS_INPUT_MODAL.SECTION_SHIFT1}
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
      <div id="swal-panel-shift2" class="swal-panel-section" data-panel="shift2" style="display: ${initTab === "shift2" ? "block" : "none"}; padding: 12px; border-radius: 14px; background: rgba(192, 132, 252, 0.06); border: 1px solid var(--shift2-border, rgba(192, 132, 252, 0.25));">
        <div style="font-size: 11px; font-weight: 800; color: var(--shift2-color, #c084fc); margin-bottom: 8px; text-transform: uppercase;">
          ${TEXT_ALERTS.BUS_INPUT_MODAL.SECTION_SHIFT2}
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
              <button type="button" id="swal-btn-copy-km-all" class="swal-copy-km-chip" title="${TEXT_ALERTS.BUS_INPUT_MODAL.COPY_KM_TITLE}">
                ${TEXT_ALERTS.BUS_INPUT_MODAL.COPY_KM_S1_BTN}
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
      <div id="swal-panel-trip" class="swal-panel-section" data-panel="trip" style="display: ${initTab === "trip" ? "block" : "none"}; padding: 12px; border-radius: 14px; background: rgba(56, 189, 248, 0.06); border: 1px solid var(--shift1-border, rgba(56, 189, 248, 0.25));">
        <div style="font-size: 11px; font-weight: 800; color: var(--accent-color); margin-bottom: 8px; text-transform: uppercase;">
          ${TEXT_ALERTS.BUS_INPUT_MODAL.SECTION_TRIP}
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
      <div id="swal-panel-notes" class="swal-panel-section" data-panel="notes" style="display: ${initTab === "notes" ? "block" : "none"}; padding: 12px; border-radius: 14px; background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.25);">
        <div style="font-size: 11px; font-weight: 800; color: var(--warning-text, #f59e0b); margin-bottom: 8px; text-transform: uppercase;">
          ${TEXT_ALERTS.BUS_INPUT_MODAL.SECTION_NOTES}
        </div>
        ${renderSmartKeteranganSection(bus.keterangan || "", "swal-wrapper-keterangan-notes", true)}
      </div>

    </div>
  `;
}

/**
 * Merender Form Modal untuk Mode Kolom Khusus / Single Column (TOA S1, Total TOA, Trip, KM)
 */
export function renderSpecificModalHtml(
  bus: BusData,
  headerHtml: string,
  activeCategory: string,
  singleMeta: { label: string; placeholder: string; key: keyof BusData } | undefined,
  tripPergiLabel: string,
  tripPulangLabel: string,
  hasManual1: boolean,
  hasManual2: boolean,
  hasKeterangan: boolean,
): string {
  if (activeCategory === "toaShift1") {
    return `
      <div class="swal-bus-input-container" style="text-align: left; display: flex; flex-direction: column; gap: 10px;">
        ${headerHtml}
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
          ${!hasManual1 ? `<button type="button" id="swal-chip-manualShift1" class="pdo-swal-chip">${TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_MANUAL_S1}</button>` : ""}
          ${!hasKeterangan ? `<button type="button" id="swal-chip-keterangan" class="pdo-swal-chip pdo-swal-chip-right">${TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_KETERANGAN}</button>` : ""}
        </div>
      </div>
    `;
  }

  if (activeCategory === "totalToa") {
    return `
      <div class="swal-bus-input-container" style="text-align: left; display: flex; flex-direction: column; gap: 10px;">
        ${headerHtml}
        <div>
          <label style="display: block; font-size: 11px; font-weight: 700; color: var(--shift1-color, #38bdf8); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOTAL_TOA}
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
            ${TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S2}
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
          ${!hasManual2 ? `<button type="button" id="swal-chip-manualShift2" class="pdo-swal-chip">${TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_MANUAL_S2}</button>` : ""}
          ${!hasKeterangan ? `<button type="button" id="swal-chip-keterangan" class="pdo-swal-chip pdo-swal-chip-right">${TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_KETERANGAN}</button>` : ""}
        </div>
      </div>
    `;
  }

  if (activeCategory === "trip") {
    return `
      <div class="swal-bus-input-container" style="text-align: left; display: flex; flex-direction: column; gap: 10px;">
        ${headerHtml}
        <div style="padding: 12px; border-radius: 14px; background: rgba(56, 189, 248, 0.06); border: 1px solid var(--shift1-border, rgba(56, 189, 248, 0.25)); display: flex; flex-direction: column; gap: 10px;">
          <div style="font-size: 11px; font-weight: 800; color: var(--accent-color); margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${TEXT_ALERTS.BUS_INPUT_MODAL.SECTION_TRIP_CARD}
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px; line-height: 1.3;">
              ${escapeHtml(tripPergiLabel)}
            </label>
            <input
              id="swal-input-tripPergi"
              type="number"
              inputmode="numeric"
              class="input-field"
              style="font-size: 20px; font-weight: 700; text-align: center; height: 46px; border-radius: 12px; border: 1.5px solid var(--accent-color); width: 100%;"
              value="${escapeHtml(bus.tripPergi || "")}"
              placeholder="0"
            />
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px; line-height: 1.3;">
              ${escapeHtml(tripPulangLabel)}
            </label>
            <input
              id="swal-input-tripPulang"
              type="number"
              inputmode="numeric"
              class="input-field"
              style="font-size: 20px; font-weight: 700; text-align: center; height: 46px; border-radius: 12px; border: 1.5px solid var(--accent-color); width: 100%;"
              value="${escapeHtml(bus.tripPulang || "")}"
              placeholder="0"
            />
          </div>
        </div>

        ${renderSmartKeteranganSection(bus.keterangan || "", "swal-wrapper-keterangan", hasKeterangan)}

        <div class="pdo-swal-chips-container">
          ${!hasKeterangan ? `<button type="button" id="swal-chip-keterangan" class="pdo-swal-chip pdo-swal-chip-right">${TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_KETERANGAN_KENDALA}</button>` : ""}
        </div>
      </div>
    `;
  }

  if (singleMeta) {
    const currentVal = (bus[singleMeta.key] as string) || "";
    return `
      <div class="swal-bus-input-container" style="text-align: left; display: flex; flex-direction: column; gap: 10px;">
        ${headerHtml}
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">
              ${escapeHtml(singleMeta.label)}
            </label>
            ${
              activeCategory === "kmAwal2" && bus.kmAkhir1
                ? `
              <button type="button" id="swal-btn-copy-km-single" class="swal-copy-km-chip" title="${TEXT_ALERTS.BUS_INPUT_MODAL.COPY_KM_TITLE}">
                ${TEXT_ALERTS.BUS_INPUT_MODAL.COPY_KM_S1_WITH_VAL(escapeHtml(bus.kmAkhir1))}
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
                ${TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_REF_S1}
              </span>
              <span id="swal-km-ref-val" style="font-weight: 800; color: var(--shift1-color, #38bdf8); font-size: 13px; letter-spacing: 0.3px;">
                ${bus.kmAwal1 ? `${escapeHtml(bus.kmAwal1)}` : `<span style="color: var(--text-secondary); font-weight: 600;">${TEXT_ALERTS.BUS_INPUT_MODAL.NOT_FILLED_YET}</span>`}
              </span>
            </div>
          `
              : activeCategory === "kmAkhir2"
              ? `
            <div id="swal-info-km-reference" style="display: flex; align-items: center; justify-content: space-between; padding: 7px 12px; border-radius: 10px; background: rgba(192, 132, 252, 0.08); border: 1px solid var(--shift2-border, rgba(192, 132, 252, 0.25)); margin-bottom: 8px; font-size: 12px;">
              <span style="font-weight: 700; color: var(--text-secondary); display: flex; align-items: center; gap: 5px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--shift2-color, #c084fc);"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_REF_S2}
              </span>
              <span id="swal-km-ref-val" style="font-weight: 800; color: var(--shift2-color, #c084fc); font-size: 13px; letter-spacing: 0.3px;">
                ${bus.kmAwal2 ? `${escapeHtml(bus.kmAwal2)}` : `<span style="color: var(--text-secondary); font-weight: 600;">${TEXT_ALERTS.BUS_INPUT_MODAL.NOT_FILLED_YET}</span>`}
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
          ${!hasKeterangan ? `<button type="button" id="swal-chip-keterangan" class="pdo-swal-chip pdo-swal-chip-right">${TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_KETERANGAN}</button>` : ""}
        </div>
      </div>
    `;
  }

  return "";
}
