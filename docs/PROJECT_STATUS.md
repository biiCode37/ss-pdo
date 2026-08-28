# 📌 Status & Memori Proyek SS_PDO (Single Source of Truth)

Dokumen ini berfungsi sebagai **Memori Utama (Single Source of Context)** bagi AntiGravity AI agar langsung memahami keseluruhan arsitektur, histori keputusan, fitur yang sudah selesai, dan batasan teknis setiap kali **Sesi Obrolan Baru** dimulai.

---

## 🏗️ 1. Gambaran Umum Proyek
- **Nama Proyek:** SS_PDO / SPUM (Spreadsheet PDO Utara Mobile)
- **Teknologi Utama:** React 19, TypeScript (Strict Mode), Vite 8, PWA, Lucide Icons, Google Sheets API, Supabase Postgres (RLS), SweetAlert2 (Themed).
- **Prioritas Layout:** **Mobile-First Priority** (dioptimalkan penuh untuk layar ponsel pengawas operasional di lapangan, mendukung Light Mode & Dark Mode).
- **Pendekatan Data:** **Single Source of Truth (SSOT)**. Semua nilai rangkuman dan statistik berasal murni dari rumus file asli Google Sheets tanpa adanya pemotongan/pembulatan angka desimal (presisi penuh hingga 10 desimal).
- **Parsing Angka Spreadsheet:** Wajib menggunakan `parseIndonesianNumber()` dari `src/utils/numberUtils.ts`.

---

## ⚡ 2. Fitur & Keputusan Teknis Utama yang Telah Selesai (Completed)

### A. Autentikasi & Multi-Role Access Control (Supabase RBAC)
- **Sesi Login Permanen:** Pengguna cukup login 1x tanpa batas waktu (*no session timeout*). Token akses Google diperbarui di latar belakang secara transparan (*silent token refresh*).
- **3 Tingkatan Peran Akun (Role):**
  - **Superadmin:** Hak akses penuh atas seluruh rute, manajemen pengguna, perubahan peran, dan audit trail.
  - **Admin:** Hak akses konfigurasi rute, pemantauan log audit, dan penambahan akun petugas.
  - **Petugas:** Hak akses pengisian form bus harian pada rute yang ditugaskan.
- **Proteksi Soft-Delete:** Pencabutan akses akun pengguna tidak melakukan *hard delete*, melainkan mengupdate kolom `is_active = FALSE` di tabel Supabase `user_profiles`.

### B. Halaman Manajemen Pengguna (User Management)
- **Visual Role Badge:** Container badge berformat pil terstruktur dengan kontras tinggi (Superadmin gradien emas-ungu, Admin biru langit, Petugas hijau zamrud) dengan ikon representatif.
- **iOS-style Toggle Switch:** Mengaktifkan atau menonaktifkan status akun secara instan dengan kurva animasi pegas fisik Apple (`cubic-bezier(0.32, 0.72, 0, 1)`).
- **Proteksi Akun Superadmin:** Kartu akun Superadmin secara otomatis menyembunyikan toggle status dan tombol ubah peran untuk mencegah penonaktifan atau penurunan wewenang yang tidak disengaja.
- **Foto Profil Google:** Dukungan `referrerPolicy="no-referrer"`, fallback inisial monogram biru, dan sinkronisasi otomatis Google User Info API ke database Supabase.

### C. Log Aktivitas & Jejak Audit (Audit Trail)
- **Tabel Audit Komprehensif (`activity_logs`):** Mencatat aksi login/logout, modifikasi data bus, perubahan pengguna, konfigurasi rute, formatting spreadsheet, dan sinkronisasi antrean offline.
- **Bahasa Operasional:** Semua role melihat kartu log dengan kalimat awam, nama pelaku yang mudah dibaca, objek aktivitas, konteks rute, dan waktu. ID teknis serta raw JSON tidak ditampilkan di permukaan.
- **Filter Kategori:** Tab `Semua`, `Data Bus`, `Pengguna`, `Rute`, `Sinkronisasi`, `Login`, dan `Sistem`.
- **Detail Aktivitas:** Tombol `Lihat detail` membuka detail tanpa request tambahan. Log baru `UPDATE_BUS_DATA` menyimpan `details.changedValues.before` dan `details.changedValues.after`; nilainya ditampilkan sebagai `SEBELUM` dan `SESUDAH`. Log lama yang belum memiliki snapshot menampilkan pemberitahuan bahwa nilai historis belum tersedia.
- **Batas Data:** Halaman mengambil maksimal 150 log terbaru dan melakukan pencarian/filter di client.

