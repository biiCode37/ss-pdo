// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { BusFormField } from "./BusFormField";
import { ShiftOptionChip } from "./ShiftOptionChip";
import { BusInputModalShift1 } from "../BusInputModalShift1";
import { BusInputModalShift2 } from "../BusInputModalShift2";
import { TEXT_ALERTS } from "@/constants/texts";
import { useBusInputForm, type BusInputFormReturn } from "../useBusInputForm";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("BusFormField Component", () => {
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
  });

  it("renders label and input connected with htmlFor and id", async () => {
    const handleChange = vi.fn();
    await act(async () => {
      root.render(
        <BusFormField
          id="test-hero-input"
          label="TOA Shift 1"
          value="120"
          onChange={handleChange}
          variant="hero"
          placeholder="Contoh: 120"
        />,
      );
    });

    const label = container.querySelector<HTMLLabelElement>("label");
    expect(label).not.toBeNull();
    expect(label?.textContent).toBe("TOA Shift 1");
    expect(label?.getAttribute("for")).toBe("test-hero-input");

    const input = container.querySelector<HTMLInputElement>("#test-hero-input");
    expect(input).not.toBeNull();
    expect(input?.placeholder).toBe("Contoh: 120");
    expect(input?.value).toBe("120");
  });

  it("handles input changes and calls onChange handler", async () => {
    const handleChange = vi.fn();

    await act(async () => {
      root.render(
        <BusFormField
          id="test-input"
          label="KM Akhir"
          value="12500"
          onChange={handleChange}
        />,
      );
    });

    const input = container.querySelector<HTMLInputElement>("#test-input");
    expect(input).not.toBeNull();

    await act(async () => {
      if (input) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        nativeInputValueSetter?.call(input, "12550");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    expect(handleChange).toHaveBeenCalled();
  });

  it("handles onFocus and onKeyDown events (e.g. Enter key navigation)", async () => {
    const handleFocus = vi.fn();
    const handleKeyDown = vi.fn();

    await act(async () => {
      root.render(
        <BusFormField
          id="test-focus-keydown"
          label="Test Enter"
          value=""
          onChange={vi.fn()}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />,
      );
    });

    const input = container.querySelector<HTMLInputElement>("#test-focus-keydown");
    expect(input).not.toBeNull();

    await act(async () => {
      input?.focus();
    });
    expect(handleFocus).toHaveBeenCalledTimes(1);

    await act(async () => {
      input?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });

  it("Enter key on BusFormField reaches requestSubmit() through the real form handler", async () => {
    const requestSubmitSpy = vi.fn();

    function FormEnterHarness() {
      const form = useBusInputForm({
        bus: {
          rowIndex: 5,
          unit: "TJ-0123",
          tripPergi: "3",
          tripPulang: "3",
          kmAwal1: "12450",
          kmAkhir1: "",
          kmAwal2: "",
          kmAkhir2: "",
          toaShift1: "120",
          toaShift2: "130",
          totalToa: "250",
          manualShift1: "",
          manualShift2: "",
          keterangan: "",
          originalRow: [],
        },
        activeCategory: "all",
        initialTab: "shift1",
        onSave: vi.fn(),
        onDismiss: vi.fn(),
        isOpen: true,
        isMounted: true,
      });

      return (
        <form id={form.formId} onSubmit={form.handleFormSubmit}>
          <BusFormField
            id="test-enter-field"
            label="Hero TOA"
            value={form.toaShift1}
            onChange={(e) => form.setToaShift1(e.target.value)}
            onKeyDown={form.handleInputKeyDown}
          />
        </form>
      );
    }

    await act(async () => {
      root.render(<FormEnterHarness />);
    });

    const formEl = container.querySelector<HTMLFormElement>("form");
    expect(formEl).not.toBeNull();
    formEl!.requestSubmit = requestSubmitSpy;

    const input = container.querySelector<HTMLInputElement>("#test-enter-field");
    expect(input).not.toBeNull();

    await act(async () => {
      input?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
      );
    });

    expect(requestSubmitSpy).toHaveBeenCalledTimes(1);
  });

  it("supports forwarded ref to access underlying HTMLInputElement", async () => {
    const inputRef = createRef<HTMLInputElement>();

    await act(async () => {
      root.render(
        <BusFormField
          ref={inputRef}
          id="test-ref"
          label="Ref Target"
          value=""
          onChange={vi.fn()}
        />,
      );
    });

    expect(inputRef.current).not.toBeNull();
    expect(inputRef.current?.id).toBe("test-ref");
  });

  it("applies disabled styling and attributes when disabled is true", async () => {
    await act(async () => {
      root.render(
        <BusFormField
          id="test-disabled"
          label="Locked KM"
          value="12340"
          onChange={vi.fn()}
          disabled={true}
          placeholder="Isi KM Awal terlebih dahulu"
        />,
      );
    });

    const input = container.querySelector<HTMLInputElement>("#test-disabled");
    expect(input).not.toBeNull();
    expect(input?.disabled).toBe(true);
    expect(input?.style.cursor).toBe("not-allowed");
    expect(input?.style.opacity).toBe("0.45");
  });

  it("renders secondary variant with appropriate font sizing and border styling", async () => {
    await act(async () => {
      root.render(
        <BusFormField
          id="test-secondary"
          label="KM Awal Shift 1"
          value="12000"
          onChange={vi.fn()}
          variant="secondary"
        />,
      );
    });

    const input = container.querySelector<HTMLInputElement>("#test-secondary");
    expect(input).not.toBeNull();
    expect(input?.style.fontSize).toBe("0.95rem");
    expect(input?.style.fontWeight).toBe("400");
  });
});

describe("ShiftOptionChip Component", () => {
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
  });

  it("renders chip label, sets aria-pressed='false' when inactive, and fires onToggle callback on click", async () => {
    const handleToggle = vi.fn();

    await act(async () => {
      root.render(
        <ShiftOptionChip
          isActive={false}
          onToggle={handleToggle}
          label="+ Manual S1"
        />,
      );
    });

    const button = container.querySelector<HTMLButtonElement>("button");
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe("+ Manual S1");
    expect(button?.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      button?.click();
    });

    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("displays active label formatted via CHIP_ACTIVE_LABEL dictionary token and sets aria-pressed='true'", async () => {
    const activeLabel = TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_LABEL(
      TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S1,
    );
    expect(activeLabel).toBe("✓ Manual Shift 1");

    await act(async () => {
      root.render(
        <ShiftOptionChip
          isActive={true}
          onToggle={vi.fn()}
          label={activeLabel}
        />,
      );
    });

    const button = container.querySelector<HTMLButtonElement>("button");
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe("✓ Manual Shift 1");
    expect(button?.getAttribute("aria-pressed")).toBe("true");
    expect(button?.style.background).toContain("rgba(56, 189, 248, 0.15)");
  });
});

