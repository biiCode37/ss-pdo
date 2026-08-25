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
- **Tabel Audit Komprehensif (`activity_logs`):** Mencatat seluruh aksi login, modifikasi data bus harian (dengan chip indikator ritase, penumpang, pendapatan, dll.), perubahan peran, dan sinkronisasi antrean offline.
- **Filter Kategori Streamlined:** Tab kategori ringkas (*Semua, Input Operasional, Pengguna, Sistem*) yang bersih tanpa distraksi badge counter angka.
- **Modal Inspeksi Log:** Tampilan modal transparan dark-glass untuk melihat metadata teknis aktivitas secara aman.

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
- Input lokal disimpan secara atomik per-item di `localStorage` via antrean sinkronisasi.
- Memiliki *Optimistic Concurrency Control* (deteksi tabrakan data server vs lokal dengan modal perbandingan).
- *No head-of-line blocking* dengan *retry backoff* eksponensial (2s -> 5s -> 15s -> 60s).

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

