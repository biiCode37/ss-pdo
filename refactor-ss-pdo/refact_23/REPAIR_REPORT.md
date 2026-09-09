# REPAIR REPORT: UNIFIED SMART PILL & CONTEXTUAL BOTTOM SHEETS (REFACTOR 23)

Dokumen ini mencatat implementasi perbaikan antarmuka dan pengalaman pengguna (UI/UX) untuk menghilangkan tumpukan form vertikal setinggi ratusan piksel di halaman Dashboard utama SS_PDO, menggantikannya dengan **Opsi 1: Clean Single Pill + Contextual Bottom Sheets**.

---

## 1. IMPLEMENTASI PERBAIKAN

### 1.1 Pembuatan Komponen `RouteSelectorSheet.tsx`
- **Lokasi:** `src/components/routeSelector/RouteSelectorSheet.tsx`
- **Fungsi:**
  - Menyediakan drawer bottom sheet bergaya native iOS untuk cascade pemilihan 4 level: **Tahun → Bulan → Rute → Tanggal**.
  - Dilengkapi *touch handle bar* di bagian atas, tombol tutup `✕`, dan aksi cepat `+ Tambah Rute Baru`.
  - Terintegrasi penuh dengan `useMobileBackHandler` sehingga dapat ditutup menggunakan gesture back / tombol hardware kembali ponsel Android.
  - Memuat tombol aksi utama "Muat Data" yang otomatis menutup sheet saat data mulai dimuat.

### 1.2 Transformasi `RouteSelectorCard.tsx` Menjadi Unified Smart Pill
- **Lokasi:** `src/components/RouteSelectorCard.tsx`
- **Fungsi:**
  - Mengubah container kartu besar menjadi **1 Kapsul Pintar Ringkas (Unified Route Control Bar)** setinggi ~46px dengan glassmorphism (`backdrop-filter: blur(12px)`).
  - **Sisi Kiri:** Pill informatif rute dan tanggal aktif (`📍 JAK.115 • Tgl 9 Sep 2026 ▾`). Mengetuk sisi ini membuka `RouteSelectorSheet`.
  - **Sisi Kanan:**
    - Jika mode `AKUMULASI` aktif: tombol instan `✕ Keluar Akumulasi` (`data-testid="exit-accumulation-btn"`).
    - Jika dalam rute normal: pill status laporan operasional (`⚡ Laporan • Draft ▾` / `Terkirim` / `Terverifikasi`). Mengetuknya membuka `RouteOperationalReportCard` dalam mode modal bottom sheet.

### 1.3 Mode Modal Bottom Sheet pada `RouteOperationalReportCard.tsx`
- **Lokasi:** `src/components/RouteOperationalReportCard.tsx`
- **Fungsi:**
  - Menambahkan dukungan mode `asModal={true}` dengan overlay drawer bottom sheet (`maxHeight: 88vh`, *overflow-y: auto*).
  - Menambahkan callback `onStatusChange` untuk menyinkronkan status laporan harian (`draft`, `submitted`, `verified`) secara instan ke badge pill kontrol utama.
  - Tetap mempertahankan mode kartu accordion standar (`asModal={false}`) demi kompatibilitas 100% terhadap seluruh unit test.

### 1.4 Integrasi Reaktif di `Dashboard.tsx`
- **Lokasi:** `src/components/Dashboard.tsx`
- **Fungsi:**
  - Menghapus rendering form laporan operasional yang memadati layout di atas `BusList`.
  - Menghubungkan pembukaan modal laporan ke kapsul pintar melalui state `isReportModalOpen` dan `operationalReportStatus`.
  - Memastikan sinkronisasi otomatis status laporan saat tanggal atau rute berganti melalui `fetchDailyRouteReport`.

---

## 2. BEFORE VS AFTER

