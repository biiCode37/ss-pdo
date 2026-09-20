// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  useBusInputForm,
  type UseBusInputFormProps,
  type BusInputFormReturn,
} from "./useBusInputForm";
import type { BusData } from "@/services/googleSheets";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let latestForm: BusInputFormReturn | null = null;

function FormTestComponent(props: UseBusInputFormProps) {
  const form = useBusInputForm(props);
  latestForm = form;
  return <div id="form-test-node">{form.formId}</div>;
}

describe("useBusInputForm - Cascading Odometer Logic (SSOT)", () => {
  let container: HTMLDivElement;
  let root: Root;

  const mockBus: BusData = {
    rowIndex: 5,
    unit: "TJ-0123",
    tripPergi: "3",
    tripPulang: "3",
    kmAwal1: "",
    kmAkhir1: "",
    kmAwal2: "",
    kmAkhir2: "",
    toaShift1: "150",
    toaShift2: "150",
    totalToa: "300",
    manualShift1: "",
    manualShift2: "",
    keterangan: "",
    originalRow: [],
  };

  const defaultProps: UseBusInputFormProps = {
    bus: mockBus,
    activeCategory: "all",
    initialTab: "shift1",
    onSave: vi.fn(),
    onDismiss: vi.fn(),
    isOpen: true,
    isMounted: true,
    previousDayKmAkhir2: "300050",
    previousDayDateLabel: "Kemarin",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    latestForm = null;
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

  function renderForm(propsPartial: Partial<UseBusInputFormProps> = {}) {
    act(() => {
      root.render(<FormTestComponent {...defaultProps} {...propsPartial} />);
    });
  }

  it("Test Case 1 & 9: Zero Phantom Value - Pagi hari input KM Awal S1 tidak menghasilkan error dan tidak mengirim prefill siluman", () => {
    const onSave = vi.fn();
    renderForm({ onSave });

    // Awal buka: KM Awal 1 mendapat prefill 3 digit dari H-1 (300)
    expect(latestForm?.kmAwal1).toBe("300");
    // KM Akhir 1 WAJIB KOSONG (Zero Phantom Value)
    expect(latestForm?.kmAkhir1).toBe("");
    expect(latestForm?.isKmAkhir1Locked).toBe(true);

    // User mengetik digit lengkap untuk KM Awal 1 di pagi hari
    act(() => {
      latestForm?.setKmAwal1("300100");
    });

    expect(latestForm?.isKmAwal1Valid).toBe(true);
    // KM Akhir 1 kini ter-unlock dan menampilkan prefill 3 digit "300"
    expect(latestForm?.isKmAkhir1Locked).toBe(false);
    expect(latestForm?.kmAkhir1).toBe("300");

    // Di pagi hari, KM Akhir 1 belum selesai diisi (masih draft 3 digit)
    // Tekan Simpan
    act(() => {
      const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      latestForm?.handleFormSubmit(dummyEvent);
    });

    // Validasi lolos tanpa error
    expect(latestForm?.validationErrors).toEqual([]);
    expect(onSave).toHaveBeenCalledTimes(1);

    // Sanitasi payload: kmAwal1 tersimpan "300100", kmAkhir1 disanitasi menjadi "" (BUKAN "300" siluman)
    const savedData = onSave.mock.calls[0][0];
    expect(savedData.kmAwal1).toBe("300100");
    expect(savedData.kmAkhir1).toBe("");
  });

  it("Test Case 2: Blocking KM Akhir S1 saat KM Awal S1 kosong atau <= 3 digit", () => {
    renderForm({ previousDayKmAkhir2: "" });

    // Saat kosong total
    expect(latestForm?.kmAwal1).toBe("");
    expect(latestForm?.kmAkhir1).toBe("");
    expect(latestForm?.isKmAkhir1Locked).toBe(true);

    // Saat baru 3 digit
    act(() => {
      latestForm?.setKmAwal1("299");
    });
    expect(latestForm?.isKmAwal1Valid).toBe(false);
    expect(latestForm?.isKmAkhir1Locked).toBe(true);
    expect(latestForm?.kmAkhir1).toBe("");
  });

  it("Test Case 3 & 4: Reactivity unlock dan re-lock saat user mengoreksi/menghapus KM Awal", () => {
    renderForm();

    // Ketik valid > 3 digit
    act(() => {
      latestForm?.setKmAwal1("300120");
    });
    expect(latestForm?.isKmAkhir1Locked).toBe(false);
    expect(latestForm?.kmAkhir1).toBe("300");

    // Petugas menghapus kembali KM Awal menjadi ""
    act(() => {
      latestForm?.setKmAwal1("");
    });
    expect(latestForm?.isKmAkhir1Locked).toBe(true);
    // KM Akhir 1 otomatis di-reset menjadi kosong (Skenario 4)
    expect(latestForm?.kmAkhir1).toBe("");
  });

  it("Test Case 5: Skenario B (Bus Dinas Siang Saja) - S1 kosong, S2 langsung terbuka & dapat prefill H-1", () => {
    renderForm({
      bus: { ...mockBus, kmAwal1: "", kmAkhir1: "" },
      previousDayKmAkhir2: "250400",
    });

    // S1 tidak diisi (kosong / hanya prefill di awal)
    act(() => {
      latestForm?.setKmAwal1("");
    });

    // KM Awal 2 tidak terkunci untuk dinas siang saja
    expect(latestForm?.isKmAwal2Locked).toBe(false);
    // KM Akhir 2 tetap terkunci sampai KM Awal 2 valid
    expect(latestForm?.isKmAkhir2Locked).toBe(true);
  });

  it("Test Case 6: Skenario A (Dinas Pagi Memblokir S2) - KM Awal S2 terkunci jika Shift 1 belum ditutup", () => {
    renderForm({
      bus: { ...mockBus, kmAwal1: "300100", kmAkhir1: "" },
    });

    // Shift 1 baru mulai dan belum tutup
    expect(latestForm?.isKmAwal1Valid).toBe(true);
    expect(latestForm?.isKmAkhir1Valid).toBe(false);
    // KM Awal S2 terkunci
    expect(latestForm?.isKmAwal2Locked).toBe(true);
  });

  it("Test Case 7: Salin KM Akhir S1 ke KM Awal S2 dan unblock KM Akhir S2", () => {
    renderForm({
      bus: { ...mockBus, kmAwal1: "300100", kmAkhir1: "300180" },
    });

    expect(latestForm?.isKmAkhir1Valid).toBe(true);
    expect(latestForm?.isKmAwal2Locked).toBe(false);

    // Jalankan handleCopyKmAkhir1ToAwal2
    act(() => {
      latestForm?.handleCopyKmAkhir1ToAwal2();
    });

    expect(latestForm?.kmAwal2).toBe("300180");
    expect(latestForm?.isKmAwal2Valid).toBe(true);
    expect(latestForm?.isKmAkhir2Locked).toBe(false);
    expect(latestForm?.kmAkhir2).toBe("300");
  });

  it("Test Case 8: Rollover kepala angka odometer berhasil disimpan dengan selisih jarak terhitung", () => {
    const onSave = vi.fn();
    renderForm({
      bus: { ...mockBus, kmAwal1: "299980", kmAkhir1: "" },
      onSave,
    });

    // KM Akhir S1 melewati batas kepala 299 ke 300
    act(() => {
      latestForm?.setKmAkhir1("300100");
    });

    expect(latestForm?.kmDistanceS1).toBe("120.0");

    act(() => {
      const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      latestForm?.handleFormSubmit(dummyEvent);
    });

    expect(latestForm?.validationErrors).toEqual([]);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].kmAwal1).toBe("299980");
    expect(onSave.mock.calls[0][0].kmAkhir1).toBe("300100");
  });

  it("Test Case 10: Single Mode Redirection - Mengalihkan kmAkhir1 ke kmAwal1 jika kmAwal1 belum valid", () => {
    renderForm({
      activeCategory: "kmAkhir1",
      bus: { ...mockBus, kmAwal1: "", kmAkhir1: "" },
    });

    expect(latestForm?.isSingleMode).toBe(true);
    // Dialihkan ke kmAwal1
    expect(latestForm?.effectiveCategory).toBe("kmAwal1");
    expect(latestForm?.guideMessage).toBeTruthy();
  });
});
