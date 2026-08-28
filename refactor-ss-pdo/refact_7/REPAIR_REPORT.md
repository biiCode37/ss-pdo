# Laporan Hasil Implementasi Perbaikan Bug SS_PDO

Dokumen ini menjelaskan hasil perbaikan bug yang telah dilakukan pada aplikasi **SS_PDO** berdasarkan temuan dalam audit kode sebelumnya. Laporan ini menyertakan perbandingan **Sebelum (Before) vs Sesudah (After)** perbaikan serta skenario kasus di lapangan agar lebih mudah dipahami oleh pengawas dan operator lapangan.

---

## 1. Race Condition & Manajemen State

### BUG-11: Status Sukses Optimistik Mendahului Eksekusi API
- **Lokasi:** `src/components/BusCard.tsx`
- **Sebelum Perbaikan:** UI langsung menampilkan status centang hijau ("sukses") segera setelah user menekan simpan, tanpa menunggu respon dari Google Sheets API. Jika terjadi error di server Google, user tidak tahu dan mengira data sudah masuk.
- **Sesudah Perbaikan:** Status centang hijau sukses hanya ditampilkan apabila Google Sheets API membalas dengan status sukses. Jika gagal karena masalah otorisasi/API, status di-reset kembali netral dan menampilkan notifikasi kesalahan.
- **Kasus Lapangan:** Petugas di terminal mengisi KM Akhir bus MGI-0123. Jaringan Google Sheets API sedang mengalami limitasi kuota (rate limit). Sebelumnya, layar langsung memunculkan indikasi tersimpan sukses. Sekarang, aplikasi menunggu verifikasi API dan memberi peringatan yang benar jika gagal.

### BUG-16: Data Dashboard Tidak Memperbarui Diri Saat Pergantian URL Sheet
- **Lokasi:** `src/components/Dashboard.tsx`
- **Sebelum Perbaikan:** Ketika URL Spreadsheet aktif berubah, state `autoLoadedRef.current` yang bernilai `true` menghalangi pemuatan ulang data baru secara otomatis. Petugas harus memuat ulang (reload) halaman secara manual.
- **Sesudah Perbaikan:** Menggunakan track history URL sheet aktif melalui `lastAutoLoadedSheetRef` dan menyelaraskannya dalam dependency array `useEffect`. Jika URL sheet berubah, dashboard langsung otomatis membaca data terbaru dari sheet tersebut.
- **Kasus Lapangan:** Admin memperbarui rute JAK-01 dengan spreadsheet periode baru di tengah jalan. Petugas memilih rute tersebut di aplikasi. Sebelumnya, data lama JAK-01 rute periode lalu tetap tampil. Kini, data otomatis berganti ke rute periode baru.

### BUG-19 & BUG-17: Race Condition Pembatalan Request Menggunakan AbortController
- **Lokasi:** `src/components/Dashboard.tsx`
- **Sebelum Perbaikan:** Ketika petugas menekan tombol atau berpindah tab dengan sangat cepat saat koneksi internet sedang lambat, beberapa request data berjalan bersamaan di belakang layar. Request yang lambat bisa selesai belakangan dan menimpa tampilan data tab yang baru dipilih.
- **Sesudah Perbaikan:** Memanfaatkan `AbortController` untuk membatalkan (abort) request pengambilan data sebelumnya jika ada request baru yang masuk.
- **Kasus Lapangan:** Petugas menekan Tab Tanggal 12 lalu dengan cepat menekan Tab Tanggal 13. Koneksi internet di terminal sedang lamban. Sebelumnya, data Tanggal 12 bisa muncul di layar Tab Tanggal 13 karena prosesnya selesai belakangan. Sekarang, request Tanggal 12 dibatalkan secara otomatis demi kelancaran Tab Tanggal 13.

### BUG-20: Sinkronisasi Async saat Navigasi Tab Tanggal
- **Lokasi:** `src/components/Dashboard.tsx`
- **Sebelum Perbaikan:** Fungsi `handleSelectTab` mengabaikan sifat async dari `handleLoadData`, membiarkan thread UI berjalan tanpa penguncian aksi/state load yang benar.
- **Sesudah Perbaikan:** Eksekusi async diikat secara sinkron menggunakan `await` di dalam handler `handleSelectTab`.
- **Kasus Lapangan:** Petugas tidak sengaja mengetuk-ngetuk layar pada barisan tanggal yang berbeda. Sebelumnya, dashboard berkedip-kedip tidak menentu dan berisiko memunculkan data yang acak. Sekarang, UI memproses urutan navigasi secara tertib dan presisi.

