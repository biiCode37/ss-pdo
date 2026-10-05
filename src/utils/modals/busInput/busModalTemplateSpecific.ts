import type { BusData } from "@/services/googleSheets";
import { TEXT_ALERTS } from "@/constants/texts";
import { escapeHtml } from "./busModalValidation";
import { renderSmartKeteranganSection } from "./busModalTemplateKeterangan";

/**
 * Merender Form Modal untuk Mode Kolom Khusus / Single Column (TOA S1, Total TOA, Trip, KM)
 */
export function renderSpecificModalHtml(
  bus: BusData,
  headerHtml: string,
  activeCategory: string,
  singleMeta:
    | { label: string; placeholder: string; key: keyof BusData }
    | undefined,
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
