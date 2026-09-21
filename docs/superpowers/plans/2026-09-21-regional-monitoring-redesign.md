# Redesign Halaman Monitoring Wilayah 18 Rute Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merombak total antarmuka halaman Monitoring Wilayah 18 Rute dengan arsitektur Bottom Navigation independen (Dashboard, Rute, Status Armada, Laporan WA), navigasi keluar/masuk via Menu Profil, visualisasi modern mobile-first, bulk verify, dan standarisasi teks laporan WA.

**Architecture:** Memecah `AllRouteMonitoringPage` monolitik menjadi 4 tab view modular yang dikendalikan oleh `MonitoringBottomNav`. State tanggal dan data wilayah dikelola di tingkat atas dan didistribusikan ke tab melalui props. Teks antarmuka sepenuhnya terpusat di kamus `text_monitoring.ts` dan `text_wa_report.ts`.

**Tech Stack:** React 19, TypeScript (Strict Mode), Tailwind CSS / Vanilla CSS Variables, Lucide React Icons, Vitest, SweetAlert2.

## Global Constraints

- Wajib bekerja di branch `devmode`. Dilarang menyentuh branch main/master.
- Prioritas tata letak Mobile-First dan mendukung 2 tema: Light Mode & Dark Mode.
- Dilarang keras menuliskan hardcoded UI strings; seluruh teks wajib ada di `src/constants/texts/`.
- Hak akses terbatas hanya untuk role: `korlap`, `korwil`, `admin`, dan `superadmin`.
- Single Source of Truth (SSOT): Data status armada membaca dari `daily_fleet_shifts` dan data monitoring membaca dari agregat laporan spreadsheet global.

---

### Task 1: Kamus Teks Sentral (`text_monitoring.ts` & `text_wa_report.ts`)

**Files:**
- Modify: `src/constants/texts/text_monitoring.ts`
- Modify: `src/constants/texts/text_wa_report.ts`
- Modify: `src/constants/texts/texts.test.ts`

**Interfaces:**
- Produces: `TEXT_MONITORING.NAV`, `TEXT_MONITORING.DASHBOARD`, `TEXT_MONITORING.FLEET_TAB`, `TEXT_MONITORING.BULK_VERIFY`, `TEXT_WA_REPORT.FORMAT_LABELS`

- [ ] **Step 1: Tulis unit test kamus teks baru di `texts.test.ts`**

```ts
// src/constants/texts/texts.test.ts
it('contains all required keys for regional monitoring redesign', () => {
  expect(TEXT_MONITORING.NAV.DASHBOARD).toBeDefined();
  expect(TEXT_MONITORING.NAV.ROUTES).toBeDefined();
  expect(TEXT_MONITORING.NAV.FLEET_STATUS).toBeDefined();
  expect(TEXT_MONITORING.NAV.WA_REPORT).toBeDefined();
  expect(TEXT_MONITORING.BULK_VERIFY.BUTTON_LABEL).toBeDefined();
  expect(TEXT_MONITORING.DASHBOARD.CHART_TITLE).toBeDefined();
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Perintah: `pnpm vitest run src/constants/texts/texts.test.ts`
Ekspektasi: FAIL karena token teks belum didefinisikan.

- [ ] **Step 3: Tambahkan token teks di `text_monitoring.ts` dan `text_wa_report.ts`**

Daftarkan teks bottom nav, header, KPI makro, status armada tab, dan bulk verify.

- [ ] **Step 4: Jalankan test dan pastikan lulus 100%**

Perintah: `pnpm vitest run src/constants/texts/texts.test.ts`
Ekspektasi: PASS 100%.

- [ ] **Step 5: Commit**

```bash
git add src/constants/texts/text_monitoring.ts src/constants/texts/text_wa_report.ts src/constants/texts/texts.test.ts
git commit -m "feat(texts): add regional monitoring redesign dictionary tokens"
```

---

### Task 2: Integrasi Pintu Navigasi di Menu Profil

**Files:**
- Modify: `src/components/profileMenu/ProfileFeaturesSection.tsx`
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/components/profileMenu/ProfileFeaturesSection.test.tsx`

**Interfaces:**
- Consumes: `currentUserRole: string`, `isInMonitoringView?: boolean`, `onToggleMonitoringView: () => void`
- Produces: Tombol transisi cerdas ("Monitoring Wilayah" vs "Kembali ke Rute Individu")

- [ ] **Step 1: Tulis unit test untuk toggle navigasi di Menu Profil**

Uji bahwa tombol menampilkan teks "Monitoring Wilayah" saat di dashboard rute, dan "Kembali ke Rute Individu" saat `isInMonitoringView = true`.

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Perintah: `pnpm vitest run src/components/profileMenu/ProfileFeaturesSection.test.tsx`

- [ ] **Step 3: Implementasikan logika perpindahan tampilan di `ProfileFeaturesSection.tsx` dan `Dashboard.tsx`**

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**

Perintah: `pnpm vitest run src/components/profileMenu/`

