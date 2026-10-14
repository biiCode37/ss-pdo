# Monthly Master Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun fitur "Tarik Data 1 Bulan Sekaligus" (*Monthly Master Ingestion*) yang mampu membaca seluruh data 18 rute dari Spreadsheet Rekap Master (seperti sheet `OKTOBER 2026`) dalam 1 kali panggilan HTTP cepat, menyaring tanggal masa depan & baris tanpa operasi, melindungi data aplikasi (*smart skip*), dan menyimpan secara massal (*bulk upsert*) ke database Supabase `daily_route_reports`.

**Architecture:** Layanan modular `monthlyMasterIngestionService.ts` mengekstrak data CSV dari endpoint Google Sheets gviz, mengelompokkan baris per blok tanggal, memvalidasi aktivitas rute, dan menyimpannya ke Supabase. Di antarmuka, `MonitoringHeader.tsx` merutekan tombol sinkronisasi secara pintar: jika periode Harian menjalankan sinkronisasi harian, sedangkan periode Mingguan/Bulanan/Kustom membuka `MonthlySyncModal.tsx`.

**Tech Stack:** React, TypeScript, Vitest, Lucide React, Supabase Client, Vanilla CSS / CSS Variables.

## Global Constraints

- Wajib bekerja di branch `devmode`.
- Aturan Emas Anti Hardcoded UI Strings: Seluruh teks antarmuka, label, dan pesan wajib berada di `src/constants/texts/text_monitoring.ts`.
- Terminologi Domain: 1 Ritase = Pulang-Pergi (PP) = 2 Trip = $\frac{\text{Total KM}}{\text{km\_baku}}$. Dilarang memasukkan trip 1 arah mentah sebagai ritase.
- Proteksi Kolom Berumus: Dilarang menimpa formula SSOT.
- Zero Secret Exposure: Dilarang menyimpan credentials di spreadsheet.
- Mobile-First Priority dengan animasi iOS `cubic-bezier(0.32, 0.72, 0, 1)`.

---

### Task 1: Kamus Teks Sentral Monitoring (`text_monitoring.ts`)

**Files:**
- Modify: `src/constants/texts/text_monitoring.ts`
- Modify: `src/constants/texts/texts.test.ts`

**Interfaces:**
- Produces: `TEXT_MONITORING.MONTHLY_SYNC` namespace containing all labels, tooltips, validation strings, range info, and toast formatters.

- [ ] **Step 1: Write failing test in `texts.test.ts`**

Tambahkan pengujian untuk memastikan keberadaan namespace `TEXT_MONITORING.MONTHLY_SYNC` beserta fungsi-fungsinya:

```typescript
    expect(TEXT_MONITORING.MONTHLY_SYNC).toBeDefined();
    expect(TEXT_MONITORING.MONTHLY_SYNC.TITLE).toBe("Tarik Data 1 Bulan Sekaligus");
    expect(typeof TEXT_MONITORING.MONTHLY_SYNC.RANGE_INFO).toBe("function");
    expect(TEXT_MONITORING.MONTHLY_SYNC.RANGE_INFO(1, 14, "Oktober", 2026)).toContain("1 s.d. 14 Oktober 2026");
    expect(typeof TEXT_MONITORING.MONTHLY_SYNC.SUCCESS_SUMMARY).toBe("function");
    expect(TEXT_MONITORING.MONTHLY_SYNC.SUCCESS_SUMMARY(180, 5)).toContain("180");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/constants/texts/texts.test.ts`
Expected: FAIL with `Cannot read properties of undefined (reading 'TITLE')`.

- [ ] **Step 3: Implement minimal code in `text_monitoring.ts`**

Tambahkan `MONTHLY_SYNC` ke dalam objek `TEXT_MONITORING`:

