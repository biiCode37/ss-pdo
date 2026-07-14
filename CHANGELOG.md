# Changelog

Semua perubahan penting dalam proyek ini akan didokumentasikan di dalam file ini.

Format pencatatan berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan proyek ini mematuhi [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
