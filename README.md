# SS_PDO (Sistem Pencatatan Shift Bus)

SS_PDO adalah aplikasi web progresif (PWA) berbasis React yang dirancang untuk mempermudah pencatatan data operasional (KM Awal dan KM Akhir) dari berbagai shift bus. Aplikasi ini disinkronisasikan secara langsung dengan Google Sheets menggunakan Google API, memungkinkan penyimpanan data yang tersentralisasi dan mudah diakses.

Keunggulan utama aplikasi ini adalah dukungannya terhadap mode **Offline**. Pengguna di lapangan (seperti supir atau petugas *pool* bus) yang sering mengalami kendala sinyal internet tetap dapat mengisi data. Data akan disimpan secara lokal terlebih dahulu dalam antrean (Sync Queue) dan akan disinkronisasikan ke Google Sheets secara otomatis ketika koneksi internet kembali tersedia.

## Fitur Utama

- **Integrasi Google Sheets**: Membaca dan menulis data shift bus secara *real-time* ke spreadsheet.
- **PWA & Offline-First**: Aplikasi dapat diakses tanpa koneksi internet (menggunakan Service Worker dari Vite PWA) dan menyimpan operasi penyimpanan (save) dalam *queue* lokal.
- **Auto-save Drafts**: Menyimpan input yang sedang diketik secara lokal sementara, mencegah kehilangan data akibat aplikasi tertutup.
- **Pencegahan Tabrakan Data**: Validasi keamanan (Optimistic Concurrency Control) sebelum menyimpan, sehingga data tidak akan tertimpa tanpa sengaja jika ada petugas lain yang mengedit baris yang sama.
- **Visibilitas Sinkronisasi**: Menampilkan indikator (badge) antrean data yang belum tersinkronisasi.
- **Skeleton Loading**: Tampilan UI *shimmer* yang lebih mulus ketika data bus sedang dimuat.
- **Mobile-Friendly UX**: Antarmuka interaksi dioptimalkan untuk perangkat seluler.

## Teknologi (Tech Stack)

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 8
- **PWA:** `vite-plugin-pwa`
- **Google API:** `gapi-script` (@types/gapi.client.sheets)
- **UI & Icons:** `@aejkatappaja/phantom-ui` (Skeleton), `lucide-react`
- **Linter:** `oxlint`

## Prasyarat & Instalasi

Pastikan Anda memiliki [Node.js](https://nodejs.org) (dan `corepack` / `pnpm`) terinstal.

1. Clone repositori ini.
2. Instal dependensi:
   ```bash
   pnpm install
   ```

## Konfigurasi Lingkungan (Environment Variables)

Aplikasi ini membutuhkan kredensial Google API untuk dapat mengakses Google Sheets. Buat file `.env` di *root* proyek (atau copy dari `.env.example` jika ada) dan isi dengan konfigurasi berikut:

```env
VITE_GAPI_CLIENT_ID=GANTI_DENGAN_GOOGLE_CLIENT_ID_ANDA
VITE_GAPI_API_KEY=GANTI_DENGAN_GOOGLE_API_KEY_ANDA
```
*Pastikan OAuth App di Google Cloud Console Anda sudah memasukkan URL aplikasi (contoh: `http://localhost:5173`) pada kolom **Authorized JavaScript origins**.*

## Menjalankan Aplikasi

### Development Mode

Untuk menjalankan server *development* dengan fitur HMR:
```bash
pnpm run dev
```

### Build & Production (Untuk menguji PWA)

Mode PWA (Service Worker) biasanya hanya aktif setelah aplikasi melalui proses *build*.
```bash
pnpm run build
pnpm run preview
```

## Kontribusi & Panduan Kode

- Selalu gunakan `pnpm` (bukan `npm` atau `yarn`) untuk konsistensi *lockfile*.
- Rujuk file `CHANGELOG.md` untuk melihat daftar pembaruan rilis.