```typescript
  MONTHLY_SYNC: {
    TITLE: "Tarik Data 1 Bulan Sekaligus",
    DESC: "Tarik otomatis seluruh riwayat operasional 18 rute dari Spreadsheet Rekap Master ke database Supabase.",
    LABEL_URL: "Link Spreadsheet Rekap Master Wilayah",
    PLACEHOLDER_URL: "https://docs.google.com/spreadsheets/d/...",
    LABEL_TAB: "Nama Lembar (Tab Bulan)",
    PLACEHOLDER_TAB: "Contoh: OKTOBER 2026",
    BTN_START: "Mulai Sinkronisasi",
    BTN_CANCEL: "Batal",
    RANGE_INFO: (start: number, end: number, monthName: string, year: number) =>
      `Menyinkronkan Tanggal ${start} s.d. ${end} ${monthName} ${year} (18 Rute)`,
    STATUS_FETCHING: "Mengunduh data spreadsheet master...",
    STATUS_PARSING: "Menganalisis baris data 18 rute...",
    STATUS_SAVING: (processed: number, total: number) =>
      `Menyimpan data ke database (${processed}/${total})...`,
    SUCCESS_TITLE: "Sinkronisasi Bulanan Selesai",
    SUCCESS_SUMMARY: (saved: number, skipped: number) =>
      `${saved} laporan rute berhasil diperbarui, ${skipped} dilewati (sudah diisi di aplikasi).`,
    ERR_INVALID_URL: "Link spreadsheet tidak valid atau kosong.",
    ERR_INVALID_TAB: "Nama lembar bulan wajib diisi.",
    TOOLTIP_MONTHLY: "Tarik Data 1 Bulan Sekaligus dari Master Sheet",
    BUTTON_LABEL_MONTHLY: "Tarik Data 1 Bulan",
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/constants/texts/texts.test.ts`
Expected: PASS 100%.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/constants/texts/text_monitoring.ts src/constants/texts/texts.test.ts
git commit -m "feat: text constants for monthly master sync"
```

---

### Task 2: Service Layer `monthlyMasterIngestionService.ts`

**Files:**
- Create: `src/services/monthlyMasterIngestionService.ts`
- Create: `src/services/monthlyMasterIngestionService.test.ts`

**Interfaces:**
- Consumes:
  - `supabase` from `src/services/supabase.ts`
  - `fetchRouteMasterList` from `src/services/dailyRouteReportService.ts`
  - `parseIndonesianNumber` from `src/utils/numberUtils.ts`
  - `extractSpreadsheetId` from `src/utils/sheetUtils.ts` (atau utilitas ekstraksi URL sheet)
- Produces:
  ```typescript
  export interface MonthlyMasterIngestionProgress {
    percent: number;
    stepMessage: string;
    currentDay?: number;
    processedRecords: number;
    totalRecords: number;
  }

  export interface MonthlyMasterIngestionResult {
    success: boolean;
    savedCount: number;
    skippedCount: number;
    errors: string[];
  }

  export async function ingestMonthlyMasterSheet(
    spreadsheetUrlOrId: string,
    sheetTabName: string,
    targetYear: number,
    targetMonth: number, // 1 - 12
    onProgress?: (progress: MonthlyMasterIngestionProgress) => void,
    nowDateOverride?: Date // untuk kemudahan testing tanggal batas
  ): Promise<MonthlyMasterIngestionResult>;
  ```

- [ ] **Step 1: Write failing tests in `monthlyMasterIngestionService.test.ts`**

Uji skenario:
1. Menolak jika URL spreadsheet tidak valid.
2. Mem-parse blok CSV tanggal dan hanya memproses sampai tanggal hari ini jika target adalah bulan berjalan.
3. Melewati baris dengan `realops === 0 && total_km === 0`.
4. Melewati rute yang sudah berstatus `submitted` / `verified` di Supabase.
5. Menyimpan data dengan benar via `supabase.from('daily_route_reports').upsert(...)`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/services/monthlyMasterIngestionService.test.ts`
Expected: FAIL with `Cannot find module './monthlyMasterIngestionService'`.

- [ ] **Step 3: Implement `monthlyMasterIngestionService.ts`**

