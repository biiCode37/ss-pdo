# Redesign Kartu Rute & Modal Detail 21 Metrik SS Global Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menampilkan metrik prioritas operasional harian pada kartu rute di Tab Rute Monitoring Wilayah dan menghadirkan modal dialog interaktif (iOS Bottom Sheet) yang menampilkan 21 metrik operasional SS Global terstruktur dalam 3 tab segmen saat kartu di-tap.

**Architecture:** Memperbarui `MonitoringRouteCardModern.tsx` menjadi 3 baris terstruktur yang kompak dengan trigger `onCardClick` dan `stopPropagation` pada tombol verifikasi; membuat komponen baru `MonitoringRouteDetailModal.tsx` dengan segmented tabs dan sticky footer action bar; mengintegrasikan state modal di `MonitoringRoutesTab.tsx`; serta menstandarkan seluruh label ke kamus sentral `text_monitoring.ts`.

**Tech Stack:** React 19, TypeScript (Strict Mode), Vanilla CSS variables / Tailwind, Lucide React, Vitest, Happy-DOM.

## Global Constraints

- Wajib bekerja di branch `devmode`. Dilarang menyentuh branch main/master.
- Prioritas Mobile-First dan mendukung 2 tema: Light Mode & Dark Mode.
- Dilarang keras menuliskan hardcoded UI strings; seluruh teks antarmuka wajib merujuk ke `src/constants/texts/text_monitoring.ts`.
- Standar terminologi domain: 1 Ritase = 1 Putaran Penuh (PP) = 2 Trip. `km_baku` = KM per 1 ritase PP.
- Seluruh parsing angka spreadsheet wajib menggunakan `parseIndonesianNumber()`.
- Quality gates: Vitest passing 100%, `pnpm run build` sukses 0 error, dan `graphify update .`.

---

### Task 1: Kamus Teks Sentral (`text_monitoring.ts` & `texts.test.ts`)

**Files:**
- Modify: `src/constants/texts/text_monitoring.ts`
- Modify: `src/constants/texts/texts.test.ts`

**Interfaces:**
- Produces: `TEXT_MONITORING.ROUTE_CARD`, `TEXT_MONITORING.ROUTE_DETAIL_MODAL`

- [ ] **Step 1: Tulis unit test untuk token teks baru di `texts.test.ts`**

