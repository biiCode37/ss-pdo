# REPAIR REPORT — REFACTOR 157
**Tanggal:** 25 Oktober 2026  
**Fokus:** Role-Based Initial Landing Page & Mobile Back Navigation Alignment

---

## 1. Implementasi Perbaikan

### 1.1 Inisialisasi Dinamis Initial View Berdasarkan Peran Pengguna
Pada `src/components/dashboard/useDashboardUiState.ts`, inisialisasi state `currentView` kini membaca peran tersimpan pengguna (`getStoredUserRole()`):
- **Peran `pdo`:** Halaman pertama saat login / membuka aplikasi tetap `"dashboard"` (input & analitik rute tunggal petugas).
- **Semua peran selain `pdo` (`superadmin`, `admin`, `korwil`, `korlap`):** Halaman pertama saat login / membuka aplikasi otomatis mendarat di `"regional_monitoring"` (Monitoring Wilayah 18 Rute & Laporan WA).

### 1.2 Keselarasan Navigasi Hardware/Gesture Back (`useMobileBackHandler`)
Menyelaraskan siklus LIFO navigation stack agar sesuai dengan mental model pengguna:
- Bagi peran non-PDO, `"regional_monitoring"` adalah *Root View*, sedangkan `"dashboard"` rute tunggal adalah *Sub-View*.
- Ketika pengguna non-PDO menekan tombol back fisik atau gesture swipe-back saat memeriksa rute tunggal di `"dashboard"`, aplikasi otomatis kembali ke `"regional_monitoring"`.
- Ketika berada di halaman `"user_management"` atau `"page_management"`, tombol back bagi peran non-PDO mengembalikan mereka ke `"regional_monitoring"`.

### 1.3 Tombol Navigasi Cepat Visual `[ < Wilayah ]` pada Header
Pada `src/components/dashboard/DashboardHeader.tsx`, ditambahkan prop opsional `onBackToMonitoring`. Jika pengguna memiliki peran selain `pdo`, tombol `[ < Wilayah ]` tampil di samping kiri badge rute aktif. Bagi peran `pdo`, tombol ini tidak ditampilkan sehingga layout formulir operasional tetap 100% konsisten.

### 1.4 Penghapusan Menu "Kembali ke Operasi Rute" di Menu Profil Monitoring Wilayah
Pada `src/components/profileMenu/ProfileFeaturesSection.tsx` dan `src/components/profileMenu/ProfileMenuSheet.tsx`, tombol `"Kembali ke Operasi Rute"` dihilangkan ketika pengguna berada di Monitoring Wilayah (`isInMonitoringView === true`). Seluruh peran non-PDO mengakses detail rute secara eksplisit dengan mengetuk kartu rute yang ingin diperiksa, sehingga menu profil tetap ringkas, bersih, dan kontekstual.

### 1.5 Sinkronisasi Penuh Navigasi Kartu Rute Monitoring ke Operasi Rute (BUG-157-04)
1. **Penerusan `setSelectedRouteCode`:** Menghubungkan fungsi pengatur kode rute dari `useDashboardData` ke hook `useDashboardSyncHandlers` pada `Dashboard.tsx`.
2. **Penyimpanan Metadata Lengkap `PDO_LAST_VISITED`:** Memastikan `routeCode`, `sheetUrl`, `selectedTab`, `month`, dan `year` tersimpan lengkap saat rute dipilih dari monitoring wilayah, sehingga siklus inisialisasi `useRouteCascade` tidak me-reset dropdown ke rute urutan pertama.
3. **Pemuatan Data Aktif Google Sheets:** Memicu langsung pemanggilan `await handleLoadData(true, targetDay, targetSheetUrl)` saat kartu rute ditekan, serta menyinkronkan `sheetUrlRef` dan state `sheetUrl` di `useDashboardData.ts`.
4. **Pencarian Rute Fleksibel & Supabase Fallback:** Jika cache lokal `getRoutesFromCache()` masih kosong (karena login awal langsung mendarat di monitoring), sistem secara otomatis mem-fetch daftar master rute dari Supabase via `fetchRoutesWithSheets()` dengan pencocokan fleksibel `formatRouteCode()`.

---

## 2. Before vs After

