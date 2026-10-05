# AUDIT BUGS: LAPORAN KONDISI OPERASIONAL & ROUTE SELECTOR REFINEMENT (REFACTOR 22)

Dokumen ini mendokumentasikan temuan audit visual, ergonomi mobile, inkonsistensi tema, serta ketidakstabilan tata letak form pada komponen **Laporan Kondisi & Armada Rute** (`RouteOperationalReportCard`), **Selector Rute Morphing** (`RouteSelectorCard`), dan **Monitoring Wilayah** (`AllRouteMonitoringPage`).

---

## DAFTAR TEMUAN AUDIT

| ID Temuan | Komponen / File Terkait | Keparahan | Status |
| :--- | :--- | :---: | :---: |
| **UI-22-01** | `src/components/RouteOperationalReportCard.tsx` | 🔴 **HIGH** (Inkonsistensi Desain Sistem & Rusak di Dark Mode) | Terselesaikan |
| **UI-22-02** | `src/components/RouteSelectorCard.tsx`<br>`src/components/routeSelector/AddRouteModal.tsx` | 🟡 **MEDIUM** (Layout Stretch & Weak Morph Affordance) | Terselesaikan |
| **UI-22-03** | `src/components/AllRouteMonitoringPage.tsx` | 🟢 **LOW** (Numeric Jitter & Monitoring Density) | Terselesaikan |

---

## RINCIAN TEMUAN

### 🔴 UI-22-01: Laporan Kondisi & Armada Rute Memiliki Styling Hardcoded & Rusak di Dark Mode

- **ID Temuan:** `UI-22-01`
- **Lokasi Kode:**
  - `src/components/RouteOperationalReportCard.tsx`
- **Keparahan:** **HIGH** (Inkonsistensi Tema & Rusaknya Kontras Dark Mode)
- **Deskripsi Masalah:**
  1. Komponen menggunakan warna inline hardcoded yang tidak selaras dengan tema aplikasi: border `#cbd5e1`, background `#f1f5f9`, teks `#334155`, dan tombol simpan biru `#2563eb` (padahal identitas tema aplikasi adalah emerald green `#3ECF8E`).
  2. Pada **Dark Mode**, input form tetap memiliki warna border terang `#cbd5e1` atau latar kontras yang menusuk mata, menciptakan tampilan yang kusam, tidak profesional, dan teks menjadi sulit dibaca oleh petugas lapangan.
  3. Indikator kemacetan yang dipilih diwarnai merah pekat (`#ef4444` & border `#dc2626`), memberikan impresi negatif seolah-olah terjadi kesalahan validasi (*form error*) alih-alih status informasi lalu lintas.
  4. Label input berukuran sangat kecil (`fontSize: 10px`), menyulitkan penglihatan petugas di lapangan.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Tampilan form terasa asing, mata petugas cepat lelah saat pengisian di malam hari (Dark Mode), dan tombol simpan tidak memiliki status indikator spinner saat proses penyimpanan ke database berlangsung.
- **Mitigasi:**
  - Standardisasi container menggunakan kelas `.glass` dan variabel tema (`var(--card-bg)`, `var(--input-bg)`, `var(--border-color)`).
  - Terapkan warna amber lalu lintas yang hangat (`rgba(245, 158, 11, 0.18)` / `#f59e0b`) untuk chip titik macet aktif.
  - Perbesar keterbacaan label input dan terapkan `.tabular-nums` pada seluruh input number.
  - Gunakan tombol utama `.btn` bergradien emerald dengan loading spinner `Loader2`.

---

### 🟡 UI-22-02: Form "Tambah Rute Baru" Meregangkan Kartu Selector & Ketiadaan Affordance Kapsul

- **ID Temuan:** `UI-22-02`
- **Lokasi Kode:**
  - `src/components/RouteSelectorCard.tsx`
- **Keparahan:** **MEDIUM** (Ergonomi Tampilan & Kejelasan Interaksi Mobile)
- **Deskripsi Masalah:**
  1. Ketika tombol "Tambah Rute Baru" ditekan, form inline berukuran besar muncul tepat di dalam kartu selector, meregangkan tinggi kartu dan mendorong data bus keluar dari layar smartphone.
  2. Saat kartu selector menciut (*morphed*) menjadi kapsul ringkas, pengguna baru di layar sentuh ponsel sering kali tidak menyadari bahwa kapsul tersebut dapat diketuk kembali untuk membuka daftar rute karena tidak adanya affordance visual panah ekspansi (*chevron*).
- **Dampak ke Pengguna Lapangan (User Impact):**
  Pengguna merasa bingung bagaimana cara mengganti tanggal/rute setelah data termuat, dan kartu melompat secara drastis saat membuka form rute baru.
- **Mitigasi:**
  - Pindahkan form penambahan rute ke dalam **Modal / Bottom Sheet tersendiri** (`AddRouteModal.tsx`) yang terintegrasi dengan `useMobileBackHandler`.
  - Tambahkan ikon chevron turun (`ChevronDown size={14}`) di sisi kanan kapsul morphing sebagai penanda interaktivitas yang intuitif.

---

### 🟢 UI-22-03: Angka Metrik Bergetar pada Kartu Monitoring Regional

- **ID Temuan:** `UI-22-03`
- **Lokasi Kode:**
  - `src/components/AllRouteMonitoringPage.tsx`
- **Keparahan:** **LOW** (Kerapian Visual & Jitter Bebas)
- **Deskripsi Masalah:**
  Angka capaian penumpang, armada realops/renops, dan total kilometer pada kartu ringkasan dan kartu rute individual belum menerapkan `font-variant-numeric: tabular-nums`, menyebabkan layout mikro bergetar saat data diperbarui.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Kolom angka bergeser sedikit saat angka berubah dari digit ramping (1) ke digit lebar (8/0).
- **Mitigasi:**
  - Terapkan kelas utilitas global `.tabular-nums` pada seluruh elemen angka metrik di `AllRouteMonitoringPage`.
