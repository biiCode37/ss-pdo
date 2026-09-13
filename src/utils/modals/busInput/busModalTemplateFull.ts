import type { BusData } from "@/services/googleSheets";
import { TEXT_ALERTS } from "@/constants/texts";
import { escapeHtml } from "./busModalValidation";
import { renderSmartKeteranganSection } from "./busModalTemplateKeterangan";

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