Tambahkan pengujian integritas kamus pada `src/constants/texts/texts.test.ts`:
```typescript
it("contains all required keys for route card redesign and 21-metric detail modal", () => {
  // ROUTE_CARD
  expect(TEXT_MONITORING.ROUTE_CARD.LBL_CORE_FLEET).toBe("Armada");
  expect(TEXT_MONITORING.ROUTE_CARD.LBL_CORE_PASSENGERS).toBe("Pelanggan");
  expect(TEXT_MONITORING.ROUTE_CARD.LBL_CORE_KM).toBe("KM Tempuh");
  expect(TEXT_MONITORING.ROUTE_CARD.RENOPS_PREFIX).toBe("Ren:");
  expect(TEXT_MONITORING.ROUTE_CARD.REALOPS_PREFIX).toBe("Real:");
  expect(TEXT_MONITORING.ROUTE_CARD.PAX_TOTAL_PREFIX).toBe("Total:");
  expect(TEXT_MONITORING.ROUTE_CARD.PAX_TOA_PREFIX).toBe("TOA:");
  expect(TEXT_MONITORING.ROUTE_CARD.PAX_MANUAL_PREFIX).toBe("Man:");
  expect(TEXT_MONITORING.ROUTE_CARD.KM_PER_BUS_PREFIX).toBe("KM/Bus:");
  expect(TEXT_MONITORING.ROUTE_CARD.PCT_PAX_PREFIX).toBe("Cap:");
  expect(TEXT_MONITORING.ROUTE_CARD.PAX_YESTERDAY_PREFIX).toBe("H-1:");
  expect(TEXT_MONITORING.ROUTE_CARD.PAX_LAST_WEEK_PREFIX).toBe("H-7:");
  expect(TEXT_MONITORING.ROUTE_CARD.ARIA_CARD_CLICK("JAK.01")).toContain("JAK.01");

  // ROUTE_DETAIL_MODAL
  expect(TEXT_MONITORING.ROUTE_DETAIL_MODAL.TITLE("JAK.01")).toContain("JAK.01");
  expect(TEXT_MONITORING.ROUTE_DETAIL_MODAL.SUBTITLE("Rute A", "Korlap B")).toContain("Rute A");
  expect(TEXT_MONITORING.ROUTE_DETAIL_MODAL.TABS.OPERASIONAL).toBe("Operasional");
  expect(TEXT_MONITORING.ROUTE_DETAIL_MODAL.TABS.SHIFT).toBe("Pelanggan & Shift");
  expect(TEXT_MONITORING.ROUTE_DETAIL_MODAL.TABS.PRODUKTIVITAS).toBe("Produktivitas & Rit");
  expect(TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.RENOPS).toBe("Rencana Operasi (Renops)");
  expect(TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.REALOPS).toBe("Realisasi Operasi (Realops)");
  expect(TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.TOTAL_PELANGGAN).toBe("Total Pelanggan");
  expect(TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.TOTAL_RITASE_PP).toBe("Total Ritase (PP)");
  expect(TEXT_MONITORING.ROUTE_DETAIL_MODAL.ACTIONS.BTN_OPEN_SHEET).toBe("Buka Lembar Kerja Rute");
  expect(TEXT_MONITORING.ROUTE_DETAIL_MODAL.ACTIONS.BTN_VERIFY).toBe("Verifikasi Rute");
  expect(TEXT_MONITORING.ROUTE_DETAIL_MODAL.ACTIONS.BTN_CLOSE).toBe("Tutup");
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Perintah: `pnpm vitest run src/constants/texts/texts.test.ts`  
Ekspektasi: FAIL karena token teks belum didefinisikan.

- [ ] **Step 3: Tambahkan token teks di `src/constants/texts/text_monitoring.ts`**

Tambahkan `LBL_CORE_FLEET`, `RENOPS_PREFIX`, dll. ke `ROUTE_CARD` dan buat namespace baru `ROUTE_DETAIL_MODAL` berisi `TITLE`, `SUBTITLE`, `TABS`, `METRICS` (seluruh 21 metrik), dan `ACTIONS`.

- [ ] **Step 4: Jalankan test dan pastikan lulus 100%**

Perintah: `pnpm vitest run src/constants/texts/texts.test.ts`  
Ekspektasi: PASS 100%.

- [ ] **Step 5: Commit**

```bash
git add src/constants/texts/text_monitoring.ts src/constants/texts/texts.test.ts
git commit -m "feat(texts): add route card and detail modal dictionary tokens"
```

---

### Task 2: Komponen Modal Detail 21 Metrik (`MonitoringRouteDetailModal.tsx`)

**Files:**
- Create: `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`
- Create: `src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx`

**Interfaces:**
- Produces: `MonitoringRouteDetailModal(props: MonitoringRouteDetailModalProps)`
- Consumes: `RegionalRouteItem`, `TEXT_MONITORING.ROUTE_DETAIL_MODAL`, `TEXT_MONITORING.PROVENANCE`

- [ ] **Step 1: Tulis unit test untuk `MonitoringRouteDetailModal` di `MonitoringRouteDetailModal.test.tsx`**

```typescript
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { MonitoringRouteDetailModal } from "@/components/monitoring/modals/MonitoringRouteDetailModal";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockRoute: RegionalRouteItem = {
  id: 1,
  reportId: 101,
  routeCode: "JAK.01",
  routeName: "Tanjung Priok - Plumpang",
  operatorName: "Mayasari Bakti",
  isLooping: false,
  kmBaku: 18,
  targetHk: 2000,
  bestRecord: 2500,
  supervisorName: "Ranto Lumban Toruan",
  defaultRenops: 10,
  renopsShift1: 10,
  realopsShift1: 10,
  renopsShift2: 10,
  realopsShift2: 9,
  totalRenops: 10,
  totalRealops: 10,
  headwayFastest: 3,
  headwaySlowest: 8,
  trafficJamSpots: [],
  operationalIssues: "",
  status: "submitted",
  todayPassengers: 2150,
  yesterdayPassengers: 2000,
  lastWeekPassengers: 1950,
  totalKm: 1800,
  achievementKm: 180,
  totalTrips: 100,
  toaShift1: 1200,
  manualShift1: 50,
  totalShift1: 1250,
  toaShift2: 850,
  manualShift2: 50,
  totalShift2: 900,
  targetPax: 2000,
  paxPercentage: 107.5,
  kmPerBus: 180,
  paxPerKm: 1.19,
  ritasePerBus: 10,
  paxPerBus: 215,
  targetPaxPerKm: 1.11,
  paxPerKmPercentage: 107.2,
};

