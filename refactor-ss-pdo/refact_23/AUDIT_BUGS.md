# AUDIT BUGS: UNIFIED SMART PILL & CONTEXTUAL BOTTOM SHEETS (REFACTOR 23)

Dokumen ini mendokumentasikan temuan audit tata letak vertikal, kepadatan antarmuka mobile (*vertical scroll clutter*), serta integrasi navigasi operasional pada halaman utama Dashboard SS_PDO.

---

## DAFTAR TEMUAN AUDIT

| ID Temuan | Komponen / File Terkait | Keparahan | Status |
| :--- | :--- | :--- | :---: |
| **UI-23-01** | `src/components/Dashboard.tsx`<br>`src/components/RouteSelectorCard.tsx`<br>`src/components/RouteOperationalReportCard.tsx` | 🔴 **HIGH** (Vertical Scroll Clutter & Layout Overcrowding pada Layar Smartphone) | Terselesaikan |
| **UI-23-02** | `src/components/RouteSelectorCard.tsx`<br>`src/components/routeSelector/RouteSelectorSheet.tsx` | 🟡 **MEDIUM** (Interaksi Form Cascade Menggeser Konten Halaman) | Terselesaikan |
| **UI-23-03** | `src/components/Dashboard.tsx`<br>`src/components/RouteOperationalReportCard.tsx` | 🟡 **MEDIUM** (Ketiadaan Indikator Status Laporan Real-Time di Header Dashboard) | Terselesaikan |

---

## RINCIAN TEMUAN

### 🔴 UI-23-01: Form Bertumpuk Vertikal Memakan 400–700px Layar Smartphone

- **ID Temuan:** `UI-23-01`
- **Lokasi Kode:**
  - `src/components/Dashboard.tsx`
  - `src/components/RouteSelectorCard.tsx`
  - `src/components/RouteOperationalReportCard.tsx`
- **Keparahan:** **HIGH** (Vertical Scroll Clutter & Kerusakan Ergonomi Mobile)
- **Deskripsi Masalah:**
  1. Di bagian atas dashboard, kartu pemilih rute (`RouteSelectorCard`) dan kartu laporan kondisi armada (`RouteOperationalReportCard`) dirender bertumpuk secara vertikal.
  2. Saat kedua form atau salah satunya terbuka, form mengambil ruang layar antara 400px hingga 700px.
  3. Di layar ponsel lapangan berukuran sedang (tinggi viewport rata-rata 667px - 844px), seluruh data kartu bus, ringkasan armada, dan tab navigasi terdorong jauh ke bawah garis lipatan (*below the fold*).
  4. Pengguna operasional lapangan harus berkali-kali melakukan scroll ke bawah hanya untuk melihat status bus pertama.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Efisiensi dan kecepatan kerja petugas lapangan terganggu karena harus menggulir melewati form besar setiap kali membuka rute.
- **Mitigasi:**
  - Satukan kedua kontrol navigasi menjadi **1 Kapsul Pintar Ringkas (Unified Route Control Bar)** setinggi ~46px yang rapi dan elegan.
  - Pindahkan form interaktif menjadi **Contextual Bottom Sheet Drawers** (`RouteSelectorSheet` & `RouteOperationalReportCard` as modal) bergaya iOS native yang hanya muncul saat diketuk.

---

### 🟡 UI-23-02: Interaksi Form Cascade Menggeser Konten Halaman

- **ID Temuan:** `UI-23-02`
- **Lokasi Kode:**
  - `src/components/RouteSelectorCard.tsx`
  - `src/components/routeSelector/RouteSelectorSheet.tsx`
- **Keparahan:** **MEDIUM** (Layout Shifting & Distraksi Visual)
- **Deskripsi Masalah:**
  1. Sebelumnya, saat kapsul rute diketuk untuk berganti tanggal atau rute, kartu melompat (*layout shift*) dan membuka 4 baris dropdown cascade langsung di atas data bus.
  2. Begitu data termuat, kartu kembali menciut, menimbulkan efek visual yang tidak stabil dan mengagetkan mata pengguna.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Interaksi terasa kasar (*jittery*), tidak sesuai dengan standar aplikasi mobile modern yang berbasis sheet/drawer overlay.
- **Mitigasi:**
  - Ekstraksi form cascade 4 level (Tahun, Bulan, Rute, Tanggal) ke dalam `RouteSelectorSheet.tsx` yang menggunakan overlay slide-up (`cubic-bezier(0.32, 0.72, 0, 1)`), backdrop blur, handle bar sentuh, dan `useMobileBackHandler`.

---

### 🟡 UI-23-03: Ketiadaan Indikator Status Laporan Real-Time di Header Dashboard

- **ID Temuan:** `UI-23-03`
- **Lokasi Kode:**
  - `src/components/Dashboard.tsx`
  - `src/components/RouteOperationalReportCard.tsx`
- **Keparahan:** **MEDIUM** (Visibilitas Status Operasional)
- **Deskripsi Masalah:**
  1. Petugas di lapangan tidak dapat mengetahui secara langsung apakah laporan operasional untuk rute dan tanggal aktif sudah dibuat (*Draft*), sudah dikirim (*Submitted*), atau sudah divalidasi supervisor (*Verified*), tanpa membuka atau menggulir ke kartu laporan.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Rentan terjadi duplikasi pengisian laporan atau kebingungan mengenai status pengiriman laporan shift harian.
- **Mitigasi:**
  - Sediakan pill status reaktif di sisi kanan Unified Control Bar (`⚡ Laporan • Draft` / `Terkirim` / `Terverifikasi`).
  - Sinkronkan status secara real-time saat laporan dibuka, dimuat, atau disimpan.
