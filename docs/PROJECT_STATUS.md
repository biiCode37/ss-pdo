# 📌 Status & Memori Proyek SS_PDO (Single Source of Truth)

Dokumen ini berfungsi sebagai **Memori Utama (Single Source of Context)** bagi AntiGravity AI agar langsung memahami keseluruhan arsitektur, histori keputusan, fitur yang sudah selesai, dan langkah selanjutnya setiap kali **Sesi Obrolan Baru** dimulai.

---

## 🏗️ 1. Gambaran Umum Proyek
- **Nama Proyek:** SS_PDO (Operational Bus Sheet & Analytics System)
- **Teknologi Utama:** React, TypeScript, Vite, PWA, Lucide Icons, Google Sheets API.
- **Prioritas Layout:** **Mobile-First Priority** (dioptimalkan penuh untuk layar ponsel pengawas operasional di lapangan).
- **Pendekatan Data:** **Single Source of Truth (SSOT)**. Semua nilai rangkuman dan statistik berasal murni dari perhitungan rumus file asli Google Sheets tanpa adanya pemotongan/pembulatan angka desimal (presisi penuh hingga 10 desimal).

---

## ⚡ 2. Fitur & Keputusan Teknis Utama yang Telah Selesai (Completed)

### A. Autentikasi & Sesi Pengguna (Persistent Auth Session)
- Sesi login dibuat **permanen tanpa timeout**. Pengguna cukup login 1x selama tidak menghapus aplikasi/peranti. Access token diperbarui secara otomatis di latar belakang (*silent token refresh*).

### B. Form Pemilihan Rute & Tanggal (Morphing Selector Card - iOS Style)
- Form pemilihan Rute dan Tanggal memiliki animasi **iOS Fluid Morphing (Spring Easing `cubic-bezier(0.32, 0.72, 0, 1)`)**.
- **Mode Menciut (Compact Pill):** Saat data selesai dimuat (*Load Data Bus*), form setinggi ~220px menciut dengan mulus menjadi kapsul ringkas 46px (`📍 JAK.76 (JULI 2026) • 📅 Tgl 31`).
- **Interaksi Dua Arah (Bidirectional Tap Toggle):**
  - Mengetuk kapsul ringkas akan membuka kembali form pemilihan Rute & Tanggal.
  - Mengetuk area header `📍 Pilih Rute & Tanggal 🔼` pada form yang terbuka akan menciutkan kembali form menjadi kapsul tanpa perlu menekan ulang tombol *Load Data Bus*.

### C. Kartu Analitik & Nilai Rangkuman Murni (Pure SSOT Summary)
- Perhitungan angka menggunakan parser `parseIndonesianNumber()` untuk memproses format angka Indonesia (`"5.589,06"`) menjadi float presisi tinggi.
- Baris **KM/Bus** dan **Pnp/Km** (dulu *Kepadatan*) dipisahkan ke dalam 2 baris terpisah dengan perlindungan `word-break: break-all` dan angka desimal murni.
- Icon pada baris **Pnp/Km** menggunakan icon penumpang/pelanggan (`<UserCheck>`), dan teks imbuhan "Pnp/KM" di belakang angka telah dihilangkan.

### D. Kartu Status Kelengkapan Armada & Auto-Scroll Highlight
- Menggantikan daftar unit belum terisi dengan **Daftar Catatan Keterangan Bus** (`busesWithNotes`).
- Menampilkan Nama Unit dan Teks Keterangannya (misal: `NP 1`, `KMJ 1987: Mogok`).
- **Auto-Scroll & Glowing Pulse Highlight (6 Detik):** Mengetuk salah satu baris keterangan bus akan otomatis mengalihkan pengguna ke tab Input, melakukan *smooth scroll* ke kartu bus terkait, dan menyalakan efek **highlight neon berdenyut (double pulse & glow ring)** selama **6 detik** pada kartu bus yang dituju.
- Scrollbar fisik pada container daftar keterangan telah disembunyikan (`.no-scrollbar`).

---

## 📁 3. File Utama & Struktur Kode
- `src/services/googleSheets.ts`: Client Google Sheets API & `parseIndonesianNumber()`.
- `src/utils/analytics.ts`: Generator rangkuman analitik SSOT & pengumpul `busesWithNotes`.
- `src/components/RouteSelectorCard.tsx`: Komponen pemilih rute/tanggal dengan efek fluid morphing.
- `src/components/KPICard.tsx`: Kartu statistik produktivitas (KM/Bus & Pnp/Km).
- `src/components/CompletionStatusCard.tsx`: Kartu status kelengkapan & daftar Keterangan Bus.
- `src/components/Dashboard.tsx`: Komponen utama pengatur tab dan handler `onSelectUnit` + highlight trigger.
- `src/components/BusCard.tsx`: Kartu input data individual bus.
- `src/index.css`: Design tokens, iOS spring morphing animations, `.no-scrollbar`, dan `.bus-card-highlight`.

---

## 🎯 4. Cara Penggunaan Dokumen Ini dalam Sesi Baru
Setiap kali membuka sesi obrolan baru:
1. Agen AntiGravity secara otomatis memeriksa `docs/PROJECT_STATUS.md` dan `git log`.
2. Anda bisa mengingatkan dengan perintah singkat: `"Lanjutkan dari PROJECT_STATUS.md"` atau menyapa seperti biasa.
3. Agen akan langsung memahami seluruh histori, keputusan visual/arsitektur, dan status proyek tanpa perlu pengulangan dari awal.
