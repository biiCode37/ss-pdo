// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SingleFocusTrip } from "./SingleFocusTrip";
import type { BusInputFormReturn } from "../useBusInputForm";
import { TEXT_ALERTS } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("SingleFocusTrip Component", () => {
  let container: HTMLDivElement;
  let root: Root;

  const createMockForm = (overrides: Partial<BusInputFormReturn> = {}): BusInputFormReturn => ({
    isSingleMode: true,
    isSingleColumnEligible: true,
    activeCategory: "trip",
    activeShift: undefined,
    isExpandedAll: false,
    setIsExpandedAll: vi.fn(),
    activeTab: "trip",
    setActiveTab: vi.fn(),
    isSatset: false,
    handleToggleSatset: vi.fn(),
    formId: "test-trip-form-id",
    validationErrors: [],
    handleFormSubmit: vi.fn(),
    handleInputFocus: vi.fn(),
    handleInputKeyDown: vi.fn(),
    singlePrimaryInputRef: { current: null },
    toaS1InputRef: { current: null },
    toaS2InputRef: { current: null },
    tripPergiInputRef: { current: null },
    keteranganInputRef: { current: null },
    tripPergi: "4",
    setTripPergi: vi.fn(),
    tripPulang: "6",
    setTripPulang: vi.fn(),
    toaShift1: "",
    setToaShift1: vi.fn(),
    manualShift1: "",
    setManualShift1: vi.fn(),
    showManual1: false,
    setShowManual1: vi.fn(),
    kmAwal1: "",
    setKmAwal1: vi.fn(),
    kmAkhir1: "",
    setKmAkhir1: vi.fn(),
    toaShift2: "",
    setToaShift2: vi.fn(),
    totalToa: "",
    setTotalToa: vi.fn(),
    manualShift2: "",
    setManualShift2: vi.fn(),
    showManual2: false,
    setShowManual2: vi.fn(),
    kmAwal2: "",
    setKmAwal2: vi.fn(),
    kmAkhir2: "",
    setKmAkhir2: vi.fn(),
    keteranganS1: "",
    setKeteranganS1: vi.fn(),
    keteranganS2: "",
    setKeteranganS2: vi.fn(),
    keterangan: "",
    setKeterangan: vi.fn(),
    showKeterangan: false,
    setShowKeterangan: vi.fn(),
    showKmAkhir1InSingle: false,
    setShowKmAkhir1InSingle: vi.fn(),
    showKmAkhir2InSingle: false,
    setShowKmAkhir2InSingle: vi.fn(),
    kmDistanceS1: null,
    kmDistanceS2: null,
    kmLiveS1: { diff: null, status: "empty", formattedText: null },
    kmLiveS2: { diff: null, status: "empty", formattedText: null },
    toaLiveS2: { s2: null, status: "empty", formattedText: null },
    handleCopyKmAkhir1ToAwal2: vi.fn(),
    bus: {
      rowIndex: 1,
      unit: "TJ-0123",
      tripPergi: "4",
      tripPulang: "6",
      kmAwal1: "",
      kmAkhir1: "",
      kmAwal2: "",
      kmAkhir2: "",
      toaShift1: "",
      toaShift2: "",
      totalToa: "",
      manualShift1: "",
      manualShift2: "",
      keterangan: "",
      originalRow: [],
    },
    previousDayKmAkhir2: undefined,
    previousDayDateLabel: "Kemarin",
    bypassOdometerReset: false,
    setBypassOdometerReset: vi.fn(),
    handleToggleBypassOdometerReset: vi.fn(),
    hasCrossDayError: false,
    smartRolloverSuggestion: null,
    handleApplyRollover: vi.fn(),
    effectiveCategory: "trip",
    guideMessage: null,
    isKmAwal1Valid: true,
    isKmAkhir1Valid: true,
    isKmAwal2Valid: true,
    isKmAkhir2Valid: true,
    isKmAkhir1Locked: false,
    isKmAwal2Locked: false,
    isKmAkhir2Locked: false,
    headerMap: undefined,
    ...overrides,
  });

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
  });

  it("merender input Trip Pergi dan Trip Pulang dengan nilai dan label default", () => {
    const form = createMockForm();
    act(() => {
      root.render(<SingleFocusTrip form={form} />);
    });

    const pergiInput = container.querySelector("#single-input-tripPergi") as HTMLInputElement;
    const pulangInput = container.querySelector("#single-input-tripPulang") as HTMLInputElement;

    expect(pergiInput).not.toBeNull();
    expect(pulangInput).not.toBeNull();
    expect(pergiInput.value).toBe("4");
    expect(pulangInput.value).toBe("6");
    expect(container.textContent).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TRIP_PERGI);
    expect(container.textContent).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TRIP_PULANG);
  });

  it("menghitung dan menampilkan Total Ritase PP secara tepat: (Pergi + Pulang) / 2", () => {
    const form = createMockForm({ tripPergi: "5", tripPulang: "3" });
    act(() => {
      root.render(<SingleFocusTrip form={form} />);
    });

    // (5 + 3) / 2 = 4.0 Rit
    expect(container.textContent).toContain("4");
    expect(container.textContent).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.TOTAL_TRIP_LABEL);
    expect(container.textContent).toContain(`${TEXT_ALERTS.BUS_INPUT_MODAL.TRIP_UNIT} (PP)`);
  });

  it("merender label dinamis dari headerMap jika disediakan", () => {
    const form = createMockForm();
    act(() => {
      root.render(
        <SingleFocusTrip
          form={form}
          headerMap={{
            tripPergiLabel: "Rute Pergi Pagi",
            tripPulangLabel: "Rute Pulang Sore",
          }}
        />,
      );
    });

    expect(container.textContent).toContain("Rute Pergi Pagi");
    expect(container.textContent).toContain("Rute Pulang Sore");
  });

  it("memanggil setTripPergi dan setTripPulang saat nilai diubah", () => {
    const form = createMockForm();
    act(() => {
      root.render(<SingleFocusTrip form={form} />);
    });

    const pergiInput = container.querySelector("#single-input-tripPergi") as HTMLInputElement;
    const pulangInput = container.querySelector("#single-input-tripPulang") as HTMLInputElement;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;

    act(() => {
      nativeInputValueSetter?.call(pergiInput, "7");
      pergiInput.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(form.setTripPergi).toHaveBeenCalledWith("7");

    act(() => {
      nativeInputValueSetter?.call(pulangInput, "8");
      pulangInput.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(form.setTripPulang).toHaveBeenCalledWith("8");
  });

  it("menekan Enter pada Trip Pergi memindahkan fokus ke Trip Pulang", () => {
    const form = createMockForm();
    act(() => {
      root.render(<SingleFocusTrip form={form} />);
    });

    const pergiInput = container.querySelector("#single-input-tripPergi") as HTMLInputElement;
    const pulangInput = container.querySelector("#single-input-tripPulang") as HTMLInputElement;

    const focusSpy = vi.spyOn(pulangInput, "focus");

    act(() => {
      pergiInput.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
      );
    });

    expect(focusSpy).toHaveBeenCalled();
  });

  it("menekan Enter pada Trip Pulang memanggil handleInputKeyDown", () => {
    const form = createMockForm();
    act(() => {
      root.render(<SingleFocusTrip form={form} />);
    });

    const pulangInput = container.querySelector("#single-input-tripPulang") as HTMLInputElement;

    act(() => {
      pulangInput.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
      );
    });

    expect(form.handleInputKeyDown).toHaveBeenCalled();
  });

  it("mengeklik chip catatan memanggil setShowKeterangan", () => {
    const form = createMockForm({ showKeterangan: false });
    act(() => {
      root.render(<SingleFocusTrip form={form} />);
    });

    const chipBtn = container.querySelector("button") as HTMLButtonElement;
    expect(chipBtn.textContent).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_KETERANGAN);

    act(() => {
      chipBtn.click();
    });

    expect(form.setShowKeterangan).toHaveBeenCalled();
  });
});