Implementasikan parser CSV murni:
- Ekstraksi `spreadsheetId`.
- Fetch data CSV via `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetTabName)}`.
- Ekstraksi blok per tanggal (`Kamis, 01 Oktober 2026`).
- Tentukan batas hari: `isCurrentMonth = (targetYear === nowYear && targetMonth === nowMonth) ? nowDay : daysInMonth`.
- Query tabel `daily_route_reports` untuk bulan bersangkutan guna memetakan status yang sudah `submitted`/`verified` (Smart Skip).
- Hitung ritase PP: `km_baku > 0 ? (totalKm / km_baku) : (ritaseCol || 0)`.
- Siapkan batch payload dan lakukan `.upsert(payload, { onConflict: 'route_id,date' })`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/services/monthlyMasterIngestionService.test.ts`
Expected: PASS 100%.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/services/monthlyMasterIngestionService.ts src/services/monthlyMasterIngestionService.test.ts
git commit -m "feat: monthly master ingestion service"
```

---

### Task 3: Komponen Modal `MonthlySyncModal.tsx`

**Files:**
- Create: `src/components/monitoring/MonthlySyncModal.tsx`
- Create: `src/components/monitoring/MonthlySyncModal.test.tsx`

**Interfaces:**
- Consumes:
  - `TEXT_MONITORING.MONTHLY_SYNC` from `src/constants/texts`
  - `ingestMonthlyMasterSheet` from `src/services/monthlyMasterIngestionService`
- Props:
  ```typescript
  export interface MonthlySyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (saved: number, skipped: number) => void;
    currentYear: number;
    currentMonth: number; // 1-12
    monthName: string;
  }
  ```

- [ ] **Step 1: Write failing test in `MonthlySyncModal.test.tsx`**

Uji skenario:
1. Tidak merender apapun jika `isOpen={false}`.
2. Merender input URL spreadsheet (mengambil dari `localStorage` jika ada) dan input tab sheet (default `${monthName.toUpperCase()} ${currentYear}`).
3. Memvalidasi jika URL kosong saat klik tombol konfirmasi.
4. Menjalankan `ingestMonthlyMasterSheet` dan menampilkan animasi progres.
5. Memanggil `onSuccess` setelah selesai.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/monitoring/MonthlySyncModal.test.tsx`
Expected: FAIL with `Cannot find module './MonthlySyncModal'`.

- [ ] **Step 3: Implement `MonthlySyncModal.tsx`**

Implementasikan komponen modal dengan:
- CSS Variables & glassmorphism theme (`var(--modal-bg)`, `var(--card-border)`).
- Input controlled untuk URL dan Sheet Tab.
- Penyimpanan URL ke `localStorage.setItem('ss_pdo_master_sheet_url', url)`.
- Indikator progres bar dengan persentase dan teks status.
- Penanganan error ramah pengguna (SweetAlert / Alert UI non-teknis).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/monitoring/MonthlySyncModal.test.tsx`
Expected: PASS 100%.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/components/monitoring/MonthlySyncModal.tsx src/components/monitoring/MonthlySyncModal.test.tsx
git commit -m "feat: MonthlySyncModal component"
```

---

### Task 4: Integrasi Pemicu Pintar di `MonitoringHeader.tsx`

**Files:**
- Modify: `src/components/monitoring/MonitoringHeader.tsx`
- Modify: `src/components/monitoring/MonitoringHeader.test.tsx`

**Interfaces:**
- Consumes:
  - `currentPeriod` prop
  - `onOpenMonthlySyncModal?: () => void` prop
  - `TEXT_MONITORING.MONTHLY_SYNC` text constants

- [ ] **Step 1: Write failing test in `MonitoringHeader.test.tsx`**

Tambahkan pengujian:
1. Saat `currentPeriod?.mode === 'daily'`, klik tombol CloudDownload memanggil `onSync18Routes`.
2. Saat `currentPeriod?.mode === 'monthly'` atau `'weekly'`, klik tombol CloudDownload memanggil `onOpenMonthlySyncModal` dan title tombol menampilkan teks bulanan.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/monitoring/MonitoringHeader.test.tsx`
Expected: FAIL with assertion error.

