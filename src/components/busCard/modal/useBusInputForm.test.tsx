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
import { TEXT_ALERTS } from "@/constants/texts";

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
      previousDayKmAkhir2: "299900",
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

  it("Test Case 11: Scoped Updates - Mode Fokus kmAwal1 hanya mengirim kmAwal1 dan tidak mengirim kolom yang tidak aktif", () => {
    const onSave = vi.fn();
    renderForm({
      activeCategory: "kmAwal1",
      bus: {
        ...mockBus,
        kmAwal1: "",
        kmAkhir1: "",
        toaShift1: "150",
        toaShift2: "100",
        keterangan: "BA.01",
      },
      onSave,
    });

    expect(latestForm?.isSingleMode).toBe(true);

    act(() => {
      latestForm?.setKmAwal1("300100");
    });

    act(() => {
      const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      latestForm?.handleFormSubmit(dummyEvent);
    });

    expect(latestForm?.validationErrors).toEqual([]);
    expect(onSave).toHaveBeenCalledTimes(1);
    const submittedPayload = onSave.mock.calls[0][0];

    // Kolom fokus harus ada
    expect(submittedPayload.kmAwal1).toBe("300100");
    // Kolom lain yang tidak disentuh di mode single TIDAK boleh ada di payload
    expect(submittedPayload.toaShift1).toBeUndefined();
    expect(submittedPayload.toaShift2).toBeUndefined();
    expect(submittedPayload.tripPergi).toBeUndefined();
    expect(submittedPayload.tripPulang).toBeUndefined();
    expect(submittedPayload.keterangan).toBeUndefined();
  });

  describe("Skenario 6: Cross-Day Validation Guard & Smart Rollover", () => {
    it("detects smart rollover and prevents submit when kmAwal1 is smaller than previous day", () => {
      const onSave = vi.fn();
      renderForm({
        ...defaultProps,
        previousDayKmAkhir2: "292990",
        activeCategory: "kmAwal1",
        onSave,
      });

      // User mengetik 3 digit akhiran "003" setelah prefill "292" -> "292003"
      act(() => {
        latestForm?.setKmAwal1("292003");
      });

      // Harus terdeteksi smart rollover (+13 KM ke 293003)
      expect(latestForm?.smartRolloverSuggestion).toEqual({
        suggestedKm: "293003",
        diff: 13,
      });

      // Coba submit tanpa rollover
      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });

      // Form ditolak karena 292003 < 292990
      expect(latestForm?.validationErrors.length).toBeGreaterThan(0);
      expect(latestForm?.validationErrors[0]).toContain("tidak boleh lebih kecil dari Kemarin");
      expect(onSave).not.toHaveBeenCalled();

      // Klik 1-klik terapkan saran rollover
      act(() => {
        latestForm?.handleApplyRollover();
      });

      expect(latestForm?.kmAwal1).toBe("293003");

      // Submit kembali setelah saran diterapkan
      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });

      expect(latestForm?.validationErrors).toEqual([]);
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave.mock.calls[0][0].kmAwal1).toBe("293003");
    });

    it("allows submit when kmAwal1 is smaller than previous day if bypassOdometerReset is true", () => {
      const onSave = vi.fn();
      renderForm({
        ...defaultProps,
        previousDayKmAkhir2: "292990",
        activeCategory: "kmAwal1",
        onSave,
      });

      // Odometer diganti baru di bengkel (misal angka 001200)
      act(() => {
        latestForm?.setKmAwal1("001200");
        latestForm?.setBypassOdometerReset(true);
      });

      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });

      expect(latestForm?.validationErrors).toEqual([]);
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave.mock.calls[0][0].kmAwal1).toBe("001200");
    });

    it("renders user-visible validation messages with dictionary labels for Shift 1, Shift 2, and TOA Shift 2", () => {
      const onSave = vi.fn();
      renderForm({
        ...defaultProps,
        activeCategory: "all",
        onSave,
      });

      // Berikan input yang memicu error pada Shift 1, Shift 2, dan TOA Shift 2
      act(() => {
        // S1 error: KM Akhir < KM Awal
        latestForm?.setKmAwal1("200000");
        latestForm?.setKmAkhir1("199900");
        // TOA S2 error: > 3 digit (> 999)
        latestForm?.setToaShift2("1200");
        // S2 error: KM Akhir < KM Awal
        latestForm?.setKmAwal2("200100");
        latestForm?.setKmAkhir2("200050");
      });

      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });

      expect(onSave).not.toHaveBeenCalled();
      const errors = latestForm?.validationErrors || [];
      expect(errors.length).toBeGreaterThanOrEqual(3);

      const hasShift1Error = errors.some((err) =>
        err.includes(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_1)
      );
      const hasShift2Error = errors.some((err) =>
        err.includes(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_2)
      );
      const hasToaS2Error = errors.some((err) =>
        err.includes(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S2)
      );

      expect(hasShift1Error).toBe(true);
      expect(hasShift2Error).toBe(true);
      expect(hasToaS2Error).toBe(true);
    });

    it("handles mixed validation errors: checking bypass clears ONLY cross-day error, leaves other errors intact, and unchecking re-evaluates cross-day on submit", () => {
      const onSave = vi.fn();
      renderForm({
        ...defaultProps,
        previousDayKmAkhir2: "292990",
        activeCategory: "all",
        onSave,
      });

      // Berikan KM Awal S1 mundur (misal 100000 < 292990) -> cross-day error
      // DAN berikan error lain: KM Akhir S1 < KM Awal S1 (misal 99000 < 100000) -> kmPair error
      act(() => {
        latestForm?.setKmAwal1("100000");
        latestForm?.setKmAkhir1("99000");
      });

      // Submit pertama
      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });

      // Verifikasi kedua error ada di validationErrors
      expect(onSave).not.toHaveBeenCalled();
      const initialErrors = latestForm?.validationErrors || [];
      expect(initialErrors.length).toBe(2);

      const crossDayErrorMsg = TEXT_ALERTS.BUS_INPUT_MODAL.KM_AWAL_LESS_THAN_PREVIOUS_DAY(
        TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_1,
        "100000",
        "292990",
        TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_PREVIOUS_DAY,
        192990,
      );
      const kmPairErrorMsg = TEXT_ALERTS.BUS_INPUT_MODAL.KM_AKHIR_LESS_THAN_AWAL(
        TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_1,
        "99000",
        "100000",
      );

      expect(initialErrors).toContain(crossDayErrorMsg);
      expect(initialErrors).toContain(kmPairErrorMsg);
      expect(latestForm?.hasCrossDayError).toBe(true);

      // Centang bypass via handleToggleBypassOdometerReset(true)
      act(() => {
        latestForm?.handleToggleBypassOdometerReset(true);
      });

      // Error cross-day hilang, TAPI error pair tetap ada!
      expect(latestForm?.bypassOdometerReset).toBe(true);
      expect(latestForm?.hasCrossDayError).toBe(true);
      expect(latestForm?.validationErrors).toEqual([kmPairErrorMsg]);
      expect(latestForm?.validationErrors).not.toContain(crossDayErrorMsg);

      // Submit form saat masih ada error pair: tetap gagal disimpan!
      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });
      expect(onSave).not.toHaveBeenCalled();
      expect(latestForm?.validationErrors).toEqual([kmPairErrorMsg]);

      // Uncheck bypass
      act(() => {
        latestForm?.handleToggleBypassOdometerReset(false);
      });
      expect(latestForm?.bypassOdometerReset).toBe(false);

      // Submit kembali setelah bypass dilepas: submit mengevaluasi lintas hari lagi!
      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });
      expect(onSave).not.toHaveBeenCalled();
      expect(latestForm?.validationErrors).toContain(crossDayErrorMsg);
      expect(latestForm?.validationErrors).toContain(kmPairErrorMsg);
    });

    it("does not save 3-digit prefill draft from H-1 as full KM (Zero Phantom Value)", () => {
      const onSave = vi.fn();
      // Bus baru tanpa KM Awal, ada H-1 292990 (prefill draft 292)
      renderForm({
        ...defaultProps,
        bus: {
          ...defaultProps.bus,
          kmAwal1: "",
          kmAkhir1: "",
        },
        previousDayKmAkhir2: "292990",
        activeCategory: "kmAwal1",
        onSave,
      });

      // Draft 3 digit otomatis terisi "292" oleh efek prefill
      expect(latestForm?.kmAwal1).toBe("292");

      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });

      // kmAwal1 disanitasi menjadi "" (draft tidak terkirim sebagai KM penuh)
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave.mock.calls[0][0].kmAwal1).toBe("");
    });

    it("respects existing saved 3-digit KM values in payload without stripping", () => {
      // Kasus: Bus yang memang memiliki data eksisting 3 digit (misal "150")
      const onSave = vi.fn();
      renderForm({
        ...defaultProps,
        bus: {
          ...defaultProps.bus,
          kmAwal1: "150",
          kmAkhir1: "190",
        },
        previousDayKmAkhir2: "150000",
        activeCategory: "kmAwal1",
        onSave,
      });

      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });

      // Nilai eksisting 3 digit tetap dihormati sesuai kontrak
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave.mock.calls[0][0].kmAwal1).toBe("150");
    });

    it("recognizes Shift 2 cross-day error in hasCrossDayError and allows bypass on partial Shift 1", () => {
      const onSave = vi.fn();
      renderForm({
        ...defaultProps,
        bus: {
          ...defaultProps.bus,
          kmAwal1: "",
          kmAkhir1: "100000",
          kmAwal2: "90000",
          kmAkhir2: "",
        },
        activeCategory: "kmAwal2",
        initialTab: "shift2",
        previousDayKmAkhir2: "120000",
        onSave,
      });

      // Submit form
      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });

      // Error lintas hari S2 harus ada di validationErrors
      expect(onSave).not.toHaveBeenCalled();
      const errors = latestForm?.validationErrors || [];
      expect(errors.some((e) => e.includes(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_2) && e.includes("tidak boleh lebih kecil"))).toBe(true);

      // Sesuai R102-01: hasCrossDayError harus TRUE sehingga checkbox bypass dapat ditampilkan
      expect(latestForm?.hasCrossDayError).toBe(true);

      // Centang bypass
      act(() => {
        latestForm?.handleToggleBypassOdometerReset(true);
      });

      expect(latestForm?.bypassOdometerReset).toBe(true);
      expect(latestForm?.hasCrossDayError).toBe(true);
      expect(latestForm?.validationErrors).toEqual([]);

      // Submit setelah bypass aktif: simpan berhasil
      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave.mock.calls[0][0].kmAwal2).toBe("90000");
    });

    it("Batch 3.2: Async previousDayKmAkhir2 kedatangan terlambat mengisi draf tanpa menimpa ketikan user", () => {
      renderForm({
        previousDayKmAkhir2: undefined,
      });

      expect(latestForm?.kmAwal1).toBe("");

      // User mengetik sebelum H-1 tiba
      act(() => {
        latestForm?.setKmAwal1("299800");
      });
      expect(latestForm?.kmAwal1).toBe("299800");

      // H-1 tiba
      renderForm({
        previousDayKmAkhir2: "300050",
      });
      expect(latestForm?.kmAwal1).toBe("299800");
    });

    it("Batch 3.2: Backspace KM Awal S1 me-lock dan me-reset KM Akhir S1 tanpa loop", () => {
      renderForm();

      act(() => {
        latestForm?.setKmAwal1("300100");
      });
      expect(latestForm?.kmAkhir1).toBe("300");
      expect(latestForm?.isKmAkhir1Locked).toBe(false);

      // Backspace ke 3 digit
      act(() => {
        latestForm?.setKmAwal1("300");
      });
      expect(latestForm?.kmAkhir1).toBe("");
      expect(latestForm?.isKmAkhir1Locked).toBe(true);

      // Backspace ke kosong
      act(() => {
        latestForm?.setKmAwal1("");
      });
      expect(latestForm?.kmAwal1).toBe("");
    });

    it("Batch 3.2: handleApplyRollover memperbarui KM dan membersihkan error rollover", () => {
      renderForm({
        previousDayKmAkhir2: "292990",
      });

      act(() => {
        latestForm?.setKmAwal1("292003");
      });

      // Submit form untuk memicu error validasi lintas hari
      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });

      expect(latestForm?.validationErrors.length).toBeGreaterThan(0);
      expect(latestForm?.smartRolloverSuggestion).not.toBeNull();

      // Apply rollover
      act(() => {
        latestForm?.handleApplyRollover();
      });

      expect(latestForm?.kmAwal1).toBe("293003");
      expect(latestForm?.kmAkhir1).toBe("293");
      expect(latestForm?.validationErrors).toEqual([]);
    });

    it("R108-01: handleApplyRollover pada form ketika kmAwal1 dan kmAwal2 bernilai sama (292003) hanya memperbarui kmAwal1 dan mempertahankan kmAwal2", () => {
      renderForm({
        previousDayKmAkhir2: "292990",
        initialTab: "shift1",
      });

      act(() => {
        latestForm?.setKmAwal1("292003");
        latestForm?.setKmAwal2("292003");
      });

      // Submit form untuk memicu error validasi lintas hari
      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });

      expect(latestForm?.validationErrors.length).toBeGreaterThan(0);
      expect(
        latestForm?.validationErrors.some((e) =>
          e.includes("tidak boleh lebih kecil dari Kemarin"),
        ),
      ).toBe(true);
      expect(latestForm?.smartRolloverSuggestion).not.toBeNull();
      expect(latestForm?.smartRolloverSuggestion?.suggestedKm).toBe("293003");

      // Apply rollover dari tab shift1
      act(() => {
        latestForm?.handleApplyRollover();
      });

      // Verifikasi R108-01: kmAwal1 ter-update ke 293003, kmAwal2 TETAP 292003
      expect(latestForm?.kmAwal1).toBe("293003");
      expect(latestForm?.kmAwal2).toBe("292003");
      expect(latestForm?.kmAkhir1).toBe("293");

      // Verifikasi error rollover telah dibersihkan
      expect(
        latestForm?.validationErrors.some((e) =>
          e.includes("tidak boleh lebih kecil dari"),
        ),
      ).toBe(false);
    });

    it("R110-01 REPRODUKSI: handleApplyRollover tidak boleh menghapus error KM Akhir < KM Awal saat membersihkan error lintas hari", () => {
      const onSave = vi.fn();
      renderForm({
        previousDayKmAkhir2: "292990",
        initialTab: "shift1",
        onSave,
      });

      act(() => {
        latestForm?.setKmAwal1("292003");
        latestForm?.setKmAkhir1("291900");
      });

      // Submit form
      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });

      // Sebelum klik: harus ada 2 error (lintas hari dan KM pair)
      expect(latestForm?.validationErrors.length).toBe(2);
      expect(
        latestForm?.validationErrors.some((e) =>
          e.includes("tidak boleh lebih kecil dari Kemarin"),
        ),
      ).toBe(true);
      expect(
        latestForm?.validationErrors.some((e) =>
          e.includes("KM Akhir Shift 1 (291900) tidak boleh lebih kecil dari KM Awal"),
        ),
      ).toBe(true);

      // Terapkan rollover
      act(() => {
        latestForm?.handleApplyRollover();
      });

      // KM Awal menjadi 293003, tetapi KM Akhir tetap 291900
      expect(latestForm?.kmAwal1).toBe("293003");
      expect(latestForm?.kmAkhir1).toBe("291900");

      // EKSPEKTASI R110-01:
      // Hanya error lintas hari yang hilang.
      // Error KM pair (KM Akhir < KM Awal) HARUS TETAP ADA!
      expect(
        latestForm?.validationErrors.some((e) =>
          e.includes("tidak boleh lebih kecil dari Kemarin"),
        ),
      ).toBe(false);
      expect(
        latestForm?.validationErrors.some((e) =>
          e.includes("KM Akhir Shift 1 (291900) tidak boleh lebih kecil dari KM Awal"),
        ),
      ).toBe(true);
      expect(latestForm?.validationErrors.length).toBe(1);

      // Submit berikutnya harus tetap ditolak karena KM Akhir masih salah
      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });
      expect(onSave).not.toHaveBeenCalled();

      // Perbaiki KM Akhir menjadi valid (293150)
      act(() => {
        latestForm?.setKmAkhir1("293150");
      });

      // Submit kembali setelah diperbaiki -> harus berhasil disimpan
      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });
      expect(onSave).toHaveBeenCalled();
      expect(latestForm?.validationErrors).toEqual([]);
    });

    it("R110-01: handleApplyRollover mempertahankan error non-KM (seperti TOA negatif)", () => {
      const onSave = vi.fn();
      renderForm({
        previousDayKmAkhir2: "292990",
        initialTab: "shift1",
        onSave,
      });

      act(() => {
        latestForm?.setKmAwal1("292003");
        latestForm?.setToaShift1("-5"); // Nilai negatif -> error
      });

      // Submit form
      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });

      expect(latestForm?.validationErrors.length).toBe(2);
      expect(
        latestForm?.validationErrors.some((e) =>
          e.includes("tidak boleh lebih kecil dari Kemarin"),
        ),
      ).toBe(true);
      expect(
        latestForm?.validationErrors.some((e) =>
          e.includes("Nilai TOA Shift 1 harus berupa angka positif!"),
        ),
      ).toBe(true);

      // Terapkan rollover
      act(() => {
        latestForm?.handleApplyRollover();
      });

      // Error lintas hari hilang, tetapi error TOA tetap bertahan
      expect(
        latestForm?.validationErrors.some((e) =>
          e.includes("tidak boleh lebih kecil dari Kemarin"),
        ),
      ).toBe(false);
      expect(
        latestForm?.validationErrors.some((e) =>
          e.includes("Nilai TOA Shift 1 harus berupa angka positif!"),
        ),
      ).toBe(true);
      expect(latestForm?.validationErrors.length).toBe(1);
    });

    it("R112-01: handleApplyRollover menyegarkan angka KM Awal pada pesan error KM pair yang masih berlaku", () => {
      const onSave = vi.fn();
      renderForm({
        previousDayKmAkhir2: "292990",
        initialTab: "shift1",
        onSave,
      });

      act(() => {
        latestForm?.setKmAwal1("292003");
        latestForm?.setKmAkhir1("291900");
      });

      // Submit form
      act(() => {
        const dummyEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        latestForm?.handleFormSubmit(dummyEvent);
      });

      // Sebelum rollover: KM Awal lama adalah 292003
      expect(latestForm?.validationErrors.length).toBe(2);
      expect(
        latestForm?.validationErrors.some((e) =>
          e.includes("KM Akhir Shift 1 (291900) tidak boleh lebih kecil dari KM Awal (292003)!"),
        ),
      ).toBe(true);

      // Terapkan rollover
      act(() => {
        latestForm?.handleApplyRollover();
      });

      // Sesudah rollover: KM Awal diperbarui ke 293003
      expect(latestForm?.kmAwal1).toBe("293003");

      // BUKTI KONTRAK R112-01:
      // Error lintas hari hilang (293003 >= 292990)
      expect(
        latestForm?.validationErrors.some((e) =>
          e.includes("tidak boleh lebih kecil dari Kemarin"),
        ),
      ).toBe(false);

      // Error KM pair lama dengan angka 292003 sudah TIDAK ADA
      expect(
        latestForm?.validationErrors.some((e) =>
          e.includes("(292003)"),
        ),
      ).toBe(false);

      // Error KM pair disegarkan dengan angka KM Awal terkini (293003)!
      expect(
        latestForm?.validationErrors.some((e) =>
          e.includes("KM Akhir Shift 1 (291900) tidak boleh lebih kecil dari KM Awal (293003)!"),
        ),
      ).toBe(true);
      expect(latestForm?.validationErrors.length).toBe(1);
    });
  });
});