- [ ] **Step 5: Commit**

```bash
git add src/components/profileMenu/ src/components/Dashboard.tsx
git commit -m "feat(nav): toggle monitoring view via profile menu"
```

---

### Task 3: Komponen Bottom Navigation Independen (`MonitoringBottomNav.tsx`)

**Files:**
- Create: `src/components/monitoring/MonitoringBottomNav.tsx`
- Create: `src/components/monitoring/MonitoringBottomNav.test.tsx`

**Interfaces:**
- Consumes: `activeTab: 'dashboard' | 'routes' | 'fleet_status' | 'wa_report'`, `onSelectTab: (tab) => void`
- Produces: Bottom navigation bar `64px`, 4 touch target tab (≥48px), indikator aktif pill emerald.

- [ ] **Step 1: Tulis unit test `MonitoringBottomNav.test.tsx`**

Uji rendering 4 tab, klik tab memicu `onSelectTab`, dan atribut `aria-selected` sesuai tab aktif.

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Perintah: `pnpm vitest run src/components/monitoring/MonitoringBottomNav.test.tsx`

- [ ] **Step 3: Buat implementasi `MonitoringBottomNav.tsx`**

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**

Perintah: `pnpm vitest run src/components/monitoring/MonitoringBottomNav.test.tsx`
Ekspektasi: PASS 100%.

- [ ] **Step 5: Commit**

```bash
git add src/components/monitoring/MonitoringBottomNav.tsx src/components/monitoring/MonitoringBottomNav.test.tsx
git commit -m "feat(monitoring): create independent bottom navigation component"
```

---

### Task 4: Tab 1 — Dashboard View (`MonitoringDashboardTab.tsx`)

**Files:**
- Create: `src/components/monitoring/tabs/MonitoringDashboardTab.tsx`
- Create: `src/components/monitoring/tabs/MonitoringToaBarChart.tsx`
- Create: `src/components/monitoring/tabs/MonitoringMacroKpiGrid.tsx`
- Create: `src/components/monitoring/tabs/MonitoringShiftSplitBar.tsx`
- Create: `src/components/monitoring/tabs/MonitoringLeaderboard.tsx`
- Create: `src/components/monitoring/tabs/MonitoringDashboardTab.test.tsx`

**Interfaces:**
- Consumes: `data: RegionalMonitoringResult`, `confirmedRoutesCount: number`, `totalRoutesCount: number`
- Produces: Tampilan dashboard makro lengkap (Progress bar PDO confirmed, Grafik 18 batang TOA, 4 Hero KPI Cards, Shift Split Bar, Top 3 & Bottom 3 Leaderboard).

- [ ] **Step 1: Tulis unit test `MonitoringDashboardTab.test.tsx`**

Uji render progress bar, chart SVG/bar container, 4 kartu KPI, dan leaderboard rute tertinggi/terendah.

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Perintah: `pnpm vitest run src/components/monitoring/tabs/MonitoringDashboardTab.test.tsx`

- [ ] **Step 3: Implementasikan `MonitoringDashboardTab.tsx` dan subkomponennya**

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**

Perintah: `pnpm vitest run src/components/monitoring/tabs/MonitoringDashboardTab.test.tsx`
Ekspektasi: PASS 100%.

- [ ] **Step 5: Commit**

```bash
git add src/components/monitoring/tabs/
git commit -m "feat(monitoring): build tab 1 executive dashboard view"
```

---

### Task 5: Tab 2 — Rute View dengan Bulk Verify (`MonitoringRoutesTab.tsx`)

**Files:**
- Create: `src/components/monitoring/tabs/MonitoringRoutesTab.tsx`
- Create: `src/components/monitoring/tabs/MonitoringRouteCardModern.tsx`
- Create: `src/components/monitoring/tabs/MonitoringRoutesTab.test.tsx`

**Interfaces:**
- Consumes: `routes: RegionalRouteItem[]`, `onVerifyRoute: (routeId, status) => void`, `onBulkVerify: () => Promise<void>`, `onSelectRoute: (code) => void`
- Produces: Tampilan daftar 18 rute modern card view dengan filter pencarian, filter status chips, filter Korlap, dan tombol Bulk Verify.

- [ ] **Step 1: Tulis unit test `MonitoringRoutesTab.test.tsx`**

Uji pencarian rute, filter status, klik kartu untuk membuka rute, verifikasi satuan, dan pemicu tombol Bulk Verify.

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Perintah: `pnpm vitest run src/components/monitoring/tabs/MonitoringRoutesTab.test.tsx`

- [ ] **Step 3: Implementasikan `MonitoringRoutesTab.tsx` dan `MonitoringRouteCardModern.tsx`**

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**

Perintah: `pnpm vitest run src/components/monitoring/tabs/MonitoringRoutesTab.test.tsx`
Ekspektasi: PASS 100%.

- [ ] **Step 5: Commit**

