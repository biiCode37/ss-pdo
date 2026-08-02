# Changelog

Semua perubahan penting dalam proyek ini akan didokumentasikan di dalam file ini.

Format pencatatan berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan proyek ini mematuhi [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-08-02

### Added
- **Apple iOS Style Sliding Indicator Dock Navbar:** Menambahkan kapsul penanda aktif *electric blue gradient* melayang yang meluncur dengan animasi pegas fisika Apple (`cubic-bezier(0.32, 0.72, 0, 1)`) dan *zero-delay touch* (`onPointerDown` + `touch-action: manipulation`).
- **Smooth Wave Growth Entrance Animation pada Grafik TOA:** Menambahkan animasi gelombang berjenjang (`@keyframes trendBarRise`) dengan kurva `cubic-bezier(0.34, 1.35, 0.64, 1)` dan promosi layer GPU (`will-change: transform, height, opacity`) untuk performa 60FPS / 120FPS tanpa patah-patah.
- **Icon Highlight Nilai Tertinggi & Terendah pada Balok Grafik:** Menambahkan ikon `Award` (hijau `#4ade80`) untuk hari puncak TOA dan `TrendingDown` (rose `#fb7185`) untuk hari terendah pada Grafik Tren TOA.
- **Dismiss Badge Melayang Dua Arah (Bidirectional Tap):** Badge info balok grafik dapat ditutup kembali dengan mengetuk ulang balok yang sama, mengetuk badge, atau mengetuk area di luar grafik.
- **Refresh Token Akses Otomatis Latar Belakang (`ensureValidToken`):** Mengganti pembatasan waktu sesi login dengan *silent background token refresh* (0.2s) agar sesi pengguna tetap aktif permanen tanpa memaksa logout.
- **Identitas Visual SPUM (Spreadsheet PDO Utara Mobile):** Memperbarui nama dan identitas visual aplikasi menjadi SPUM.

### Changed
- **Default Landing Page ke Dashboard Analitik:** Mengubah inisialisasi state `mainTab` dari `'input'` menjadi `'analytics'`, sehingga pengguna langsung disajikan ringkasan eksekutif Dashboard Analitik saat membuka aplikasi.
- **Kesesuaian Presisi Murni Single Source of Truth (SSOT):** Menyelaraskan perhitungan `getMonthlyToaTrend` di `googleSheets.ts` dengan rumus murni Google Sheets (TOA + TOA Manual) agar angka badge balok (e.g. `1.527`) konsisten 100% dengan blok "PELANGGAN (TOA)".
- **Render Tab Komponen Secara Persisten:** Memperbarui `Dashboard.tsx` agar `AnalyticsDashboard` dan `DailyToaTrendCard` tetap terpasang (*persistently mounted*) di DOM menggunakan CSS `display` + `opacity transition` untuk mengeliminasi *reflow lag*.
- **Header Bulan/Tahun Dinamis:** Menambahkan helper `extractMonthYearLabel` untuk mengekstrak nama bulan dan tahun dari nama sheet/link secara dinamis (e.g. `📅 Juli 2026`).
- **Pembaruan Badge Jumlah Unit Keterangan (UI/UX Pro Max):** Memperbesar badge `X Unit` menjadi font `13px` (`fontWeight: 800`), padding `4px 12px`, bentuk kapsul membal dengan *shadow aura*, serta teks keterangan responsif (`wordBreak: break-word`).

### Fixed
- **[BUG-17] Login Prompt Tidak Diharapkan saat Tap "Load Data":** Menyelaraskan fungsi `checkSignedIn()` dan `ensureValidToken()` di `googleSheets.ts` untuk memverifikasi masa berlaku `GAPI_ACCESS_TOKEN` (`expiresAt`). Jika token kedaluwarsa, state stale dibersihkan dan aplikasi meminta login bersih sejak awal di `<LoginScreen />`, mengeliminasi kemunculan popup login Google secara mendadak ketika pengguna mengetuk "Load Data".

## [1.5.0] - 2026-07-26

### Fixed
- **[BUG-01] Race condition antrean sync:** Mengganti pola snapshot-based menjadi atomic read-modify-write per-item di `useOfflineSync.ts`, sehingga edit baru yang masuk selama jeda 2 detik tidak akan tertimpa.
- **[BUG-02] Deteksi konflik di jalur offline:** Menambahkan `originalSnapshot` ke `SyncItem` dan collision detection via `getBusRowData` sebelum sync. Item berkonflik ditandai `'conflict'` dengan opsi resolusi (Gunakan Data Server / Force Save).
- **[BUG-03] Head-of-line blocking:** Mengubah `break` menjadi `continue` untuk error non-auth. Menambahkan `retryCount` dengan backoff bertahap (2s→5s→15s→60s). Error permanen (400/403/404) ditampilkan langsung ke user, bukan diantrekan. Auth error menampilkan pesan jelas.
- **[BUG-04] Tombol login macet permanen:** Menambahkan `error_callback` pada `initTokenClient` dan timeout 60 detik pada `signIn()`. Promise selalu settle (resolve/reject), tombol tidak lagi macet saat popup ditutup.
- **[BUG-05] Kegagalan silent per-kolom:** Validasi SEMUA field header (bukan hanya 'unit'). Kolom yang tidak terdeteksi ditampilkan sebagai warning banner kuning di Dashboard sebelum user mulai mengisi data.
- **[BUG-06] False positive "Tabrakan Data":** Menambahkan callback `onSyncSuccess` di `useOfflineSync` yang memperbarui `busData` di Dashboard saat sync antrean berhasil.
- **[BUG-07] Field Manual Shift & Keterangan terkunci:** Mengecualikan `manualShift1`, `manualShift2`, `keterangan` dari `isFieldDisabled` — field pelengkap ini selalu aktif di semua mode kategori.
- **[BUG-08] Badge antrean duplikat:** Menghapus `SyncQueueBadge` (Tailwind-dependent) dari `App.tsx`. Fungsionalitas modal dipindahkan ke badge inline di Dashboard dengan styling CSS variable yang konsisten.
- **[BUG-09] Jendela kehilangan data <1 detik:** Menambahkan listener `visibilitychange` + `pagehide` di `BusCard` yang langsung menyimpan `formData` (bukan debounced) ke localStorage.
- **[BUG-10] Deteksi header rapuh:** Menambahkan validasi bahwa kandidat baris header harus berisi ≥50% teks (bukan angka murni), mengurangi risiko baris data salah dikenali sebagai header.
- **[BUG-11] Token refresh otomatis:** Menambahkan timer proaktif yang melakukan silent refresh 5 menit sebelum token kedaluwarsa.
- **[BUG-12] Status 'failed' aktif:** `retryCount` dan status `'failed'`/`'conflict'` benar-benar digunakan. UI modal menampilkan item gagal/berkonflik dengan tombol "Coba Lagi" / "Hapus" / "Gunakan Data Server" / "Force Save".
- **[BUG-13] Rute duplikat dicegah:** Menambahkan pengecekan Sheet ID duplikat di `saveNewRoute`.
- **[BUG-14] Pull-to-refresh cek online:** Menambahkan validasi `isOnline` sebelum refresh, menampilkan pesan "Tidak bisa refresh saat offline".
- **[BUG-15] StrictMode double-init:** Menambahkan `useRef` guard agar `initializeApi` hanya berjalan sekali di development.
- **[BUG-16] Label progres dinamis:** Label berubah dari "Progres Harian" menjadi "Progres Kolom: [nama kolom]" saat filter kategori aktif.

### Changed
- Skema `SyncItem` di `useOfflineSync.ts` diperluas dengan field `retryCount`, `originalSnapshot`, dan status `'conflict'`. **Backward-compatible:** data lama yang belum punya field baru akan otomatis dimigrasikan saat load.
- Fungsi `getBusData` di `googleSheets.ts` kini mengembalikan `missingColumns: string[]` sebagai tambahan.

## [1.4.0] - 2026-07-14

### Added
- **Data Collision Prevention (Optimistic Concurrency Control):** Menerapkan validasi *pre-flight check* pada `BusCard`. Sebelum menyimpan data ke Google Sheets, aplikasi akan membandingkan data terbaru di server dengan *snapshot* lokal. Jika terdapat perbedaan (data telah diubah oleh orang lain), aplikasi akan memunculkan peringatan (Modal Resolusi Konflik) yang memungkinkan petugas untuk tetap memaksa penimpaan (Force Save) atau menggunakan data dari server.

## [1.3.0] - 2026-07-14

### Added
- **PWA Offline Sync Badge:** Menambahkan komponen `SyncQueueBadge` dan modal konfirmasi untuk memberikan indikator visual kepada pengguna mengenai jumlah data yang masuk ke dalam antrean (belum tersinkronisasi) dan status kelancaran sinkronisasi background.
- **Auto-save Drafts:** Menerapkan fungsi *debounce* (`useDebounce`) pada `BusCard`. Input yang sedang diketik akan tersimpan sementara (draft) di `localStorage`, mencegah hilangnya data apabila terjadi *refresh* atau aplikasi tertutup tiba-tiba (kecuali data berhasil di-*save*/masuk *queue*).

### Changed
- **Skeleton UI Loader:** Mengganti teks "Membaca data..." standar dengan *skeleton loading* teranimasi menggunakan library `@aejkatappaja/phantom-ui`. Komponen `BusList` kini menampilkan blok abu-abu yang lebih rapi saat memuat data.
- **Mobile Copy UX:** Mengganti gaya *hover tooltip* pada tombol salin KM Akhir menjadi pola responsif untuk perangkat seluler. Ketika ditekan, ikon "Copy" akan berubah wujud menjadi "Check" (hijau) selama 2 detik sebagai respons visual yang lebih bersahabat tanpa *layout shift*.

### Fixed
- **Input Form Alignment:** Mengatasi pergeseran penjajaran (misalignment) input pada `KM Awal Shift 2` di grid CSS dengan mengatur `display: flex; flex-direction: column; justify-content: flex-end;` pada kontainernya (robust fix).

## [1.2.0] - (Earlier)

### Added
- **Authentication & Security:** Memperbaiki sistem login via Google Auth. Menambahkan _guard_ pencegahan interaksi jika pengguna belum login atau *credentials* (seperti `VITE_GAPI_CLIENT_ID`) di `.env` belum didefinisikan dengan tepat.

## [1.0.0] - Initial Release

### Added
- Inisiasi proyek berbasis Vite + React + TypeScript.
- Integrasi `gapi-script` untuk membaca dan menulis baris *spreadsheet* Google Sheets.
- Registrasi Service Worker PWA standar menggunakan `vite-plugin-pwa` untuk fungsionalitas caching *offline* mendasar.