---

## 2. Logika & Penanganan Error

### BUG-04: Timeout GIS Pop-up Dipercepat Menjadi 20 Detik
- **Lokasi:** `src/services/googleSheets/auth.ts`
- **Sebelum Perbaikan:** Jika jendela login Google ditutup paksa oleh pengguna, aplikasi terhenti menunggu timeout kaku selama 60 detik sebelum memberikan respon.
- **Sesudah Perbaikan:** Timeout masuk/perpanjangan sesi dipotong menjadi 20 detik untuk meningkatkan responsivitas aplikasi.
- **Kasus Lapangan:** Petugas membuka jendela Login Google namun koneksi buruk membuat loading popup berputar lama. Petugas memilih menutup paksa popup login tersebut. Sebelumnya, aplikasi tampak "hang" 1 menit. Sekarang, dalam 20 detik aplikasi sudah siaga kembali untuk ditekan ulang.

### BUG-21: Pengamanan Loop Antrean Offline Latar Belakang
- **Lokasi:** `src/components/Dashboard.tsx`
- **Sebelum Perbaikan:** Proses pengurasan antrean (`processQueue`) yang dipicu pasca login ulang manual tidak memiliki penanganan error tersendiri, berisiko menghentikan proses perpanjangan sesi secara tidak langsung.
- **Sesudah Perbaikan:** Membungkus eksekusi `processQueue` dalam blok pengaman try-catch.
- **Kasus Lapangan:** Petugas memperbarui sesi Google karena kedaluwarsa. Setelah sukses, antrean offline mencoba menyinkronkan data tetapi tiba-tiba sinyal drop lagi. Sebelumnya, proses ini memicu error unhandled. Sekarang, kesalahan ditangani dengan aman dan sesi petugas tetap tercatat sukses diperbarui.

### BUG-28: Menu Log Aktivitas Lebih Tangguh Saat Masalah Jaringan
- **Lokasi:** `src/services/routeService.ts`
- **Sebelum Perbaikan:** Fungsi `fetchActivityLogs` langsung melempar error (`throw`) saat koneksi database terputus. Hal ini membuat halaman Log Aktivitas crash total (layar putih/blank).
- **Sesudah Perbaikan:** Fungsi dimodifikasi agar tidak melempar crash kasar, melainkan menangkap error dan menyajikan array kosong `[]` secara aman.
- **Kasus Lapangan:** Pengawas ingin memeriksa aktivitas log petugas di daerah susah sinyal. Sebelumnya, mengetuk menu log langsung membuat aplikasi crash dan harus dibuka ulang. Sekarang, menu log tetap terbuka aman dengan menampilkan status riwayat yang bersih.

---

## 3. Keamanan & Integritas Data

### BUG-12: Deteksi Tabrakan Data yang Komprehensif
- **Lokasi:** `src/components/BusCard.tsx`
- **Sebelum Perbaikan:** Pengecekan tabrakan data (collision check) hanya membandingkan field spesifik yang sedang diedit. Jika petugas A mengubah Keterangan, lalu di saat bersamaan petugas B mengubah KM Awal pada bus yang sama, perubahan petugas A akan tertimpa tanpa peringatan konflik.
- **Sesudah Perbaikan:** Pre-flight checking diubah untuk membandingkan 9 field utama yang dapat diedit (TOA, Manual, KM, Keterangan).
- **Kasus Lapangan:** Petugas A di pos timur menulis keterangan bus "BA.01 (Mogok)". Pada detik yang sama, Petugas B di pos barat memasukkan KM Akhir bus tersebut. Sebelumnya, input Petugas B menimpa dan menghapus catatan "BA.01 (Mogok)" milik Petugas A. Sekarang, aplikasi mendeteksi perubahan tersebut dan memunculkan dialog pembanding data agar tidak ada yang terhapus sepihak.

### BUG-27: Bahasa Pesan Kesalahan RLS Dipermudah
- **Lokasi:** `src/services/routeService.ts`
- **Sebelum Perbaikan:** Pesan error dari database ketika hak akses dibatasi (RLS Policy) ditampilkan mentah-mentah ke pengguna (contoh: "row-level security policy violation" atau "cannot update table user_profiles").
- **Sesudah Perbaikan:** Pesan error diubah ke bahasa operasional yang ramah pengguna: "Tidak dapat menemukan akun dengan email ... atau akses ditolak. Silakan coba lagi."
- **Kasus Lapangan:** Admin mencoba menonaktifkan akun petugas lewat UI tetapi terblokir oleh aturan keamanan database. Sebelumnya, muncul pesan error aneh yang membingungkan. Sekarang, pesan error memberi tahu secara jelas bahwa akun tidak ditemukan atau akses ditolak.

