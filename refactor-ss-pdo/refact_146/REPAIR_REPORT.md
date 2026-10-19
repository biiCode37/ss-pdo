# REPAIR REPORT: Pengoptimalan Loading State (Skeleton) Terpadu Lintas Halaman (Refact 146)

## 1. Ringkasan Implementasi
Telah diimplementasikan sistem *loading state* (skeleton) terpadu di ketiga tab utama aplikasi (Dashboard Analitik, Input SS, dan Rekapitulasi Armada). Pengguna kini mendapatkan respons visual seketika (*instant visual feedback*) begitu tombol *Keluar Akumulasi* atau selector tanggal diklik, sehingga menghilangkan persepsi delay/macet dan mencegah data lama (*stale data*) terlihat saat data baru sedang diambil dari Google Sheets.

---

## 2. Rincian Perubahan Kode

### A. Komponen Skeleton Modern: `src/components/Skeletons.tsx`
- **`UnitCardSkeleton`:** Dirombak agar proporsional dan identik dengan `UnitCard` modern 3-kolom (`RITASE`, `TOTAL KM`, `PELANGGAN`).
- **`BusCardSkeleton`:** Diperbarui dengan header bar dan glanceable metric strip 3-kolom.
- **`KPICardSkeleton`:** Komponen baru untuk mencerminkan layout simetris 4-grid KPI eksekutif (Pelanggan/KM, Total Penumpang, Total KM Tempuh, Efisiensi Ritase).
- **`ShiftComparisonSkeleton`:** Komponen baru untuk mencerminkan rasio split shift 1 dan shift 2.
- **`AnalyticsDashboardSkeleton`:** Komponen gabungan yang menyatukan chart trend, KPI grid, dan shift comparison skeleton untuk halaman Dashboard Analitik.

### B. Penyambungan Prop `isLoading` ke Seluruh Halaman Utama
- **`src/components/dashboard/DashboardContentTabs.tsx`:** Meneruskan prop `isLoading` ke komponen `AnalyticsDashboard` dan `UnitSummaryDashboard`.
- **`src/components/AnalyticsDashboard.tsx`:** Menerima `isLoading` dan menampilkan `AnalyticsDashboardSkeleton` saat pemuatan aktif.
- **`src/components/UnitSummaryDashboard.tsx`:** Menerima `isLoading` dan menampilkan `UnitCardSkeleton` saat `isLoading === true` (tidak lagi menunggu `!busData`), mencegah data akumulasi lama tetap muncul.

### C. Instant Visual Feedback pada `useDashboardData.ts`
- **`handleExitAccumulation` & `handleSelectTab`:** Menyetel `setIsLoading(true)` dan `setCurrentTabName(...)` secara langsung dan sinkron pada saat tombol diklik. Hal ini memicu tampilan skeleton secara instan tanpa ada *gap* jeda asinkron jaringan.

---

## 3. Before vs After

| Aspek | Before | After |
| :--- | :--- | :--- |
| **Respon Klik Keluar Akumulasi** | Delay visual 1–3 detik; layar tetap menampilkan data akumulasi lama seolah-olah tombol macet. | Respons seketika (0 ms); seluruh halaman langsung beralih ke skeleton berdenyut halus (*smooth shimmer pulse*). |
| **Halaman Dashboard Analitik (`AnalyticsDashboard`)** | Tidak memiliki loading state; terus menampilkan KPI dan grafik dari data lama saat request berjalan. | Menampilkan `AnalyticsDashboardSkeleton` dengan 4-grid KPI dan bar perbandingan shift. |
| **Halaman Armada (`UnitSummaryDashboard`)** | Hanya cek `!busData`; tidak tahu saat data sedang diperbarui sehingga kartu lama tetap bertengger. | Menerima `isLoading` dan menampilkan `UnitCardSkeleton` 3-kolom modern. |
| **Bentuk Skeleton Kartu Unit** | Format lama (2 baris teks generik) yang tidak sesuai dengan kartu 3-kolom riil. | Format modern 3-kolom presisi yang mencegah *layout shift* (lompatan antarmuka). |

---

## 4. Case: Skenario Lapangan

### Skenario: Beralih dari Mode Rekap Akumulasi ke Harian
- **Kondisi Awal:** Korlap selesai menganalisis akumulasi tanggal 01–18 Oktober di rute JAK.115 (total puluhan ribu KM), lalu menekan tombol `[✕ Keluar Akumulasi]`. Karena proses fetch Google Sheets harian membutuhkan ~2 detik, layar sempat tetap diam di data akumulasi lama, membuat Korlap mengira tombol tidak berfungsi lalu menekan berulang kali.
- **Hasil Setelah Perbaikan:** Begitu tombol ditekan, seluruh kartu metrik dan armada langsung menciut ke animasi skeleton berdenyut halus. Dua detik kemudian saat data harian selesai diunduh, angka harian (misal 200 KM dan 14 trip) muncul dengan transisi lembut tanpa ada kebingungan data.

---

## 5. Status Verifikasi & Quality Gates
1. **Unit Test:**
   - `src/components/__tests__/UnitSummaryDashboard.test.tsx` (3 tests passed).
   - `src/components/__tests__/AnalyticsDashboard.test.tsx` (2 tests passed).
   - `src/components/__tests__/UnitCard.test.tsx` (5 tests passed).
   - `src/components/__tests__/UnitDetailModal.test.tsx` (5 tests passed).
   - `src/components/busCard/BusCard.test.tsx` (7 tests passed).
2. **Build Test:**
   - `pnpm run build` ➔ TypeScript Strict Mode (`tsc -b`) dan Vite build berhasil 0 error dalam 2.01s.
3. **Knowledge Graph:**
   - `graphify update .` ➔ 5.751 nodes, 7.149 edges terbarui.
4. **Isolasi Fitur:** Kode nomor 2 (*Modal Status Armada*) tetap aman dan belum disentuh.
