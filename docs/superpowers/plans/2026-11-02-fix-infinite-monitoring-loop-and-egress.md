# Eliminasi Infinite Loop Monitoring & Mitigasi Kuota Egress Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memutus siklus perulangan request tak terbatas (*infinite loop*) pada halaman Monitoring Wilayah (`AllRouteMonitoringPage.tsx`) dan meredam cascading event realtime dengan debounce, sehingga menghentikan kebocoran kuota API Gateway (618.000+ request) dan Egress (12.1 GB) ke Supabase.

**Architecture:** 
1. Mengubah ketergantungan reaktif fungsi `loadData` pada `AllRouteMonitoringPage.tsx` dengan memanfaatkan `dataRef` (`useRef(data)`) dan *in-flight guard* (`isFetchingRef`), membebaskan `useCallback` dari state `data` yang memicu re-creation loop.
2. Memasang *debounce timer* (3.000 ms) pada listener Supabase Realtime (`postgres_changes` tabel `daily_route_reports`) untuk meredam pemanggilan berulang saat terjadi batch editing spreadsheet di lapangan.
3. Mendokumentasikan siklus perbaikan ke `refactor-ss-pdo/refact_193/` (`AUDIT_BUGS.md` dan `REPAIR_REPORT.md`) dan memverifikasi seluruh Quality Gates.

**Tech Stack:** React 19, TypeScript Strict Mode, Vitest, Happy-DOM, Supabase JS Client, Tailwind CSS.

## Global Constraints

- Wajib bekerja secara eksklusif di branch `devmode`.
- Dilarang keras *hardcoded hex/rgb*; gunakan token semantik dari `src/styles/tokens/semantic.css`.
- Dilarang keras *hardcoded UI string*; seluruh teks antarmuka wajib melalui `src/constants/texts/`.
- Sesuai prinsip *Single Source of Truth (SSOT)*, dilarang merusak rumus spreadsheet asli atau mengubah payload mutasi ke kolom berumus.
- Wajib lulus seluruh Quality Gates sebelum penyelesaian:
  1. `pnpm vitest run src/styles/tokens/color-contract.test.ts`
  2. `pnpm vitest run src/`
  3. `pnpm run build`
  4. `graphify update .`

---

### Task 1: Eliminasi Infinite Re-render Loop & In-Flight Guard di `AllRouteMonitoringPage.tsx`

**Files:**
- Modify: `src/components/monitoring/AllRouteMonitoringPage.tsx:135-195`
- Test: `src/components/monitoring/AllRouteMonitoringPage.test.tsx`

**Interfaces:**
- Consumes: `RegionalMonitoringResult`, `fetchRegionalMonitoringData`, `fetchDailyFleetShiftsByDate`.
- Produces: `loadData` yang stabil tanpa re-creation loop, `dataRef` untuk pembacaan status skeleton hening, dan `isFetchingRef` untuk mencegah overlapping request.

- [ ] **Step 1: Tulis unit test untuk membuktikan kestabilan referensi `loadData`**
  Tambahkan pengujian di `src/components/monitoring/AllRouteMonitoringPage.test.tsx` yang memverifikasi bahwa `fetchRegionalMonitoringData` hanya dipanggil 1 kali saat inisialisasi awal dan tidak memicu panggilan beruntun ketika state `data` terisi.

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan/kondisi baseline**
  Jalankan `pnpm vitest run src/components/monitoring/AllRouteMonitoringPage.test.tsx`.

- [ ] **Step 3: Implementasikan perbaikan `dataRef` dan in-flight guard di `AllRouteMonitoringPage.tsx`**
  1. Buat `dataRef = useRef(data)` dan sinkronkan via `useEffect`:
     ```typescript
     const dataRef = useRef(data);
     useEffect(() => {
       dataRef.current = data;
     }, [data]);
     ```
  2. Buat `isFetchingRef = useRef(false)`.
  3. Di dalam `loadData`:
     - Ganti pengecekan `!data` menjadi `!dataRef.current`.
     - Pasang guard: jika `isFetchingRef.current === true` dan mode adalah `"silent"`, abaikan request duplikat.
     - Bungkus dengan `try ... finally { isFetchingRef.current = false; }`.
  4. Hapus `data` dari dependency array `useCallback`:
     ```typescript
     // Sebelum:
     [selectedDate, currentPeriod, data]
     // Sesudah:
     [selectedDate, currentPeriod]
     ```

