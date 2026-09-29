// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  BusInputModalSingleFocus,
  type BusInputModalSingleFocusProps,
} from "./BusInputModalSingleFocus";
import type { BusInputFormReturn } from "./useBusInputForm";
import { TEXT_ALERTS } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("BusInputModalSingleFocus Component", () => {
  let container: HTMLDivElement;
  let root: Root;

  const createMockForm = (overrides: Partial<BusInputFormReturn> = {}): BusInputFormReturn => ({
    isSingleMode: true,
    isSingleColumnEligible: true,
    isExpandedAll: false,
    setIsExpandedAll: vi.fn(),
    activeTab: "shift1",
    setActiveTab: vi.fn(),
    isSatset: false,
    handleToggleSatset: vi.fn(),
    formId: "test-form-id",
    validationErrors: [],
    handleFormSubmit: vi.fn(),
    handleInputFocus: vi.fn(),
    handleInputKeyDown: vi.fn(),
    singlePrimaryInputRef: { current: null },
    toaS1InputRef: { current: null },
    toaS2InputRef: { current: null },
    tripPergiInputRef: { current: null },
    keteranganInputRef: { current: null },
    tripPergi: "3",
    setTripPergi: vi.fn(),
    tripPulang: "3",
    setTripPulang: vi.fn(),
    toaShift1: "150",
    setToaShift1: vi.fn(),
    manualShift1: "",
    setManualShift1: vi.fn(),
    showManual1: false,
    setShowManual1: vi.fn(),
    kmAwal1: "300100",
    setKmAwal1: vi.fn(),
    kmAkhir1: "",
    setKmAkhir1: vi.fn(),
    toaShift2: "",
    setToaShift2: vi.fn(),
    totalToa: "300",
    setTotalToa: vi.fn(),
    manualShift2: "",
    setManualShift2: vi.fn(),
    showManual2: false,
    setShowManual2: vi.fn(),
    kmAwal2: "",
    setKmAwal2: vi.fn(),
    kmAkhir2: "",
    setKmAkhir2: vi.fn(),
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
      tripPergi: "3",
      tripPulang: "3",
      kmAwal1: "",
      kmAkhir1: "",
      kmAwal2: "",
      kmAkhir2: "",
      toaShift1: "150",
      toaShift2: "",
      totalToa: "300",
      manualShift1: "",
      manualShift2: "",
      keterangan: "",
      originalRow: [],
    },
    previousDayKmAkhir2: "300050",
    previousDayDateLabel: "Kemarin",
    bypassOdometerReset: false,
    setBypassOdometerReset: vi.fn(),
    handleToggleBypassOdometerReset: vi.fn(),
    hasCrossDayError: false,
    smartRolloverSuggestion: null,
    handleApplyRollover: vi.fn(),
    effectiveCategory: "toaShift1",
    guideMessage: null,
    isKmAwal1Valid: true,
    isKmAkhir1Valid: false,
    isKmAwal2Valid: false,
    isKmAkhir2Valid: false,
    isKmAkhir1Locked: false,
    isKmAwal2Locked: true,
    isKmAkhir2Locked: true,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
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

  function renderComponent(props: BusInputModalSingleFocusProps) {
    act(() => {
      root.render(<BusInputModalSingleFocus {...props} />);
    });
  }

  it("merender banner guideMessage ketika ada panduan navigasi", () => {
    const form = createMockForm({
      guideMessage: "Silakan isi KM Awal terlebih dahulu.",
    });
    renderComponent({ form, activeCategory: "kmAwal1" });

    expect(container.textContent).toContain("Silakan isi KM Awal terlebih dahulu.");
  });

  describe("Kelompok TOA", () => {
    it("merender input toaShift1 beserta action chips manual dan catatan", () => {
      const setShowManual1 = vi.fn();
      const setShowKeterangan = vi.fn();
      const form = createMockForm({
        effectiveCategory: "toaShift1",
        toaShift1: "120",
        showManual1: false,
        setShowManual1,
        showKeterangan: false,
        setShowKeterangan,
      });

      renderComponent({ form, activeCategory: "toaShift1" });

      const input = container.querySelector("#single-input-toaShift1") as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.value).toBe("120");

      // Verifikasi chips memakai teks sentral
      expect(container.textContent).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_MANUAL_S1);
      expect(container.textContent).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_KETERANGAN);

      // Klik chip manual
      const manualBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes(TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_MANUAL_S1),
      );
      expect(manualBtn).toBeDefined();
      act(() => {
        manualBtn?.click();
      });
      expect(setShowManual1).toHaveBeenCalled();
    });

    it("menampilkan input manualShift1 dan label aktif ketika showManual1 true", () => {
      const form = createMockForm({
        effectiveCategory: "toaShift1",
        showManual1: true,
        manualShift1: "15",
      });

      renderComponent({ form, activeCategory: "toaShift1" });

      expect(container.textContent).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_MANUAL_S1);
      const manualInput = container.querySelector("#single-input-manualShift1") as HTMLInputElement;
      expect(manualInput).not.toBeNull();
      expect(manualInput.value).toBe("15");
    });

    it("merender input totalToa dan chip manual S2 untuk kategori totalToa", () => {
      const form = createMockForm({
        effectiveCategory: "totalToa",
        totalToa: "280",
        showManual2: true,
        manualShift2: "20",
      });

      renderComponent({ form, activeCategory: "totalToa" });

      const input = container.querySelector("#single-input-totalToa") as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.value).toBe("280");
      expect(container.textContent).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_MANUAL_S2);

      const manualInput = container.querySelector("#single-input-manualShift2") as HTMLInputElement;
      expect(manualInput).not.toBeNull();
      expect(manualInput.value).toBe("20");
    });
  });

  describe("Kelompok KM", () => {
    it("merender kmAwal1 dengan badge referensi kemarin dan banner saran rollover", () => {
      const handleApplyRollover = vi.fn();
      const form = createMockForm({
        effectiveCategory: "kmAwal1",
        kmAwal1: "292003",
        previousDayDateLabel: "Kemarin",
        smartRolloverSuggestion: {
          suggestedKm: "293003",
          diff: 13,
        },
        handleApplyRollover,
      });

      renderComponent({ form, activeCategory: "kmAwal1", busKmAwal1: "292990" });

      // Verifikasi badge referensi kemarin
      expect(container.textContent).toContain(
        TEXT_ALERTS.BUS_INPUT_MODAL.REF_KM_AWAL_DYNAMIC("292990", "Kemarin"),
      );

      // Verifikasi banner saran rollover
      expect(container.textContent).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_DETECTED_TITLE);
      expect(container.textContent).toContain(
        TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_APPLY_BTN("293003"),
      );

      // Klik tombol terapkan rollover
      const applyBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes(TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_APPLY_BTN("293003")),
      );
      expect(applyBtn).toBeDefined();
      act(() => {
        applyBtn?.click();
      });
      expect(handleApplyRollover).toHaveBeenCalled();
    });

    it("merender sub-input KM Akhir 1 dan badge jarak tempuh S1 saat dibuka", () => {
      const form = createMockForm({
        effectiveCategory: "kmAwal1",
        showKmAkhir1InSingle: true,
        kmAkhir1: "300250",
        kmDistanceS1: "150",
      });

      renderComponent({ form, activeCategory: "kmAwal1" });

      expect(container.textContent).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_KM_AKHIR_1);
      const subInput = container.querySelector("#single-input-kmAkhir1-sub") as HTMLInputElement;
      expect(subInput).not.toBeNull();
      expect(subInput.value).toBe("300250");
      expect(container.textContent).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_VALUE_KM("150"));
    });

    it("merender kmAkhir1 dengan acuan KM Awal 1 dan status terkunci jika belum valid", () => {
      const form = createMockForm({
        effectiveCategory: "kmAkhir1",
        kmAwal1: "300100",
        kmAkhir1: "",
        isKmAkhir1Locked: true,
      });

      renderComponent({ form, activeCategory: "kmAkhir1" });

      expect(container.textContent).toContain(
        TEXT_ALERTS.BUS_INPUT_MODAL.REF_KM_AWAL_S1("300100"),
      );
      const input = container.querySelector("#single-input-kmAkhir1") as HTMLInputElement;
      expect(input.disabled).toBe(true);
      expect(input.placeholder).toBe(TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_KM_LOCKED);
    });

    it("merender kmAwal2 dengan tombol salin KM Akhir S1 jika valid dan saran rollover", () => {
      const handleCopyKmAkhir1ToAwal2 = vi.fn();
      const handleApplyRollover = vi.fn();
      const form = createMockForm({
        effectiveCategory: "kmAwal2",
        kmAkhir1: "300200",
        isKmAkhir1Valid: true,
        isKmAwal2Locked: false,
        handleCopyKmAkhir1ToAwal2,
        smartRolloverSuggestion: {
          suggestedKm: "301000",
          diff: 20,
        },
        handleApplyRollover,
      });

      renderComponent({ form, activeCategory: "kmAwal2" });

      expect(container.textContent).toContain(
        TEXT_ALERTS.BUS_INPUT_MODAL.COPY_KM_AKHIR_S1_ACTION("300200"),
      );

      const copyBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes(TEXT_ALERTS.BUS_INPUT_MODAL.COPY_KM_AKHIR_S1_ACTION("300200")),
      );
      expect(copyBtn).toBeDefined();
      act(() => {
        copyBtn?.click();
      });
      expect(handleCopyKmAkhir1ToAwal2).toHaveBeenCalled();

      // Verifikasi banner rollover Shift 2
      expect(container.textContent).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_DETECTED_TITLE);
      const applyBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes(TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_APPLY_BTN("301000")),
      );
      expect(applyBtn).toBeDefined();
      act(() => {
        applyBtn?.click();
      });
      expect(handleApplyRollover).toHaveBeenCalled();
    });

    it("merender kmAwal2 terkunci ketika isKmAwal2Locked bernilai true", () => {
      const form = createMockForm({
        effectiveCategory: "kmAwal2",
        isKmAwal2Locked: true,
      });

      renderComponent({ form, activeCategory: "kmAwal2" });

      const input = container.querySelector("#single-input-kmAwal2") as HTMLInputElement;
      expect(input.disabled).toBe(true);
      expect(input.placeholder).toBe(TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_KM_S2_LOCKED);
    });

    it("merender kmAkhir2 dengan acuan KM Awal 2 dan jarak tempuh S2", () => {
      const form = createMockForm({
        effectiveCategory: "kmAkhir2",
        kmAwal2: "300200",
        kmAkhir2: "300320",
        kmDistanceS2: "120",
        isKmAkhir2Locked: false,
      });

      renderComponent({ form, activeCategory: "kmAkhir2" });

      expect(container.textContent).toContain(
        TEXT_ALERTS.BUS_INPUT_MODAL.REF_KM_AWAL_S2("300200"),
      );
      expect(container.textContent).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_VALUE_KM("120"));
    });

    it("menghubungkan singlePrimaryInputRef ke input primer sesuai kategori KM aktif", () => {
      // Tes kategori kmAwal1
      const refAwal1: { current: HTMLInputElement | null } = { current: null };
      const formAwal1 = createMockForm({
        effectiveCategory: "kmAwal1",
        singlePrimaryInputRef: refAwal1,
      });
      renderComponent({ form: formAwal1, activeCategory: "kmAwal1" });
      expect(refAwal1.current).not.toBeNull();
      expect(refAwal1.current?.id).toBe("single-input-kmAwal1");

      // Tes kategori kmAkhir1
      const refAkhir1: { current: HTMLInputElement | null } = { current: null };
      const formAkhir1 = createMockForm({
        effectiveCategory: "kmAkhir1",
        singlePrimaryInputRef: refAkhir1,
      });
      renderComponent({ form: formAkhir1, activeCategory: "kmAkhir1" });
      expect(refAkhir1.current).not.toBeNull();
      expect(refAkhir1.current?.id).toBe("single-input-kmAkhir1");

      // Tes kategori kmAwal2
      const refAwal2: { current: HTMLInputElement | null } = { current: null };
      const formAwal2 = createMockForm({
        effectiveCategory: "kmAwal2",
        singlePrimaryInputRef: refAwal2,
      });
      renderComponent({ form: formAwal2, activeCategory: "kmAwal2" });
      expect(refAwal2.current).not.toBeNull();
      expect(refAwal2.current?.id).toBe("single-input-kmAwal2");

      // Tes kategori kmAkhir2
      const refAkhir2: { current: HTMLInputElement | null } = { current: null };
      const formAkhir2 = createMockForm({
        effectiveCategory: "kmAkhir2",
        singlePrimaryInputRef: refAkhir2,
      });
      renderComponent({ form: formAkhir2, activeCategory: "kmAkhir2" });
      expect(refAkhir2.current).not.toBeNull();
      expect(refAkhir2.current?.id).toBe("single-input-kmAkhir2");
    });
  });

  describe("Kelompok Catatan", () => {
    it("merender textarea catatan jika showKeterangan true", () => {
      const setKeterangan = vi.fn();
      const form = createMockForm({
        effectiveCategory: "toaShift1",
        showKeterangan: true,
        keterangan: "Dinas lancar",
        setKeterangan,
      });

      renderComponent({ form, activeCategory: "toaShift1" });

      const textarea = container.querySelector("#single-input-keterangan") as HTMLTextAreaElement;
      expect(textarea).not.toBeNull();
      expect(textarea.value).toBe("Dinas lancar");
    });

    it("merender textarea catatan jika kategori adalah murni keterangan", () => {
      const form = createMockForm({
        effectiveCategory: "keterangan",
        showKeterangan: false,
        keterangan: "AC kurang dingin",
      });

      renderComponent({ form, activeCategory: "keterangan" });

      const textarea = container.querySelector("#single-input-keterangan") as HTMLTextAreaElement;
      expect(textarea).not.toBeNull();
      expect(textarea.value).toBe("AC kurang dingin");
    });
  });
});
