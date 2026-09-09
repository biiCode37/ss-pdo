# Spesifikasi Desain: Manajemen Status Armada Harian & Master Renops Dinamis

**Tanggal:** 9 September 2026  
**Status:** Disetujui (Ready for Implementation Plan)  
**Tujuan:** Mengotomatiskan penentuan kesiapan armada (SGO / TO / OFF / BA), menghitung nilai Realops secara akurat dari unit yang beroperasi, menyediakan Master Data Renops dinamis (Hari Kerja, Weekend, dan Libur Nasional), serta menjaga tampilan layout dashboard tetap ultra-bersih, elegan, dan bebas dari kepadatan vertikal.

---

## 1. Latar Belakang & Masalah

1. **Inkonsistensi Nilai Realops & Status Lapangan:**
   - Selama ini nilai Realops pada form Laporan Operasional diinput secara manual atau terpisah dari status sebenarnya dari 15–60 unit bus di rute terkait.
   - Petugas sering kali lupa menandai bus yang `OFF` (libur) atau `TO` (tidak operasi), sehingga unit tersebut berisiko terisi data ritase secara tidak sengaja (*human error*).
2. **Ketiadaan Konfigurasi Rencana Operasi (Renops) Dinamis:**
   - Target Renops sebuah rute berbeda antara Hari Kerja (Senin–Jumat), Sabtu, Minggu, dan Hari Libur Nasional.
   - Saat ini nilai `default_renops` pada master rute hanya berupa 1 angka tunggal statis, sehingga petugas harus mengubahnya manual setiap akhir pekan atau hari libur.
3. **Kebutuhan Layout Bersih & Elegan (Mobile-First):**
   - Sesuai evaluasi Refactor 23 & 24, antarmuka dashboard tidak boleh dipadati oleh tumpukan form vertikal.
   - Peringatan awal shift dan penentuan status armada wajib disajikan dalam antarmuka yang sangat ringkas (*slim contextual capsule/banner*), sementara proses penataan armada disediakan dalam satu halaman khusus (*Full Screen View*) yang fokus dan ergonomis.

---

## 2. Arsitektur & Model Data

### 2.1 Master Data Renops di Supabase (`public.routes`)
Menambahkan 4 kolom baru pada tabel `routes` di Supabase untuk menampung target Renops per kategori hari:
- `renops_weekday` (`integer`): Target Renops Senin–Jumat.
- `renops_saturday` (`integer`): Target Renops hari Sabtu.
- `renops_sunday` (`integer`): Target Renops hari Minggu.
- `renops_holiday` (`integer`): Target Renops Hari Libur Nasional / Tanggal Merah.

*Fallback:* Jika kolom-kolom baru masih `NULL`, sistem secara otomatis menggunakan nilai `default_renops` yang sudah ada.

### 2.2 Modul Utilitas Kalender & Libur Nasional (`src/utils/holidayUtils.ts`)
Fungsi pembantu untuk mendeteksi profil hari berdasarkan tanggal aktif (`YYYY-MM-DD`):
1. Menentukan hari dalam pekan:
   - 0: Minggu (`sunday`)
   - 6: Sabtu (`saturday`)
   - 1–5: Hari Kerja (`weekday`)
2. Memeriksa apakah tanggal tersebut terdaftar dalam kalender Hari Libur Nasional Indonesia:
   - Jika libur nasional: kategori otomatis dialihkan ke `holiday`.
3. Mengembalikan nilai Renops yang sesuai:
   `getRenopsForDate(route: Route, dateStr: string): { renops: number; dayType: 'weekday' | 'saturday' | 'sunday' | 'holiday'; label: string }`

### 2.3 Standar Penulisan Keterangan di Google Sheets (SSOT)
- **SGO (Siap Guna Operasi):**
  Kolom `Keterangan` **dikosongkan** (`""`). Baris bus tidak diberi highlight warna (tampilan normal).
- **TO / OFF / BA:**
  Kolom `Keterangan` diisi teks baku (`"OFF"`, `"TO EVDAL"`, `"BA.01"`, `"BA.02 NP1"`, dll.) dan diberi warna baris sesuai standar `sheetColorUtils.ts`.
- **Keterangan Berbeda Antar Shift:**
  Jika Shift 1 dan Shift 2 memiliki catatan berbeda (misal paginya jalan normal, siangnya mogok), keterangan digabungkan menggunakan pemisah pipe `" | "`.
  *Contoh:*
  - Shift 1 SGO, Shift 2 BA.02: `BA.02 NP1`
  - Shift 1 BA.01, Shift 2 TO EVDAL: `BA.01 Radiator Bocor | TO EVDAL`

### 2.4 Perhitungan Realops Otomatis
- `Realops Shift 1` = Jumlah unit armada yang berstatus **SGO** pada Shift 1.
- `Realops Shift 2` = Jumlah unit armada yang berstatus **SGO** pada Shift 2.
- Nilai ini otomatis disinkronkan ke tabel `daily_route_reports` di Supabase saat status armada dikonfirmasi.

---

## 3. Desain Antarmuka Pengguna (UI/UX)

Prinsip utama: **Ultra-Clean, Zero Layout Shift, Zero Vertical Clutter**.

