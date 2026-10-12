import { TEXT_ALERTS } from "@/constants/texts";
import { escapeHtml } from "./busModalValidation";

/**
 * Helper HTML untuk merender Input Keterangan bebas via Textarea
 * tanpa pill/chip cepat.
 */
export function renderSmartKeteranganSection(
  initialKeterangan: string = "",
  wrapperId: string = "swal-wrapper-keterangan",
  isRevealed: boolean = true,
): string {
  return `
    <div id="${escapeHtml(wrapperId)}" class="swal-revealed-field" style="display: ${isRevealed ? "block" : "none"}; margin-top: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <label style="display: block; font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">
          ${TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_NOTES}
        </label>
        <span style="font-size: 10px; color: var(--text-secondary); font-weight: 600;">${TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_OPTIONAL}</span>
      </div>

      <textarea
        id="swal-input-keterangan"
        rows="3"
        class="input-field"
        placeholder="${TEXT_ALERTS.BUS_INPUT_MODAL.NOTES_DETAIL_PLACEHOLDER}"
        style="width: 100%; border: 1.5px solid var(--card-border); border-radius: 10px; background: var(--input-bg, var(--card-bg)); padding: 8px 10px; font-size: 13px; font-weight: 600; color: var(--text-primary); box-sizing: border-box; resize: none; line-height: 1.4;"
      >${escapeHtml(initialKeterangan)}</textarea>
    </div>
  `;
}