describe("Modal Shift Integration via Reusable Fields", () => {
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
  });

  function createMockForm(overrides: Partial<BusInputFormReturn> = {}): BusInputFormReturn {
    return {
      formId: "test-form-1",
      bus: {
        rowIndex: 5,
        unit: "TJ-0123",
        tripPergi: "3",
        tripPulang: "3",
        kmAwal1: "12450",
        kmAkhir1: "12580",
        kmAwal2: "12580",
        kmAkhir2: "12710",
        toaShift1: "120",
        toaShift2: "130",
        totalToa: "250",
        manualShift1: "",
        manualShift2: "",
        keterangan: "",
        originalRow: [],
      },
      isSingleMode: false,
      isSingleColumnEligible: false,
      isExpandedAll: false,
      setIsExpandedAll: vi.fn(),
      activeTab: "shift1",
      setActiveTab: vi.fn(),
      isSatset: false,
      handleToggleSatset: vi.fn(),
      singlePrimaryInputRef: createRef<HTMLInputElement>(),
      toaS1InputRef: createRef<HTMLInputElement>(),
      toaS2InputRef: createRef<HTMLInputElement>(),
      tripPergiInputRef: createRef<HTMLInputElement>(),
      keteranganInputRef: createRef<HTMLInputElement>(),
      tripPergi: "3",
      setTripPergi: vi.fn(),
      tripPulang: "3",
      setTripPulang: vi.fn(),
      toaShift1: "120",
      setToaShift1: vi.fn(),
      totalToa: "250",
      setTotalToa: vi.fn(),
      toaShift2: "130",
      setToaShift2: vi.fn(),
      showManual1: false,
      setShowManual1: vi.fn(),
      manualShift1: "",
      setManualShift1: vi.fn(),
      showManual2: false,
      setShowManual2: vi.fn(),
      manualShift2: "",
      setManualShift2: vi.fn(),
      kmAwal1: "12450",
      setKmAwal1: vi.fn(),
      isKmAwal1Valid: true,
      kmAkhir1: "12580",
      setKmAkhir1: vi.fn(),
      isKmAkhir1Valid: true,
      isKmAkhir1Locked: false,
      kmDistanceS1: "130",
      kmLiveS1: { diff: 130, status: "normal", formattedText: "" },
      kmAwal2: "12580",
      setKmAwal2: vi.fn(),
      isKmAwal2Valid: true,
      isKmAwal2Locked: false,
      kmAkhir2: "12710",
      setKmAkhir2: vi.fn(),
      isKmAkhir2Valid: true,
      isKmAkhir2Locked: false,
      kmDistanceS2: "130",
      kmLiveS2: { diff: 130, status: "normal", formattedText: "" },
      toaLiveS2: { s2: 130, status: "valid", formattedText: "" },
      keterangan: "",
      setKeterangan: vi.fn(),
      showKeterangan: false,
      setShowKeterangan: vi.fn(),
      showKmAkhir1InSingle: false,
      setShowKmAkhir1InSingle: vi.fn(),
      showKmAkhir2InSingle: false,
      setShowKmAkhir2InSingle: vi.fn(),
      validationErrors: [],
      previousDayKmAkhir2: "12450",
      previousDayDateLabel: "Kemarin",
      smartRolloverSuggestion: null,
      handleApplyRollover: vi.fn(),
      handleCopyKmAkhir1ToAwal2: vi.fn(),
      handleInputFocus: vi.fn(),
      handleInputKeyDown: vi.fn(),
      handleFormSubmit: vi.fn(),
      bypassOdometerReset: false,
      setBypassOdometerReset: vi.fn(),
      effectiveCategory: "all",
      guideMessage: null,
      ...overrides,
    } as unknown as BusInputFormReturn;
  }

  it("Shift 1 renders hero fields and toggles Manual and Catatan chips with setters", async () => {
    const setShowManual1 = vi.fn();
    const setShowKeterangan = vi.fn();
    const mockForm = createMockForm({
      showManual1: false,
      setShowManual1,
      showKeterangan: false,
      setShowKeterangan,
      isKmAkhir1Locked: true,
    });

    await act(async () => {
      root.render(<BusInputModalShift1 form={mockForm} />);
    });

    // Periksa Hero Field TOA S1 & KM Akhir S1
    const toaS1Input = container.querySelector<HTMLInputElement>("#input-toa-s1");
    expect(toaS1Input).not.toBeNull();
    expect(toaS1Input?.value).toBe("120");

    const kmAkhir1Input = container.querySelector<HTMLInputElement>("#input-km-akhir-1");
    expect(kmAkhir1Input).not.toBeNull();
    expect(kmAkhir1Input?.disabled).toBe(true);
    expect(kmAkhir1Input?.placeholder).toBe(TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_KM_LOCKED);

    // Periksa Action Chip Manual S1
    const chips = container.querySelectorAll<HTMLButtonElement>("button");
    const manualChip = Array.from(chips).find((b) => b.textContent?.includes("Manual S1"));
    expect(manualChip).toBeDefined();
    expect(manualChip?.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      manualChip?.click();
    });
    expect(setShowManual1).toHaveBeenCalledTimes(1);

    // Periksa Action Chip Catatan
    const notesChip = Array.from(chips).find((b) => b.textContent?.includes("Catatan"));
    expect(notesChip).toBeDefined();
    expect(notesChip?.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      notesChip?.click();
    });
    expect(setShowKeterangan).toHaveBeenCalledTimes(1);
  });

  it("Shift 2 renders Total TOA hero, locked states for KM Akhir 2, copy KM button, and toggles chips", async () => {
    const handleCopy = vi.fn();
    const setShowManual2 = vi.fn();
    const setShowKeterangan = vi.fn();
    const mockForm = createMockForm({
      isKmAkhir1Valid: true,
      handleCopyKmAkhir1ToAwal2: handleCopy,
      isKmAwal2Locked: true,
      isKmAkhir2Locked: true,
      totalToa: "250",
      showManual2: false,
      setShowManual2,
      showKeterangan: false,
      setShowKeterangan,
    });

    await act(async () => {
      root.render(<BusInputModalShift2 form={mockForm} />);
    });

    // Periksa Total TOA hero field
    const toaS2Input = container.querySelector<HTMLInputElement>("#input-toa-s2");
    expect(toaS2Input).not.toBeNull();
    expect(toaS2Input?.value).toBe("250");

    // Periksa KM Akhir 2 disabled saat isKmAkhir2Locked: true
    const kmAkhir2Input = container.querySelector<HTMLInputElement>("#input-km-akhir-2");
    expect(kmAkhir2Input).not.toBeNull();
    expect(kmAkhir2Input?.disabled).toBe(true);
    expect(kmAkhir2Input?.placeholder).toBe(TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_KM_LOCKED);

    // Periksa Tombol Salin KM Akhir S1
    const copyBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes(TEXT_ALERTS.BUS_INPUT_MODAL.COPY_KM_AKHIR_S1_BTN),
    );
    expect(copyBtn).toBeDefined();

    await act(async () => {
      copyBtn?.click();
    });
    expect(handleCopy).toHaveBeenCalledTimes(1);

    // Periksa Action Chip Manual S2
    const chips = container.querySelectorAll<HTMLButtonElement>("button");
    const manualChip = Array.from(chips).find((b) => b.textContent?.includes("Manual S2"));
    expect(manualChip).toBeDefined();
    expect(manualChip?.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      manualChip?.click();
    });
    expect(setShowManual2).toHaveBeenCalledTimes(1);

    // Periksa Action Chip Catatan
    const notesChip = Array.from(chips).find((b) => b.textContent?.includes("Catatan"));
    expect(notesChip).toBeDefined();
    expect(notesChip?.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      notesChip?.click();
    });
    expect(setShowKeterangan).toHaveBeenCalledTimes(1);
  });
});
