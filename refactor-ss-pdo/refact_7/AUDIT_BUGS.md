# Laporan Audit Kode dan Temuan Bug SS_PDO

Dokumen ini memuat hasil audit mendalam terhadap basis kode aplikasi **SS_PDO** (React 19 + TypeScript + Vite PWA). Audit mencakup aspek manajemen state, race condition, penanganan error, integritas data, keamanan, kebocoran memori, dan kesesuaian tipe data.

---

## Ringkasan Eksekutif

- **Total Temuan:** 30 Bug
- **Distribusi Keparahan:**
  - **Tinggi (High / Critical):** 2 Bug
  - **Sedang (Medium):** 9 Bug
  - **Rendah (Low):** 19 Bug

---

## Daftar Kategori Temuan

1. [Race Condition & Manajemen State](#1-race-condition--manajemen-state)
2. [Logika & Penanganan Error](#2-logika--penanganan-error)
3. [Keamanan & Integritas Data](#3-keamanan--integritas-data)
4. [Kesesuaian Tipe Data (TypeScript)](#4-kesesuaian-tipe-data-typescript)
5. [Kebocoran Memori & Siklus Hidup Komponen](#5-kebocoran-memori--siklus-hidup-komponen)

---

## 1. Race Condition & Manajemen State

### BUG-01: Race Condition Penulisan Antrean Offline di LocalStorage
- **Lokasi:** `src/hooks/useOfflineSync.ts` (baris ~122)
- **Tingkat Keparahan:** Tinggi
- **Deskripsi:** Pemanggilan `writeQueueToStorage(newQueue)` dan `setQueue(newQueue)` dilakukan langsung di dalam handler `addToQueue`. Pada mode `React.StrictMode`, pembaruan state dapat dieksekusi ganda, memicu race condition saat penulisan ke `localStorage` dan pemanggilan `backupSyncQueue` ganda ke Supabase.
- **Dampak User:** Item antrean offline muncul ganda atau data input terbaru tertimpa oleh data antrean lama saat koneksi terputus.
- **Mitigasi:** Pisahkan efek samping I/O storage dan network dari updater state, pastikan penulisan storage bersifat atomik dan tersinkronisasi.

### BUG-11: Status Sukses Optimistik Mendahului Eksekusi API
- **Lokasi:** `src/components/BusCard.tsx` (baris ~144)
- **Tingkat Keparahan:** Sedang
- **Deskripsi:** Status penyimpanan `saveStatus` diubah menjadi `"success"` sebelum `await updateBusData` selesai. Jika permintaan API gagal di tengah jalan, UI tetap menandai proses berhasil.
- **Dampak User:** Petugas mengira data telah berhasil tersimpan ke Google Sheets padahal gagal terkirim atau masuk antrean tanpa indikasi yang tepat.
- **Mitigasi:** Pindahkan perubahan status `setSaveStatus("success")` hanya setelah Promise `updateBusData` selesai secara sukses.

### BUG-16: Data Dashboard Tidak Memperbarui Diri Saat Pergantian URL Sheet
- **Lokasi:** `src/components/Dashboard.tsx` (baris ~273)
- **Tingkat Keparahan:** Sedang
- **Deskripsi:** Penanda `autoLoadedRef.current` diatur ke `true` pada pemuatan awal, namun dependency array pada `useEffect` tidak menyertakan `sheetUrl`. Jika URL spreadsheet berganti saat komponen aktif, data rute baru tidak otomatis dimuat.
- **Dampak User:** Petugas berpindah rute atau periode namun tampilan tetap menampilkan data dari rute/spreadsheet sebelumnya.
- **Mitigasi:** Tambahkan `sheetUrl` ke dependency array `useEffect` dan reset status pemuatan otomatis saat terjadi perubahan URL.

### BUG-17: Reference Request ID Tidak Direset Saat Unmount
- **Lokasi:** `src/components/Dashboard.tsx` (baris ~168)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** `requestIdRef.current` dinaikkan secara manual di luar siklus hidup React tanpa dibersihkan saat komponen di-unmount.
- **Dampak User:** Pemuatan data bisa terabaikan secara tidak sengaja jika komponen di-mount ulang secara cepat.
- **Mitigasi:** Reset nilai referensi atau gunakan `AbortController` standar untuk menghentikan request aktif saat unmount.

### BUG-18: State Loading Tertahan Jika Terjadi Error Dini
- **Lokasi:** `src/components/Dashboard.tsx` (baris ~380)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** `setIsLoading(true)` dipanggil sebelum validasi parameter awal selesai. Jika terjadi kegagalan sebelum blok try-catch utama, flag loading dapat tertahan bernilai `true`.
- **Dampak User:** Indikator loading (spinner) berputar terus menerus dan antarmuka terkunci.
- **Mitigasi:** Pindahkan aktivasi `setIsLoading(true)` setelah pemeriksaan awal dan pastikan blok `finally` selalu mengeksekusi reset state.

### BUG-19: Inkonsistensi Request ID Akibat Interaksi Cepat
- **Lokasi:** `src/components/Dashboard.tsx` (baris ~168)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** Peningkatan nilai `requestIdRef` tanpa sinkronisasi event dapat memicu konflik urutan eksekusi jika user melakukan pull-to-refresh bersamaan dengan pergantian tab tanggal.
- **Dampak User:** Data hasil refresh tertukar atau hasil pembacaan tab tanggal tertimpa request sebelumnya.
- **Mitigasi:** Sinkronkan token request pembacaan data per aksi navigasi.

### BUG-20: Eksekusi Tak Sinkron pada Pemilihan Tab Tanggal
- **Lokasi:** `src/components/Dashboard.tsx` (baris ~404)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** Fungsi `handleSelectTab` memanggil fungsi async `handleLoadData` tanpa mekanisme `await` atau penguncian aksi.
- **Dampak User:** Pergantian tanggal berulang kali secara cepat menampilkan data tanggal yang tidak sesuai dengan tab aktif.
- **Mitigasi:** Terapkan debounce atau batalkan request sebelumnya saat user berpindah tab tanggal.

---

## 2. Logika & Penanganan Error

### BUG-02: Item Antrean Berstatus Konflik Tertahan Tanpa Batas
- **Lokasi:** `src/hooks/useOfflineSync.ts` (baris ~163)
- **Tingkat Keparahan:** Sedang
- **Deskripsi:** Ketika tabrakan data terdeteksi (`detectCollision`), item ditandai sebagai `conflict` lalu proses berlanjut (`continue`). Item tersebut tidak dikeluarkan dari antrean utama sehingga terus diproses ulang pada siklus berikutnya.
- **Dampak User:** Muncul peringatan konflik antrean yang berulang dan tidak hilang meski user telah mengabaikan atau memperbarui data.
- **Mitigasi:** Pisahkan item berstatus konflik ke daftar penanganan terpisah dan hentikan pemrosesan otomatis untuk item tersebut hingga diputuskan oleh user.

### BUG-03: Percobaan Ulang Agresif Tanpa Back-Off Delay
- **Lokasi:** `src/hooks/useOfflineSync.ts` (baris ~216)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** Blok penanganan error non-autentikasi langsung melanjutkan loop pemrosesan tanpa jeda peningkatan bertahap (exponential back-off).
- **Dampak User:** Beban jaringan meningkat drastis saat sinyal buruk, kuota API Google Sheets cepat habis, dan baterai perangkat lebih boros.
- **Mitigasi:** Terapkan back-off bertahap (misal: 2 detik, 5 detik, 15 detik) sebelum mencoba kembali pengiriman item yang gagal.

### BUG-04: Penanganan Error Popup Login Google dan Timeout Kaku
- **Lokasi:** `src/services/googleSheets/auth.ts` (baris ~89, ~135)
- **Tingkat Keparahan:** Sedang
- **Deskripsi:** Penutupan popup OAuth oleh user ditangani melalui fallback timeout kaku selama 60 detik tanpa penerusan pesan error spesifik dari callback GIS (`error_callback`).
- **Dampak User:** Saat user tidak sengaja menutup jendela login Google, aplikasi tampak membeku hingga 60 detik sebelum menampilkan pesan error timeout.
- **Mitigasi:** Tangkap event pembatalan popup langsung dari callback SDK Google dan turunkan batas waktu maksimal timeout.

### BUG-21: Tidak Ada Penanganan Error Lanjutan Pasca Login Ulang
- **Lokasi:** `src/components/Dashboard.tsx` (baris ~231)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** Pemanggilan `processQueue()` di dalam `handleReauthenticate` tidak dibungkus dalam blok try-catch tersendiri.
- **Dampak User:** Jika sinkronisasi antrean pasca perpanjangan sesi gagal, user tidak mendapatkan informasi lanjutan mengenai kegagalan tersebut.
- **Mitigasi:** Tambahkan blok penanganan error khusus untuk memantau status pemrosesan antrean setelah re-autentikasi berhasil.

### BUG-22: Penanganan Silent Failure Saat Pengambilan Daftar Rute
- **Lokasi:** `src/services/routeService.ts` (baris ~35)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** Ketika kueri Supabase gagal dan cache lokal kosong, fungsi mengembalikan array kosong `[]` tanpa menandai error.
- **Dampak User:** Layar rute tampak kosong tanpa instruksi atau pemberitahuan bahwa perangkat sedang mengalami masalah jaringan.
- **Mitigasi:** Kembalikan status error terstruktur agar antarmuka dapat menampilkan tombol coba lagi.

### BUG-23: Banner Sesi Kedaluwarsa Muncul Palsu Pasca Silent Refresh
- **Lokasi:** `src/services/routeService.ts` / `src/services/googleSheets/auth.ts` (baris ~424)
- **Tingkat Keparahan:** Sedang
- **Deskripsi:** Evaluasi status token pada saat inisialisasi dapat mengembalikan `needs_reauth` meskipun token baru berhasil diperoleh secara latar belakang.
- **Dampak User:** Banner merah "Sesi kedaluwarsa" kerap muncul di layar dashboard saat aplikasi baru dibuka, memaksa user melakukan login ulang manual yang tidak perlu.
- **Mitigasi:** Periksa kembali isi token aktif di storage setelah proses silent refresh sebelum menentukan flag `needs_reauth`.

### BUG-28: Halaman Audit Log Rusak Jika Pengambilan Data Gagal
- **Lokasi:** `src/services/routeService.ts` (baris ~797)
- **Tingkat Keparahan:** Sedang
- **Deskripsi:** Fungsi `fetchActivityLogs` langsung melempar error (`throw`) saat kueri database gagal, alih-alih ditangani secara aman di tingkat pemanggil.
- **Dampak User:** Menu Log Aktivitas langsung crash atau blank putih saat koneksi internet terganggu.
- **Mitigasi:** Tangkap error dan sediakan fallback array kosong serta pesan notifikasi error yang ramah pengguna.

---

## 3. Keamanan & Integritas Data

### BUG-12: Deteksi Tabrakan Data Baris Bus Tidak Menyeluruh
- **Lokasi:** `src/components/BusCard.tsx` (baris ~117)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** Pengecekan konflik hanya membandingkan field yang sedang diedit oleh user, bukan keseluruhan baris snapshot server.
- **Dampak User:** Jika petugas A mengubah catatan/keterangan dan petugas B mengubah nilai KM, perubahan dari petugas A dapat tertimpa tanpa peringatan konflik.
- **Mitigasi:** Bandingkan seluruh snapshot baris lokal dengan data terbaru dari server saat validasi pre-flight.

### BUG-13: Celah Keamanan XSS pada Teks Catatan/Keterangan Unit
- **Lokasi:** `src/components/BusCard.tsx` (baris ~160)
- **Tingkat Keparahan:** Tinggi
- **Deskripsi:** Fungsi sanitasi `escapeHtml` diterapkan pada nama unit di pesan toast, tetapi beberapa representasi string catatan yang dimasukkan pengguna belum melalui proses escaping yang konsisten.
- **Dampak User:** Berpotensi disusupi script berbahaya lewat kolom keterangan Google Sheets yang dapat tereksekusi pada browser petugas lain.
- **Mitigasi:** Pastikan semua input teks bebas yang bersumber dari spreadsheet melewati pembersihan karakter HTML sebelum di-render ke DOM.

### BUG-26: Validasi Format Email Tidak Memaksa Huruf Kecil
- **Lokasi:** `src/services/routeService.ts` (baris ~575)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** Validasi regex email sebelum penambahan user tidak melakukan normalisasi huruf kecil secara seragam pada tingkat database collation.
- **Dampak User:** Admin berpotensi mendaftarkan email yang sama dengan kombinasi huruf besar-kecil berbeda, memicu kebingungan hak akses.
- **Mitigasi:** Terapkan fungsi `lower()` dan normalisasi wajib sebelum menyimpan data akun pengguna.

---

## 4. Kesesuaian Tipe Data (TypeScript)

### BUG-09: Tipe Objek Tidak Sesuai pada Pemanggilan Antrean Bulk Trip
- **Lokasi:** `src/components/BusList.tsx` (baris ~109)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** Parameter yang dikirim ke `addToQueue` menyertakan atribut `retryCount: 0`, padahal tipe fungsi `addToQueue` menggunakan `Omit<SyncItem, "id" | "status" | "retryCount">`.
- **Dampak User:** Tidak berdampak langsung ke user, namun memicu peringatan compiler TypeScript dan berisiko menyamarkan error tipe data lain.
- **Mitigasi:** Hapus properti `retryCount` dari argumen pemanggilan `addToQueue`.

### BUG-10: Tipe Objek Tidak Sesuai pada Salin KM Massal
- **Lokasi:** `src/components/BusList.tsx` (baris ~206)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** Masalah tipe data yang sama dengan BUG-09 pada fungsi penyalinan KM massal Shift 1 ke Shift 2.
- **Dampak User:** Peringatan compiler pada build time.
- **Mitigasi:** Sesuaikan payload objek agar mematuhi definisi tipe interface `addToQueue`.

---

## 5. Kebocoran Memori & Siklus Hidup Komponen

### BUG-05: Eksekusi Berlebih Efek Referensi Opsi Antrean
- **Lokasi:** `src/hooks/useOfflineSync.ts` (baris ~86)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** `useEffect` pembaruan `optionsRef` dijalankan pada setiap render tanpa daftar dependensi.
- **Dampak User:** Penurunan performa mikro pada perangkat berspesifikasi rendah akibat re-assign referensi yang terus-menerus.
- **Mitigasi:** Berikan array dependensi `[options]` pada `useEffect`.

### BUG-07: Interval Telemetry Heartbeat Tidak Dibersihkan Saat Logout
- **Lokasi:** `src/hooks/useUserActivityTracking.ts` (baris ~28)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** `setInterval` pelacakan durasi aktif tidak dibersihkan dengan benar saat status `isSignedIn` berubah menjadi false tanpa unmount komponen root.
- **Dampak User:** Request heartbeat tetap terkirim di latar belakang meski user sudah keluar ke halaman login.
- **Mitigasi:** Pastikan cleanup function membersihkan interval timer secara tuntas saat user logout.

### BUG-08: Stale Reference pada Email Telemetry Pengguna
- **Lokasi:** `src/hooks/useUserActivityTracking.ts` (baris ~14)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** Nilai email disimpan dalam referensi mutable tanpa sinkronisasi dependensi hook yang ketat.
- **Dampak User:** Aktivitas pengguna yang login bergantian pada perangkat yang sama berpotensi tercatat atas nama akun sebelumnya.
- **Mitigasi:** Daftarkan `userEmail` ke dalam dependency array `useEffect`.

### BUG-14: State Pull-to-Refresh Menggantung Saat Perangkat Offline
- **Lokasi:** `src/components/Dashboard.tsx` (baris ~438)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** Ketika user menarik layar untuk refresh saat offline, handler menampilkan error tetapi kalkulasi jarak tarikan (`pullDistance`) tidak di-reset secara mulus.
- **Dampak User:** Indikator panah refresh tetap menggantung di atas layar sampai user menyentuh layar kembali.
- **Mitigasi:** Reset `pullDistance` dan `touchStartY` ke nilai `0` secara langsung sebelum keluar dari fungsi.

### BUG-15: Observer Ukuran Header Tidak Dilepas Saat Referensi Berubah
- **Lokasi:** `src/components/Dashboard.tsx` (baris ~171)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** Instance `ResizeObserver` dipasang pada elemen header tanpa penanganan pelepasan elemen spesifik jika referensi DOM berubah.
- **Dampak User:** Potensi kebocoran memori kecil jika navigasi antar halaman dilakukan berulang kali dalam durasi lama.
- **Mitigasi:** Simpan referensi elemen DOM ke variabel lokal di dalam effect dan lakukan `ro.unobserve(el)` pada fungsi cleanup.

### BUG-24: Sinkronisasi Profil Gagal Tidak Dicoba Ulang Otomatis
- **Lokasi:** `src/services/routeService.ts` (baris ~170)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** Profil yang gagal tersinkronisasi ke database disimpan ke key `PDO_PROFILE_SYNC_PENDING`, tetapi tidak ada scheduler otomatis yang mencoba mengirimkannya kembali saat online.
- **Dampak User:** Foto atau nama profil terbaru petugas tidak terbarui di database admin sampai user melakukan login ulang.
- **Mitigasi:** Tambahkan pemicu sinkronisasi pending profile pada event listener `online`.

### BUG-25: Pengabaian Silent Error pada Pencatatan Log Aktivitas
- **Lokasi:** `src/services/routeService.ts` (baris ~210)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** Kegagalan pengiriman log aktivitas pengguna hanya dicatat lewat `console.error` tanpa mekanisme antrean offline.
- **Dampak User:** Riwayat audit admin kehilangan jejak aktivitas penting yang dilakukan petugas saat koneksi internet tidak stabil.
- **Mitigasi:** Simpan log aktivitas penting yang gagal ke dalam antrean lokal untuk dikirim ulang saat jaringan stabil.

### BUG-27: Pesan Kesalahan RLS Membocorkan Detail Internal
- **Lokasi:** `src/services/routeService.ts` (baris ~645, ~690)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** Pesan error operasi pengguna yang terblokir RLS menyertakan istilah teknis kebijakan database ke antarmuka pengguna.
- **Dampak User:** User atau admin awam bingung membaca pesan error teknis mengenai policy database.
- **Mitigasi:** Format pesan kesalahan menjadi bahasa operasional yang mudah dimengerti (contoh: "Akses ditolak atau data tidak ditemukan").

### BUG-29: Pencarian Rute Spreadsheet Sensitif Terhadap Trailing Slash
- **Lokasi:** `src/utils/cacheUtils.ts` (baris ~50)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** Fungsi `findSheetInRoutes` mencocokkan URL tanpa menormalisasi karakter garis miring di akhir URL (`trailing slash`).
- **Dampak User:** Rute tidak terdeteksi otomatis jika link spreadsheet yang dimasukkan memiliki format garis miring penutup yang berbeda.
- **Mitigasi:** Lakukan normalisasi URL dengan menghapus trailing slash sebelum proses pencocokan.

### BUG-30: Nilai Fallback Tanggal/Bulan Tidak Akurat Saat URL Rute Tidak Ditemukan
- **Lokasi:** `src/utils/cacheUtils.ts` (baris ~85)
- **Tingkat Keparahan:** Rendah
- **Deskripsi:** Fungsi `getMonthYearForSheet` mengembalikan bulan dan tahun sistem saat ini jika pencocokan sheet gagal, yang bisa tidak sesuai jika rute yang dibuka adalah arsip bulan lampau.
- **Dampak User:** Rekap atau nama periode dapat keliru menampilkan bulan berjalan saat membuka rute arsip yang URL-nya belum terindeks penuh di cache.
- **Mitigasi:** Ekstrak informasi periode dari parameter tab atau berikan nilai indikator khusus bahwa periode belum terdefinisi.
