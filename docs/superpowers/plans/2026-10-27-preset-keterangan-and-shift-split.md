# Preset Keterangan & Pemisahan Catatan per Shift Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun antarmuka preset cepat untuk keterangan operasional armada (tombol preset `[BA]`, `[OFF]`, `[TO EVDAL]`, `[Reset]`, dropdown jenis BA `01`–`04`, shortcut `NP1`/`NP2` untuk BA.02) serta memisahkan pengelolaan catatan per shift (Shift 1 vs Shift 2) secara terisolasi dengan normalisasi gabungan kanonik `combineShiftKeterangan`.

**Architecture:** Memanfaatkan fondasi utilitas yang sudah ada di `src/utils/keteranganUtils.ts` (`splitShiftKeterangan`, `combineShiftKeterangan`, `parseKeterangan`, `normalizeKeterangan`) untuk mengelola state terpisah `keteranganS1` dan `keteranganS2` di `useBusInputForm`. Membuat komponen UI modular `KeteranganPresetBar` yang menangani deteksi status aktif, pemilihan jenis BA via `<select>`, dan sinkronisasi prefix cerdas ke textarea. Mengintegrasikannya ke form Shift 1, Shift 2, dan Tab Catatan lengkap dengan live preview format SSOT.

**Tech Stack:** React 18, TypeScript (Strict), Lucide React icons, Vitest, Testing Library, Tailwind CSS / CSS variables tokenized design.

## Global Constraints

- Wajib beroperasi di branch `devmode`.
- Dilarang keras menyentuh atau menimpa kolom formula spreadsheet asli (Strict No-Overwrite Formula Columns).
- Dilarang menggunakan string antarmuka hardcoded; seluruh teks wajib didaftarkan di `src/constants/texts/text_alerts.ts` dan diverifikasi di `texts.test.ts`.
- Prioritas Mobile-First dan kompatibel 2 tema (Light Mode & Dark Mode) via CSS variables.
- Setiap task wajib mengikuti prinsip TDD (failing test -> verify fail -> minimal implementation -> verify pass -> commit).

---

### Task 1: Kamus Teks Sentral & Definisi Opsi BA

**Files:**
- Modify: `src/constants/texts/text_alerts.ts:246-247`
- Test: `src/constants/texts/texts.test.ts`

**Interfaces:**
- Produces: `TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS` (kunci teks untuk label preset, dropdown jenis BA, dan live preview)

- [ ] **Step 1: Write the failing test**

Tambahkan pengujian integritas teks baru di `src/constants/texts/texts.test.ts`:

```typescript
// Tambahkan di dalam describe('Central Text Dictionary Integrity', ...)
it('contains all required text entries for Keterangan Presets & Shift Notes', () => {
  const modalTexts = TEXT_ALERTS.BUS_INPUT_MODAL;
  expect(modalTexts.PRESETS).toBeDefined();
  expect(modalTexts.PRESETS.BTN_BA).toBe('BA');
  expect(modalTexts.PRESETS.BTN_OFF).toBe('OFF');
  expect(modalTexts.PRESETS.BTN_TO_EVDAL).toBe('TO EVDAL');
  expect(modalTexts.PRESETS.BTN_CLEAR).toBe('Normal (SGO)');
  expect(modalTexts.PRESETS.SELECT_BA_DEFAULT).toBe('-- Pilih Jenis BA --');
  expect(modalTexts.PRESETS.BA_TYPES['01']).toContain('01');
  expect(modalTexts.PRESETS.BA_TYPES['02']).toContain('02');
  expect(modalTexts.PRESETS.BA_TYPES['03']).toContain('03');
  expect(modalTexts.PRESETS.BA_TYPES['04']).toContain('04');
  expect(modalTexts.PRESETS.BTN_NP1).toBe('NP1');
  expect(modalTexts.PRESETS.BTN_NP2).toBe('NP2');
  expect(modalTexts.PRESETS.LABEL_SHIFT1_NOTE).toBe('Catatan Shift 1');
  expect(modalTexts.PRESETS.LABEL_SHIFT2_NOTE).toBe('Catatan Shift 2');
  expect(modalTexts.PRESETS.PREVIEW_SSOT_LABEL).toBe('Hasil Format Spreadsheet:');
  expect(modalTexts.PRESETS.APPLY_ALL_SHIFTS).toBe('Terapkan ke Kedua Shift');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/constants/texts/texts.test.ts`
