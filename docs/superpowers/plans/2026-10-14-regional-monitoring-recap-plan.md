# Implementasi Fitur Rekap Korwil & Rekap Fleksibel (Harian/Mingguan/Bulanan/Kustom)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun fitur Rekap Korwil (Subtotal 3 Pengawas) dan Pemilih Periode Fleksibel (Harian, Mingguan, Bulanan, Kustom) pada modul Monitoring Wilayah 18 Rute SS_PDO untuk menggantikan fungsi Master Spreadsheet selamanya.

**Architecture:** Menerapkan state periode terpadu di `AllRouteMonitoringPage` yang menyinkronkan seluruh tab (Dashboard, Rute, Rekap Korwil, Laporan WA). Di backend, `allRouteMonitoringService` memperluas query rentang tanggal `.gte('date', start).lte('date', end)` dan menghitung subtotal metrik 3 Korwil (`SupervisorTeamSummary`). Di frontend, bilah navigasi bawah diperluas menjadi 5 tab (menambah tab `korwil`), dan header dilengkapi kapsul pemilih periode iOS style.

**Tech Stack:** React 19, TypeScript (Strict Mode), Vite, Supabase Client, Lucide React, Vitest, CSS Variables (Light & Dark Theme).

## Global Constraints

- Wajib bekerja di branch `devmode`.
- Dilarang hardcode string antarmuka di komponen UI (`.tsx`); seluruh teks antarmuka WAJIB berada di `src/constants/texts/`.
- 1 Ritase = 1 Putaran Penuh (PP) = 2 Trip = `Total KM / km_baku`. Dilarang membagi trip tanpa normalisasi PP.
- Gunakan `parseIndonesianNumber` dari `utils/numberUtils.ts` untuk parsing angka format Indonesia.
- Mobile-first priority dengan kurva animasi iOS: `cubic-bezier(0.32, 0.72, 0, 1)`.
- Wajib mendukung Light Mode & Dark Mode.
- Sebelum menyatakan selesai, wajib lulus 100%: `pnpm vitest run src/`, `pnpm run build`, dan `graphify update .`.

---

### Task 1: Kamus Teks Sentral Monitoring (`src/constants/texts/`)

**Files:**
- Modify: `src/constants/texts/text_monitoring.ts`
- Modify: `src/constants/texts/texts.test.ts`

**Interfaces:**
- Produces: `TEXT_MONITORING.PERIOD`, `TEXT_MONITORING.KORWIL_TAB`, `TEXT_MONITORING.NAV.KORWIL`

- [ ] **Step 1: Tulis unit test kamus teks baru**
Tambahkan pengujian di `src/constants/texts/texts.test.ts` untuk memastikan properti kamus periode dan korwil tersedia.

- [ ] **Step 2: Jalankan test untuk memastikan test gagal (merah)**
Run: `pnpm vitest run src/constants/texts/texts.test.ts`
Expected: FAIL karena properti baru belum didefinisikan.

- [ ] **Step 3: Tambahkan definisi teks di `text_monitoring.ts`**
Daftarkan teks untuk label navigasi, label periode (`Harian`, `Mingguan`, `Bulanan`, `Kustom`), kartu korwil, subtotal tim, dan pesan status.

- [ ] **Step 4: Jalankan test kembali untuk memastikan lulus (hijau)**
Run: `pnpm vitest run src/constants/texts/texts.test.ts`
Expected: PASS 100%.

- [ ] **Step 5: Commit**
```bash
git add src/constants/texts/text_monitoring.ts src/constants/texts/texts.test.ts
git commit -m "feat: kamus teks rekap korwil dan periode"
```

---

### Task 2: Service Layer & Kalkulasi Subtotal Korwil (`allRouteMonitoringService.ts`)

**Files:**
- Modify: `src/services/allRouteMonitoringService.ts`
- Modify: `src/services/allRouteMonitoringService.test.ts`

