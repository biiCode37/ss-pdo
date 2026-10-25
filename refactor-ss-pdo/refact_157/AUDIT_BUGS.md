# AUDIT BUGS — REFACTOR 157
**Tanggal:** 25 Oktober 2026  
**Fokus:** Role-Based Initial Landing Page & Mobile Back Navigation Alignment

---

### Temuan Audit

#### BUG-157-01: Static Initial Landing Page Mengabaikan Hirarki Peran Pengguna (RBAC)
- **Lokasi Kode:** `src/components/dashboard/useDashboardUiState.ts` (baris 33)
- **Keparahan:** Sedang (UX & Operational Friction)
- **Deskripsi:** State navigasi utama `currentView` diinisialisasi secara statis dengan nilai `"dashboard"`. Akibatnya, seluruh pengguna terlepas dari perannya (`superadmin`, `admin`, `korwil`, `korlap`) selalu mendarat di formulir/dashboard rute tunggal saat pertama kali membuka aplikasi atau login.
- **Dampak User:** Pimpinan operasional, Koordinator Wilayah (Korwil), dan Koordinator Lapangan (Korlap) yang bertugas memantau pergerakan 18 rute secara makro terpaksa harus selalu membuka Profile Menu terlebih dahulu secara manual dan memilih "Monitoring Wilayah & Laporan WA" setiap kali membuka aplikasi. Hal ini memperlambat responsivitas monitoring lapangan.
- **Mitigasi:** Menginisialisasi `currentView` secara dinamis dengan membaca peran aktif via `getStoredUserRole()`. Jika peran bukan `"pdo"` (`superadmin`, `admin`, `korwil`, `korlap`), halaman pembuka otomatis diarahkan ke `"regional_monitoring"`. Peran `"pdo"` tetap mendarat di `"dashboard"` rute tunggal.

---

#### BUG-157-02: Disorientasi Navigasi Tombol Back Fisik/Gesture pada Peran Non-PDO
- **Lokasi Kode:** `src/components/dashboard/useDashboardUiState.ts` (baris 112–128) & `src/components/Dashboard.tsx`
- **Keparahan:** Sedang (UX & Navigation Confusion)
- **Deskripsi:** Handler tombol kembali perangkat (`useMobileBackHandler`) sebelumnya mengasumsikan `"dashboard"` sebagai satu-satunya *root view*. Saat peran non-PDO mendarat di `"regional_monitoring"`, tombol back perangkat justru mendaftarkan penutupan yang melempar pengguna ke `"dashboard"`. Sebaliknya, saat pengguna masuk ke detail rute tunggal dari monitoring wilayah, menekan tombol back tidak mengembalikannya ke monitoring wilayah melainkan memicu navigasi keluar.
- **Dampak User:** Korwil/Admin yang menekan gesture back di halaman monitoring wilayah malah terlempar ke dashboard rute tunggal. Saat berada di detail rute tunggal, mereka kesulitan kembali ke tampilan 18 rute.
- **Mitigasi:**
  1. Menyesuaikan `useMobileBackHandler` agar peka terhadap peran pengguna (`isPdoRole`): bagi peran non-PDO, detail rute tunggal (`"dashboard"`) diperlakukan sebagai sub-view dari `"regional_monitoring"`, sehingga tombol back otomatis mengembalikan pengguna ke Monitoring Wilayah.
  2. Bagi peran non-PDO di `"regional_monitoring"`, halaman tersebut berlaku sebagai *root view* yang mendukung standar *double-back to exit* PWA tanpa melempar ke view lain.
  3. Menambahkan tombol navigasi visual `[ < Wilayah ]` pada `DashboardHeader` khusus untuk pengguna non-PDO agar navigasi satu-tap langsung tersedia di layar mobile.

---

