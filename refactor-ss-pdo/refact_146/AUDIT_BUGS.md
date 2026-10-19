# AUDIT BUGS: Ketiadaan Loading State (Skeleton) Terpadu Saat Keluar dari Mode Akumulasi / Transisi Data

## 1. Metadata Audit
- **Audit ID**: `BUG-146-UNIFIED-LOADING-SKELETON`
- **Tanggal**: 19 Oktober 2026
- **Cabang**: `devmode`
- **Komponen Terdampak**:
  - `src/components/Skeletons.tsx` (`UnitCardSkeleton`, `AnalyticsDashboardSkeleton`)
  - `src/components/AnalyticsDashboard.tsx`
  - `src/components/UnitSummaryDashboard.tsx`
  - `src/components/dashboard/DashboardContentTabs.tsx`
  - `src/components/dashboard/useDashboardData.ts`

---

## 2. Deskripsi Masalah Lapangan
Ketika pengguna menekan tombol *"Keluar Akumulasi"* atau beralih tanggal saat data harian diambil dari Google Sheets, antarmuka mengalami *delay* visual yang terasa lambat/macet.
Selama 1–3 detik proses request jaringan:
1. Label tanggal di header sudah berganti, namun kartu bus dan metrik analitik tetap menampilkan angka lama (data akumulasi dengan puluhan ribu KM dan ribuan pelanggan).
2. Pengguna mengira aplikasi macet (*freeze*), tombol tidak merespons, atau data salah.
3. Tidak ada indikator pemuatan skeleton serentak di halaman Dashboard Analitik maupun Armada.

---

## 3. Investigasi & Akar Masalah (*Root Cause Analysis*)

### A. Ketiadaan Prop `isLoading` pada Komponen Tab Utama
- **`UnitSummaryDashboard` (Halaman Armada):** Hanya mengecek kondisi `!busData`. Karena saat request berjalan `busData` masih menyimpan objek data akumulasi lama, kartu unit lama tetap ditampilkan tanpa skeleton.
- **`AnalyticsDashboard` (Halaman Dashboard KPI):** Sama sekali tidak menerima prop `isLoading`. Menghitung analitik dari `busData` lama secara terus-menerus selama request baru berlangsung.
- **`DashboardContentTabs`:** Tidak meneruskan status `isLoading` dari `useDashboardData` ke `AnalyticsDashboard` dan `UnitSummaryDashboard`.

### B. Skeleton Eksisting Kurang Representatif
- `UnitCardSkeleton` di `src/components/Skeletons.tsx` masih menggunakan format lama dan belum mencerminkan tata letak modern kartu armada 3-kolom (`RITASE`, `TOTAL KM`, `PELANGGAN`).
- Belum ada komponen skeleton untuk `AnalyticsDashboard` yang meniru tata letak simetris 4-grid `KPICard` dan bar rasio `ShiftComparisonCard`, sehingga jika dibuat loading tanpa skeleton yang proporsional akan memicu *layout shift* (lompatan antarmuka).

---

## 4. Dampak Pengguna
- **Persepsi Kinerja Buruk (*Perceived Slowness*):** Pengguna merasa aplikasi lambat dan tidak responsif.
- **Kebingungan Data (*Data Confusion*):** Pengguna melihat data akumulasi berhari-hari pada header bertanggal harian.

---

## 5. Rencana Mitigasi & Perbaikan
1. Menambahkan komponen `AnalyticsDashboardSkeleton` di `src/components/Skeletons.tsx` dengan struktur simetris 4-grid KPI dan rasio shift.
2. Memperbarui `UnitCardSkeleton` di `src/components/Skeletons.tsx` agar identik dengan kartu unit 3-kolom modern.
3. Menyalurkan prop `isLoading` ke `AnalyticsDashboard` dan `UnitSummaryDashboard` di `DashboardContentTabs.tsx`.
4. Memperbarui `AnalyticsDashboard.tsx` dan `UnitSummaryDashboard.tsx` agar merender skeleton saat `isLoading === true`.
5. Memberikan instant feedback pada `handleExitAccumulation` di `useDashboardData.ts`.
6. Memvalidasi seluruh quality gates (`vitest`, `build`, `graphify`).
