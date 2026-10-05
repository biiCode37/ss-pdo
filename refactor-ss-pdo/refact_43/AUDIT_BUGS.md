# Audit Temuan Refact 43: Dekomposisi God File Terakhir `Dashboard.tsx` (~1.040 baris)

Dokumen audit ini mencatat analisis struktural dan dekomposisi terhadap god file terakhir di proyek, yaitu `src/components/Dashboard.tsx` yang memuat logika presentasional utama, penanganan data Google Sheets & akumulasi lintas periode, status armada per shift & audit log, gestur pull-down refresh mobile, dan orkestrasi modal dalam satu file monolitik.

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF43-ARCH-001: God File `src/components/Dashboard.tsx` (1.040 baris)

- **Lokasi Kode**: `src/components/Dashboard.tsx` (1.040 baris)
- **Tingkat Keparahan**: **HIGH** (Maintainability & Cognitive Overhead)
- **Deskripsi Masalah**:
  Meskipun komponen presentasional visualnya telah dipisahkan ke `DashboardHeader`, `DashboardStatusBanners`, `DashboardContentTabs`, dan `DashboardModals`, berkas induk `Dashboard.tsx` masih memegang lebih dari 20 state, 5 useRef, serta puluhan baris callback logic secara simultan:
  1. Pengambilan dan pembatalan data spreadsheet Google Sheets (`handleLoadData`, `AbortController`, `requestIdRef`, `selectedTab`, `accRange`).
  2. Akumulasi lintas periode dan rekonsiliasi data rute (`handleApplyAccumulation`, `handleExitAccumulation`).
  3. Konfirmasi status armada per shift (`handleConfirmFleetStatus`, perhitungan realops/renops dinamis, `FleetUnitStatusDetail`, dan penyimpanan log audit Supabase).
  4. Pengenalan gestur layar sentuh mobile pull-down refresh (`touchStartY`, `pullDistance`, `isRefreshing`).
  5. Manajemen view bertingkat (Monitoring wilayah, Manajemen user, Dashboard rute tunggal).
- **Dampak User & Pengembang**:
  - `Dashboard.tsx` menjadi titik kemacetan pemeliharaan (*maintenance bottleneck*) di mana setiap perubahan kecil pada logika data atau armada berpotensi mengganggu siklus hidup hook lain di dashboard.
  - Cognitive overhead pengembang sangat tinggi saat membaca alur komponen.
- **Mitigasi**:
  Dekomposisi seluruh logika state, side-effect, dan kalkulasi ke dalam 3 custom hook terdedikasi di `src/components/dashboard/`:
  - `useDashboardData.ts`: Menangani data Google Sheets, tab aktif, rentang akumulasi, update bus row, dan sinkronisasi rute aktif.
  - `useDashboardFleet.ts`: Menangani status laporan operasional harian, konfirmasi armada Shift 1/2, perhitungan status unit (SGO/TO/OFF), dan pencatatan audit log Supabase.
  - `usePullToRefresh.ts`: Menangani gestur sentuh layar tarik ke bawah (*pull-to-refresh*) pada perangkat mobile.
  - `index.ts`: Barrel export modul dashboard.
  - `Dashboard.tsx`: Dirampingkan menjadi komponen orchestrator bersih **~380 baris** tanpa god file yang tersisa di seluruh basis kode proyek.