#### BUG-157-03: Menu "Kembali ke Operasi Rute" yang Tidak Sesuai pada Akun Non-PDO di Monitoring Wilayah
- **Lokasi Kode:** `src/components/profileMenu/ProfileFeaturesSection.tsx` & `src/components/ProfileMenuSheet.tsx`
- **Keparahan:** Rendah (UX Cleanliness & Information Architecture)
- **Deskripsi:** Pada menu profil saat berada di tampilan monitoring wilayah (`isInMonitoringView === true`), sistem sebelumnya menampilkan tombol `"Kembali ke Operasi Rute"`. Padahal akun selain PDO (`superadmin`, `admin`, `korwil`, `korlap`) menjadikan Monitoring Wilayah sebagai *home page* / ruang kerja utama mereka dan tidak sedang berpindah dari entri rute harian. Di sisi lain, akun PDO sama sekali tidak diizinkan mengakses halaman monitoring wilayah oleh batasan RBAC.
- **Dampak User:** Munculnya tombol "Kembali ke Operasi Rute" membingungkan akun pimpinan/korwil karena memberi kesan bahwa monitoring wilayah adalah halaman sekunder, serta jika ditekan akan melempar mereka ke formulir rute tunggal secara acak tanpa konteks rute yang jelas.
- **Mitigasi:** Menghapus tombol `"Kembali ke Operasi Rute"` dari menu profil saat berada di monitoring wilayah (`isInMonitoringView === true`). Jika pengguna non-PDO ingin melihat rute tertentu, mereka cukup mengetuk langsung kartu rute terkait dari daftar 18 rute di halaman monitoring.

---

#### BUG-157-04: Navigasi Kartu Rute Monitoring Tidak Memuat Sheet & Kode Rute Terpilih di Dashboard Operasi Rute
- **Lokasi Kode:** `src/components/dashboard/useDashboardSyncHandlers.ts`, `src/components/Dashboard.tsx`, & `src/components/dashboard/useDashboardData.ts`
- **Keparahan:** Tinggi (Functional & Data Routing Bug)
- **Deskripsi:** Ketika pengguna memilih rute A baik melalui Tab "RUTE" (kartu rute / modal detail 21 metrik) maupun Tab "KORWIL" (bottom sheet korwil 22 metrik) di halaman Monitoring Wilayah:
  1. `setSelectedRouteCode` tidak dioper dari `Dashboard.tsx` ke opsi hook `useDashboardSyncHandlers`, sehingga `selectedRouteCode` di `useDashboardData` tidak pernah terbarui.
  2. Cache `getRoutesFromCache()` bernilai kosong jika pengguna baru login dan langsung mendarat di Monitoring Wilayah (karena `fetchRoutesWithSheets` belum pernah dipicu oleh `useRouteCascade`), sehingga `matched` rute bernilai `undefined`.
  3. `localStorage.setItem("PDO_LAST_VISITED", ...)` tidak menyimpan field `year` dan `month`, menyebabkan inisialisasi `useRouteCascade` menganggap data tersimpan tidak valid lalu fallback menimpa rute aktif menjadi rute urutan pertama.
  4. Fungsi `handleLoadData` tidak pernah dipanggil secara aktif saat berpindah view, dan di dalam `handleLoadData` sendiri tidak ada sinkronisasi balik ke state `sheetUrl` saat menerima parameter `targetSheetUrl`.
- **Dampak User:** Pengguna memilih rute A (misal JAK.10A atau 4E), namun saat mendarat di halaman Operasi Rute, rute yang ditampilkan tetaplah rute lama atau rute acak/pertama, serta data tabel bus tidak dimuat.
- **Mitigasi:**
  1. Menghubungkan `setSelectedRouteCode` di `src/components/Dashboard.tsx` ke `useDashboardSyncHandlers`.
  2. Menambahkan fallback fetch otomatis `fetchRoutesWithSheets()` jika cache kosong atau rute belum tersimpan di cache lokal.
  3. Menyimpan metadata lengkap `PDO_LAST_VISITED` (`routeCode`, `sheetUrl`, `selectedTab`, `month`, `year`) sesuai periode tanggal monitoring aktif.
  4. Memicu pemanggilan aktif `await handleLoadData(true, targetDay, targetSheetUrl)` saat navigasi rute dieksekusi, serta menyinkronkan `sheetUrlRef` & `setSheetUrl` di `useDashboardData.ts`.