- [ ] **Step 4: Jalankan kembali unit test untuk memastikan perbaikan lulus**
  Jalankan `pnpm vitest run src/components/monitoring/AllRouteMonitoringPage.test.tsx`.

- [ ] **Step 5: Git commit task 1**
  Commit perubahan task 1 dengan pesan ringkas: `fix: eliminate monitoring loadData loop`.

---

### Task 2: Penjinakan Realtime Listener dengan Debounce (3.000 ms)

**Files:**
- Modify: `src/components/monitoring/AllRouteMonitoringPage.tsx:197-223`
- Test: `src/components/monitoring/AllRouteMonitoringPage.test.tsx`

**Interfaces:**
- Consumes: Supabase Realtime channel (`monitoring-realtime-reports`), `postgres_changes` event.
- Produces: Debounced silent update callback dengan pembersihan timer (`clearTimeout`) saat unmount.

- [ ] **Step 1: Tulis unit test untuk verifikasi debounce event realtime**
  Tambahkan pengujian di `src/components/monitoring/AllRouteMonitoringPage.test.tsx` yang mensimulasikan multiple incoming realtime events secara beruntun dan memastikan `loadData` hanya dieksekusi 1 kali setelah timer debounce 3 detik selesai.

- [ ] **Step 2: Jalankan test untuk melihat perilaku saat ini**
  Jalankan `pnpm vitest run src/components/monitoring/AllRouteMonitoringPage.test.tsx`.

- [ ] **Step 3: Implementasikan debounce timer pada listener realtime**
  Pada `useEffect` Realtime Subscription (`AllRouteMonitoringPage.tsx`):
  ```typescript
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const channel = supabase
      .channel("monitoring-realtime-reports")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_route_reports",
        },
        () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            loadDataRef.current?.("silent");
          }, 3000);
        }
      )
      .subscribe(...);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, []);
  ```

- [ ] **Step 4: Jalankan unit test untuk memastikan debounce bekerja dengan presisi**
  Jalankan `pnpm vitest run src/components/monitoring/AllRouteMonitoringPage.test.tsx`.

- [ ] **Step 5: Git commit task 2**
  Commit perubahan task 2 dengan pesan ringkas: `fix: debounce monitoring realtime listener`.

---

### Task 3: Dokumentasi Audit & Refactor Siklus `refact_193` & Quality Gates

**Files:**
- Create: `refactor-ss-pdo/refact_193/AUDIT_BUGS.md`
- Create: `refactor-ss-pdo/refact_193/REPAIR_REPORT.md`

**Interfaces:**
- Consumes: Temuan audit logs Supabase, analisis infinite loop `AllRouteMonitoringPage.tsx`, data Before vs After, dan Case Lapangan.
- Produces: Dokumentasi kepatuhan audit standar proyek SS_PDO di folder `refactor-ss-pdo/refact_193/`.

- [ ] **Step 1: Susun dokumen `refactor-ss-pdo/refact_193/AUDIT_BUGS.md`**
  Dokumentasikan ID temuan:
  - `BUG-193-01`: Infinite Re-render Loop pada `loadData` di `AllRouteMonitoringPage.tsx` (Severity: CRITICAL).
  - `BUG-193-02`: Un-debounced Realtime Listener Cascading Spike pada `daily_route_reports` (Severity: HIGH).
  Lengkapi dengan lokasi kode, keparahan, deskripsi, dampak user, dan mitigasi.

- [ ] **Step 2: Susun dokumen `refactor-ss-pdo/refact_193/REPAIR_REPORT.md`**
  Dokumentasikan rincian implementasi, Before vs After, dan Case: Skenario Lapangan pergantian shift operasional.

- [ ] **Step 3: Jalankan Quality Gates Lengkap**
  1. `pnpm vitest run src/styles/tokens/color-contract.test.ts`
  2. `pnpm vitest run src/`
  3. `pnpm run build`
  4. `graphify update .`

- [ ] **Step 4: Git commit dokumentasi siklus 193**
  Commit perubahan dokumentasi dengan pesan ringkas: `docs: refactor-193 audit & repair report`.