| Aspek | Before (Sebelum Refactor 157) | After (Setelah Refactor 157) |
| :--- | :--- | :--- |
| **Landing Page Peran Non-PDO (`superadmin`, `admin`, `korwil`, `korlap`)** | Selalu mendarat di formulir rute tunggal (`dashboard`), memerlukan 3 langkah manual untuk ke monitoring 18 rute. | Langsung mendarat di halaman **Monitoring Wilayah (`regional_monitoring`)** begitu membuka aplikasi / login. |
| **Landing Page Peran `pdo`** | Mendarat di formulir rute tunggal (`dashboard`). | Tetap mendarat di formulir rute tunggal (`dashboard`) tanpa perubahan flow. |
| **Hardware Back di Rute Tunggal bagi Non-PDO** | Menekan tombol back memicu keluar aplikasi atau tidak merespons. | Menekan tombol back langsung mengembalikan pengguna ke halaman Monitoring Wilayah. |
| **Navigasi Cepat Header Rute** | Hanya ada tombol ganti rute dan menu profil di pojok kanan. | Ditambahkan tombol `[ < Wilayah ]` di pojok kiri atas khusus untuk peran non-PDO. |
| **Menu Profil di Monitoring Wilayah** | Menampilkan tombol "Kembali ke Operasi Rute" yang ambigu dan tidak sesuai untuk akun non-PDO. | Menu profil bersih dari tombol rute acak; navigasi rute dilakukan terarah via ketukan kartu 18 rute. |
| **Kembali dari Manajemen User / Halaman** | Selalu dilempar ke `dashboard` rute tunggal terlepas dari peran. | Mengembalikan pengguna non-PDO ke `regional_monitoring`. |
| **Memilih Rute dari Halaman Rute / Korwil (BUG-157-04)** | Memilih rute A tapi yang tampil di operasi rute adalah rute lama atau rute pertama karena cache kosong & `handleLoadData` tidak dipanggil. | 100% memuat data rute terpilih beserta sinkronisasi sheet URL, tab tanggal, kode rute aktif di header, dan dropdown rute. |

---

## 3. Case: Skenario Lapangan

### Skenario 1: Koordinator Wilayah (Korwil) Membuka Aplikasi di Pagi Hari
- **Kondisi:** Korwil membuka aplikasi di HP lapangan untuk memantau status operasional pagi hari.
- **Before:** Aplikasi terbuka di formulir rute JAK.60 (atau rute terakhir). Korwil bingung karena harus buka menu profil -> klik monitoring wilayah untuk melihat armada 18 rute.
- **After:** Aplikasi langsung menyajikan kartu ringkasan 18 rute, progress ritase, deviasi KM, dan status armada per korwil secara instan.

### Skenario 2: Koordinator Lapangan (Korlap) Memeriksa Rute Tertentu lalu Kembali
- **Kondisi:** Dari halaman monitoring wilayah, Korlap melihat ada unit terlambat di JAK.30, lalu mengetuk kartu JAK.30 untuk melihat detail bus.
- **Before:** Setelah masuk ke detail JAK.30, Korlap kesulitan mencari cara kembali ke ringkasan wilayah dan jika menekan back malah memicu reload/keluar.
- **After:** Korlap cukup mengetuk tombol `[ < Wilayah ]` di header atau menekan tombol back HP, seketika kembali ke posisi monitoring wilayah dengan tanggal yang sama.

### Skenario 3: Petugas Data Operasional (PDO) Bertugas Input Lapangan
- **Kondisi:** Petugas PDO login untuk menginput KM dan TOA shift 1.
- **Before & After:** Petugas PDO langsung masuk ke formulir input rute operasional mereka (`dashboard`). Hak akses RBAC memastikan petugas PDO tetap fokus pada penginputan tanpa akses atau gangguan navigasi wilayah.

### Skenario 4: Memilih Rute Tertentu dari Tab Rute atau Tab Korwil
- **Kondisi:** Pengguna berada di tab "RUTE" atau tab "KORWIL", lalu memilih rute 4E atau JAK.10A untuk memeriksa catatan bus dan TOA per unit.
- **Before:** Setelah berpindah ke operasi rute, rute yang muncul tetap JAK.01 atau rute lama, data bus tidak termuat.
- **After:** Sistem langsung memuat Google Sheet rute yang dipilih, mengaktifkan tab tanggal sesuai monitoring wilayah, menyetel badge header menjadi rute tersebut, dan menampilkan data bus rute terkait secara akurat.