---

## 4. Kesesuaian Tipe Data (TypeScript)

### BUG-09 & BUG-10: Pembersihan Atribut Tidak Sah pada `addToQueue`
- **Lokasi:** `src/components/BusList.tsx`
- **Sebelum Perbaikan:** Compiler TypeScript memunculkan warning karena parameter `retryCount` disisipkan ke dalam pemanggilan `addToQueue`, padahal parameter tersebut tidak dideklarasikan dalam tipe data parameter wajib.
- **Sesudah Perbaikan:** Nilai `retryCount` dihapus dari argumen pemanggilan fungsi `addToQueue` karena penanganannya sudah dilakukan secara terpusat oleh hook `useOfflineSync`.
- **Kasus Lapangan:** Mengurangi risiko penumpukan peringatan warning saat proses build production, memastikan kode tetap bersih dan minim bug terselubung.

---

## 5. Kebocoran Memori & Siklus Hidup Komponen

### BUG-05: Efisiensi Effect Pemasangan Opsi Antrean
- **Lokasi:** `src/hooks/useOfflineSync.ts`
- **Sebelum Perbaikan:** Referensi opsi antrean diperbarui pada setiap kali komponen di-render ulang karena dependency array tidak diset pada `useEffect` (~baris 86).
- **Sesudah Perbaikan:** Menambahkan array dependency `[options]` agar pembaruan referensi hanya berjalan jika memang terdapat perubahan opsi secara nyata.
- **Kasus Lapangan:** Mengurangi beban CPU HP petugas lapangan saat menjelajahi daftar unit bus yang panjang.

### BUG-14: Tarikan Pull-to-Refresh Langsung Ter-reset Saat Offline
- **Lokasi:** `src/components/Dashboard.tsx`
- **Sebelum Perbaikan:** Jika petugas melakukan pull-to-refresh dalam kondisi offline, muncul notifikasi peringatan offline namun ikon putar/tarik di atas layar tetap tersangkut dan tidak kembali ke atas.
- **Sesudah Perbaikan:** Menyertakan instruksi reset state koordinat tarikan (`pullDistance` dan `touchStartY`) sesaat setelah mendeteksi status offline.
- **Kasus Lapangan:** Petugas berada di dalam terowongan stasiun yang tidak ada sinyal lalu mencoba menarik layar ke bawah untuk memperbarui data. Ikon panah berputar sebelumnya tersangkut di layar atas. Sekarang, ikon langsung meluncur kembali ke atas secara rapi setelah toast offline muncul.

### BUG-24: Sinkronisasi Latar Belakang untuk Profil Tertunda
- **Lokasi:** `src/services/routeService.ts`
- **Sebelum Perbaikan:** Jika pembaruan informasi profil petugas gagal akibat offline, data hanya disimpan di local storage tanpa pernah dicoba kirim kembali secara otomatis saat internet terhubung.
- **Sesudah Perbaikan:** Menambahkan event listener global `'online'` yang secara otomatis memicu fungsi `flushPendingLocalSync()` untuk mengirim profil tertunda dan logs ke database Supabase.
- **Kasus Lapangan:** Petugas pertama kali login saat sinyal di pool bus buruk, membuat nama lengkapnya gagal tersinkron ke dashboard pengawas. Sebelumnya, nama petugas tidak akan pernah masuk database sampai dia logout-login kembali. Sekarang, begitu petugas mendapatkan sinyal 4G di jalan, aplikasi otomatis menyinkronkan profilnya.

### BUG-25: Pengamanan Log Aktivitas yang Gagal Kirim
- **Lokasi:** `src/services/routeService.ts`
- **Sebelum Perbaikan:** Jika koneksi Supabase mati saat logging aktivitas dijalankan (misal: petugas login/logout/update data), log tersebut langsung terbuang tanpa jejak.
- **Sesudah Perbaikan:** Menambahkan fallback penyimpanan log yang gagal ke dalam antrean lokal `PDO_PENDING_ACTIVITY_LOGS` di `localStorage`, yang akan otomatis terkirim begitu perangkat kembali online.
- **Kasus Lapangan:** Petugas memperbarui data bus saat offline. Sebelumnya, riwayat audit admin kehilangan catatan siapa yang mengedit data tersebut. Sekarang, log audit disimpan secara lokal dan disinkronkan ke server secara background sesaat setelah jaringan kembali terhubung.
