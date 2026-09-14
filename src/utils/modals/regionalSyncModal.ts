import { pdoSwal } from "@/utils/swalBase";
import { escapeHtml } from "./busInput/busModalValidation";
import { TEXT_MONITORING } from "@/constants/texts";

export interface RegionalSyncModalOptions {
  dateStr: string;
  defaultUrl?: string;
  defaultSheetName?: string;
}

export interface RegionalSyncModalResult {
  spreadsheetUrl: string;
  sheetName: string;
}

const INDONESIAN_MONTH_NAMES = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
];

/**
 * Menampilkan dialog modal SweetAlert2 untuk konfigurasi dan konfirmasi sinkronisasi data
 * 18 rute dari Spreadsheet Global Wilayah ke database.
 */
export async function showRegionalSyncModal(
  options: RegionalSyncModalOptions
): Promise<RegionalSyncModalResult | null> {
  const parts = options.dateStr.split("-").map(Number);
  const computedSheetName =
    parts[1] >= 1 && parts[1] <= 12
      ? `${INDONESIAN_MONTH_NAMES[parts[1] - 1]} ${parts[0]}`
      : "SEPTEMBER 2026";

  const savedUrl =
    typeof window !== "undefined"
      ? localStorage.getItem("pdo_regional_global_sheet_url") || ""
      : "";
  const initialUrl = options.defaultUrl || savedUrl || "";
  const initialSheetName = options.defaultSheetName || computedSheetName;

  const formHtml = `
    <div class="swal-regional-sync-container" style="display: flex; flex-direction: column; gap: 14px; text-align: left;">
      <div style="font-size: 13px; color: var(--text-secondary, #a3a3a3); line-height: 1.45;">
        ${escapeHtml(TEXT_MONITORING.SYNC_MODAL.DESC)}
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; padding: 14px; border-radius: 12px; background: rgba(62, 207, 142, 0.06); border: 1px solid rgba(62, 207, 142, 0.25);">
        <div>
          <label for="swal-global-sheet-url" style="font-size: 11px; font-weight: 700; color: var(--text-secondary, #8b8b8b); display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${escapeHtml(TEXT_MONITORING.SYNC_MODAL.LABEL_URL)}
          </label>
          <input
            id="swal-global-sheet-url"
            type="text"
            placeholder="${escapeHtml(TEXT_MONITORING.SYNC_MODAL.PLACEHOLDER_URL)}"
            value="${escapeHtml(initialUrl)}"
            style="width: 100%; box-sizing: border-box; padding: 9px 12px; font-size: 13px; border-radius: 8px; border: 1px solid var(--card-border, rgba(255,255,255,0.15)); background: var(--input-bg, rgba(0,0,0,0.25)); color: var(--text-primary, #ededed);"
          />
        </div>

        <div>
          <label for="swal-global-sheet-name" style="font-size: 11px; font-weight: 700; color: var(--text-secondary, #8b8b8b); display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${escapeHtml(TEXT_MONITORING.SYNC_MODAL.LABEL_SHEET_NAME)}
          </label>
          <input
            id="swal-global-sheet-name"
            type="text"
            placeholder="${escapeHtml(TEXT_MONITORING.SYNC_MODAL.PLACEHOLDER_SHEET_NAME)}"
            value="${escapeHtml(initialSheetName)}"
            style="width: 100%; box-sizing: border-box; padding: 9px 12px; font-size: 13px; border-radius: 8px; border: 1px solid var(--card-border, rgba(255,255,255,0.15)); background: var(--input-bg, rgba(0,0,0,0.25)); color: var(--text-primary, #ededed);"
          />
        </div>
      </div>
    </div>
  `;

  const result = await pdoSwal.fire({
    title: TEXT_MONITORING.SYNC_MODAL.TITLE,
    html: formHtml,
    icon: "info",
    showCancelButton: true,
    confirmButtonText: TEXT_MONITORING.SYNC_MODAL.BTN_CONFIRM,
    cancelButtonText: TEXT_MONITORING.SYNC_MODAL.BTN_CANCEL,
    reverseButtons: true,
    focusConfirm: false,
    preConfirm: () => {
      const urlEl = document.getElementById("swal-global-sheet-url") as HTMLInputElement | null;
      const sheetEl = document.getElementById("swal-global-sheet-name") as HTMLInputElement | null;

      const url = (urlEl?.value || "").trim();
      const sheetName = (sheetEl?.value || "").trim();

      if (!url) {
        pdoSwal.showValidationMessage("Link Spreadsheet Global wajib diisi.");
        return false;
      }

      if (!sheetName) {
        pdoSwal.showValidationMessage("Nama Lembar (Sheet) wajib diisi.");
        return false;
      }

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("pdo_regional_global_sheet_url", url);
        } catch (e) {
          console.warn("Gagal menyimpan URL ke localStorage:", e);
        }
      }

      return {
        spreadsheetUrl: url,
        sheetName,
      };
    },
  });

  if (!result.isConfirmed || !result.value) {
    return null;
  }

  return result.value as RegionalSyncModalResult;
}