Expected: FAIL dengan pesan property `PRESETS` tidak ditemukan pada `TEXT_ALERTS.BUS_INPUT_MODAL`.

- [ ] **Step 3: Write minimal implementation in text_alerts.ts**

Tambahkan objek `PRESETS` ke dalam `TEXT_ALERTS.BUS_INPUT_MODAL` di `src/constants/texts/text_alerts.ts`:

```typescript
    PRESETS: {
      BTN_BA: "BA",
      BTN_OFF: "OFF",
      BTN_TO_EVDAL: "TO EVDAL",
      BTN_CLEAR: "Normal (SGO)",
      SELECT_BA_DEFAULT: "-- Pilih Jenis BA --",
      BA_TYPES: {
        "01": "01 - Gangguan Kendaraan / Teknis",
        "02": "02 - Kendala Pramudi / Layanan",
        "03": "03 - Gangguan Jalur / Operasional",
        "04": "04 - Lain-lain / Force Majeure",
      },
      BTN_NP1: "NP1",
      BTN_NP2: "NP2",
      LABEL_SHIFT1_NOTE: "Catatan Shift 1",
      LABEL_SHIFT2_NOTE: "Catatan Shift 2",
      PREVIEW_SSOT_LABEL: "Hasil Format Spreadsheet:",
      APPLY_ALL_SHIFTS: "Terapkan ke Kedua Shift",
    },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/constants/texts/texts.test.ts`
Expected: PASS 24 tests.

- [ ] **Step 5: Commit**

```bash
git add src/constants/texts/text_alerts.ts src/constants/texts/texts.test.ts
git commit -m "feat: add central texts for keterangan presets"
```

---

### Task 2: Komponen Reusable `KeteranganPresetBar`

**Files:**
- Create: `src/components/busCard/modal/notes/KeteranganPresetBar.tsx`
- Create: `src/components/busCard/modal/notes/KeteranganPresetBar.test.tsx`

**Interfaces:**
- Consumes:
  - `TEXT_ALERTS` dari `@/constants/texts`
  - `parseKeterangan`, `normalizeKeterangan` dari `@/utils/keteranganUtils`
- Produces:
  ```typescript
  export interface KeteranganPresetBarProps {
    value: string;
    onChange: (newValue: string) => void;
    shiftLabel?: string;
  }
  export const KeteranganPresetBar: React.FC<KeteranganPresetBarProps>;
  ```

- [ ] **Step 1: Write the failing test**

