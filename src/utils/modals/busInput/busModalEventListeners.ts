import { pdoSwal } from "@/utils/alertUtils";
import { parseIndonesianNumber } from "@/utils/numberUtils";
import { TEXT_ALERTS } from "@/constants/texts";
import {
  type BusModalOptions,
  getSatsetMode,
  setSatsetMode,
  MAX_SHIFT_DISTANCE_KM,
} from "./busModalTypes";
import { escapeHtml } from "./busModalValidation";
import { setupSmartKeteranganLogic } from "./busModalKeterangan";

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

  // 1. Inisialisasi logika Smart Keterangan
  setupSmartKeteranganLogic(popup);

  // 2. Inisialisasi Segmented Tab Switcher untuk Mode ALL
  if (isAll) {
    const segBtns =
      popup.querySelectorAll<HTMLButtonElement>(".swal-segment-btn");
    const panelSections =
      popup.querySelectorAll<HTMLElement>(".swal-panel-section");

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

  // 3. Auto focus ke input utama sesuai kategori
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

  // 4. Enter keydown handler & smart auto-scroll on inputs
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

  // 5. Quick Copy KM S1 to KM Awal S2 buttons
  const copyBtnAll = popup.querySelector<HTMLButtonElement>(
    "#swal-btn-copy-km-all",
  );
  if (copyBtnAll) {
    copyBtnAll.addEventListener("click", () => {
      const kmAkhir1Val = (
        popup.querySelector("#swal-input-kmAkhir1") as HTMLInputElement | null
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

  // 6. Live KM diff preview untuk KM Akhir S1 & KM Akhir S2
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

  // 7. Handler chip progressive disclosure di mode spesifik
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

  // 8. Handler Toggle Mode Satset / Beruntun (Auto-Next Bus)
  const toggleSatsetBtn =
    popup.querySelector<HTMLButtonElement>("#swal-toggle-satset");
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
        toggleSatsetBtn.title =
          TEXT_ALERTS.BUS_INPUT_MODAL.SATSET_INACTIVE_TITLE;
      }
    });
  }
}
