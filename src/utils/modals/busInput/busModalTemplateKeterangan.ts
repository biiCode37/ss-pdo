import { parseKeterangan } from "@/utils/keteranganUtils";
import { TEXT_ALERTS } from "@/constants/texts";
import { escapeHtml } from "./busModalValidation";

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
