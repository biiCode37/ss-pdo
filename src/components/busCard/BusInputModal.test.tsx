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
    expect(document.body.textContent).toContain("Unit JAK.15-99");
    expect(document.body.textContent).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.SUBTITLE);
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

    const satsetBtn = Array.from(document.body.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Satset"),
    );
    expect(satsetBtn).toBeDefined();

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
});