Buat file test `src/components/busCard/modal/notes/KeteranganPresetBar.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { KeteranganPresetBar } from "./KeteranganPresetBar";

describe("KeteranganPresetBar Component", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("renders preset buttons: BA, OFF, TO EVDAL, and Normal", () => {
    act(() => {
      root.render(<KeteranganPresetBar value="" onChange={vi.fn()} />);
    });
    expect(container.textContent).toContain("BA");
    expect(container.textContent).toContain("OFF");
    expect(container.textContent).toContain("TO EVDAL");
    expect(container.textContent).toContain("Normal (SGO)");
  });

  it("activates dropdown Pilih Jenis BA when BA button is clicked", () => {
    const handleChange = vi.fn();
    act(() => {
      root.render(<KeteranganPresetBar value="" onChange={handleChange} />);
    });

    const baBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "BA"
    );
    expect(baBtn).toBeDefined();

    act(() => {
      baBtn!.click();
    });

    // Default onChange dipanggil dengan awalan BA.01
    expect(handleChange).toHaveBeenCalledWith("BA.01 ");
  });

  it("renders dropdown with options 01, 02, 03, 04 when value starts with BA", () => {
    act(() => {
      root.render(<KeteranganPresetBar value="BA.01 Radiator" onChange={vi.fn()} />);
    });

    const select = container.querySelector<HTMLSelectElement>("select");
    expect(select).not.toBeNull();
    expect(select?.value).toBe("01");
    expect(container.textContent).toContain("01 - Gangguan Kendaraan / Teknis");
  });

  it("renders NP1 and NP2 shortcut buttons when BA.02 is active", () => {
    const handleChange = vi.fn();
    act(() => {
      root.render(<KeteranganPresetBar value="BA.02 " onChange={handleChange} />);
    });

    const np1Btn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "NP1"
    );
    expect(np1Btn).toBeDefined();

    act(() => {
      np1Btn!.click();
    });
    expect(handleChange).toHaveBeenCalledWith("BA.02 NP1");
  });

  it("replaces BA prefix without removing the existing custom reason when dropdown changes", () => {
    const handleChange = vi.fn();
    act(() => {
      root.render(<KeteranganPresetBar value="BA.01 Radiator bocor" onChange={handleChange} />);
    });

    const select = container.querySelector<HTMLSelectElement>("select");
    expect(select).not.toBeNull();

    act(() => {
      select!.value = "03";
      select!.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(handleChange).toHaveBeenCalledWith("BA.03 Radiator bocor");
  });

  it("sets value to OFF when OFF button is clicked", () => {
    const handleChange = vi.fn();
    act(() => {
      root.render(<KeteranganPresetBar value="" onChange={handleChange} />);
    });

    const offBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "OFF"
    );
    act(() => {
      offBtn!.click();
    });
    expect(handleChange).toHaveBeenCalledWith("OFF");
  });

  it("clears value to empty string when Normal button is clicked", () => {
    const handleChange = vi.fn();
    act(() => {
      root.render(<KeteranganPresetBar value="BA.01 Mogok" onChange={handleChange} />);
    });

    const clearBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Normal")
    );
    act(() => {
      clearBtn!.click();
    });
    expect(handleChange).toHaveBeenCalledWith("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/busCard/modal/notes/KeteranganPresetBar.test.tsx`
Expected: FAIL karena modul `KeteranganPresetBar` belum ada.

- [ ] **Step 3: Implement KeteranganPresetBar.tsx**

Buat file `src/components/busCard/modal/notes/KeteranganPresetBar.tsx`:

