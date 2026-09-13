// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import {
  setupSmartKeteranganLogic,
  extractKeteranganFromForm,
} from "./busModalKeterangan";

describe("busModalKeterangan Module", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.innerHTML = `
      <div id="swal-note-prefix-badge" style="display: none;">
        <span id="swal-note-prefix-text"></span>
        <button id="swal-btn-remove-prefix"></button>
      </div>
      <div id="swal-select-ba02-wrapper" style="display: none;">
        <select id="swal-select-ba02-detail">
          <option value="">-- Pilih --</option>
          <option value="NP1">NP1</option>
          <option value="NP2">NP2</option>
          <option value="__CUSTOM__">Lainnya</option>
        </select>
        <button id="swal-btn-switch-dropdown" style="display: none;"></button>
      </div>
      <input id="swal-input-keterangan" value="" />
      <button class="swal-note-chip" data-type="ba" data-val="BA.01">BA.01</button>
      <button class="swal-note-chip" data-type="ba" data-val="BA.02">BA.02</button>
      <button class="swal-note-chip" data-type="fixed" data-val="OFF">OFF</button>
      <button id="swal-btn-clear-note">Clear</button>
    `;
    document.body.appendChild(container);
  });

  it("extracts empty string when no prefix or text is set", () => {
    expect(extractKeteranganFromForm(container)).toBe("");
  });

  it("extracts prefix with note text correctly", () => {
    const badge = container.querySelector<HTMLElement>(
      "#swal-note-prefix-badge",
    )!;
    const badgeText = container.querySelector<HTMLElement>(
      "#swal-note-prefix-text",
    )!;
    const input = container.querySelector<HTMLInputElement>(
      "#swal-input-keterangan",
    )!;

    badge.style.display = "flex";
    badgeText.innerText = "BA.01";
    input.value = "AC Rusak";

    expect(extractKeteranganFromForm(container)).toBe("BA.01 AC Rusak");
  });

  it("extracts BA.02 NP1 correctly from dropdown", () => {
    const badge = container.querySelector<HTMLElement>(
      "#swal-note-prefix-badge",
    )!;
    const badgeText = container.querySelector<HTMLElement>(
      "#swal-note-prefix-text",
    )!;
    const ba02Wrapper = container.querySelector<HTMLElement>(
      "#swal-select-ba02-wrapper",
    )!;
    const ba02Select = container.querySelector<HTMLSelectElement>(
      "#swal-select-ba02-detail",
    )!;

    badge.style.display = "flex";
    badgeText.innerText = "BA.02";
    ba02Wrapper.style.display = "flex";
    ba02Select.value = "NP1";

    expect(extractKeteranganFromForm(container)).toBe("BA.02 NP1");
  });

  it("handles fixed chip click to set OFF", () => {
    setupSmartKeteranganLogic(container);

    const offChip = container.querySelector<HTMLButtonElement>(
      '.swal-note-chip[data-val="OFF"]',
    )!;
    offChip.click();

    const input = container.querySelector<HTMLInputElement>(
      "#swal-input-keterangan",
    )!;
    expect(input.value).toBe("OFF");
    expect(input.readOnly).toBe(true);
  });

  it("handles clear button click to reset note input", () => {
    setupSmartKeteranganLogic(container);

    const input = container.querySelector<HTMLInputElement>(
      "#swal-input-keterangan",
    )!;
    input.value = "KENDALA";

    const clearBtn = container.querySelector<HTMLButtonElement>(
      "#swal-btn-clear-note",
    )!;
    clearBtn.click();

    expect(input.value).toBe("");
  });
});