**Interfaces:**
- Produces:
  - `type MonitoringPeriodMode = 'daily' | 'weekly' | 'monthly' | 'custom'`
  - `interface MonitoringPeriodFilter { mode: MonitoringPeriodMode; date: string; startDate: string; endDate: string; label: string; }`
  - `interface SupervisorTeamSummary`
  - `function calculateSupervisorSummaries(routes: RegionalRouteItem[]): SupervisorTeamSummary[]`
  - `function fetchRegionalPeriodMonitoringData(startDate: string, endDate: string): Promise<RegionalMonitoringResult>`

- [ ] **Step 1: Tulis unit test untuk `calculateSupervisorSummaries` dan `fetchRegionalPeriodMonitoringData`**
Buat pengujian di `allRouteMonitoringService.test.ts` untuk memverifikasi kalkulasi subtotal tim Ranto, Abdul, dan Moamar serta agregasi rentang tanggal.

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**
Run: `pnpm vitest run src/services/allRouteMonitoringService.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasikan logika di `allRouteMonitoringService.ts`**
  - Definisikan tipe `MonitoringPeriodMode`, `MonitoringPeriodFilter`, dan `SupervisorTeamSummary`.
  - Buat fungsi `calculateSupervisorSummaries` yang mengelompokkan 18 rute ke dalam 3 tim korlap dan mengakumulasi metriknya.
  - Buat fungsi `fetchRegionalPeriodMonitoringData` dengan query Supabase rentang tanggal.

- [ ] **Step 4: Jalankan test untuk memastikan lulus**
Run: `pnpm vitest run src/services/allRouteMonitoringService.test.ts`
Expected: PASS 100%.

- [ ] **Step 5: Commit**
```bash
git add src/services/allRouteMonitoringService.ts src/services/allRouteMonitoringService.test.ts
git commit -m "feat: service rekap korwil dan multi-periode"
```

---

### Task 3: Komponen Pemilih Periode (`MonitoringPeriodSelector.tsx` & `MonitoringHeader.tsx`)

**Files:**
- Create: `src/components/monitoring/MonitoringPeriodSelector.tsx`
- Create: `src/components/monitoring/MonitoringPeriodSelector.test.tsx`
- Modify: `src/components/monitoring/MonitoringHeader.tsx`
- Modify: `src/components/monitoring/MonitoringHeader.test.tsx`

**Interfaces:**
- Consumes: `MonitoringPeriodFilter`, `TEXT_MONITORING.PERIOD`
- Produces: `MonitoringPeriodSelector` component dengan 4 opsi kapsul (`Harian`, `Mingguan`, `Bulanan`, `Kustom`) dan modal rentang tanggal.

- [ ] **Step 1: Tulis unit test untuk `MonitoringPeriodSelector`**
- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**
- [ ] **Step 3: Implementasikan `MonitoringPeriodSelector.tsx` dan integrasikan ke `MonitoringHeader.tsx`**
- [ ] **Step 4: Jalankan test untuk memastikan lulus**
Run: `pnpm vitest run src/components/monitoring/MonitoringPeriodSelector.test.tsx src/components/monitoring/MonitoringHeader.test.tsx`
Expected: PASS 100%.

- [ ] **Step 5: Commit**
```bash
git add src/components/monitoring/MonitoringPeriodSelector.tsx src/components/monitoring/MonitoringPeriodSelector.test.tsx src/components/monitoring/MonitoringHeader.tsx src/components/monitoring/MonitoringHeader.test.tsx
git commit -m "feat: komponen period selector di header"
```

---

### Task 4: Bilah Navigasi Bawah 5 Tab (`MonitoringBottomNav.tsx`)

**Files:**
- Modify: `src/components/monitoring/MonitoringBottomNav.tsx`
- Modify: `src/components/monitoring/MonitoringBottomNav.test.tsx`

**Interfaces:**
- Produces: `MonitoringTab = "dashboard" | "routes" | "fleet_status" | "wa_report" | "korwil"`

- [ ] **Step 1: Perbarui test di `MonitoringBottomNav.test.tsx` untuk menyertakan tab `korwil`**
- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**
- [ ] **Step 3: Tambahkan item `korwil` dengan ikon `Users` ke `NAV_ITEMS` di `MonitoringBottomNav.tsx`**
- [ ] **Step 4: Jalankan test untuk memastikan lulus**
Run: `pnpm vitest run src/components/monitoring/MonitoringBottomNav.test.tsx`
Expected: PASS 100%.

- [ ] **Step 5: Commit**
```bash
git add src/components/monitoring/MonitoringBottomNav.tsx src/components/monitoring/MonitoringBottomNav.test.tsx
git commit -m "feat: tab rekap korwil di bottom nav"
```

---

### Task 5: Komponen Tab Rekap Korwil (`MonitoringKorwilTab.tsx`)

**Files:**
- Create: `src/components/monitoring/tabs/MonitoringKorwilTab.tsx`
- Create: `src/components/monitoring/tabs/MonitoringKorwilTab.test.tsx`

**Interfaces:**
- Consumes: `RegionalMonitoringResult`, `SupervisorTeamSummary`, `TEXT_MONITORING.KORWIL_TAB`
- Produces: Antarmuka mobile-first menampilkan 3 Kartu Tim Korwil (Ranto, Abdul, Moamar) dengan accordion 6 rute anak dan kartu Rangkuman Total 18 Rute.

- [ ] **Step 1: Tulis unit test untuk `MonitoringKorwilTab`**
- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**
- [ ] **Step 3: Implementasikan `MonitoringKorwilTab.tsx`**
  - Desain kartu dengan visualisasi modern, progress bar capaian target tim, subtotal KM, Penumpang, Ritase PP.
  - Accordion interaktif untuk membuka/menutup rincian 6 rute tim.
- [ ] **Step 4: Jalankan test untuk memastikan lulus**
Run: `pnpm vitest run src/components/monitoring/tabs/MonitoringKorwilTab.test.tsx`
Expected: PASS 100%.

- [ ] **Step 5: Commit**
```bash
git add src/components/monitoring/tabs/MonitoringKorwilTab.tsx src/components/monitoring/tabs/MonitoringKorwilTab.test.tsx
git commit -m "feat: komponen tab rekap korwil"
```

---

### Task 6: Integrasi Penuh Halaman & Sinkronisasi Lintas Tab (`AllRouteMonitoringPage.tsx`)

**Files:**
- Modify: `src/components/monitoring/AllRouteMonitoringPage.tsx`
- Modify: `src/components/monitoring/AllRouteMonitoringPage.test.tsx`

**Interfaces:**
- Menghubungkan state `currentPeriod` ke `MonitoringHeader`, router tab `activeTab === 'korwil'`, serta me-reload data ketika periode berganti.

- [ ] **Step 1: Perbarui test integrasi di `AllRouteMonitoringPage.test.tsx`**
- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**
- [ ] **Step 3: Terapkan integrasi state periode dan tab korwil di `AllRouteMonitoringPage.tsx`**
- [ ] **Step 4: Jalankan test integrasi untuk memastikan lulus**
Run: `pnpm vitest run src/components/monitoring/AllRouteMonitoringPage.test.tsx`
Expected: PASS 100%.

- [ ] **Step 5: Commit**
```bash
git add src/components/monitoring/AllRouteMonitoringPage.tsx src/components/monitoring/AllRouteMonitoringPage.test.tsx
git commit -m "feat: integrasi tab korwil dan periode di monitoring"
```

---

### Task 7: Quality Gates Otomatis & Verifikasi Akhir

**Files:**
- Seluruh file proyek

- [ ] **Step 1: Jalankan seluruh suite unit test**
Run: `pnpm vitest run src/`
Expected: 100% PASS, 0 fail.

- [ ] **Step 2: Jalankan build TypeScript strict mode**
Run: `pnpm run build`
Expected: Build sukses 0 error.

- [ ] **Step 3: Perbarui graf pengetahuan Graphify**
Run: `graphify update .`
Expected: Graphify update sukses.