```tsx
import React from "react";
import { TEXT_ALERTS } from "@/constants/texts";
import { parseKeterangan } from "@/utils/keteranganUtils";

export interface KeteranganPresetBarProps {
  value: string;
  onChange: (newValue: string) => void;
  shiftLabel?: string;
}

export const KeteranganPresetBar: React.FC<KeteranganPresetBarProps> = ({
  value,
  onChange,
  shiftLabel,
}) => {
  const parsed = parseKeterangan(value);
  const trimmed = (value || "").trim();

  const isBaActive = Boolean(parsed.prefix && parsed.prefix.startsWith("BA."));
  const currentBaCode = isBaActive && parsed.prefix ? parsed.prefix.replace("BA.", "") : "";
  const isOffActive = trimmed.toUpperCase() === "OFF";
  const isToEvdalActive = trimmed.toUpperCase() === "TO EVDAL";

  const handleToggleBa = () => {
    if (isBaActive) {
      // Toggle off BA: hilangkan prefix BA jika ada alasan, atau kosongkan
      const cleanDetail = parsed.detail.trim();
      onChange(cleanDetail);
    } else {
      // Aktifkan BA dengan default 01
      const detail = trimmed ? ` ${trimmed}` : "";
      onChange(`BA.01${detail}`);
    }
  };

  const handleBaCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    if (!newCode) return;
    const detail = parsed.detail.trim();
    onChange(detail ? `BA.${newCode} ${detail}` : `BA.${newCode} `);
  };

  const handleSelectOff = () => {
    onChange("OFF");
  };

  const handleSelectToEvdal = () => {
    onChange("TO EVDAL");
  };

  const handleClear = () => {
    onChange("");
  };

  const handleSelectNp = (np: "NP1" | "NP2") => {
    onChange(`BA.02 ${np}`);
  };

  const texts = TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "8px" }}>
      {shiftLabel && (
        <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-secondary, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {shiftLabel}
        </span>
      )}

      {/* Baris 1: Preset Buttons Utama */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
        {/* Tombol Preset BA */}
        <button
          type="button"
          onClick={handleToggleBa}
          style={{
            padding: "5px 12px",
            borderRadius: "8px",
            fontSize: "0.78rem",
            fontWeight: 700,
            cursor: "pointer",
            border: isBaActive
              ? "1px solid var(--accent-color, #38bdf8)"
              : "1px solid var(--border-color, rgba(255, 255, 255, 0.15))",
            background: isBaActive
              ? "rgba(56, 189, 248, 0.2)"
              : "rgba(255, 255, 255, 0.05)",
            color: isBaActive
              ? "var(--accent-color, #38bdf8)"
              : "var(--text-primary, #f8fafc)",
            transition: "all 0.15s ease",
          }}
        >
          {texts.BTN_BA}
        </button>

        {/* Tombol Preset OFF */}
        <button
          type="button"
          onClick={handleSelectOff}
          style={{
            padding: "5px 12px",
            borderRadius: "8px",
            fontSize: "0.78rem",
            fontWeight: 700,
            cursor: "pointer",
            border: isOffActive
              ? "1px solid #ef4444"
              : "1px solid var(--border-color, rgba(255, 255, 255, 0.15))",
            background: isOffActive
              ? "rgba(239, 68, 68, 0.2)"
              : "rgba(255, 255, 255, 0.05)",
            color: isOffActive ? "#ef4444" : "var(--text-primary, #f8fafc)",
            transition: "all 0.15s ease",
          }}
        >
          {texts.BTN_OFF}
        </button>

        {/* Tombol Preset TO EVDAL */}
        <button
          type="button"
          onClick={handleSelectToEvdal}
          style={{
            padding: "5px 12px",
            borderRadius: "8px",
            fontSize: "0.78rem",
            fontWeight: 700,
            cursor: "pointer",
            border: isToEvdalActive
              ? "1px solid #f59e0b"
              : "1px solid var(--border-color, rgba(255, 255, 255, 0.15))",
            background: isToEvdalActive
              ? "rgba(245, 158, 11, 0.2)"
              : "rgba(255, 255, 255, 0.05)",
            color: isToEvdalActive ? "#f59e0b" : "var(--text-primary, #f8fafc)",
            transition: "all 0.15s ease",
          }}
        >
          {texts.BTN_TO_EVDAL}
        </button>

        {/* Tombol Reset/Normal SGO */}
        {trimmed !== "" && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: "5px 10px",
              borderRadius: "8px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              border: "1px dashed var(--border-color, rgba(255, 255, 255, 0.2))",
              background: "transparent",
              color: "var(--text-secondary, #94a3b8)",
              transition: "all 0.15s ease",
              marginLeft: "auto",
            }}
          >
            {texts.BTN_CLEAR}
          </button>
        )}
      </div>

      {/* Baris 2: Dropdown Pilih Jenis BA (Hanya muncul jika BA aktif) */}
      {isBaActive && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
          <select
            id="select-ba-type"
            value={currentBaCode}
            onChange={handleBaCodeChange}
            style={{
              flex: "1 1 200px",
              padding: "6px 10px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 600,
              border: "1px solid var(--border-color, rgba(255, 255, 255, 0.2))",
              background: "var(--input-bg, rgba(0, 0, 0, 0.3))",
              color: "var(--text-primary, #f8fafc)",
              outline: "none",
            }}
          >
            <option value="" disabled>
              {texts.SELECT_BA_DEFAULT}
            </option>
            <option value="01">{texts.BA_TYPES["01"]}</option>
            <option value="02">{texts.BA_TYPES["02"]}</option>
            <option value="03">{texts.BA_TYPES["03"]}</option>
            <option value="04">{texts.BA_TYPES["04"]}</option>
          </select>

          {/* Sub-chips cepat NP1 & NP2 jika jenis BA adalah 02 */}
          {currentBaCode === "02" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                onClick={() => handleSelectNp("NP1")}
                style={{
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: parsed.detail.trim() === "NP1"
                    ? "1px solid #10b981"
                    : "1px solid rgba(255, 255, 255, 0.15)",
                  background: parsed.detail.trim() === "NP1"
                    ? "rgba(16, 185, 129, 0.2)"
                    : "rgba(255, 255, 255, 0.05)",
                  color: parsed.detail.trim() === "NP1"
                    ? "#10b981"
                    : "var(--text-primary, #f8fafc)",
                }}
              >
                {texts.BTN_NP1}
              </button>
              <button
                type="button"
                onClick={() => handleSelectNp("NP2")}
                style={{
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: parsed.detail.trim() === "NP2"
                    ? "1px solid #10b981"
                    : "1px solid rgba(255, 255, 255, 0.15)",
                  background: parsed.detail.trim() === "NP2"
                    ? "rgba(16, 185, 129, 0.2)"
                    : "rgba(255, 255, 255, 0.05)",
                  color: parsed.detail.trim() === "NP2"
                    ? "#10b981"
                    : "var(--text-primary, #f8fafc)",
                }}
              >
                {texts.BTN_NP2}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/busCard/modal/notes/KeteranganPresetBar.test.tsx`
