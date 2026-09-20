// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BusInputModal } from "./BusInputModal";
import type { BusData } from "@/services/googleSheets";
import { getSatsetMode, setSatsetMode } from "@/utils/modals/busInput/busModalTypes";
import { TEXT_ALERTS, TEXT_FLEET_STATUS } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const createMockBus = (partial: Partial<BusData> = {}): BusData => ({
  rowIndex: 7,
  unit: "JAK.15-09",
  tripPergi: "3",
  tripPulang: "3",
  toaShift1: "120",
  toaShift2: "140",
  manualShift1: "",
  manualShift2: "",
  totalToa: "260",
  kmAwal1: "1000",
  kmAkhir1: "1050",
  kmAwal2: "1050",
  kmAkhir2: "1110",
  keterangan: "",
  originalRow: [],
  ...partial,
});

describe("BusInputModal Component (Declarative React JSX Modal)", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    setSatsetMode(false);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    // Clean up modal overlay portal in document.body
    document.body.innerHTML = "";
  });

  it("does not render when isOpen is false", async () => {
    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={false}
          onClose={vi.fn()}
          bus={createMockBus()}
          onSave={vi.fn()}
        />,
      );
    });

    const modal = document.body.querySelector(".bus-input-modal-overlay");
    expect(modal).toBeNull();
  });

  it("renders modal header with unit name and close button when isOpen is true", async () => {
    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus({ unit: "JAK.15-99" })}
          onSave={vi.fn()}
        />,
      );
    });

    const modal = document.body.querySelector(".bus-input-modal-overlay");
    expect(modal).not.toBeNull();
    expect(document.body.textContent).toContain("JAK.15-99");
    expect(document.body.textContent).not.toContain("Unit JAK.15-99");
    expect(document.body.textContent).not.toContain(TEXT_ALERTS.BUS_INPUT_MODAL.SUBTITLE);
  });

  it("navigates between Shift 1, Shift 2, Ritase, and Ket tabs correctly", async () => {
    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus()}
          onSave={vi.fn()}
        />,
      );
    });

    // Default tab is shift1
    expect(document.body.querySelector("#input-toa-s1")).not.toBeNull();
    expect(document.body.querySelector("#input-toa-s2")).toBeNull();

    // Switch to Shift 2 tab
    const tabButtons = document.body.querySelectorAll("button");
    const shift2Btn = Array.from(tabButtons).find((b) => b.textContent?.includes("Shift 2"));
    expect(shift2Btn).toBeDefined();

    await act(async () => {
      shift2Btn?.click();
    });

    expect(document.body.querySelector("#input-toa-s2")).not.toBeNull();
    expect(document.body.querySelector("#input-toa-s1")).toBeNull();

    // Switch to Ritase tab
    const ritaseBtn = Array.from(tabButtons).find((b) =>
      b.textContent?.includes(TEXT_ALERTS.BUS_INPUT_MODAL.TAB_RITASE),
    );
    expect(ritaseBtn).toBeDefined();

    await act(async () => {
      ritaseBtn?.click();
    });

    expect(document.body.querySelector("#input-trip-pergi")).not.toBeNull();
    expect(document.body.querySelector("#input-trip-pulang")).not.toBeNull();

    // Switch to Ket tab
    const ketBtn = Array.from(tabButtons).find((b) =>
      b.textContent?.includes(TEXT_ALERTS.BUS_INPUT_MODAL.TAB_KET),
    );
    expect(ketBtn).toBeDefined();

    await act(async () => {
      ketBtn?.click();
    });

    expect(document.body.querySelector("#input-keterangan")).not.toBeNull();
  });

  it("calculates live distance accurately for Shift 1 and Shift 2", async () => {
    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus({
            kmAwal1: "12000.5",
            kmAkhir1: "12045.5",
          })}
          onSave={vi.fn()}
        />,
      );
    });

    // In Shift 1 tab, live distance preview should be 45.0 KM
    expect(document.body.textContent).toContain("45.0 KM");

    // Switch to Shift 2
    const shift2Btn = Array.from(document.body.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Shift 2"),
    );
    await act(async () => {
      shift2Btn?.click();
    });

    // In Shift 2 tab, bus has kmAwal2=1050, kmAkhir2=1110 -> 60.0 KM
    expect(document.body.textContent).toContain("60.0 KM");
  });

  it("validates KM akhir < KM awal and blocks submission with warning message", async () => {
    const onSaveMock = vi.fn();

    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus({
            kmAwal1: "500",
            kmAkhir1: "400", // Invalid: akhir < awal
          })}
          onSave={onSaveMock}
        />,
      );
    });

    const form = document.body.querySelector("form");
    expect(form).not.toBeNull();

    await act(async () => {
      form?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });

    // Should not call onSave
    expect(onSaveMock).not.toHaveBeenCalled();
    // Should display validation error header
    expect(document.body.textContent).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.VALIDATION_HEADER);
    expect(document.body.textContent).toContain("tidak boleh lebih kecil");
  });

  it("toggles Satset Mode state correctly", async () => {
    expect(getSatsetMode()).toBe(false);

    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus()}
          onSave={vi.fn()}
        />,
      );
    });

    const satsetBtn = document.body.querySelector<HTMLButtonElement>("#btn-toggle-satset");
    expect(satsetBtn).not.toBeNull();

    await act(async () => {
      satsetBtn?.click();
    });

    expect(getSatsetMode()).toBe(true);
  });

  it("submits valid form data and triggers onSave with normalized values", async () => {
    const onSaveMock = vi.fn();
    const onCloseMock = vi.fn();

    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={onCloseMock}
          bus={createMockBus({
            toaShift1: "110",
            toaShift2: "130",
            kmAwal1: "100",
            kmAkhir1: "150",
            kmAwal2: "150",
            kmAkhir2: "200",
            tripPergi: "2",
            tripPulang: "2",
          })}
          onSave={onSaveMock}
        />,
      );
    });

    const form = document.body.querySelector("form");
    await act(async () => {
      form?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });

    expect(onSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        toaShift1: "110",
        toaShift2: "130",
        totalToa: "240",
        kmAwal1: "100",
        kmAkhir1: "150",
        kmAwal2: "150",
        kmAkhir2: "200",
        tripPergi: "2",
        tripPulang: "2",
      }),
    );
  });

  it("renders unconfirmed shift reminder banner when isShiftConfirmed is false", async () => {
    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus()}
          onSave={vi.fn()}
          isShiftConfirmed={false}
          activeShift={1}
        />,
      );
    });

    expect(document.body.textContent).toContain(
      TEXT_FLEET_STATUS.MODAL.MODAL_REMINDER(1),
    );
  });

  it("renders Single-Column Focus Speed-Run mode when activeCategory is toaShift1", async () => {
    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus({ toaShift1: "150" })}
          activeCategory="toaShift1"
          onSave={vi.fn()}
        />,
      );
    });

    // Single input field should exist
    const singleInput = document.body.querySelector<HTMLInputElement>(
      "#single-input-toaShift1",
    );
    expect(singleInput).not.toBeNull();
    expect(singleInput?.value).toBe("150");

    // Segmented tab buttons (Shift 1, Shift 2, etc.) should be hidden in single mode
    expect(document.body.querySelector("#input-toa-s1")).toBeNull();

    // Toggle button should show 'Semua Kolom'
    const toggleBtn = Array.from(document.body.querySelectorAll("button")).find(
      (b) => b.textContent?.includes(TEXT_ALERTS.BUS_INPUT_MODAL.SWITCH_TO_FULL_FORM),
    );
    expect(toggleBtn).toBeDefined();

    // Clicking 'Semua Kolom' switches to full tabbed view
    await act(async () => {
      toggleBtn?.click();
    });

    expect(document.body.querySelector("#input-toa-s1")).not.toBeNull();
    expect(document.body.textContent).toContain(
      TEXT_ALERTS.BUS_INPUT_MODAL.SWITCH_TO_SINGLE_FOCUS,
    );
  });

  it("toggles progressive disclosure chips (+ Manual S1 and + Catatan) in Single-Column mode", async () => {
    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus({ manualShift1: "", keterangan: "" })}
          activeCategory="toaShift1"
          onSave={vi.fn()}
        />,
      );
    });

    // Initially manual and note fields are not shown
    expect(document.body.querySelector("#single-input-manualShift1")).toBeNull();
    expect(document.body.querySelector("#single-input-keterangan")).toBeNull();

    // Click '+ Manual S1'
    const manualChip = Array.from(document.body.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("+ Manual S1"),
    );
    expect(manualChip).toBeDefined();

    await act(async () => {
      manualChip?.click();
    });

    expect(document.body.querySelector("#single-input-manualShift1")).not.toBeNull();

    // Click '+ Catatan'
    const noteChip = Array.from(document.body.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("+ Catatan"),
    );
    expect(noteChip).toBeDefined();

    await act(async () => {
      noteChip?.click();
    });

    expect(document.body.querySelector("#single-input-keterangan")).not.toBeNull();
  });

  it("submits form on Enter keydown directly (Enter-to-Save)", async () => {
    const onSaveMock = vi.fn();

    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus({ toaShift1: "175" })}
          activeCategory="toaShift1"
          onSave={onSaveMock}
        />,
      );
    });

    const singleInput = document.body.querySelector<HTMLInputElement>(
      "#single-input-toaShift1",
    );
    expect(singleInput).not.toBeNull();

    await act(async () => {
      singleInput?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
      );
    });

    expect(onSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        toaShift1: "175",
      }),
    );
  });

  it("blocks submission if validateToaPair fails (Total TOA < TOA S1)", async () => {
    const onSaveMock = vi.fn();

    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus({
            toaShift1: "200",
            totalToa: "150", // Invalid: Total TOA cannot be less than TOA S1
          })}
          activeCategory="totalToa"
          onSave={onSaveMock}
        />,
      );
    });

    const form = document.body.querySelector("form");
    await act(async () => {
      form?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });

    expect(onSaveMock).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.VALIDATION_HEADER);
    expect(document.body.textContent).toContain("tidak boleh lebih kecil dari TOA Shift 1");
  });

  it("allows copying KM Akhir S1 to KM Awal S2 via quick copy button in single mode", async () => {
    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus({
            kmAkhir1: "12345.6",
            kmAwal2: "",
          })}
          activeCategory="kmAwal2"
          onSave={vi.fn()}
        />,
      );
    });

    const copyBtn = Array.from(document.body.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Salin KM Akhir S1"),
    );
    expect(copyBtn).toBeDefined();

    await act(async () => {
      copyBtn?.click();
    });

    const inputKmAwal2 = document.body.querySelector<HTMLInputElement>(
      "#single-input-kmAwal2",
    );
    expect(inputKmAwal2?.value).toBe("12345.6");
  });

  it("auto-prefills 3 leading digits of KM Akhir S1 when empty and KM Awal S1 exists", async () => {
    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus({
            kmAwal1: "145800",
            kmAkhir1: "",
          })}
          initialTab="shift1"
          onSave={vi.fn()}
        />,
      );
    });

    const inputKmAkhir1 = document.body.querySelector<HTMLInputElement>("#input-km-akhir-1");
    expect(inputKmAkhir1?.value).toBe("145");
  });

  it("auto-prefills 3 leading digits of KM Akhir S2 when empty and KM Awal S2 exists", async () => {
    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus({
            kmAwal2: "146050",
            kmAkhir2: "",
          })}
          initialTab="shift2"
          onSave={vi.fn()}
        />,
      );
    });

    const inputKmAkhir2 = document.body.querySelector<HTMLInputElement>("#input-km-akhir-2");
    expect(inputKmAkhir2?.value).toBe("146");
  });

  it("auto-prefills 3 leading digits of KM Awal S1 and Akhir S1 from previousDayKmAkhir2 when empty", async () => {
    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus({
            kmAwal1: "",
            kmAkhir1: "",
          })}
          initialTab="shift1"
          onSave={vi.fn()}
          previousDayKmAkhir2="152890"
        />,
      );
    });

    const inputKmAwal1 = document.body.querySelector<HTMLInputElement>("#input-km-awal-1");
    expect(inputKmAwal1?.value).toBe("152");

    const inputKmAkhir1 = document.body.querySelector<HTMLInputElement>("#input-km-akhir-1");
    expect(inputKmAkhir1?.value).toBe("152");
  });

  it("positions cursor at the end of 3-digit prefill instead of selecting all text", async () => {
    vi.useFakeTimers();

    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus({
            kmAwal1: "",
          })}
          activeCategory="kmAwal1"
          onSave={vi.fn()}
          previousDayKmAkhir2="289514"
        />,
      );
    });

    const input = document.body.querySelector<HTMLInputElement>("#single-input-kmAwal1");
    expect(input?.value).toBe("289");

    // Fast-forward timer autofocus 60ms
    await act(async () => {
      vi.advanceTimersByTime(70);
    });

    // Kursor harus berada di indeks 3 (akhir teks), bukan memblok teks 0 s/d 3
    expect(input?.selectionStart).toBe(3);
    expect(input?.selectionEnd).toBe(3);

    vi.useRealTimers();
  });

  it("displays transparent date label in prefill reference badge when bus was OFF yesterday", async () => {
    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus({ kmAwal1: "" })}
          activeCategory="kmAwal1"
          onSave={vi.fn()}
          previousDayKmAkhir2="289514"
          previousDayDateLabel="Tgl 18"
        />,
      );
    });

    // Badge acuan harus menampilkan tanggal asal: "Acuan KM (Tgl 18): 289514"
    expect(document.body.textContent).toContain("Acuan KM (Tgl 18): 289514");
  });
});

