# SS_PDO (Sistem Pencatatan Shift Bus)

SS_PDO adalah aplikasi web progresif (PWA) berbasis React yang dirancang untuk mempermudah pencatatan data operasional (KM Awal, KM Akhir, TOA, Manual Shift) dari berbagai shift bus Transjakarta. Aplikasi ini disinkronisasikan secara langsung dengan Google Sheets menggunakan Google API, memungkinkan penyimpanan data yang tersentralisasi dan mudah diakses.

Keunggulan utama aplikasi ini adalah dukungannya terhadap mode **Offline-First**. Pengguna di lapangan (seperti supir atau petugas *pool* bus) yang sering mengalami kendala sinyal internet tetap dapat mengisi data secara lancar. Data disimpan secara atomik dalam antrean lokal (Sync Queue) dan disinkronisasikan ke Google Sheets secara otomatis ketika koneksi internet kembali tersedia.

---

## 🌟 Fitur Utama

- **Integrasi Google Sheets & Dynamic Header:** Membaca dan menulis data shift bus secara *real-time*. Mendukung deteksi header dinamis dan memecah format shorthand `KM 1` / `KM 2` (misal `14.011` -> KM Awal 14, KM Akhir 011) secara otomatis.
- **Offline-First & Atomic Queueing:** Data disimpan secara atomik per-item di `localStorage`. Antrean tidak akan macet (*no head-of-line blocking*) jika ada 1 error non-auth, dengan fitur retry backoff bertahap (2s -> 5s -> 15s -> 60s).
- **Auto-save Drafts Cerdas:** Menyimpan input yang sedang diketik secara lokal via `useDebounce`. Memiliki *dirty tracking* sehingga draft kosong tidak pernah menimpa data valid di server.
- **Optimistic Concurrency Control (Pencegahan Tabrakan Data):** Pengecekan *pre-flight* sebelum menyimpan. Jika data di Google Sheets telah diubah oleh petugas lain, aplikasi akan menampilkan **Tabel Perbandingan Data Server vs Input Anda** dengan opsi *Gunakan Data Server* atau *Tetap Timpa (Force Save)*.
- **Dynamic Live Subtitle Card per-Tab Kategori:** Header card (saat tertutup) menampilkan nilai live dari server sesuai tab kategori yang aktif. Jika cell kosong, menampilkan indikator **`Belum Terisi`** berwarna merah soft (`#f87171`).
- **Proaktif Token Refresh:** Timer proaktif yang secara otomatis memperbarui token akses Google OAuth 5 menit sebelum kedaluwarsa tanpa mengganggu alur kerja pengguna.
- **Visibilitas Modal Antrean & Validation Warning:** Indikator badge antrean dengan modal terperinci untuk mengelola item antrean yang tertunda, gagal, atau berkonflik. Menampilkan warning banner jika ada kolom header sheet yang tidak terdeteksi.

---

## 🛠️ Teknologi (Tech Stack)

- **Framework:** React 19 + TypeScript (`strict: true`)
- **Build Tool:** Vite 8
- **PWA:** `vite-plugin-pwa`
- **Google API:** `gapi-script` (`@types/gapi.client.sheets`) + Google Identity Services (GIS)
- **UI & Icons:** CSS Variables (Sistem Tema Light/Dark), `lucide-react`, `@aejkatappaja/phantom-ui` (Skeleton UI)
- **Package Manager:** `pnpm`

---

## 🚀 Prasyarat & Instalasi

Pastikan Anda memiliki [Node.js](https://nodejs.org) (Node LTS disarankan) dan `pnpm` terinstal.

1. Clone repositori ini:
   ```bash
   git clone https://github.com/biiCode37/ss-pdo.git
   cd ss-pdo
   ```
2. Instal dependensi menggunakan `pnpm`:
   ```bash
   pnpm install
   ```

---

## 🔑 Konfigurasi Lingkungan (Environment Variables)

Buat file `.env` di *root* proyek (atau copy dari `.env.example`) dan isi kredensial Google API:

```env
VITE_GAPI_CLIENT_ID=GANTI_DENGAN_GOOGLE_CLIENT_ID_ANDA
VITE_GAPI_API_KEY=GANTI_DENGAN_GOOGLE_API_KEY_ANDA
```

> **Catatan:** Pastikan OAuth App di Google Cloud Console Anda sudah memasukkan URL aplikasi (misal `http://localhost:5173`) pada kolom **Authorized JavaScript origins**.

---

## 💻 Menjalankan Aplikasi

### Mode Development
```bash
pnpm run dev
```

### Verification & Production Build
```bash
pnpm run build
pnpm run preview
```

---

## 📄 Dokumentasi Tambahan

- **[CHANGELOG.md](file:///d:/MINE/SS_PDO/CHANGELOG.md):** Riwayat lengkap perubahan versi aplikasi (v1.0.0 s.d. v1.6.0).
- **[ADR 0001](file:///d:/MINE/SS_PDO/docs/adr/0001-refactoring-and-ux-enhancements.md):** Keputusan arsitektur refactoring antrean sync offline, autentikasi, dan UX card dinamis.
- **[Daftar Masalah & Audit](file:///d:/MINE/SS_PDO/refactor-ss-pdo/01-daftar-masalah.md):** Dokumentasi audit 16 bug yang telah diselesaikan.
