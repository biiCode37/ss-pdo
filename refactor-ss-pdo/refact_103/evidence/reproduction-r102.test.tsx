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

describe("Reproduksi Bug R102-01 dan R102-02 (Sebelum Perbaikan)", () => {
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

  it("R102-01 BUG: Pada mode fokus kmAwal2 dengan Shift 1 parsial (kmAwal1 kosong, kmAkhir1 100000), submit menghasilkan error S2 tetapi hasCrossDayError bernilai FALSE", () => {
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

    // Prefill kmAwal1 adalah "120" (draft 3 digit)
    expect(latestForm?.kmAwal1).toBe("120");
    expect(latestForm?.kmAwal2).toBe("90000");

    // Lakukan submit form
    act(() => {
      const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      latestForm?.handleFormSubmit(dummyEvent);
    });

    // Buktikan error S2 dihasilkan:
    expect(latestForm?.validationErrors.length).toBeGreaterThan(0);
    const hasS2Error = latestForm?.validationErrors.some((e) => e.includes("Shift 2") && e.includes("tidak boleh lebih kecil"));
    expect(hasS2Error).toBe(true);

    // KETIDAKKONSISTENAN (BUG R102-01):
    // hasCrossDayError bernilai false padahal error lintas hari S2 baru saja dihasilkan!
    // Akibatnya checkbox bypass TIDAK MUNCUL!
    // Pada kode sebelum fix, baris berikut membuktikan bug:
    expect(latestForm?.hasCrossDayError).toBe(false); // BUG: seharusnya true!
  });

  it("R102-02 BUG: Ketika hanya ada satu error lintas hari, mencentang bypass menghilangkan seluruh panel termasuk checkbox", async () => {
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
          previousDayKmAkhir2="120000" // hanya cross-day error S1
        />
      );
    });

    // Submit form
    const formEl = document.body.querySelector("form");
    await act(async () => {
      formEl?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });

    // Checkbox bypass tampil
    const checkbox = document.body.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(checkbox).not.toBeNull();
    expect(checkbox?.checked).toBe(false);

    // Centang checkbox bypass
    await act(async () => {
      checkbox?.click();
    });

    // BUG R102-02:
    // Karena validationErrors.length = 0, seluruh div alert (parent) hilang dari DOM!
    // Checkbox ikut HILANG sehingga querySelector bernilai null!
    const checkboxAfter = document.body.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(checkboxAfter).toBeNull(); // BUG: seharusnya TIDAK null (tetap ada dan checked)!
  });
});