describe("MonitoringRouteDetailModal", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    container.remove();
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", async () => {
    await act(async () => {
      root.render(
        <MonitoringRouteDetailModal
          route={mockRoute}
          isOpen={false}
          onClose={vi.fn()}
        />
      );
    });
    expect(container.innerHTML).toBe("");
  });

  it("renders route title, status, and tab Operasional by default", async () => {
    await act(async () => {
      root.render(
        <MonitoringRouteDetailModal
          route={mockRoute}
          isOpen={true}
          onClose={vi.fn()}
          onSelectRoute={vi.fn()}
          onVerifyRoute={vi.fn()}
        />
      );
    });

    expect(container.textContent).toContain("Detail Operasional Rute JAK.01");
    expect(container.textContent).toContain("Ranto Lumban Toruan");
    expect(container.textContent).toContain("Operasional");
    expect(container.textContent).toContain("1.800"); // Total KM Tempuh
  });

  it("switches to Pelanggan & Shift and Produktivitas & Rit tabs on click", async () => {
    await act(async () => {
      root.render(
        <MonitoringRouteDetailModal
          route={mockRoute}
          isOpen={true}
          onClose={vi.fn()}
        />
      );
    });

    const shiftTabBtn = container.querySelector<HTMLButtonElement>('[data-testid="tab-shift"]');
    expect(shiftTabBtn).toBeTruthy();

    await act(async () => {
      shiftTabBtn?.click();
    });

    expect(container.textContent).toContain("Rincian Shift 1 (Pagi)");
    expect(container.textContent).toContain("1.200"); // TOA S1

    const ritaseTabBtn = container.querySelector<HTMLButtonElement>('[data-testid="tab-produktivitas"]');
    expect(ritaseTabBtn).toBeTruthy();

    await act(async () => {
      ritaseTabBtn?.click();
    });

    expect(container.textContent).toContain("Total Ritase (PP)");
  });

  it("triggers onSelectRoute and onVerifyRoute from modal actions", async () => {
    const onSelectRoute = vi.fn();
    const onVerifyRoute = vi.fn();
    const onClose = vi.fn();

    await act(async () => {
      root.render(
        <MonitoringRouteDetailModal
          route={mockRoute}
          isOpen={true}
          onClose={onClose}
          onSelectRoute={onSelectRoute}
          onVerifyRoute={onVerifyRoute}
        />
      );
    });

    const openSheetBtn = container.querySelector<HTMLButtonElement>('[data-testid="modal-btn-open-sheet"]');
    expect(openSheetBtn).toBeTruthy();
    act(() => { openSheetBtn?.click(); });
    expect(onSelectRoute).toHaveBeenCalledWith("JAK.01");

    const verifyBtn = container.querySelector<HTMLButtonElement>('[data-testid="modal-btn-verify"]');
    expect(verifyBtn).toBeTruthy();
    act(() => { verifyBtn?.click(); });
    expect(onVerifyRoute).toHaveBeenCalledWith(1, "verified");

    const closeBtn = container.querySelector<HTMLButtonElement>('[data-testid="modal-btn-close"]');
    expect(closeBtn).toBeTruthy();
    act(() => { closeBtn?.click(); });
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Perintah: `pnpm vitest run src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx`  
Ekspektasi: FAIL karena komponen belum dibuat.

- [ ] **Step 3: Buat implementasi `MonitoringRouteDetailModal.tsx`**

Buat file `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`:
- Render backdrop blur `backdrop-filter: blur(8px)`.
- Modal bottom sheet container beranimasi `cubic-bezier(0.32, 0.72, 0, 1)`.
- Drag handle bar di bagian atas.
- Header dengan badge rute, operator, korlap, status badge, dan close button.
- Segmented tabs: `Operasional`, `Pelanggan & Shift`, `Produktivitas & Rit`.
- 21 metrik ditampilkan rapi dengan kartu nilai berlatar lembut dan label dari `TEXT_MONITORING.ROUTE_DETAIL_MODAL`.
- Sticky footer action bar: Tombol `Buka Lembar Kerja Rute`, Tombol `Verifikasi Rute` (jika status `submitted`), Tombol `Tutup`.

- [ ] **Step 4: Jalankan test dan pastikan lulus 100%**

Perintah: `pnpm vitest run src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx`  
Ekspektasi: PASS 100%.

- [ ] **Step 5: Commit**

```bash
git add src/components/monitoring/modals/MonitoringRouteDetailModal.tsx src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx
git commit -m "feat(monitoring): add 21-metric route detail modal"
```

---

### Task 3: Refactor Kartu Rute Modern (`MonitoringRouteCardModern.tsx`)

**Files:**
- Modify: `src/components/monitoring/tabs/MonitoringRouteCardModern.tsx`
- Create: `src/components/monitoring/tabs/MonitoringRouteCardModern.test.tsx`

**Interfaces:**
- Produces: `MonitoringRouteCardModern(props: MonitoringRouteCardModernProps)` dengan `onCardClick`
- Consumes: `RegionalRouteItem`, `TEXT_MONITORING.ROUTE_CARD`

- [ ] **Step 1: Tulis unit test untuk `MonitoringRouteCardModern` di `MonitoringRouteCardModern.test.tsx`**

```typescript
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { MonitoringRouteCardModern } from "@/components/monitoring/tabs/MonitoringRouteCardModern";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockRoute: RegionalRouteItem = {
  id: 1,
  reportId: 101,
  routeCode: "JAK.01",
  routeName: "Tanjung Priok - Plumpang",
  operatorName: "Mayasari Bakti",
  isLooping: false,
  kmBaku: 18,
  targetHk: 2000,
  bestRecord: 2500,
  supervisorName: "Ranto Lumban Toruan",
  defaultRenops: 10,
  renopsShift1: 10,
  realopsShift1: 10,
  renopsShift2: 10,
  realopsShift2: 9,
  totalRenops: 10,
  totalRealops: 10,
  headwayFastest: 3,
  headwaySlowest: 8,
  trafficJamSpots: [],
  operationalIssues: "",
  status: "submitted",
  todayPassengers: 2150,
  yesterdayPassengers: 2000,
  lastWeekPassengers: 1950,
  totalKm: 1800,
  achievementKm: 180,
  totalTrips: 100,
  toaShift1: 1200,
  manualShift1: 50,
  totalShift1: 1250,
  toaShift2: 850,
  manualShift2: 50,
  totalShift2: 900,
  targetPax: 2000,
  paxPercentage: 107.5,
  kmPerBus: 180,
  paxPerKm: 1.19,
  ritasePerBus: 10,
  paxPerBus: 215,
};

describe("MonitoringRouteCardModern", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    container.remove();
    vi.clearAllMocks();
  });

  it("renders priority metrics: Renops, Realops, Total Pelanggan, TOA, Manual, KM/Bus, %, H-1, H-7", async () => {
    await act(async () => {
      root.render(<MonitoringRouteCardModern route={mockRoute} />);
    });

    expect(container.textContent).toContain("JAK.01");
    expect(container.textContent).toContain("10/10"); // Realops / Renops
    expect(container.textContent).toContain("2.150"); // Total Pelanggan
    expect(container.textContent).toContain("TOA: 2.050"); // TOA
    expect(container.textContent).toContain("Man: 100"); // Manual
    expect(container.textContent).toContain("180"); // KM/Bus
    expect(container.textContent).toContain("107.5%"); // Capaian
    expect(container.textContent).toContain("H-1: 2.000"); // Kemarin
    expect(container.textContent).toContain("H-7: 1.950"); // Minggu Lalu
  });

  it("triggers onCardClick when the card is clicked", async () => {
    const onCardClick = vi.fn();
    await act(async () => {
      root.render(<MonitoringRouteCardModern route={mockRoute} onCardClick={onCardClick} />);
    });

    const card = container.querySelector<HTMLDivElement>('[data-testid="route-card-JAK.01"]');
    expect(card).toBeTruthy();

    act(() => { card?.click(); });
    expect(onCardClick).toHaveBeenCalledWith(mockRoute);
  });

  it("triggers onVerify without triggering onCardClick (stopPropagation)", async () => {
    const onCardClick = vi.fn();
    const onVerify = vi.fn();

    await act(async () => {
      root.render(
        <MonitoringRouteCardModern
          route={mockRoute}
          onCardClick={onCardClick}
          onVerify={onVerify}
        />
      );
    });

    const verifyBtn = container.querySelector<HTMLButtonElement>('[data-testid="verify-btn-JAK.01"]');
    expect(verifyBtn).toBeTruthy();

    act(() => { verifyBtn?.click(); });
    expect(onVerify).toHaveBeenCalledWith(1, "verified");
    expect(onCardClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Perintah: `pnpm vitest run src/components/monitoring/tabs/MonitoringRouteCardModern.test.tsx`  
Ekspektasi: FAIL karena `MonitoringRouteCardModern` belum mendukung `onCardClick` dan format metrik baru.

- [ ] **Step 3: Refactor `MonitoringRouteCardModern.tsx`**

Perbarui `MonitoringRouteCardModern.tsx`:
- Tambahkan prop `onCardClick?: (route: RegionalRouteItem) => void`.
- Berikan atribut `data-testid={`route-card-${route.routeCode}`}` dan `onClick={() => onCardClick?.(route)}` dengan kursor pointer dan hover highlight.
- Format 3 Baris:
  1. Header: Kode rute, operator, korlap, provenance badge, status badge.
  2. 3 Kolom Core Metrics:
     - Armada: `Realops/Renops` & `S1: X • S2: Y`.
     - Pelanggan: `Total Pelanggan` & `TOA: X • Man: Y`.
     - Efisiensi: `KM/Bus` & `Cap: XX.X%`.
  3. Baris 3: Secondary Chips:
     - `H-1: X` & `H-7: Y`.
     - Ikon Chevron tipis sebagai petunjuk sentuh.
     - Tombol Verifikasi dengan `e.stopPropagation()`.
- Hapus tombol "Buka Rute" dari kartu karena sudah dipindahkan ke dalam Modal Detail.

- [ ] **Step 4: Jalankan test dan pastikan lulus 100%**

Perintah: `pnpm vitest run src/components/monitoring/tabs/MonitoringRouteCardModern.test.tsx`  
Ekspektasi: PASS 100%.

- [ ] **Step 5: Commit**

```bash
git add src/components/monitoring/tabs/MonitoringRouteCardModern.tsx src/components/monitoring/tabs/MonitoringRouteCardModern.test.tsx
git commit -m "feat(monitoring): redesign route card with priority metrics"
```

---

### Task 4: Integrasi State Modal di Tab Rute (`MonitoringRoutesTab.tsx`)

**Files:**
- Modify: `src/components/monitoring/tabs/MonitoringRoutesTab.tsx`
- Modify: `src/components/monitoring/tabs/MonitoringRoutesTab.test.tsx`

**Interfaces:**
- Consumes: `MonitoringRouteCardModern`, `MonitoringRouteDetailModal`

- [ ] **Step 1: Perbarui unit test `MonitoringRoutesTab.test.tsx`**

Perbarui test pada `MonitoringRoutesTab.test.tsx`:
- Uji bahwa mengklik kartu rute memunculkan modal `MonitoringRouteDetailModal`.
- Uji bahwa mengklik "Buka Lembar Kerja Rute" di dalam modal detail memanggil `onSelectRoute`.

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Perintah: `pnpm vitest run src/components/monitoring/tabs/MonitoringRoutesTab.test.tsx`  
Ekspektasi: FAIL sebelum integrasi state modal.

- [ ] **Step 3: Hubungkan state modal di `MonitoringRoutesTab.tsx`**

Di `MonitoringRoutesTab.tsx`:
- Impor `MonitoringRouteDetailModal` dari `@/components/monitoring/modals/MonitoringRouteDetailModal`.
- Tambahkan state: `const [selectedRouteForModal, setSelectedRouteForModal] = useState<RegionalRouteItem | null>(null);`
- Operkan `onCardClick={(route) => setSelectedRouteForModal(route)}` ke setiap kartu `MonitoringRouteCardModern`.
- Render komponen `<MonitoringRouteDetailModal ... />` di akhir container tab.
- Pastikan saat `selectedRouteForModal` terisi, modal muncul dan saat ditutup (`onClose`), state di-set kembali ke `null`.

- [ ] **Step 4: Jalankan test dan pastikan lulus 100%**

Perintah: `pnpm vitest run src/components/monitoring/tabs/MonitoringRoutesTab.test.tsx`  
Ekspektasi: PASS 100%.

- [ ] **Step 5: Commit**

```bash
git add src/components/monitoring/tabs/MonitoringRoutesTab.tsx src/components/monitoring/tabs/MonitoringRoutesTab.test.tsx
git commit -m "feat(monitoring): integrate route detail modal in routes tab"
```

---

### Task 5: Quality Gates, Regresi, & Knowledge Graph Update

**Files:**
- None (Verifikasi menyeluruh)

- [ ] **Step 1: Jalankan seluruh pengujian unit Vitest**

Perintah: `pnpm vitest run src/`  
Ekspektasi: Seluruh pengujian (monitoring, modal, dashboard, kamus) lulus 100%.

- [ ] **Step 2: Jalankan TypeScript compiler check dan Vite build**

Perintah: `pnpm run build`  
Ekspektasi: Build sukses 0 error (`tsc -b && vite build`).

- [ ] **Step 3: Perbarui graf pengetahuan Graphify**

Perintah: `graphify update .`  
Ekspektasi: Knowledge graph terbarukan secara otomatis.

- [ ] **Step 4: Commit perubahan akhir jika ada**

```bash
git status
# Jika ada file sisa/update
git commit -m "chore(monitoring): pass all quality gates for route card & modal"
```
