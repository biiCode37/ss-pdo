import { pdoSwal } from "@/utils/alertUtils";
import type { BusData } from "@/services/googleSheets";
import { parseIndonesianNumber } from "@/utils/numberUtils";
import { normalizeKeterangan } from "@/utils/keteranganUtils";
import { TEXT_ALERTS } from "@/constants/texts";
import {
  type BusModalOptions,
  getSatsetMode,
  setSatsetMode,
  MAX_SHIFT_DISTANCE_KM,
} from "./busModalTypes";
import {
  escapeHtml,
  validateKmPair,
  validateToaValue,
  validateToaPair,
  validateTripCount,
} from "./busModalValidation";

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
 * Setup seluruh event listener saat modal dibuka (didOpen)
 */
export function setupModalEventListeners(
  popup: HTMLElement,
  options: BusModalOptions,
  isAll: boolean,
  initTab: string,
): void {
  const { bus, activeCategory = "all" } = options;

  // Inisialisasi logika Smart Keterangan
  setupSmartKeteranganLogic(popup);

  // Inisialisasi Segmented Tab Switcher untuk Mode ALL
  if (isAll) {
    const segBtns = popup.querySelectorAll<HTMLButtonElement>(".swal-segment-btn");
    const panelSections = popup.querySelectorAll<HTMLElement>(".swal-panel-section");

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
            const firstInput = panel.querySelector<HTMLInputElement>("input");
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
    if (initTab === "trip") {
      primaryInput = popup.querySelector("#swal-input-tripPergi");
    } else if (initTab === "shift2") {
      primaryInput = popup.querySelector("#swal-input-totalToa");
    } else if (initTab === "notes") {
      primaryInput = popup.querySelector("#swal-custom-keterangan");
    } else {
      primaryInput = popup.querySelector("#swal-input-toaShift1");
    }
  } else if (activeCategory === "trip") {
    primaryInput = popup.querySelector("#swal-input-tripPergi");
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
  const copyBtnAll = popup.querySelector<HTMLButtonElement>("#swal-btn-copy-km-all");
  if (copyBtnAll) {
    copyBtnAll.addEventListener("click", () => {
      const kmAkhir1Val = (
        popup.querySelector("#swal-input-kmAkhir1") as HTMLInputElement | null
      )?.value;
      const kmAwal2Input = popup.querySelector("#swal-input-kmAwal2") as HTMLInputElement | null;
      if (kmAwal2Input && kmAkhir1Val) {
        kmAwal2Input.value = kmAkhir1Val;
        kmAwal2Input.focus();
        kmAwal2Input.select();
      }
    });
  }

  const copyBtnSingle = popup.querySelector<HTMLButtonElement>("#swal-btn-copy-km-single");
  if (copyBtnSingle) {
    copyBtnSingle.addEventListener("click", () => {
      const singleInput = popup.querySelector("#swal-input-single") as HTMLInputElement | null;
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
    const singleInput = popup.querySelector<HTMLInputElement>("#swal-input-single");
    const refValSpan = popup.querySelector<HTMLElement>("#swal-km-ref-val");
    const kmAwalRaw = activeCategory === "kmAkhir1" ? bus.kmAwal1 : bus.kmAwal2;
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
        refValSpan.innerHTML = `${escapeHtml(kmAwalRaw)} <span style="font-size: 11px; color: var(--danger-color, #ef4444); font-weight: 700;">${TEXT_ALERTS.BUS_INPUT_MODAL.DIFF_SMALLER}</span>`;
      } else if (diff > MAX_SHIFT_DISTANCE_KM) {
        refValSpan.innerHTML = `${escapeHtml(kmAwalRaw)} <span style="font-size: 11px; color: var(--danger-color, #ef4444); font-weight: 800;">${TEXT_ALERTS.BUS_INPUT_MODAL.DIFF_EXCEEDS(diff, MAX_SHIFT_DISTANCE_KM)}</span>`;
      } else {
        refValSpan.innerHTML = `${escapeHtml(kmAwalRaw)} <span style="font-size: 11px; color: var(--success-color, #22c55e); font-weight: 700;">${TEXT_ALERTS.BUS_INPUT_MODAL.DIFF_VALID(diff)}</span>`;
      }
    };

    if (singleInput) {
      singleInput.addEventListener("input", updateDiffDisplay);
      updateDiffDisplay();
    }
  }

  // Handler chip progressive disclosure di mode spesifik
  const chipManual1 = popup.querySelector<HTMLButtonElement>("#swal-chip-manualShift1");
  if (chipManual1) {
    chipManual1.addEventListener("click", () => {
      const wrapper = popup.querySelector<HTMLElement>("#swal-wrapper-manualShift1");
      if (wrapper) {
        wrapper.style.display = "block";
        const input = wrapper.querySelector<HTMLInputElement>("input");
        if (input) input.focus();
      }
      chipManual1.style.display = "none";
    });
  }

  const chipManual2 = popup.querySelector<HTMLButtonElement>("#swal-chip-manualShift2");
  if (chipManual2) {
    chipManual2.addEventListener("click", () => {
      const wrapper = popup.querySelector<HTMLElement>("#swal-wrapper-manualShift2");
      if (wrapper) {
        wrapper.style.display = "block";
        const input = wrapper.querySelector<HTMLInputElement>("input");
        if (input) input.focus();
      }
      chipManual2.style.display = "none";
    });
  }

  const chipKet = popup.querySelector<HTMLButtonElement>("#swal-chip-keterangan");
  if (chipKet) {
    chipKet.addEventListener("click", () => {
      const wrapper = popup.querySelector<HTMLElement>("#swal-wrapper-keterangan");
      if (wrapper) {
        wrapper.style.display = "block";
        const input = wrapper.querySelector<HTMLInputElement>("#swal-input-keterangan");
        if (input) input.focus();
      }
      chipKet.style.display = "none";
    });
  }

  // Handler Toggle Mode Satset / Beruntun (Auto-Next Bus)
  const toggleSatsetBtn = popup.querySelector<HTMLButtonElement>("#swal-toggle-satset");
  if (toggleSatsetBtn) {
    toggleSatsetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const nextState = !getSatsetMode();
      setSatsetMode(nextState);
      if (nextState) {
        toggleSatsetBtn.classList.add("active");
        toggleSatsetBtn.title = TEXT_ALERTS.BUS_INPUT_MODAL.SATSET_ACTIVE_TITLE;
      } else {
        toggleSatsetBtn.classList.remove("active");
        toggleSatsetBtn.title = TEXT_ALERTS.BUS_INPUT_MODAL.SATSET_INACTIVE_TITLE;
      }
    });
  }
}