Expected: PASS 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/busCard/modal/notes/KeteranganPresetBar.tsx src/components/busCard/modal/notes/KeteranganPresetBar.test.tsx
git commit -m "feat: implement KeteranganPresetBar component"
```

---

### Task 3: State Pemisahan Shift & Payload Builder

**Files:**
- Modify: `src/components/busCard/modal/useBusInputForm.ts:135-145,465-475,520-530`
- Modify: `src/components/busCard/modal/busInputPayload.ts:28-30,53-167`
- Test: `src/components/busCard/modal/busInputPayload.test.ts`
- Test: `src/components/busCard/modal/useBusInputForm.test.tsx`

**Interfaces:**
- Consumes: `splitShiftKeterangan`, `combineShiftKeterangan` dari `@/utils/keteranganUtils`
- Produces:
  - `form.keteranganS1`, `form.setKeteranganS1`
  - `form.keteranganS2`, `form.setKeteranganS2`
  - `buildBusInputPayload({ ..., keteranganS1, keteranganS2 })`

- [ ] **Step 1: Write failing test in busInputPayload.test.ts**

Tambahkan uji untuk pembentukan payload per shift di `src/components/busCard/modal/busInputPayload.test.ts`:

```typescript
it("combines keteranganS1 and keteranganS2 using canonical combineShiftKeterangan", () => {
  const result = buildBusInputPayload({
    ...defaultParams,
    isSingleMode: false,
    keteranganS1: "BA.01 Radiator bocor",
    keteranganS2: "",
  });
  expect(result.keterangan).toBe("BA.01 Radiator bocor | SGO");
});

it("combines identical notes into single note for all-day status", () => {
  const result = buildBusInputPayload({
    ...defaultParams,
    isSingleMode: false,
    keteranganS1: "OFF",
    keteranganS2: "OFF",
  });
  expect(result.keterangan).toBe("OFF");
});