```bash
git add src/components/monitoring/tabs/MonitoringRoutesTab.tsx src/components/monitoring/tabs/MonitoringRouteCardModern.tsx src/components/monitoring/tabs/MonitoringRoutesTab.test.tsx
git commit -m "feat(monitoring): build tab 2 routes view with bulk verify"
```

---

### Task 6: Tab 3 — Status Armada Non-SGO Grouped by Route (`MonitoringFleetStatusTab.tsx`)

**Files:**
- Create: `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx`
- Create: `src/components/monitoring/tabs/MonitoringFleetStatusTab.test.tsx`

**Interfaces:**
- Consumes: `selectedDate: string`, `fleetShifts: DailyFleetShiftWithUnits[]`
- Produces: Tampilan unit non-SGO yang dikelompokkan per rute (hanya rute berkendala), filter shift (S1/S2/Semua), filter tipe status (TO/OFF/SO), dan empty state 100% SGO.

- [ ] **Step 1: Tulis unit test `MonitoringFleetStatusTab.test.tsx`**

Uji pengelompokan per rute, penyembunyian rute yang 100% SGO, filter shift, dan visualisasi empty state saat tidak ada kendala.

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Perintah: `pnpm vitest run src/components/monitoring/tabs/MonitoringFleetStatusTab.test.tsx`

- [ ] **Step 3: Implementasikan `MonitoringFleetStatusTab.tsx`**

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**

Perintah: `pnpm vitest run src/components/monitoring/tabs/MonitoringFleetStatusTab.test.tsx`
Ekspektasi: PASS 100%.

- [ ] **Step 5: Commit**

```bash
git add src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx src/components/monitoring/tabs/MonitoringFleetStatusTab.test.tsx
git commit -m "feat(monitoring): build tab 3 fleet status grouped by route"
```

---

### Task 7: Tab 4 — Laporan WA Studio & Redesain Format Teks

**Files:**
- Modify: `src/utils/waReportGenerator.ts`
- Modify: `src/utils/waReportGenerator.test.ts`
- Create: `src/components/monitoring/tabs/MonitoringWaReportTab.tsx`
- Create: `src/components/monitoring/tabs/MonitoringWaReportTab.test.tsx`

**Interfaces:**
- Consumes: `data: RegionalMonitoringResult`, `selectedDate: string`
- Produces: Generator 3 format WA modern yang padat tanpa wrapping terpotong, live monospace preview, tombol salin dan kirim WA.

- [ ] **Step 1: Tulis unit test `waReportGenerator.test.ts` untuk format teks baru**

Uji bahwa teks yang dihasilkan untuk Format 1, 2, dan 3 mematuhi struktur baru (header resmi, summary makro di awal, perataan konsisten).

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Perintah: `pnpm vitest run src/utils/waReportGenerator.test.ts`

- [ ] **Step 3: Perbarui fungsi generator di `waReportGenerator.ts` dan bangun `MonitoringWaReportTab.tsx`**

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**

Perintah: `pnpm vitest run src/utils/waReportGenerator.test.ts src/components/monitoring/tabs/MonitoringWaReportTab.test.tsx`
Ekspektasi: PASS 100%.

- [ ] **Step 5: Commit**

```bash
git add src/utils/waReportGenerator.ts src/utils/waReportGenerator.test.ts src/components/monitoring/tabs/MonitoringWaReportTab.tsx src/components/monitoring/tabs/MonitoringWaReportTab.test.tsx
git commit -m "feat(monitoring): build tab 4 wa report studio and polish message formats"
```

---

### Task 8: Integrasi Orkestrator `AllRouteMonitoringPage.tsx` & Quality Gates

**Files:**
- Modify: `src/components/monitoring/AllRouteMonitoringPage.tsx`
- Modify: `src/components/monitoring/MonitoringHeader.tsx`
- Modify: `src/components/monitoring/AllRouteMonitoringPage.test.tsx`

**Interfaces:**
- Menggabungkan `MonitoringHeader` (ringkas tanpa tombol kembali) + Active Tab View (Dashboard / Rute / Status Armada / Laporan WA) + `MonitoringBottomNav`.

- [ ] **Step 1: Perbarui `MonitoringHeader.tsx` untuk menghapus tombol kembali fisik**

- [ ] **Step 2: Hubungkan active tab state di `AllRouteMonitoringPage.tsx` dengan Bottom Nav**

- [ ] **Step 3: Jalankan seluruh suite test Vitest**

Perintah: `pnpm vitest run src/`
Ekspektasi: 100% lulus tanpa kegagalan.

- [ ] **Step 4: Jalankan build produksi TypeScript & Vite**

Perintah: `pnpm run build`
Ekspektasi: `tsc -b && vite build` selesai 0 error.

- [ ] **Step 5: Perbarui Knowledge Graph**

Perintah: `graphify update .`

- [ ] **Step 6: Commit**

```bash
git add src/components/monitoring/
git commit -m "feat(monitoring): integrate bottom nav and tabs orchestrator"
```
