// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BusInputModal } from "./BusInputModal";
import type { BusData } from "@/services/googleSheets";
import { getSatsetMode, setSatsetMode } from "@/utils/modals/busInput/busModalTypes";
import { TEXT_ALERTS, TEXT_FLEET_STATUS, TEXT_COMMON } from "@/constants/texts";

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
            totalToa: "240",
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
        totalToa: "240",
        kmAwal1: "100",
        kmAkhir1: "150",
        kmAwal2: "150",
        kmAkhir2: "200",
        tripPergi: "2",
        tripPulang: "2",
      }),
    );
    expect(onSaveMock.mock.calls[0][0].toaShift2).toBeUndefined();
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

  it("auto-prefills 3 leading digits of KM Awal S1 and locks Akhir S1 when empty (Zero Phantom Value)", async () => {
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
    // Sesuai SSOT Zero Phantom Value: KM Akhir 1 terkunci dan bernilai "" saat KM Awal 1 belum lengkap
    expect(inputKmAkhir1?.value).toBe("");
    expect(inputKmAkhir1?.disabled).toBe(true);
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

  it("renders trip fallback labels from TEXT_ALERTS when headerMap is not provided", async () => {
    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus()}
          activeCategory="all"
          initialTab="trip"
          onSave={vi.fn()}
        />,
      );
    });

    // Verifikasi fallback label trip muncul dari TEXT_ALERTS
    expect(document.body.textContent).toContain(
      TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TRIP_PERGI,
    );
    expect(document.body.textContent).toContain(
      TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TRIP_PULANG,
    );
  });

  it("handles bypass checkbox toggle correctly: keeps checkbox visible after check, removes only cross-day error, and disables save when other errors exist", async () => {
    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus({
            kmAwal1: "100000",
            kmAkhir1: "99000", // error pair
            toaShift1: "100",
            totalToa: "200",
          })}
          activeCategory="all"
          initialTab="shift1"
          onSave={vi.fn()}
          previousDayKmAkhir2="292990" // error cross-day
        />,
      );
    });

    // Pemicu submit form untuk memunculkan error validasi
    const formEl = document.body.querySelector("form");
    expect(formEl).not.toBeNull();
    await act(async () => {
      formEl?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });

    // Checkbox bypass harus muncul
    const bypassCheckbox = document.body.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    expect(bypassCheckbox).not.toBeNull();
    expect(bypassCheckbox?.checked).toBe(false);
    expect(document.body.textContent).toContain(
      TEXT_ALERTS.BUS_INPUT_MODAL.BYPASS_ODOMETER_RESET_LABEL,
    );

    // Centang checkbox bypass
    await act(async () => {
      bypassCheckbox?.click();
    });

    // Checkbox TETAP ADA di DOM dan berstatus checked
    const updatedCheckbox = document.body.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    expect(updatedCheckbox).not.toBeNull();
    expect(updatedCheckbox?.checked).toBe(true);

    // Tombol simpan tetap disabled karena error pair (KM Akhir < Awal) masih ada!
    const submitBtn = document.body.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    );
    expect(submitBtn?.disabled).toBe(true);

    // Error KM Akhir < Awal masih tampil di alert
    expect(document.body.textContent).toContain(
      TEXT_ALERTS.BUS_INPUT_MODAL.KM_AKHIR_LESS_THAN_AWAL(
        TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_1,
        "99000",
        "100000",
      ),
    );
  });

  it("R102-02: maintains bypass checkbox visible and checked when cross-day is the ONLY error, and unchecking re-evaluates on submit", async () => {
    const onSave = vi.fn();
    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus({
            kmAwal1: "100000",
            kmAkhir1: "100050",
            kmAwal2: "100050",
            kmAkhir2: "100100",
            toaShift1: "100",
            totalToa: "200",
          })}
          activeCategory="all"
          initialTab="shift1"
          onSave={onSave}
          previousDayKmAkhir2="120000" // Hanya error lintas hari S1
        />,
      );
    });

    const formEl = document.body.querySelector("form");
    expect(formEl).not.toBeNull();
    await act(async () => {
      formEl?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });

    // Error lintas hari muncul
    expect(document.body.textContent).toContain("tidak boleh lebih kecil");
    const bypassCheckbox = document.body.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    expect(bypassCheckbox).not.toBeNull();
    expect(bypassCheckbox?.checked).toBe(false);

    // Centang bypass
    await act(async () => {
      bypassCheckbox?.click();
    });

    // Checkbox TETAP ADA di DOM dan checked walaupun validationErrors.length === 0
    const checkboxAfter = document.body.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    expect(checkboxAfter).not.toBeNull();
    expect(checkboxAfter?.checked).toBe(true);

    // List error merah hilang dari antarmuka
    expect(document.body.textContent).not.toContain(TEXT_ALERTS.BUS_INPUT_MODAL.VALIDATION_HEADER);

    // Tombol simpan menjadi enabled
    const submitBtn = document.body.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    );
    expect(submitBtn?.disabled).toBe(false);

    // Lepas centang bypass (uncheck)
    await act(async () => {
      checkboxAfter?.click();
    });

    // Submit form lagi setelah dilepas: submit mengevaluasi lintas hari lagi!
    await act(async () => {
      formEl?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });

    // Error lintas hari muncul kembali di DOM dan tombol simpan kembali disabled
    expect(document.body.textContent).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.VALIDATION_HEADER);
    expect(document.body.textContent).toContain("tidak boleh lebih kecil");
    expect(submitBtn?.disabled).toBe(true);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("R102-01: renders bypass checkbox on partial Shift 1 in Single Focus mode for kmAwal2", async () => {
    const onSave = vi.fn();
    await act(async () => {
      root.render(
        <BusInputModal
          isOpen={true}
          onClose={vi.fn()}
          bus={createMockBus({
            kmAwal1: "",
            kmAkhir1: "100000",
            kmAwal2: "90000",
            kmAkhir2: "",
          })}
          activeCategory="kmAwal2"
          onSave={onSave}
          previousDayKmAkhir2="120000"
        />,
      );
    });

    const formEl = document.body.querySelector("form");
    await act(async () => {
      formEl?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });

    // Error lintas hari S2 harus tampil
    expect(document.body.textContent).toContain("tidak boleh lebih kecil");

    // Checkbox bypass HARUS tampil di DOM
    const bypassCheckbox = document.body.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    expect(bypassCheckbox).not.toBeNull();
    expect(bypassCheckbox?.checked).toBe(false);
  });

  describe("ModalShell Integration & Shell Dismissal Behaviors (Fase 3 Batch 3.5)", () => {
    it("membuktikan dismiss idempotent dengan timer 220 ms dan mencegah late callback saat unmount", async () => {
      vi.useFakeTimers();
      const onClose = vi.fn();

      await act(async () => {
        root.render(
          <BusInputModal
            isOpen={true}
            onClose={onClose}
            bus={createMockBus()}
            onSave={vi.fn()}
          />,
        );
      });

      // Cari tombol close header
      const closeBtn = document.body.querySelector<HTMLButtonElement>(
        `button[aria-label="${TEXT_ALERTS.BUS_INPUT_MODAL.MODAL_CLOSE_ARIA}"]`,
      );
      expect(closeBtn).not.toBeNull();

      // Klik pertama untuk memicu handleDismiss
      await act(async () => {
        closeBtn?.click();
      });

      // Pada t = 0ms dan t = 100ms, onClose BELUM dipanggil karena ada transisi 220ms
      expect(onClose).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(onClose).not.toHaveBeenCalled();

      // Klik kedua pada t = 100ms (uji idempotency: tidak boleh membuat timeout baru atau double call)
      await act(async () => {
        closeBtn?.click();
      });

      // Majukan timer melewati 220ms (total 250ms dari klik pertama)
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // onClose harus dipanggil TEPAT SATU KALI
      expect(onClose).toHaveBeenCalledTimes(1);

      // Uji pencegahan late callback saat unmount:
      const onLateClose = vi.fn();
      await act(async () => {
        root.render(
          <BusInputModal
            isOpen={true}
            onClose={onLateClose}
            bus={createMockBus()}
            onSave={vi.fn()}
          />,
        );
      });

      const closeBtn2 = document.body.querySelector<HTMLButtonElement>(
        `button[aria-label="${TEXT_ALERTS.BUS_INPUT_MODAL.MODAL_CLOSE_ARIA}"]`,
      );
      await act(async () => {
        closeBtn2?.click();
      });

      // Unmount komponen sebelum 220ms selesai
      await act(async () => {
        root.unmount();
      });

      // Majukan timer 500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // onLateClose TIDAK boleh dipanggil karena timer sudah dibersihkan saat unmount
      expect(onLateClose).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("mengintegrasikan coordinated scroll lock reference counting tanpa manipulasi overflow langsung", async () => {
      const { getActiveScrollLockCount, _resetScrollLockCoordinatorForTest } = await import(
        "@/utils/scrollLockCoordinator"
      );
      _resetScrollLockCoordinatorForTest();
      document.body.style.overflow = "";

      expect(getActiveScrollLockCount()).toBe(0);
      expect(document.body.style.overflow).toBe("");

      // 1. Render BusInputModal
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

      // Scroll lock count bertambah menjadi 1 dan overflow terisolasi
      expect(getActiveScrollLockCount()).toBe(1);
      expect(document.body.style.overflow).toBe("hidden");

      // 2. Simulasi modal kedua bertumpuk di atasnya
      const { ModalShell } = await import("@/components/ui/ModalShell");
      const secondContainer = document.createElement("div");
      document.body.appendChild(secondContainer);
      const secondRoot = createRoot(secondContainer);

      await act(async () => {
        secondRoot.render(
          <ModalShell isOpen={true} title="Modal Kedua" onClose={vi.fn()}>
            <div>Modal Bertumpuk</div>
          </ModalShell>,
        );
      });

      // Scroll lock count bertambah menjadi 2
      expect(getActiveScrollLockCount()).toBe(2);
      expect(document.body.style.overflow).toBe("hidden");

      // 3. Tutup modal kedua
      await act(async () => {
        secondRoot.unmount();
      });
      secondContainer.remove();

      // Scroll lock count kembali menjadi 1, overflow body tetap hidden untuk BusInputModal
      expect(getActiveScrollLockCount()).toBe(1);
      expect(document.body.style.overflow).toBe("hidden");

      // 4. Tutup BusInputModal
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

      // Semua scroll lock terlepas dan overflow pulih
      expect(getActiveScrollLockCount()).toBe(0);
      expect(document.body.style.overflow).toBe("");
    });

    it("mengintegrasikan modalStackCoordinator untuk Escape hanya menutup dialog teratas (topmost)", async () => {
      const { _resetModalStackForTest } = await import("@/utils/modalStackCoordinator");
      const { ModalShell } = await import("@/components/ui/ModalShell");
      _resetModalStackForTest();

      const onBusModalClose = vi.fn();
      const onSecondModalClose = vi.fn();

      // 1. Render BusInputModal
      await act(async () => {
        root.render(
          <BusInputModal
            isOpen={true}
            onClose={onBusModalClose}
            bus={createMockBus()}
            onSave={vi.fn()}
          />,
        );
      });

      // 2. Render modal kedua di atas BusInputModal
      const secondContainer = document.createElement("div");
      document.body.appendChild(secondContainer);
      const secondRoot = createRoot(secondContainer);

      await act(async () => {
        secondRoot.render(
          <ModalShell
            isOpen={true}
            title="Modal Paling Atas"
            id="modal-topmost"
            onClose={onSecondModalClose}
          >
            <div>Konten Topmost</div>
          </ModalShell>,
        );
      });

      // 3. Tekan Escape saat ada 2 modal bertumpuk
      await act(async () => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      });

      // HANYA modal teratas yang memanggil onClose! BusInputModal TIDAK tertutup
      expect(onSecondModalClose).toHaveBeenCalledTimes(1);
      expect(onBusModalClose).not.toHaveBeenCalled();

      // Bersihkan modal kedua
      await act(async () => {
        secondRoot.unmount();
      });
      secondContainer.remove();
    });

    it("R126-01 (Kontrak 1): dua modal terdaftar (Bus Input di bawah modal atas) - Back nyata 1 menutup modal atas; Back nyata 2 sebelum atas unmount tidak memanggil callback Bus; setelah atas unmount history.state sesuai Bus; Back nyata 3 menutup Bus", async () => {
      const { initHistoryNavigation, _resetHistoryNavigationForTest } = await import(
        "@/utils/historyNavigation"
      );
      const { ModalShell } = await import("@/components/ui/ModalShell");
      _resetHistoryNavigationForTest();
      initHistoryNavigation();
      vi.useFakeTimers();

      const onBusClose = vi.fn();
      const onTopModalClose = vi.fn();

      // 1. Render BusInputModal
      await act(async () => {
        root.render(
          <BusInputModal
            isOpen={true}
            onClose={onBusClose}
            bus={createMockBus()}
            onSave={vi.fn()}
          />,
        );
      });

      const busNavId = window.history.state?.pdoNavId;
      expect(busNavId).toBeTruthy();

      // 2. Render Modal Atas di atas BusInputModal (modal bertumpuk)
      const topContainer = document.createElement("div");
      document.body.appendChild(topContainer);
      const topRoot = createRoot(topContainer);

      await act(async () => {
        topRoot.render(
          <ModalShell
            isOpen={true}
            id="modal-atas"
            title="Modal Atas"
            onClose={onTopModalClose}
          >
            <div>Konten Modal Atas</div>
          </ModalShell>,
        );
      });

      expect(window.history.state?.pdoNavId).toBe("modal-atas");

      // 3. Back pertama nyata (real history.back()): modal atas menutup, Bus tetap terbuka
      await act(async () => {
        window.history.back();
      });

      expect(onTopModalClose).toHaveBeenCalledTimes(1);
      expect(onBusClose).not.toHaveBeenCalled();

      // 4. Back kedua nyata (real history.back()) sebelum modal atas unmount:
      // callback Bus tetap TIDAK dipanggil!
      await act(async () => {
        window.history.back();
      });

      expect(onBusClose).not.toHaveBeenCalled();
      expect(onTopModalClose).toHaveBeenCalledTimes(1);

      // 5. Modal atas selesai menutup dan unmount
      await act(async () => {
        topRoot.unmount();
      });
      topContainer.remove();

      // Setelah modal atas unmount, history.state.pdoNavId HARUS sesuai modal Bus!
      expect(window.history.state?.pdoNavId).toBe(busNavId);

      // 6. Back ketiga nyata (real history.back()) menutup modal Bus, bukan keluar/root
      await act(async () => {
        window.history.back();
      });

      // Sebelum timer 220ms selesai, onClose belum dipanggil
      expect(onBusClose).not.toHaveBeenCalled();

      // Majukan timer 220ms
      act(() => {
        vi.advanceTimersByTime(220);
      });

      expect(onBusClose).toHaveBeenCalledTimes(1);

      // Simulasi parent merespons onClose dengan unmount
      await act(async () => {
        root.render(
          <BusInputModal
            isOpen={false}
            onClose={onBusClose}
            bus={createMockBus()}
            onSave={vi.fn()}
          />,
        );
      });

      expect(window.history.state?.pdoRootGuard).toBe(true);

      vi.useRealTimers();
      _resetHistoryNavigationForTest();
    });

    it("R126-01 (Kontrak 2): Bus Input sendiri - dua Back nyata dalam <220 ms menghasilkan satu onClose, setelah unmount state kembali ke root guard dan scroll lock pulih", async () => {
      const { initHistoryNavigation, _resetHistoryNavigationForTest } = await import(
        "@/utils/historyNavigation"
      );
      const { getActiveScrollLockCount, _resetScrollLockCoordinatorForTest } = await import(
        "@/utils/scrollLockCoordinator"
      );
      _resetScrollLockCoordinatorForTest();
      _resetHistoryNavigationForTest();
      initHistoryNavigation();
      vi.useFakeTimers();

      const onClose = vi.fn();

      await act(async () => {
        root.render(
          <BusInputModal
            isOpen={true}
            onClose={onClose}
            bus={createMockBus()}
            onSave={vi.fn()}
          />,
        );
      });

      expect(getActiveScrollLockCount()).toBe(1);
      expect(document.body.style.overflow).toBe("hidden");

      const alertUtils = await import("@/utils/alertUtils");
      const toastSpy = vi.spyOn(alertUtils, "showToast");

      // Back 1 nyata pada t = 0ms
      await act(async () => {
        window.history.back();
      });

      expect(onClose).not.toHaveBeenCalled();
      expect(toastSpy).not.toHaveBeenCalled();

      // Majukan timer 100ms
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Back 2 nyata pada t = 100ms (<220ms)
      await act(async () => {
        window.history.back();
      });

      expect(onClose).not.toHaveBeenCalled();
      expect(toastSpy).not.toHaveBeenCalled();
      expect(getActiveScrollLockCount()).toBe(1);

      // Majukan timer melewati 220ms (total 250ms dari Back 1)
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Menghasilkan tepat SATU onClose
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(toastSpy).not.toHaveBeenCalled();

      // Unmount modal
      await act(async () => {
        root.render(
          <BusInputModal
            isOpen={false}
            onClose={onClose}
            bus={createMockBus()}
            onSave={vi.fn()}
          />,
        );
      });

      // Scroll lock pulih dan state kembali ke root guard
      expect(getActiveScrollLockCount()).toBe(0);
      expect(document.body.style.overflow).toBe("");
      expect(window.history.state?.pdoRootGuard).toBe(true);

      toastSpy.mockRestore();
      vi.useRealTimers();
      _resetHistoryNavigationForTest();
    });

    it("R126-01 (Kontrak 3): Jalur tutup UI (Batal/X/backdrop) diikuti Back nyata selama animasi memenuhi kontrak riwayat yang sama", async () => {
      const { initHistoryNavigation, _resetHistoryNavigationForTest } = await import(
        "@/utils/historyNavigation"
      );
      const { getActiveScrollLockCount, _resetScrollLockCoordinatorForTest } = await import(
        "@/utils/scrollLockCoordinator"
      );
      _resetScrollLockCoordinatorForTest();
      _resetHistoryNavigationForTest();
      initHistoryNavigation();
      vi.useFakeTimers();

      const onClose = vi.fn();

      await act(async () => {
        root.render(
          <BusInputModal
            isOpen={true}
            onClose={onClose}
            bus={createMockBus()}
            onSave={vi.fn()}
          />,
        );
      });

      const cancelBtn = Array.from(document.body.querySelectorAll("button")).find((b) =>
        b.textContent?.includes(TEXT_COMMON.BUTTONS.CANCEL),
      );
      expect(cancelBtn).toBeDefined();

      // Klik Batal memicu penutupan via UI
      await act(async () => {
        cancelBtn?.click();
      });

      // Selama animasi 220ms, user menekan Back nyata
      await act(async () => {
        window.history.back();
      });

      // Majukan timer 220ms
      act(() => {
        vi.advanceTimersByTime(220);
      });

      expect(onClose).toHaveBeenCalledTimes(1);

      // Unmount modal
      await act(async () => {
        root.render(
          <BusInputModal
            isOpen={false}
            onClose={onClose}
            bus={createMockBus()}
            onSave={vi.fn()}
          />,
        );
      });

      expect(getActiveScrollLockCount()).toBe(0);
      expect(document.body.style.overflow).toBe("");
      expect(window.history.state?.pdoRootGuard).toBe(true);

      vi.useRealTimers();
      _resetHistoryNavigationForTest();
    });

    it("R124-01: idempotensi menyeluruh untuk Escape, backdrop, tombol X/Batal, dan tutup paksa via isOpen=false", async () => {
      vi.useFakeTimers();
      const onClose = vi.fn();

      // 1. Uji Tutup Paksa melalui prop isOpen=false saat modal sedang aktif
      await act(async () => {
        root.render(
          <BusInputModal
            isOpen={true}
            onClose={onClose}
            bus={createMockBus()}
            onSave={vi.fn()}
          />,
        );
      });

      // Parent langsung set isOpen = false (tutup paksa)
      await act(async () => {
        root.render(
          <BusInputModal
            isOpen={false}
            onClose={onClose}
            bus={createMockBus()}
            onSave={vi.fn()}
          />,
        );
      });

      // Majukan timer 500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Karena ditutup paksa via prop, onClose tidak boleh dipanggil terlambat
      expect(onClose).not.toHaveBeenCalled();

      // 2. Uji tombol Batal (footer)
      const onCancelClose = vi.fn();
      await act(async () => {
        root.render(
          <BusInputModal
            isOpen={true}
            onClose={onCancelClose}
            bus={createMockBus()}
            onSave={vi.fn()}
          />,
        );
      });

      const cancelBtn = Array.from(document.body.querySelectorAll("button")).find((b) =>
        b.textContent?.includes(TEXT_COMMON.BUTTONS.CANCEL),
      );
      expect(cancelBtn).toBeDefined();

      // Klik Batal berkali-kali
      await act(async () => {
        cancelBtn?.click();
        cancelBtn?.click();
      });

      act(() => {
        vi.advanceTimersByTime(220);
      });
      expect(onCancelClose).toHaveBeenCalledTimes(1);

      // Unmount modal sebelum sub-step 3
      await act(async () => {
        root.render(
          <BusInputModal
            isOpen={false}
            onClose={onCancelClose}
            bus={createMockBus()}
            onSave={vi.fn()}
          />,
        );
      });

      // 3. Uji Backdrop click ganda
      const onBackdropClose = vi.fn();
      await act(async () => {
        root.render(
          <BusInputModal
            isOpen={true}
            onClose={onBackdropClose}
            bus={createMockBus()}
            onSave={vi.fn()}
          />,
        );
      });

      const backdrop = document.body.querySelector(".bus-input-modal-overlay") as HTMLElement;
      expect(backdrop).not.toBeNull();

      // Klik backdrop berkali-kali
      await act(async () => {
        backdrop.click();
        backdrop.click();
      });

      act(() => {
        vi.advanceTimersByTime(220);
      });
      expect(onBackdropClose).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it("memverifikasi struktur dialog bersih (tepat 1 role='dialog' tanpa nested dialog) dan aria-labelledby terhubung ke formId judul", async () => {
      await act(async () => {
        root.render(
          <BusInputModal
            isOpen={true}
            onClose={vi.fn()}
            bus={createMockBus({ unit: "TJ-0456" })}
            onSave={vi.fn()}
          />,
        );
      });

      // Tepat 1 elemen role="dialog" di seluruh DOM (tidak bersarang)
      const dialogElements = document.body.querySelectorAll('[role="dialog"]');
      expect(dialogElements.length).toBe(1);

      const dialog = dialogElements[0] as HTMLElement;
      expect(dialog.getAttribute("aria-modal")).toBe("true");

      const labelledBy = dialog.getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();

      // Elemen yang dirujuk oleh aria-labelledby adalah judul h2 header unit bus
      const titleHeading = document.body.querySelector(`#${CSS.escape(labelledBy!)}`);
      expect(titleHeading).not.toBeNull();
      expect(titleHeading?.tagName.toLowerCase()).toBe("h2");
      expect(titleHeading?.textContent).toContain("TJ-0456");
    });
  });
});


