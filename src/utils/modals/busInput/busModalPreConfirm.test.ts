// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleModalPreConfirm } from "./busModalPreConfirm";
import type { BusData } from "@/services/googleSheets";
import { pdoSwal } from "@/utils/alertUtils";

vi.mock("@/utils/alertUtils", () => ({
  pdoSwal: {
    showValidationMessage: vi.fn(),
  },
}));

describe("busModalPreConfirm Module", () => {
  let container: HTMLDivElement;

  const mockBus: BusData = {
    rowIndex: 2,
    unit: "MYS-01",
    tripPergi: "1",
    tripPulang: "1",
    toaShift1: "50",
    toaShift2: "50",
    manualShift1: "",
    manualShift2: "",
    totalToa: "100",
    kmAwal1: "100",
    kmAkhir1: "150",
    kmAwal2: "150",
    kmAkhir2: "200",
    keterangan: "",
    originalRow: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    container.innerHTML = `
      <div id="swal-note-prefix-badge" style="display: none;">
        <span id="swal-note-prefix-text"></span>
      </div>
      <input id="swal-input-keterangan" value="" />
      <div id="swal-wrapper-keterangan" style="display: none;"></div>
      <input id="swal-input-tripPergi" value="" />
      <input id="swal-input-tripPulang" value="" />
      <input id="swal-input-single" value="" />
      <input id="swal-input-toaShift1" value="" />
      <input id="swal-input-totalToa" value="" />
      <input id="swal-input-kmAwal1" value="" />
      <input id="swal-input-kmAkhir1" value="" />
      <input id="swal-input-kmAwal2" value="" />
      <input id="swal-input-kmAkhir2" value="" />
    `;
    document.body.appendChild(container);
  });

  it("handles trip mode valid input correctly", () => {
    container.querySelector<HTMLInputElement>(
      "#swal-input-tripPergi",
    )!.value = "3";
    container.querySelector<HTMLInputElement>(
      "#swal-input-tripPulang",
    )!.value = "3";

    const res = handleModalPreConfirm(
      container,
      {
        bus: mockBus,
        activeCategory: "trip",
        headerMap: { tripPergi: 1, tripPulang: 2 } as any,
      },
      false,
    );

    expect(res).toEqual({
      tripPergi: "3",
      tripPulang: "3",
    });
  });

  it("rejects trip mode input when trip exceeds maximum count", () => {
    container.querySelector<HTMLInputElement>(
      "#swal-input-tripPergi",
    )!.value = "25";

    const res = handleModalPreConfirm(
      container,
      {
        bus: mockBus,
        activeCategory: "trip",
        headerMap: { tripPergi: 1, tripPulang: 2 } as any,
      },
      false,
    );

    expect(res).toBe(false);
    expect(pdoSwal.showValidationMessage).toHaveBeenCalled();
  });

  it("handles single column mode for toaShift1", () => {
    container.querySelector<HTMLInputElement>(
      "#swal-input-toaShift1",
    )!.value = "75";

    const res = handleModalPreConfirm(
      container,
      {
        bus: mockBus,
        activeCategory: "toaShift1",
      },
      false,
      { label: "TOA Shift 1", placeholder: "0", key: "toaShift1" },
    );

    expect(res).toEqual({
      toaShift1: "75",
    });
  });

  it("rejects kmAkhir1 smaller than kmAwal1 in single column mode", () => {
    container.querySelector<HTMLInputElement>(
      "#swal-input-single",
    )!.value = "80";

    const res = handleModalPreConfirm(
      container,
      {
        bus: mockBus,
        activeCategory: "kmAkhir1",
      },
      false,
      { label: "KM Akhir 1", placeholder: "0", key: "kmAkhir1" },
    );

    expect(res).toBe(false);
    expect(pdoSwal.showValidationMessage).toHaveBeenCalled();
  });

  it("clears operational fields when unit note is OFF", () => {
    container.querySelector<HTMLInputElement>(
      "#swal-input-keterangan",
    )!.value = "OFF";
    container.querySelector<HTMLInputElement>(
      "#swal-input-tripPergi",
    )!.value = "2";

    const res = handleModalPreConfirm(
      container,
      {
        bus: mockBus,
        activeCategory: "trip",
        headerMap: { tripPergi: 1, tripPulang: 2 } as any,
      },
      false,
    );

    expect(res).toEqual({
      tripPergi: "",
      tripPulang: "",
      keterangan: "OFF",
    });
  });
});
