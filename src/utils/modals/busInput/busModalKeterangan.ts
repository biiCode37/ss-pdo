import { normalizeKeterangan } from "@/utils/keteranganUtils";
import { TEXT_ALERTS } from "@/constants/texts";

/**
 * Setup event listeners untuk Smart Keterangan Input (Chips, Prefix Badge, Clear, BA.02 Dropdown)
 */
export function setupSmartKeteranganLogic(popup: HTMLElement): void {
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
      noteInput.placeholder = TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_BA02;
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
            noteInput.placeholder = TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_PREFIX;
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
          noteInput.placeholder = TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_FIXED;
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
        noteInput.placeholder = TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_DEFAULT;
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
        noteInput.placeholder = TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_DEFAULT;
        noteInput.focus();
      }
    });
  }
}

/**
 * Logika ekstraksi keterangan dari form input (Prefix + Detail)
 */
export function extractKeteranganFromForm(popup: HTMLElement): string {
  const prefixBadge = popup.querySelector<HTMLElement>(
    "#swal-note-prefix-badge",
  );
  const prefixText = popup.querySelector<HTMLElement>("#swal-note-prefix-text");
  const isPrefixActive = prefixBadge && prefixBadge.style.display !== "none";
  const prefix = isPrefixActive && prefixText ? prefixText.innerText.trim() : "";
  const ba02Select = popup.querySelector<HTMLSelectElement>(
    "#swal-select-ba02-detail",
  );
  const ba02Wrapper = popup.querySelector<HTMLElement>(
    "#swal-select-ba02-wrapper",
  );
  const isBa02Active =
    prefix === "BA.02" && ba02Wrapper && ba02Wrapper.style.display !== "none";

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
      rawNote = "";
    }
  } else {
    rawNote = noteInput ? noteInput.value.trim() : "";
  }

  let resolvedKeterangan = rawNote;
  if (prefix) {
    resolvedKeterangan = rawNote ? `${prefix} ${rawNote}` : prefix;
  }
  return normalizeKeterangan(resolvedKeterangan);
}
