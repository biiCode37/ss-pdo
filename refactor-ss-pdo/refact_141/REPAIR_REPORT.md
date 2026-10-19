# REPAIR REPORT: Perombakan Konsep UI Minimalis & Kontrol Header Rute/Tanggal (Fase 3)

## Informasi Refactor
- **ID Refactor:** `refact_141`
- **Tanggal:** 18 Oktober 2026
- **Branch:** `devmode`
- **Terkait Temuan:** BUG-141-01, BUG-141-02, BUG-141-03

---

## Implementasi Perbaikan

### 1. Kapsul Header Tanggal & Status Laporan Modern (`UnifiedRouteControlBar`)
- **Struktur Kapsul Elegan:**
  - Mengurangi padding berlebih menjadi `5px 8px` dengan `border-radius: 12px` dan glassmorphism `backdrop-filter: blur(16px)` tipis.
  - Teks tanggal operasional menggunakan ukuran `12.5px` berbobot `600`, anti-overflow ellipsis, dan ikon kalender beraksen emerald.
  - Pill laporan operasional A2 dan tombol keluar akumulasi diberi sudut `8px` dan padding proporsional.

---

### 2. Modernisasi Baris Kontrol Daftar Bus (`BusListControlBar`)
- **Harmonisasi Tombol Operasi Massal & Fokus Kolom:**
  - Tombol "Set Jumlah Trip" dan dropdown "Fokus Kolom" di-style dengan sudut lengkung halus (`10px`), latar kaca transparan `var(--input-bg)`, dan border tipis `var(--card-border)`.
  - Dropdown fokus kolom menggunakan `font-weight: 600` dan panah chevron yang presisi.
- **Pencarian & Filter Sisa Unit:**
  - Kotak pencarian nomor body bus terintegrasi rapi dengan tombol filter `[Sisa Unit]` / `[Filter]`.
  - Saat mode filter sisa unit aktif, tombol berubah menjadi pill beraksen dengan border tegas dan latar subtil agar status filter langsung disadari oleh pengguna.

---

### 3. Polish Cascade Selector Drawer (`RouteSelectorSheet`)
- **Micro-Typography pada 4 Dropdown:**
  - Mengubah label Tahun, Bulan, Rute, dan Tanggal menjadi format mikro (9.5px, uppercase, letter-spacing 0.04em, warna `var(--text-secondary)`).
  - Mengurangi padding vertikal elemen `<select>` menjadi `8px 10px` dengan sudut `10px` sehingga seluruh formulir pas di layar tanpa scrolling.

---

## Perbandingan Before vs After

| Parameter | Sebelum Refactor (Before) | Sesudah Refactor (After) |
|---|---|---|
| **Kapsul Tanggal Header** | Padding kaku, border tebal, rawan wrap pada layar 360px | Kapsul tipis elegan (12px radius, 12.5px font, ellipsis rapi) |
| **Kontrol List Bus** | Tombol trip & select fokus kolom berpenampilan form klasik | Rounded capsule modern yang serasi dengan kartu bus Fase 1 |
| **Drawer Pemilih Rute** | Label form standar memakan tinggi layar | Label mikro efisien (9.5px uppercase) menghemat tinggi drawer |

---

## Case: Skenario Lapangan

### Skenario 1: Petugas Lapangan Membuka Aplikasi di Layar Ponsel Sempit (360px - 380px)
- **Sebelum Perbaikan:** Teks tanggal dan pill laporan di header berdesakan, tombol filter di bawah terasa kaku.
- **Sesudah Perbaikan:** Header tampil sangat ramping dan elegan. Seluruh teks terbaca bersih tanpa overflow.

### Skenario 2: Beralih Antara Mode "Semua Kolom" dan Fokus Input Spesifik
- **Sebelum Perbaikan:** Dropdown fokus kolom terlihat seperti input form standar yang kaku.
- **Sesudah Perbaikan:** Dropdown menyatu secara alami dengan bilah kontrol, memudahkan perpindahan kategori dengan transisi cepat.
