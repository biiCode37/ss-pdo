// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  useBusModalOdometer,
  type UseBusModalOdometerProps,
  type UseBusModalOdometerReturn,
} from "./useBusModalOdometer";
import type { BusData } from "@/services/googleSheets";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let latestOdometer: UseBusModalOdometerReturn | null = null;

function OdometerTestComponent(props: UseBusModalOdometerProps) {
  const odometer = useBusModalOdometer(props);
  latestOdometer = odometer;
  return <div id="odometer-test-node">{odometer.kmAwal1}</div>;
}

describe("useBusModalOdometer - Dedicated Sub-hook Characterization & Regressions", () => {
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

  const defaultProps: UseBusModalOdometerProps = {
    bus: mockBus,
    previousDayKmAkhir2: "300050",
    isSingleMode: false,
    activeCategory: "all",
    activeTab: "shift1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    latestOdometer = null;
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

  function renderOdometer(propsPartial: Partial<UseBusModalOdometerProps> = {}) {
    act(() => {
      root.render(<OdometerTestComponent {...defaultProps} {...propsPartial} />);
    });
  }

  it("1. Async H-1: saat data H-1 datang terlambat setelah render awal, draf 3 digit masuk hanya jika field pantas diisi", () => {
    // Awal buka: previousDayKmAkhir2 belum ada (undefined)
    renderOdometer({ previousDayKmAkhir2: undefined });
    expect(latestOdometer?.kmAwal1).toBe("");

    // H-1 tiba dari async query
    renderOdometer({ previousDayKmAkhir2: "300050" });
    expect(latestOdometer?.kmAwal1).toBe("300");
  });

  it("2. Async H-1 tidak menimpa nilai yang sudah diketik pengguna sebelum H-1 tiba", () => {
    // Awal buka tanpa H-1
    renderOdometer({ previousDayKmAkhir2: undefined });
    expect(latestOdometer?.kmAwal1).toBe("");

    // Pengguna mengetik sendiri sebelum H-1 datang
    act(() => {
      latestOdometer?.setKmAwal1("299800");
    });
    expect(latestOdometer?.kmAwal1).toBe("299800");

    // H-1 tiba
    renderOdometer({ previousDayKmAkhir2: "300050" });
    // Nilai ketikan pengguna WAJIB TIDAK TERTIRU / TIDAK TERTEMPA
    expect(latestOdometer?.kmAwal1).toBe("299800");
  });

  it("3. Async H-1 tidak menimpa nilai yang sudah tersimpan di database bus", () => {
    const busWithSavedKm: BusData = {
      ...mockBus,
      kmAwal1: "300100",
    };
    renderOdometer({ bus: busWithSavedKm, previousDayKmAkhir2: undefined });
    expect(latestOdometer?.kmAwal1).toBe("300100");

    // H-1 tiba
    renderOdometer({ bus: busWithSavedKm, previousDayKmAkhir2: "300050" });
    expect(latestOdometer?.kmAwal1).toBe("300100");
  });

  it("4. Backspace/koreksi KM Awal S1: me-lock dan me-reset KM Akhir S1 tanpa loop atau prefill berulang", () => {
    renderOdometer();
    // Awal: prefill 3 digit "300"
    expect(latestOdometer?.kmAwal1).toBe("300");
    expect(latestOdometer?.isKmAwal1Valid).toBe(false);
    expect(latestOdometer?.isKmAkhir1Locked).toBe(true);

    // Ketik nilai lengkap
    act(() => {
      latestOdometer?.setKmAwal1("300100");
    });
    expect(latestOdometer?.isKmAwal1Valid).toBe(true);
    expect(latestOdometer?.isKmAkhir1Locked).toBe(false);
    expect(latestOdometer?.kmAkhir1).toBe("300");

    // User backspace KM Awal S1 hingga <= 3 digit ("300")
    act(() => {
      latestOdometer?.setKmAwal1("300");
    });
    expect(latestOdometer?.isKmAwal1Valid).toBe(false);
    expect(latestOdometer?.isKmAkhir1Locked).toBe(true);
    // KM Akhir S1 auto-reset menjadi kosong
    expect(latestOdometer?.kmAkhir1).toBe("");

    // User hapus total KM Awal S1 menjadi kosong ""
    act(() => {
      latestOdometer?.setKmAwal1("");
    });
    // Field tetap kosong, tidak tertimpa kembali secara agresif
    expect(latestOdometer?.kmAwal1).toBe("");
  });

  it("5. Menghapus (clear) KM Akhir S1/S2 tidak memicu prefill ulang otomatis saat KM Awal masih valid", () => {
    renderOdometer();
    act(() => {
      latestOdometer?.setKmAwal1("300100");
    });
    expect(latestOdometer?.kmAkhir1).toBe("300");

    // User menghapus KM Akhir 1 untuk dikosongkan
    act(() => {
      latestOdometer?.setKmAkhir1("");
    });
    // Nilai kosong tetap dipertahankan, tidak langsung snapping kembali
    expect(latestOdometer?.kmAkhir1).toBe("");
  });

  it("6. Bus dinas siang saja (Shift 2 saja): KM Awal S2 langsung terbuka dan mengambil draf H-1", () => {
    renderOdometer({
      bus: { ...mockBus, kmAwal1: "", kmAkhir1: "", kmAwal2: "", kmAkhir2: "" },
      previousDayKmAkhir2: "250000",
    });

    // Shift 1 belum dimulai
    expect(latestOdometer?.isS1Started).toBe(false);
    // KM Awal S2 langsung mengambil draft H-1 "250"
    expect(latestOdometer?.kmAwal2).toBe("250");
    // KM Awal S2 tidak terkunci oleh S1
    expect(latestOdometer?.isKmAwal2Locked).toBe(false);
  });

  it("7. Salin KM Akhir S1 ke Awal S2 (handleCopyKmAkhir1ToAwal2) menyalin nilai penuh dan membuka prefill KM Akhir S2", () => {
    renderOdometer();
    act(() => {
      latestOdometer?.setKmAwal1("300100");
      latestOdometer?.setKmAkhir1("300180");
    });

    act(() => {
      latestOdometer?.handleCopyKmAkhir1ToAwal2();
    });

    expect(latestOdometer?.kmAwal2).toBe("300180");
    expect(latestOdometer?.isKmAwal2Valid).toBe(true);
    expect(latestOdometer?.isKmAkhir2Locked).toBe(false);
    expect(latestOdometer?.kmAkhir2).toBe("300");
  });

  it("8. Smart Rollover Suggestion & Apply memperbarui KM Awal & Akhir tanpa merusak nilai lain", () => {
    renderOdometer({
      previousDayKmAkhir2: "292990",
    });

    // User menginput KM Awal dengan pergantian kepala ribuan (misal 292003 padahal sudah lewat 292990)
    act(() => {
      latestOdometer?.setKmAwal1("292003");
    });

    expect(latestOdometer?.smartRolloverSuggestion).not.toBeNull();
    expect(latestOdometer?.smartRolloverSuggestion?.suggestedKm).toBe("293003");

    // Terapkan rollover
    act(() => {
      const ok = latestOdometer?.applyRollover();
      expect(ok).toBe(true);
    });

    expect(latestOdometer?.kmAwal1).toBe("293003");
    expect(latestOdometer?.kmAkhir1).toBe("293");
  });

  it("9. R108-01: Ketika kmAwal1 dan kmAwal2 bernilai sama (292003) pada tab shift1, applyRollover harus memperbarui kmAwal1 dan mempertahankan kmAwal2", () => {
    renderOdometer({
      previousDayKmAkhir2: "292990",
      activeTab: "shift1",
    });

    act(() => {
      latestOdometer?.setKmAwal1("292003");
      latestOdometer?.setKmAwal2("292003");
    });

    expect(latestOdometer?.kmAwal1).toBe("292003");
    expect(latestOdometer?.kmAwal2).toBe("292003");
    expect(latestOdometer?.smartRolloverSuggestion).not.toBeNull();
    expect(latestOdometer?.smartRolloverSuggestion?.suggestedKm).toBe("293003");

    // Terapkan rollover
    act(() => {
      const ok = latestOdometer?.applyRollover();
      expect(ok).toBe(true);
    });

    // R108-01 EXPECTATION: kmAwal1 harus 293003, kmAwal2 HARUS TETAP 292003
    expect(latestOdometer?.kmAwal1).toBe("293003");
    expect(latestOdometer?.kmAwal2).toBe("292003");
    expect(latestOdometer?.kmAkhir1).toBe("293");
  });

  it("10. Rollover Shift 2 eksplisit (bus dinas siang saja): applyRollover memperbarui kmAwal2 tanpa menyentuh kmAwal1", () => {
    renderOdometer({
      previousDayKmAkhir2: "292990",
      activeTab: "shift2",
    });

    act(() => {
      latestOdometer?.setKmAwal2("292003");
    });

    // kmAwal1 tetap draf prefill 3 digit ("292") dari H-1
    expect(latestOdometer?.kmAwal1).toBe("292");
    expect(latestOdometer?.kmAwal2).toBe("292003");
    expect(latestOdometer?.smartRolloverSuggestion).not.toBeNull();
    expect(latestOdometer?.smartRolloverSuggestion?.suggestedKm).toBe("293003");

    act(() => {
      const ok = latestOdometer?.applyRollover();
      expect(ok).toBe(true);
    });

    expect(latestOdometer?.kmAwal2).toBe("293003");
    expect(latestOdometer?.kmAkhir2).toBe("293");
    expect(latestOdometer?.kmAwal1).toBe("292");
  });

  it("11. Rollover Single Focus Shift 2 (kmAwal2): applyRollover memperbarui kmAwal2", () => {
    renderOdometer({
      previousDayKmAkhir2: "292990",
      isSingleMode: true,
      activeCategory: "kmAwal2",
    });

    act(() => {
      latestOdometer?.setKmAwal2("292003");
    });

    expect(latestOdometer?.smartRolloverSuggestion?.suggestedKm).toBe("293003");

    act(() => {
      const ok = latestOdometer?.applyRollover();
      expect(ok).toBe(true);
    });

    expect(latestOdometer?.kmAwal2).toBe("293003");
    expect(latestOdometer?.kmAkhir2).toBe("293");
  });

  it("12. Kedua nilai KM Awal berbeda: applyRollover pada tab shift1 hanya memperbarui kmAwal1", () => {
    renderOdometer({
      previousDayKmAkhir2: "292990",
      activeTab: "shift1",
    });

    act(() => {
      latestOdometer?.setKmAwal1("292003");
      latestOdometer?.setKmAwal2("292500");
    });

    expect(latestOdometer?.smartRolloverSuggestion?.suggestedKm).toBe("293003");

    act(() => {
      const ok = latestOdometer?.applyRollover();
      expect(ok).toBe(true);
    });

    expect(latestOdometer?.kmAwal1).toBe("293003");
    expect(latestOdometer?.kmAwal2).toBe("292500");
  });
});

