import { TEXT_ALERTS } from "@/constants/texts";
import { escapeHtml } from "./busModalValidation";

export { renderSmartKeteranganSection } from "./busModalTemplateKeterangan";
export { renderFullModalHtml } from "./busModalTemplateFull";
export { renderSpecificModalHtml } from "./busModalTemplateSpecific";

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