it("combines empty shift notes into empty string", () => {
  const result = buildBusInputPayload({
    ...defaultParams,
    isSingleMode: false,
    keteranganS1: "",
    keteranganS2: "",
  });
  expect(result.keterangan).toBe("");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/busCard/modal/busInputPayload.test.ts`
Expected: FAIL karena parameter `keteranganS1` dan `keteranganS2` belum ditangani.

- [ ] **Step 3: Update busInputPayload.ts and useBusInputForm.ts**

Di `src/components/busCard/modal/busInputPayload.ts`:
1. Tambahkan `keteranganS1?: string;` dan `keteranganS2?: string;` ke `BuildBusInputPayloadParams`.
2. Import `combineShiftKeterangan` dari `@/utils/keteranganUtils`.
3. Dalam fungsi `buildBusInputPayload`:
   ```typescript
   const resolvedKeterangan =
     params.keteranganS1 !== undefined || params.keteranganS2 !== undefined
       ? combineShiftKeterangan(params.keteranganS1, params.keteranganS2)
       : (keterangan || "").trim();
   ```
4. Masukkan `updates.keterangan = resolvedKeterangan;` baik di Single Focus mode maupun All mode.

Di `src/components/busCard/modal/useBusInputForm.ts`:
1. Import `splitShiftKeterangan` dan `combineShiftKeterangan` dari `@/utils/keteranganUtils`.
2. Inisialisasi:
   ```typescript
   const initialNotes = splitShiftKeterangan(bus.keterangan || "");
   const [keteranganS1, setKeteranganS1] = useState(initialNotes.s1);
   const [keteranganS2, setKeteranganS2] = useState(initialNotes.s2);
   ```
3. Sinkronkan `keterangan` (backward compatible) dan teruskan `keteranganS1`, `setKeteranganS1`, `keteranganS2`, `setKeteranganS2` ke return object dan ke `buildBusInputPayload`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/components/busCard/modal/busInputPayload.test.ts`
Run: `pnpm vitest run src/components/busCard/modal/useBusInputForm.test.tsx`
Expected: PASS seluruh tes.

- [ ] **Step 5: Commit**

```bash
git add src/components/busCard/modal/busInputPayload.ts src/components/busCard/modal/useBusInputForm.ts src/components/busCard/modal/busInputPayload.test.ts
git commit -m "feat: split shift notes in form and payload builder"
```

---

### Task 4: Integrasi Form Shift 1 & Shift 2 dengan KeteranganPresetBar

**Files:**
- Modify: `src/components/busCard/modal/BusInputModalShift1.tsx:414-456`
- Modify: `src/components/busCard/modal/BusInputModalShift2.tsx`
- Test: `src/components/busCard/BusInputModal.test.tsx`

**Interfaces:**
- Consumes: `KeteranganPresetBar`, `keteranganS1`, `setKeteranganS1`, `keteranganS2`, `setKeteranganS2`

- [x] **Step 1: Write test for Shift 1 & Shift 2 preset in BusInputModal.test.tsx**

Tambahkan uji di `src/components/busCard/BusInputModal.test.tsx`:

```typescript
it("renders KeteranganPresetBar inside collapsible notes of Shift 1", async () => {
  renderModal({
    bus: createMockBus({ keterangan: "" }),
    initialTab: "shift1",
  });

  // Buka chip Catatan
  const chipCatatan = Array.from(document.body.querySelectorAll("button")).find(
    (b) => b.textContent?.includes("Catatan")
  );
  expect(chipCatatan).toBeDefined();
  act(() => {
    chipCatatan!.click();
  });

  // Memastikan tombol preset BA tampil di dalam collapsible Shift 1
  const baBtn = Array.from(document.body.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === "BA"
  );
  expect(baBtn).not.toBeNull();
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/busCard/BusInputModal.test.tsx`
Expected: FAIL karena `KeteranganPresetBar` belum di-mount di collapsible Shift 1.

- [x] **Step 3: Update BusInputModalShift1.tsx and BusInputModalShift2.tsx**

1. Import `KeteranganPresetBar` di `BusInputModalShift1.tsx`:
   Gantikan area textarea collapsible agar menggunakan `keteranganS1` dan menyertakan `KeteranganPresetBar`:
   ```tsx
   {showKeterangan && (
     <div style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))" }}>
       <KeteranganPresetBar
         value={keteranganS1}
         onChange={setKeteranganS1}
         shiftLabel={TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS.LABEL_SHIFT1_NOTE}
       />
       <textarea
         id="input-shift1-keterangan"
         rows={2}
         value={keteranganS1}
         onChange={(e) => setKeteranganS1(e.target.value)}
         onFocus={handleInputFocus}
         placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.NOTES_DETAIL_PLACEHOLDER}
         style={{ ... }}
       />
     </div>
   )}
   ```
2. Lakukan hal yang sama pada `BusInputModalShift2.tsx` dengan menggunakan `keteranganS2` dan `setKeteranganS2`.

- [x] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/components/busCard/BusInputModal.test.tsx`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/components/busCard/modal/BusInputModalShift1.tsx src/components/busCard/modal/BusInputModalShift2.tsx src/components/busCard/BusInputModal.test.tsx
git commit -m "feat: embed KeteranganPresetBar in Shift 1 & 2 forms"
```

---

### Task 5: Integrasi Tab Catatan Penuh (`BusInputModalNotes`) & Single Focus (`SingleFocusNotes`)

**Files:**
- Modify: `src/components/busCard/modal/BusInputModalNotes.tsx`
- Modify: `src/components/busCard/modal/singleFocus/SingleFocusNotes.tsx`
- Test: `src/components/busCard/BusInputModal.test.tsx`

**Interfaces:**
- Consumes:
  - `keteranganS1`, `setKeteranganS1`, `keteranganS2`, `setKeteranganS2`
  - `combineShiftKeterangan` dari `@/utils/keteranganUtils`
  - `KeteranganPresetBar`
- Produces: UI Tab Catatan interaktif dengan Segmented Tab Shift 1 / Shift 2, opsi terapkan ke kedua shift, dan SSOT live preview badge.

- [ ] **Step 1: Write test for Tab Catatan per shift & live preview**

Tambahkan uji di `src/components/busCard/BusInputModal.test.tsx`:

```typescript
it("renders segmented shift selector and live SSOT preview in Tab Catatan", async () => {
  renderModal({
    bus: createMockBus({ keterangan: "BA.01 Ban bocor | SGO" }),
    initialTab: "notes",
  });

  // Cek keberadaan preview SSOT
  expect(document.body.textContent).toContain(
    TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS.PREVIEW_SSOT_LABEL
  );
  expect(document.body.textContent).toContain("BA.01 Ban bocor | SGO");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/busCard/BusInputModal.test.tsx`
Expected: FAIL karena preview SSOT dan segmented tab belum ada di `BusInputModalNotes.tsx`.

- [ ] **Step 3: Implement BusInputModalNotes.tsx & SingleFocusNotes.tsx**

Di `src/components/busCard/modal/BusInputModalNotes.tsx`:
1. Sediakan Segmented Tab lokal: `[🔵 Shift 1]` dan `[🟣 Shift 2]`.
2. Sediakan toggle checkbox: *"Terapkan ke Kedua Shift"* (jika aktif, perubahan di shift yang sedang diedit otomatis menyamakan shift lainnya).
3. Render `KeteranganPresetBar` untuk shift yang sedang aktif.
4. Render `textarea` terhubung ke `keteranganS1` atau `keteranganS2`.
5. Render Live Preview Box di bagian bawah yang menghitung `combineShiftKeterangan(keteranganS1, keteranganS2)`.

Di `src/components/busCard/modal/singleFocus/SingleFocusNotes.tsx`:
1. Hubungkan ke shift yang relevan (`keteranganS1` jika shift 1, `keteranganS2` jika shift 2).
2. Pasang `KeteranganPresetBar`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/components/busCard/BusInputModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/busCard/modal/BusInputModalNotes.tsx src/components/busCard/modal/singleFocus/SingleFocusNotes.tsx src/components/busCard/BusInputModal.test.tsx
git commit -m "feat: complete Tab Catatan with segmented shifts and preview"
```

---

### Task 6: Verifikasi Penuh & Quality Gates

**Files:**
- Seluruh modul terkait di `src/`

- [ ] **Step 1: Run complete vitest test suite**

Run: `pnpm vitest run src/`
Expected: 100% PASS (0 failing tests).

- [ ] **Step 2: Run TypeScript strict check and production build**

Run: `pnpm run build`
Expected: Vite build success (0 errors).

- [ ] **Step 3: Update knowledge graph**

Run: `graphify update .`
Expected: Graph updated cleanly.

- [ ] **Step 4: Final commit (if any leftover docs/formatting)**

```bash
git status
# Pastikan clean working tree di branch devmode
```