### D. Sistem Dialog & Theming SweetAlert2 Terpadu
- Seluruh alert dan modal konfirmasi menggunakan utilitas terpusat `pdoSwal` dari `src/utils/alertUtils.ts`.
- Mendukung dua tema: Glassmorphism gelap (`#0f172a` / `#1e293b`) dan tema terang (`#ffffff` / `#f8fafc`) dengan styling form input khusus (`.pdo-swal-input`, `.pdo-swal-select`).
- **Anti-XSS:** Seluruh variabel dinamis pada modal HTML wajib dibungkus dengan `escapeHtml()`.

### E. Form Pemilihan Rute & Tanggal (Morphing Selector Card - iOS Style)
- Form pemilihan Rute dan Tanggal memiliki animasi **iOS Fluid Morphing (Spring Easing `cubic-bezier(0.32, 0.72, 0, 1)`)**.
- **Mode Menciut (Compact Pill):** Saat data selesai dimuat (*Load Data Bus*), form setinggi ~220px menciut dengan mulus menjadi kapsul ringkas 46px (`📍 JAK.76 (JULI 2026) • 📅 Tgl 31`).
- **Interaksi Dua Arah (Bidirectional Tap Toggle):**
  - Mengetuk kapsul ringkas akan membuka kembali form pemilihan Rute & Tanggal.
  - Mengetuk area header form yang terbuka akan menciutkan kembali form menjadi kapsul tanpa perlu menekan ulang tombol *Load Data Bus*.

### F. Kartu Analitik & Nilai Rangkuman Murni (Pure SSOT Summary)
- Perhitungan angka menggunakan parser `parseIndonesianNumber()` untuk memproses format angka Indonesia (`"5.589,06"`) menjadi float presisi tinggi.
- Baris **KM/Bus** dan **Pnp/Km** dipisahkan ke dalam 2 baris terpisah dengan perlindungan `word-break: break-all` dan angka desimal murni.
- **Auto-Scroll & Glowing Pulse Highlight (6 Detik):** Mengetuk salah satu baris keterangan bus pada kartu status kelengkapan akan otomatis mengalihkan pengguna ke tab Input, melakukan *smooth scroll* ke kartu bus terkait, dan menyalakan efek **highlight neon berdenyut** selama **6 detik**.

### G. Offline-First & Atomic Sync Queueing
- Input lokal disimpan secara atomik per-item di `localStorage` via antrean sinkronisasi `PDO_SYNC_QUEUE`.
- Memiliki *Optimistic Concurrency Control*: perubahan server dibandingkan dengan snapshot lokal sebelum data ditulis.
- Jika ada konflik online, user dapat menggabungkan data server terbaru milik petugas lain dengan input lokalnya, lalu menyimpan payload gabungan tanpa mengetik ulang.
- Jika konflik terjadi pada antrean offline, item ditandai `conflict` dan dikeluarkan dari proses otomatis sampai user memilih retry, gunakan data server, atau force-save.
- Retry otomatis berjalan saat event `online` dan scheduler 45 detik untuk item `pending`; setelah 5 kali gagal item berubah menjadi `failed`. Ada jeda 2 detik antar item sukses untuk mengurangi risiko rate limit Google Sheets.

### H. Dokumentasi Audit/Refactor
- Setiap audit kode atau refactor wajib didokumentasikan di `refactor-ss-pdo/refact_N` sesuai urutan.
- Setiap folder refactor wajib berisi `AUDIT_BUGS.md` dan `REPAIR_REPORT.md`.
- `AUDIT_BUGS.md` memuat ID temuan, lokasi kode, keparahan, deskripsi, dampak user, dan mitigasi.
- `REPAIR_REPORT.md` memuat implementasi, perbandingan Before vs After, dan Case: Skenario Lapangan untuk setiap perbaikan.
- Dokumentasi terbaru:
  - `refactor-ss-pdo/refact_7/`: audit/perbaikan stabilitas umum, konflik data, offline queue, dan audit awal.
  - `refactor-ss-pdo/refact_8/`: revamp halaman Log Aktivitas & Audit menjadi bahasa operasional awam.
  - `refactor-ss-pdo/refact_9/`: filter kombinasi [rute, hari, bulan, tahun, rentang aksi] di halaman Log Aktivitas, backfill log lama, dan index pendukung.

### I. Status Verifikasi Terakhir
- `npm run test`: 23 file test lulus, 207 test lulus.
- `npm run build`: sukses.
- `npm run lint`: tidak ada error; warning lama masih ada di area historis/non-kritis.

