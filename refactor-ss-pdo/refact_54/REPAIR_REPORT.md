# Repair Report Refact 54: Dekomposisi Root Orchestrator Dashboard (Dashboard.tsx)

Dokumen ini memuat laporan teknis implementasi dekomposisi `src/components/Dashboard.tsx` menjadi custom hooks terdedikasi di `src/components/dashboard/`.

---

## 1. Implementasi & Detail Perubahan

### A. Pembagian Custom Hook Modular (`src/components/dashboard/`)

1. **`useDashboardUiState.ts`**:
   - Menangani state konektivitas (`isOnline`), otentikasi (`isAuthExpired`, `isReauthenticating`), modal (`isQueueModalOpen`, `isAccSheetOpen`, `isProfileMenuOpen`), navigasi view tingkat atas (`currentView`, `monitoringDate`), navigasi tab utama swipeable (`mainTab`, `handleSwipeNextTab`, `handleSwipePrevTab`), serta preferensi tema (`theme`, `toggleTheme`).
   - Mendaftarkan 5 interseptor tombol kembali hardware (`useMobileBackHandler`) untuk tampilan monitoring wilayah, manajemen user, menu profil, akumulasi, dan modal antrean.
   - Mengelola pendengar event jendela (`online`, `offline`, `google-auth-expired`, `google-login-success`) secara terisolasi dengan cleanup rapi.
   - Mengimplementasikan `handleSelectUnit` dengan scrolling halus dan animasi denyut (*glowing pulse*) 6 detik sesuai standar aturan emas UI/UX aplikasi.

2. **`useDashboardSyncHandlers.ts`**:
   - `handleDeleteQueueItem`: Menampilkan konfirmasi SweetAlert2 sebelum menghapus item antrean offline yang gagal/tertunda.
   - `handleReauthenticate`: Memperbarui token sesi Google Sheets, merestart pembacaan data, memproses sisa antrean sinkronisasi tertunda, dan menyajikan notifikasi toast yang informatif.
   - `handleSelectMonitoringRoute`: Mencocokkan rute dari cache, memilih URL spreadsheet dan tanggal terkait, serta mengalihkan tampilan kembali ke dashboard rute.
   - `handleFormatWholeSheet`: Menjalankan utilitas format massal styling Google Sheets untuk lembar kerja aktif.

3. **`Dashboard.tsx` (Root Orchestrator Ramping)**:
   - Berkurang dari 514 baris menjadi **290 baris** (penurunan -224 baris / 44%).
   - Berperan murni merakit 5 komponen tampilan utama: `DashboardHeader`, `DashboardStatusBanners`, `DashboardContentTabs`, `DashboardModals`, dan `BottomNav`.

4. **Pengujian Unit Mandiri**:
   - `src/components/dashboard/useDashboardUiState.test.tsx`: 5 pengujian (inisialisasi default, alih tema light/dark, navigasi tab rotasi geser maju/mundur, pendengar event auth, pendengar event jaringan online/offline).
   - `src/components/dashboard/useDashboardSyncHandlers.test.tsx`: 5 pengujian (konfirmasi hapus antrean, pembatalan hapus, alur reautentikasi sesi sukses, alih rute dari monitoring, format massal lembar kerja).

---

## 2. Perbandingan Before vs After

| Aspek | Sebelum Refactor 54 (Before) | Sesudah Refactor 54 (After) |
| :--- | :--- | :--- |
| **Ukuran `Dashboard.tsx`** | 514 baris (Padat dan monolitik) | **290 baris** (Penurunan -224 baris kode / 44%) |
| **Pemisahan Logika UI vs Tata Letak** | Seluruh state UI, efek window, dan back handlers tertanam di `Dashboard.tsx` | Diisolasi penuh ke dalam `useDashboardUiState.ts` |
| **Pemisahan Logika Sinkronisasi & Auth** | Logika async reauth dan antrean menyatu di komponen root | Diisolasi penuh ke dalam `useDashboardSyncHandlers.ts` |
| **Kamus Teks Sentral** | - | 100% menggunakan entri kamus terpusat di `text_dashboard.ts` |
| **Integritas Unit Test** | Belum memiliki pengujian terisolasi untuk state dan sync dashboard | **10/10 tests passed** pada 2 berkas pengujian baru, total **48/48 test files passed (359 tests) 100%** |
| **Kompilasi & Bundle** | - | **`tsc -b && vite build` lulus 0 error (1.24s)** |
| **Knowledge Graph** | - | Graphify 3.563 nodes, 4.564 edges, 315 communities terbarui |

---

## 3. Skenario Lapangan (Field Cases)

### Case 1: Pengawas Mengalami Token Sesi Google Kedaluwarsa Saat Sinkronisasi Lapangan
- **Kondisi**: Petugas operasional di terminal bus sedang berada di dashboard dan sesi login Google Sheets kedaluwarsa setelah beberapa jam.
- **Before**: State auth expired dan fungsi reautentikasi tertanam dalam komponen raksasa 514 baris yang dapat memicu re-render tak terkendali pada tab dan kartu bus.
- **After**: `useDashboardUiState` menangkap event `google-auth-expired` dan menampilkan peringatan. Ketika pengguna menekan tombol Segarkan Sesi, `useDashboardSyncHandlers.handleReauthenticate` menangani pembaruan token di latar belakang, memproses sisa antrean offline, dan me-reload data lembar kerja secara mulus tanpa mengganggu state UI lainnya.

### Case 2: Petugas Berpindah dari Monitoring 18 Rute ke Detail Rute Spesifik
- **Kondisi**: Pengawas regional melihat rekapitulasi performa 18 rute pada menu Monitoring Wilayah, lalu mengetuk salah satu rute bermasalah (misal: Rute 4E) pada tanggal tertentu.
- **After**: `useDashboardSyncHandlers.handleSelectMonitoringRoute` mengekstrak sheet URL rute dari cache, memilih tab tanggal yang sesuai secara otomatis, dan segera mengembalikan view ke `dashboard` utama dengan animasi transisi yang instan dan bebas lag.