/**
 * Logika ekstraksi keterangan dari form input (Prefix + Detail)
 */
export function extractKeteranganFromForm(popup: HTMLElement): string {
  const prefixBadge = popup.querySelector<HTMLElement>("#swal-note-prefix-badge");
  const prefixText = popup.querySelector<HTMLElement>("#swal-note-prefix-text");
  const isPrefixActive = prefixBadge && prefixBadge.style.display !== "none";
  const prefix = isPrefixActive && prefixText ? prefixText.innerText.trim() : "";
  const ba02Select = popup.querySelector<HTMLSelectElement>("#swal-select-ba02-detail");
  const ba02Wrapper = popup.querySelector<HTMLElement>("#swal-select-ba02-wrapper");
  const isBa02Active =
    prefix === "BA.02" && ba02Wrapper && ba02Wrapper.style.display !== "none";

  const noteInput = popup.querySelector<HTMLInputElement>("#swal-input-keterangan");

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

/**
 * Handle preConfirm modal SweetAlert2
 */
export function handleModalPreConfirm(
  popup: HTMLElement,
  options: BusModalOptions,
  isAll: boolean,
  singleMeta?: { label: string; placeholder: string; key: keyof BusData },
): Partial<BusData> | false | null {
  const { bus, activeCategory = "all", headerMap } = options;
  const updates: Partial<BusData> = {};

  const resolvedKeterangan = extractKeteranganFromForm(popup);
  const upperKet = resolvedKeterangan.toUpperCase();
  const isOffUnit = upperKet === "OFF";
  const isNp1Unit = /\bNP1\b/i.test(upperKet);
  const isNp2Unit = /\bNP2\b/i.test(upperKet);

  if (!isAll && activeCategory === "trip") {
    // Mode Trip
    const tripPergiInput = popup.querySelector<HTMLInputElement>("#swal-input-tripPergi");
    const tripPulangInput = popup.querySelector<HTMLInputElement>("#swal-input-tripPulang");
    const tripPergiVal = tripPergiInput ? tripPergiInput.value.trim() : "";
    const tripPulangVal = tripPulangInput ? tripPulangInput.value.trim() : "";

    const tripPergiErr = validateTripCount(tripPergiVal, "Trip Pergi");
    if (tripPergiErr) {
      pdoSwal.showValidationMessage(tripPergiErr);
      return false;
    }
    const tripPulangErr = validateTripCount(tripPulangVal, "Trip Pulang");
    if (tripPulangErr) {
      pdoSwal.showValidationMessage(tripPulangErr);
      return false;
    }

    if (headerMap?.tripPergi !== undefined && headerMap.tripPergi !== -1) {
      updates.tripPergi = isOffUnit ? "" : tripPergiVal;
    }
    if (headerMap?.tripPulang !== undefined && headerMap.tripPulang !== -1) {
      updates.tripPulang = isOffUnit ? "" : tripPulangVal;
    }

    const wrapperKet = popup.querySelector<HTMLElement>("#swal-wrapper-keterangan");
    if (
      wrapperKet &&
      (wrapperKet.style.display !== "none" ||
        resolvedKeterangan !== (bus.keterangan || ""))
    ) {
      updates.keterangan = resolvedKeterangan;
    }
  } else if (!isAll && singleMeta) {
    // Mode Kolom Tunggal
    let singleInput: HTMLInputElement | null = null;
    if (activeCategory === "toaShift1") {
      singleInput = popup.querySelector<HTMLInputElement>("#swal-input-toaShift1");
    } else if (activeCategory === "totalToa") {
      singleInput = popup.querySelector<HTMLInputElement>("#swal-input-totalToa");
    } else {
      singleInput = popup.querySelector<HTMLInputElement>("#swal-input-single");
    }

    if (!singleInput) {
      singleInput = popup.querySelector<HTMLInputElement>(
        ".swal-bus-input-container input[type='number']",
      );
    }

    const val = singleInput ? singleInput.value.trim() : "";

    if (val !== "") {
      const numVal = parseIndonesianNumber(val, NaN);
      if (isNaN(numVal) || numVal < 0) {
        pdoSwal.showValidationMessage(TEXT_ALERTS.BUS_INPUT_MODAL.POSITIVE_NUMBER);
        return false;
      }
    }

    if (val !== "" && !isOffUnit) {
      if (activeCategory === "kmAkhir1") {
        const kmErr = validateKmPair(bus.kmAwal1 || "", val, "Shift 1");
        if (kmErr) {
          pdoSwal.showValidationMessage(kmErr);
          return false;
        }
      } else if (activeCategory === "kmAkhir2") {
        const kmErr = validateKmPair(bus.kmAwal2 || "", val, "Shift 2");
        if (kmErr) {
          pdoSwal.showValidationMessage(kmErr);
          return false;
        }
      } else if (activeCategory === "kmAwal1" && bus.kmAkhir1) {
        const kmErr = validateKmPair(val, bus.kmAkhir1, "Shift 1");
        if (kmErr) {
          pdoSwal.showValidationMessage(kmErr);
          return false;
        }
      } else if (activeCategory === "kmAwal2" && bus.kmAkhir2) {
        const kmErr = validateKmPair(val, bus.kmAkhir2, "Shift 2");
        if (kmErr) {
          pdoSwal.showValidationMessage(kmErr);
          return false;
        }
      } else if (activeCategory === "toaShift1") {
        const toaValErr = validateToaValue(val, "TOA Shift 1");
        if (toaValErr) {
          pdoSwal.showValidationMessage(toaValErr);
          return false;
        }
        if (bus.totalToa) {
          const toaErr = validateToaPair(val, bus.totalToa);
          if (toaErr) {
            pdoSwal.showValidationMessage(toaErr);
            return false;
          }
        }
      } else if (activeCategory === "totalToa") {
        const totValErr = validateToaValue(val, "Total TOA");
        if (totValErr) {
          pdoSwal.showValidationMessage(totValErr);
          return false;
        }
        if (bus.toaShift1) {
          const toaErr = validateToaPair(bus.toaShift1, val);
          if (toaErr) {
            pdoSwal.showValidationMessage(toaErr);
            return false;
          }
        }
      } else if (
        activeCategory === "manualShift1" ||
        activeCategory === "manualShift2"
      ) {
        const manErr = validateToaValue(val, singleMeta.label);
        if (manErr) {
          pdoSwal.showValidationMessage(manErr);
          return false;
        }
      } else if (
        activeCategory === "tripPergi" ||
        activeCategory === "tripPulang"
      ) {
        const tripErr = validateTripCount(val, singleMeta.label);
        if (tripErr) {
          pdoSwal.showValidationMessage(tripErr);
          return false;
        }
      }
    }

    const isTargetOff =
      isOffUnit ||
      (activeCategory === "toaShift1" && isNp1Unit) ||
      (activeCategory === "totalToa" && isOffUnit);
    (updates as any)[singleMeta.key] = isTargetOff ? "" : val;

    const wrapperKet = popup.querySelector<HTMLElement>("#swal-wrapper-keterangan");
    if (
      wrapperKet &&
      (wrapperKet.style.display !== "none" ||
        resolvedKeterangan !== (bus.keterangan || ""))
    ) {
      updates.keterangan = resolvedKeterangan;
    }

    if (activeCategory === "toaShift1") {
      const m1Wrapper = popup.querySelector<HTMLElement>("#swal-wrapper-manualShift1");
      const m1Input = popup.querySelector<HTMLInputElement>("#swal-input-manualShift1");
      if (m1Input) {
        const m1Val = m1Input.value.trim();
        const isM1Revealed = m1Wrapper && m1Wrapper.style.display !== "none";
        if (isM1Revealed || m1Val !== (bus.manualShift1 || "")) {
          if (m1Val !== "") {
            const m1Err = validateToaValue(m1Val, "Manual Shift 1");
            if (m1Err) {
              pdoSwal.showValidationMessage(m1Err);
              return false;
            }
            updates.manualShift1 = isOffUnit || isNp1Unit ? "" : m1Val;
          } else {
            updates.manualShift1 = "";
          }
        }
      }
    }

    if (activeCategory === "totalToa") {
      const m2Wrapper = popup.querySelector<HTMLElement>("#swal-wrapper-manualShift2");
      const m2Input = popup.querySelector<HTMLInputElement>("#swal-input-manualShift2");
      if (m2Input) {
        const m2Val = m2Input.value.trim();
        const isM2Revealed = m2Wrapper && m2Wrapper.style.display !== "none";
        if (isM2Revealed || m2Val !== (bus.manualShift2 || "")) {
          if (m2Val !== "") {
            const m2Err = validateToaValue(m2Val, "Manual Shift 2");
            if (m2Err) {
              pdoSwal.showValidationMessage(m2Err);
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
    // Mode Full (ALL)
    const tripPergi =
      popup.querySelector<HTMLInputElement>("#swal-input-tripPergi")?.value.trim() || "";
    const tripPulang =
      popup.querySelector<HTMLInputElement>("#swal-input-tripPulang")?.value.trim() || "";
    const toaShift1 =
      popup.querySelector<HTMLInputElement>("#swal-input-toaShift1")?.value.trim() || "";
    const manualShift1 =
      popup.querySelector<HTMLInputElement>("#swal-input-manualShift1")?.value.trim() || "";
    const totalToa =
      popup.querySelector<HTMLInputElement>("#swal-input-totalToa")?.value.trim() || "";
    const manualShift2 =
      popup.querySelector<HTMLInputElement>("#swal-input-manualShift2")?.value.trim() || "";
    const kmAwal1 =
      popup.querySelector<HTMLInputElement>("#swal-input-kmAwal1")?.value.trim() || "";
    const kmAkhir1 =
      popup.querySelector<HTMLInputElement>("#swal-input-kmAkhir1")?.value.trim() || "";
    const kmAwal2 =
      popup.querySelector<HTMLInputElement>("#swal-input-kmAwal2")?.value.trim() || "";
    const kmAkhir2 =
      popup.querySelector<HTMLInputElement>("#swal-input-kmAkhir2")?.value.trim() || "";

    const tripPergiErr = validateTripCount(tripPergi, "Trip Pergi");
    if (tripPergiErr) {
      pdoSwal.showValidationMessage(tripPergiErr);
      return false;
    }
    const tripPulangErr = validateTripCount(tripPulang, "Trip Pulang");
    if (tripPulangErr) {
      pdoSwal.showValidationMessage(tripPulangErr);
      return false;
    }

    const toa1ValErr = validateToaValue(toaShift1, "TOA Shift 1");
    if (toa1ValErr) {
      pdoSwal.showValidationMessage(toa1ValErr);
      return false;
    }
    const man1ValErr = validateToaValue(manualShift1, "Manual Shift 1");
    if (man1ValErr) {
      pdoSwal.showValidationMessage(man1ValErr);
      return false;
    }
    const totToaValErr = validateToaValue(totalToa, "Total TOA");
    if (totToaValErr) {
      pdoSwal.showValidationMessage(totToaValErr);
      return false;
    }
    const man2ValErr = validateToaValue(manualShift2, "Manual Shift 2");
    if (man2ValErr) {
      pdoSwal.showValidationMessage(man2ValErr);
      return false;
    }

    if (!isOffUnit) {
      const km1Err = validateKmPair(kmAwal1, kmAkhir1, "Shift 1");
      if (km1Err) {
        pdoSwal.showValidationMessage(km1Err);
        return false;
      }

      const km2Err = validateKmPair(kmAwal2, kmAkhir2, "Shift 2");
      if (km2Err) {
        pdoSwal.showValidationMessage(km2Err);
        return false;
      }

      const toaErr = validateToaPair(toaShift1, totalToa);
      if (toaErr) {
        pdoSwal.showValidationMessage(toaErr);
        return false;
      }
    }

    if (headerMap?.tripPergi !== undefined && headerMap.tripPergi !== -1) {
      updates.tripPergi = tripPergi;
    }
    if (headerMap?.tripPulang !== undefined && headerMap.tripPulang !== -1) {
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
}