### J. Perbaikan Baru (Refactor 8)
- Halaman Log Aktivitas & Audit: semua role melihat kartu log dengan bahasa operasional, nama pelaku yang mudah dibaca, objek aktivitas, konteks rute, dan waktu.
- Tombol `Lihat detail` membuka detail tanpa request tambahan. Log baru `UPDATE_BUS_DATA` menyimpan `details.changedValues.before` dan `details.changedValues.after`; nilainya ditampilkan sebagai `SEBELUM` dan `SESUDAH`.
- Log lama yang belum memiliki snapshot menampilkan pemberitahuan bahwa nilai historis belum tersedia.
- Kategori filter diperluas: Semua, Data Bus, Pengguna, Rute, Sinkronisasi, Login, Sistem.
- Tidak ada ID teknis (`sheetId`, `queueItemId`, dll) di UI permukaan; tetap tersedia di detail admin jika diperlukan.

### K. Filter Lanjutan Log Aktivitas (Refactor 9)
- Panel "Filter rute dan waktu" (kolapsibel) di bawah search/tabs halaman Log Aktivitas.
- Dua grup filter independen: Periode operasional (rute, tahun, bulan, hari) dan Rentang waktu aksi (dari–sampai).
- Tombol Terapkan memicu request Supabase server-side, bukan auto-fetch per perubahan input.
- Filter server-side via `eq('route_code', ...)` + `details->>year/month/day` + `gte/lte('created_at', ...)`.
- Log baru (`UPDATE_BUS_DATA`, `UPDATE_BULK_BUS_DATA`, `SYNC_OFFLINE_QUEUE`, `FORMAT_WHOLE_SHEET`) kini menulis `route_code` (kolom top-level) + `details.year/month/day` lewat helper `resolveRouteContext`.
- Backfill log lama: migrasi `20260828000000_backfill_activity_log_route_context.sql` melakukan UPDATE dengan join ke `route_sheets`+`routes` agar log historis kompatibel dengan filter baru.
- Index `idx_activity_logs_route_created (route_code, created_at DESC)` untuk performa filter.

---

## 📁 3. File Utama & Struktur Kode

```
src/
├── components/
│   ├── AuditLogPage.tsx        # Halaman Log Aktivitas & Jejak Audit
│   ├── BusCard.tsx             # Kartu input data individual bus
│   ├── BusList.tsx             # Kontainer daftar kartu bus
│   ├── CompletionStatusCard.tsx# Kartu status kelengkapan & daftar Keterangan Bus
│   ├── Dashboard.tsx           # Komponen dashboard utama
│   ├── KPICard.tsx             # Kartu statistik produktivitas (KM/Bus & Pnp/Km)
│   ├── LoginScreen.tsx         # Layar login Google GIS
│   ├── ProfileMenuSheet.tsx    # Drawer profil pengguna & navigasi admin
│   ├── RoleBadge.tsx           # Badge indikator peran pengguna (Superadmin, Admin, Petugas)
│   ├── RouteSelectorCard.tsx   # Komponen pemilih rute/tanggal dengan fluid morphing
│   └── UserManagementPage.tsx  # Halaman kelola pengguna & RBAC
├── services/
│   ├── googleSheets.ts         # Client Google Sheets API & pemrosesan spreadsheet
│   ├── routeService.ts         # Service Supabase (profil pengguna, rute, log audit)
│   └── supabase.ts             # Inisialisasi Supabase client & environment guard
├── utils/
│   ├── alertUtils.ts           # Utilitas modal SweetAlert2 (pdoSwal, escapeHtml)
│   ├── analytics.ts            # Kalkulasi SSOT & agregator analitik
│   ├── errorFormatter.ts       # Formatter error ramah pengguna (non-teknis)
│   └── numberUtils.ts          # Parser angka format Indonesia (parseIndonesianNumber)
└── index.css                   # Design tokens, animasi iOS spring, tema dark/light
```

---

## 🎯 4. Cara Penggunaan Dokumen Ini dalam Sesi Baru
Setiap kali membuka sesi obrolan baru:
1. Agen AntiGravity secara otomatis memeriksa `docs/PROJECT_STATUS.md` dan `git log`.
2. Anda bisa mengingatkan dengan perintah singkat: `"Lanjutkan dari PROJECT_STATUS.md"` atau menyapa seperti biasa.
3. Agen akan langsung memahami seluruh histori, keputusan visual/arsitektur, dan status proyek tanpa perlu pengulangan dari awal.

