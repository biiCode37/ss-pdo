// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BusInputModal } from "@/components/busCard/BusInputModal";
import { useBusInputForm, type UseBusInputFormProps, type BusInputFormReturn } from "@/components/busCard/modal/useBusInputForm";
import type { BusData } from "@/services/googleSheets";

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

describe("Reproduksi Kegagalan R102-01 dan R102-02 Sebelum Perbaikan", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    document.body.innerHTML = "";
  });

  let latestForm: BusInputFormReturn | null = null;
  function HookTestComponent(props: UseBusInputFormProps) {
    const form = useBusInputForm(props);
    latestForm = form;
    return <div>{form.formId}</div>;
  }

  it("R102-01: hasCrossDayError HARUS true ketika submit menghasilkan error lintas hari S2 pada kondisi Shift 1 parsial", () => {
    const bus = createMockBus({
      kmAwal1: "",
      kmAkhir1: "100000",
      kmAwal2: "90000",
      kmAkhir2: "",
    });

    act(() => {
      root.render(
        <HookTestComponent
          bus={bus}
          activeCategory="kmAwal2"
          initialTab="shift2"
          isOpen={true}
          isMounted={true}
          onSave={vi.fn()}
          onDismiss={vi.fn()}
          previousDayKmAkhir2="120000"
          previousDayDateLabel="Kemarin"
        />
      );
    });

    act(() => {
      const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      latestForm?.handleFormSubmit(dummyEvent);
    });

    expect(latestForm?.validationErrors.some((e) => e.includes("Shift 2") && e.includes("tidak boleh lebih kecil"))).toBe(true);
    // Ekspektasi yang benar: checkbox bypass harus diaktifkan (true)
    expect(latestForm?.hasCrossDayError).toBe(true);
  });

  it("R102-02: Checkbox bypass HARUS tetap terlihat dan checked saat hanya ada satu error lintas hari dan telah dicentang", async () => {
    const bus = createMockBus({
      kmAwal1: "100000",
      kmAkhir1: "100050",
      kmAwal2: "100050",
      kmAkhir2: "100100",
      toaShift1: "100",
      totalToa: "200",
    });

    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={bus}
          activeCategory="all"
          initialTab="shift1"
          onSave={vi.fn()}
          previousDayKmAkhir2="120000"
        />
      );
    });

    const formEl = document.body.querySelector("form");
    await act(async () => {
      formEl?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });

    const checkbox = document.body.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(checkbox).not.toBeNull();

    await act(async () => {
      checkbox?.click();
    });

    // Ekspektasi yang benar: checkbox TETAP ADA di DOM dan berstatus checked
    const checkboxAfter = document.body.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(checkboxAfter).not.toBeNull();
    expect(checkboxAfter?.checked).toBe(true);
  });
});