- [ ] **Step 3: Implement routing di `MonitoringHeader.tsx`**

Perbarui prop dan perilaku tombol:
```typescript
export interface MonitoringHeaderProps {
  // ...props lama...
  onOpenMonthlySyncModal?: () => void;
}
```
Pada tombol `<CloudDownload>`:
```typescript
const isDaily = !currentPeriod || currentPeriod.mode === "daily";
const handleSyncClick = () => {
  if (isDaily) {
    onSync18Routes?.();
  } else {
    onOpenMonthlySyncModal?.();
  }
};
const syncTitle = isDaily
  ? TEXT_MONITORING.INGESTION.TOOLTIP
  : TEXT_MONITORING.MONTHLY_SYNC.TOOLTIP_MONTHLY;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/monitoring/MonitoringHeader.test.tsx`
Expected: PASS 100%.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/components/monitoring/MonitoringHeader.tsx src/components/monitoring/MonitoringHeader.test.tsx
git commit -m "feat: smart sync button trigger in MonitoringHeader"
```

---

### Task 5: Integrasi Halaman di `AllRouteMonitoringPage.tsx`

**Files:**
- Modify: `src/components/monitoring/AllRouteMonitoringPage.tsx`
- Modify: `src/components/monitoring/AllRouteMonitoringPage.test.tsx`

**Interfaces:**
- State: `showMonthlySyncModal: boolean`
- Handler: `handleMonthlySyncSuccess(saved: number, skipped: number)`

- [ ] **Step 1: Write failing test in `AllRouteMonitoringPage.test.tsx`**

Tambahkan pengujian:
1. Membuka modal sinkronisasi bulanan saat tombol sync diklik pada mode periode bulanan.
2. Memuat ulang data (`loadData`) dan memunculkan toast sukses setelah `handleMonthlySyncSuccess` dipanggil.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/monitoring/AllRouteMonitoringPage.test.tsx`
Expected: FAIL with assertion error.

- [ ] **Step 3: Implement state & modal wiring di `AllRouteMonitoringPage.tsx`**

Tambahkan state dan render `<MonthlySyncModal>`:
```tsx
const [showMonthlySyncModal, setShowMonthlySyncModal] = useState(false);

const handleMonthlySyncSuccess = async (saved: number, skipped: number) => {
  showSuccessToast(TEXT_MONITORING.MONTHLY_SYNC.SUCCESS_SUMMARY(saved, skipped));
  await loadData(true);
};
```
Sambungkan prop `onOpenMonthlySyncModal={() => setShowMonthlySyncModal(true)}` ke `MonitoringHeader`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/monitoring/AllRouteMonitoringPage.test.tsx`
Expected: PASS 100%.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/components/monitoring/AllRouteMonitoringPage.tsx src/components/monitoring/AllRouteMonitoringPage.test.tsx
git commit -m "feat: integrate MonthlySyncModal into AllRouteMonitoringPage"
```

---

### Task 6: Quality Gates & Verifikasi Menyeluruh

**Files:**
- Seluruh repository

- [ ] **Step 1: Jalankan seluruh rangkaian test Vitest**

Run: `pnpm vitest run src/`
Expected: 100% lulus tanpa kegagalan.

- [ ] **Step 2: Jalankan TypeScript Strict Mode & Production Build**

Run: `pnpm run build`
Expected: Lulus tanpa error kompilasi (`0 errors`).

- [ ] **Step 3: Perbarui Graf Pengetahuan Knowledge Graph**

Run: `graphify update .`
Expected: Berhasil memperbarui AST graph.

- [ ] **Step 4: Commit akhir verifikasi (jika ada file metadata)**

Run:
```bash
git add .
git commit -m "chore: update knowledge graph and verify quality gates"
```