### 3.1 Peringatan Awal Shift: Slim Contextual Alert Bar
- Diletakkan tepat di bawah header kapsul rute dengan tinggi ramping (~38px) dan animasi slide-down halus (`cubic-bezier(0.32, 0.72, 0, 1)`):
  - **Kondisi Muncul:**
    - Shift 1 (Pagi hingga siang < 14.00): Jika status armada Shift 1 hari itu belum dikonfirmasi.
    - Shift 2 (Mulai jam 14.00 ke atas): Jika status armada Shift 2 belum dikonfirmasi.
  - **Tampilan:**
    Kapsul glass bernuansa amber/warning lembut:
    `[ ⚠️ Status Armada Shift 1 Belum Dikonfirmasi • Tentukan Status → ]`
  - **Interaksi:**
    - Mengetuk kapsul membuka **Full Screen Fleet Status Modal**.
    - Setelah dikonfirmasi, bar ini langsung meluncur hilang (*slide up & fade out*), mengembalikan 100% ruang vertikal layar ke daftar bus.

### 3.2 Akses Manual Kapan Saja
- Menambahkan ikon/tombol cepat di sisi header kontrol rute atau di dalam drawer Laporan Operasional:
  `[ 📋 Status Armada ]`
  Memungkinkan petugas membuka Full Grid kapan saja jika terjadi pertukaran armada mendadak di lapangan.

### 3.3 Halaman Penuh: Full Screen Fleet Status Modal (`FleetStatusModal.tsx`)
Sebuah tampilan modal layer penuh (*portal z-index 99999*) yang dirancang khusus untuk kecepatan input jempol di layar sentuh mobile:

1. **Header Bar:**
   - Tombol `[✕ Tutup]` dan Judul Rute (misal `JAK.15`).
   - Tanggal aktif & Badge Target Renops dinamis (misal `Target: 60 Unit • Hari Kerja`).
   - Toggle Pilihan Shift: `[ Shift 1 (Pagi) ]` vs `[ Shift 2 (Siang) ]`.
2. **Mode Kuas / Active Brush Bar:**
   - Palet brush status:
     - `[ 🟢 SGO ]` (Default aktif)
     - `[ 🟡 OFF ]`
     - `[ 🔴 T.O ]`
     - `[ 🔵 Keterangan / BA ]`
   - Aksi Instan:
     - `[ ⚡ SGO Semua Unit ]` (Mengubah seluruh unit menjadi SGO dalam 1 kali tap).
3. **Grid Kartu Armada Bus:**
   - Grid fleksibel (2–3 kolom di mobile, 4–6 kolom di tablet/desktop).
   - Setiap kartu menampilkan:
     - Nomor Body Bus (misal `JAK.15-01`).
     - Badge status saat ini (`SGO`, `OFF`, `T.O`, `BA.02`).
     - Catatan detail (jika ada).
     - Indikator visual warna border & latar belakang yang jelas dan elegan.
   - **Interaksi Kartu:**
     - **Single Tap:** Langsung menerapkan status sesuai mode brush yang sedang aktif.
     - **Long Press / Ikon Titik Tiga:** Membuka popover detail untuk memilih variasi BA (BA.01, BA.02 NP1/NP2, BA.03, BA.04) atau mengetik catatan kendala khusus.
4. **Floating Bottom Action Bar:**
   - Ringkasan Real-Time: `SGO (Realops): 57 | OFF: 1 | T.O: 1 | BA: 1`.
   - Tombol Utama: `[ ✓ Konfirmasi & Terapkan Status Armada Shift X ]`.
   - Tombol ini melakukan:
     1. Batch update kolom `Keterangan` ke Google Sheets.
     2. Update `realops_shift1` / `realops_shift2` ke Supabase `daily_route_reports`.
     3. Menandai shift tersebut telah terkonfirmasi sehingga alert dashboard padam.

### 3.4 Perilaku Interaksi Kartu Bus di Dashboard Utama (Opsi B: Non-Blocking)
- Ketika petugas mengetuk kartu bus yang sedang berstatus `OFF` atau `TO`:
  - Muncul konfirmasi ramah (*SweetAlert2*):
    *"Unit JAK.15-03 saat ini berstatus [OFF / T.O]. Apakah unit ini dioperasikan (SGO)?"*
    - Tombol 1: `[ Jadikan SGO & Buka Form ]` ➔ Otomatis ubah status unit menjadi SGO dan buka modal pengisian ritase.
    - Tombol 2: `[ Batal ]` ➔ Menutup dialog tanpa mengubah data.

---

## 4. Pengujian & Quality Gates

1. **Unit Testing:**
   - Test utilitas `holidayUtils.test.ts`: verifikasi hari kerja, akhir pekan (Sabtu/Minggu), dan hari libur nasional.
   - Test `renopsCalculation.test.ts`: verifikasi pemilihan nilai Renops dari master route berdasarkan hari.
   - Test format keterangan per-shift (`keteranganUtils.test.ts`): pemisahan dan penggabungan dengan format `" | "`.
   - Test komponen `FleetStatusModal.test.tsx`: brush interaction, batch SGO semua, kalkulasi summary realops.
2. **Quality Gates:**
   - 100% test lulus pada `pnpm vitest run src/`.
   - `tsc -b` & `pnpm run build` lulus 0 error.
   - `graphify update .` diperbarui.
   - Dukungan penuh Dark Mode dan Light Mode.