| Aspek | Sebelum Refactor 23 | Sesudah Refactor 23 |
| :--- | :--- | :--- |
| **Tata Letak Header Dashboard** | Dua kartu form besar bertumpuk (`RouteSelectorCard` & `RouteOperationalReportCard`) memakan 400px–700px tinggi layar. | Hanya **1 Kapsul Pintar Ringkas (~46px)** di atas halaman. Layar 100% bersih dan langsung menampilkan kartu bus. |
| **Interaksi Pemilihan Rute/Tanggal** | Membuka form inline secara vertikal, mendorong data bus ke bawah dan meloncat-loncat (*layout shift*). | Meluncur halus dari bawah sebagai **Bottom Sheet Drawer** dengan kurva spring iOS (`cubic-bezier(0.32, 0.72, 0, 1)`). |
| **Akses Laporan Kondisi Armada** | Terbentang panjang di antara filter tab dan daftar bus, mengganggu fokus pemeriksaan armada. | Diakses secara kontekstual melalui pill kanan di header. Membuka form lengkap dalam drawer yang nyaman diisi dengan jempol. |
| **Status Laporan Operasional** | Tersembunyi di dalam kartu laporan; petugas harus scroll untuk memeriksa status kirim. | Terpampang jelas dan reaktif langsung di header (`Draft`, `Terkirim`, atau `Terverifikasi`). |
| **Navigasi Kembali (Android Back)** | Pengguna sering tidak sengaja keluar aplikasi saat mencoba menutup form pemilih. | Dilindungi oleh `useMobileBackHandler` di kedua sheet; tombol back ponsel menutup drawer dengan aman. |

---

## 3. CASE: SKENARIO LAPANGAN

### Kasus 1: Petugas Lapangan Memeriksa Kesiapan Bus di Pool Pagi Hari
- **Skenario:** Di pagi hari yang sibuk, petugas membuka aplikasi SS_PDO di ponsel untuk memeriksa apakah seluruh unit JAK.115 sudah terinput ritasenya.
- **Sebelumnya:** Begitu aplikasi dibuka, layar dipenuhi oleh dropdown form pemilihan rute dan form laporan armada. Petugas harus mengusap layar 2–3 kali ke bawah hanya untuk melihat kartu unit pertama.
- **Sesudah Refactor:** Layar langsung menampilkan kapsul ringkas `[📍 JAK.115 • Tgl 9 Sep ▾] [⚡ Laporan • Draft ▾]`, dan tepat di bawahnya langsung terpampang rapi kartu unit bus `JAK.115-01`, `JAK.115-02`, dst. Petugas langsung dapat mengecek dan mengedit data tanpa terhalang form.

### Kasus 2: Pengisian Laporan Operasional Shift Malam
- **Skenario:** Menjelang pergantian shift, petugas ingin mengisi realisasi operasi dan titik kemacetan rute.
- **Sebelumnya:** Form laporan berada di tengah halaman; saat papan ketik virtual (*soft keyboard*) ponsel muncul, seluruh layout terdorong secara canggung.
- **Sesudah Refactor:** Petugas cukup mengetuk pill `[⚡ Laporan • Draft ▾]` di kanan atas. Bottom sheet yang elegan meluncur dari bawah dengan latar belakang blur. Petugas mengisi shift 1 & 2, memilih titik macet, lalu menekan "Kirim Laporan Operasional". Status pill di header langsung berubah menjadi warna biru cerah `[⚡ Laporan • Terkirim ▾]`, memberikan kepastian instan bahwa data telah tersimpan di Supabase.

### Kasus 3: Memeriksa Data Rekap Akumulasi Bulanan
- **Skenario:** Pengguna mengaktifkan mode akumulasi untuk melihat total ritase bulanan.
- **Sebelumnya:** Banner mode akumulasi berbaur di dalam tumpukan form yang padat.
- **Sesudah Refactor:** Kapsul utama menampilkan `[📍 JAK.115 • Akumulasi (01/09 - 05/09) ▾]` dan sisi kanan berubah menjadi tombol kontras tinggi `[✕ Keluar Akumulasi]`. Sekali ketuk, pengguna langsung kembali ke mode harian dengan transisi yang sangat bersih.

---

## 4. VERIFIKASI & QUALITY GATES

1. **Unit Testing:**
   ```bash
   pnpm vitest run src/
   ```
   *Hasil:* **34 test files passed, 255 tests passed (100% pass, 0 failure).**
2. **TypeScript Strict & Production Build:**
   ```bash
   pnpm run build
   ```
   *Hasil:* **Vite production build sukses dalam 1.03s, 0 error TypeScript.**
3. **Penyelarasan Tema:**
   - 100% mendukung Light Mode dan Dark Mode dengan token CSS variabel native.
