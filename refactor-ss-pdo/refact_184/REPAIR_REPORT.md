# Laporan Perbaikan Bug & Penyempurnaan Plotting Harian & Smart Ritase (Refactor 184)

## Ringkasan Perbaikan

Siklus **Refactor 184** menyelesaikan seluruh temuan kritis dari hasil pengujian nyata modul **Plotting Harian** dan **Smart Ritase** pada peranti ponsel di rute aktif **JAK.115 (Tanjung Priok - Pegangsaan II IGI)**. Perbaikan mencakup sisi Frontend (FE) maupun Backend (BE) dengan fokus utama pada kebebasan input target ritase operasional, koreksi ekstraksi nama pangkalan rute ganda, eliminasi nomor urutan duplikat, ergonomi antarmuka mobile-first (2 baris kartu unit), serta perlindungan mutasi multi-select.

---

## Rincian Implementasi & Before vs After

### 1. BUG-184-01: Ekstraksi Nama Pangkalan Titik A & B (Priok & IGI)
- **Lokasi:** `src/utils/routeEndpointUtils.ts` & `src/utils/routeEndpointUtils.test.ts`
- **Penyebab:** Kolom header Google Sheets memuat string gabungan directional tanpa tanda baca titik (`"TERM. TJ PRIOK - PEGANGSAAN II IGI"` dan `"PEGANGSAAN II IGI - TERM. TJ PRIOK"`). Regex lama mencari kata kunci kaku `"TJ."` (dengan titik) dan tidak memecah token asal-tujuan berdasarkan tanda strip (`-`), sehingga kata `"IGI"` terdeteksi di kedua kolom, menghasilkan nama pangkalan kembar: `"IGI"` dan `"IGI"`.
- **Implementasi:**
  1. Memecah string label rute komposit menjadi pasangan origin & destination menggunakan pemisah `\s*[-–—/]\s*`.
  2. Menambahkan varian regex tanpa titik: `/\b(TANJUNG PRIOK|TJ\.?\s*PRIOK|PRIOK)\b/i`.
  3. Menambahkan fallback cerdas ke `routeName` (nama rute resmi) jika label kolom spreadsheet tidak lengkap.
  4. Menambahkan proteksi invarian: jika kedua titik terdeteksi sama, endpoint kedua otomatis disubstitusi dengan titik seberangnya yang valid.
- **Before vs After:**
  - *Before:* Tab pangkalan menampilkan `Start IGI (17)` dan `Start IGI (13)`.
  - *After:* Tab pangkalan menampilkan `Start Priok (17)` dan `Start IGI (13)`.
- **Case Skenario Lapangan:**
  Petugas di Terminal Tanjung Priok membuka aplikasi pada pagi hari. Petugas langsung dapat membedakan armada yang standby di Pangkalan Priok versus armada yang standby di Pool Pegangsaan II IGI secara presisi tanpa kebingungan.

---

### 2. BUG-184-02: Target Ritase Fleksibel & Bebas (Custom Number + Modal + Dynamic Presets)
- **Lokasi:**
  - `src/components/plotting/PlottingUnitCard.tsx`
  - `src/components/plotting/TargetRitaseModal.tsx`
  - `src/components/plotting/PlottingHeader.tsx`
  - `src/components/busCard/modal/BusInputModalTrip.tsx`
  - `src/components/busCard/modal/singleFocus/SingleFocusTrip.tsx`
  - `src/constants/texts/text_plotting.ts`
- **Penyebab:** Target ritase sebelumnya dikunci dalam dropdown statis 6 pilihan `[6.0, 6.5, 7.0, 7.5, 8.0, 8.5]` pada kartu unit, serta 4 tombol preset statis di modal trip. Hal ini membatasi rute-rute dengan target di luar kisaran tersebut (misal rute jarak jauh dengan target 4 atau 5 rit, atau rute pendek dengan target 9 atau 10 rit).
- **Implementasi:**
  1. Mengganti dropdown statis di kartu unit dengan stepper cepat (`- 0.5` / `+ 0.5`) dan pill interaktif yang membuka `TargetRitaseModal`.
  2. Membuat komponen modal baru `TargetRitaseModal.tsx` yang dilengkapi:
     - Input angka bebas (`<input type="number">` step 0.5, mendukung desimal maupun integer apapun).
     - Stepper penyesuaian cepat (`- 0.5` / `+ 0.5`).
     - Deretan chip preset cepat: `[4, 5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 10]`.
     - Pilihan cakupan penerapan: *Terapkan Unit Ini*, *Terapkan ke Pangkalan Ini*, atau *Terapkan ke Semua Unit Rute Ini*.
  3. Menambahkan kontrol *Target Default Rute* pada `PlottingHeader.tsx` untuk konfigurasi target massal dalam 1 kali tap.
  4. Memperbarui `BusInputModalTrip.tsx` dan `SingleFocusTrip.tsx` dengan preset dinamis yang berpusat pada target plotting unit (`[target - 1, target - 0.5, target, target + 0.5, target + 1]`), tombol cepat `🎯 Target`, serta stepper ritase langsung di bilah Auto-Set.
- **Before vs After:**
  - *Before:* Petugas hanya bisa memilih 6 angka ritase tetap; rute dengan target di luar 6–8.5 rit tidak dapat dikonfigurasi.
  - *After:* Petugas bebas mengetik target ritase berapapun (misal 4 rit, 5.5 rit, 9 rit, dll.) dan dapat menerapkannya ke unit tunggal, seluruh pangkalan, maupun seluruh rute.
- **Case Skenario Lapangan:**
  Rute mikrorans dengan rute panjang menetapkan target harian 5.0 Ritase. Pengawas cukup menekan tombol "Target Rute" di header, mengetik angka `5`, dan menekan "Terapkan ke Semua Unit". Seluruh unit rute langsung terplot dengan target 5.0 Rit, dan modal input trip malam langsung memunculkan preset 4, 4.5, 5.0, 5.5 Rit.

---

### 3. BUG-184-03: Eliminasi Nomor Urutan Duplikat (Strict Base Normalization)
- **Lokasi:** `src/components/plotting/DailyPlottingPage.tsx`
- **Penyebab:** Ketika unit dipindahkan antar pangkalan atau dipindah ke urutan bawah, tidak dilakukan re-indexing urutan per pangkalan, sehingga unit yang baru pindah memiliki nomor urutan yang bentrok dengan unit yang sudah ada (#1 kembar, #2 kembar).
- **Implementasi:**
  Membuat fungsi normalisasi ketat `normalizeBaseOrders(items: UnitPlottingItem[])`. Fungsi ini menjamin setiap pangkalan (A dan B) selalu memiliki nomor urutan sekuensial bulat tanpa jeda `1..N`. Fungsi ini dieksekusi pada setiap inisialisasi, perubahan pangkalan, pemindahan posisi, rolling harian, maupun penyimpanan.
- **Before vs After:**
  - *Before:* Muncul unit KWK 222153 berurutan #1 dan unit KWK 222168 juga berurutan #1 di pangkalan yang sama.
  - *After:* Setiap unit di pangkalan Priok dan IGI memiliki nomor urutan unik berurutan: 1, 2, 3, 4, dst.
- **Case Skenario Lapangan:**
  Pengawas memindahkan unit KWK 222153 ke pangkalan seberang. Unit otomatis masuk ke urutan paling akhir pangkalan tujuan, dan pangkalan asal langsung merapatkan urutannya sehingga urutan #1, #2, #3 tetap solid tanpa celah dan tanpa duplikasi.

---

### 4. BUG-184-04: Header Metrik Ergonomis & Bebas Ambruk
- **Lokasi:** `src/components/plotting/PlottingHeader.tsx`
- **Penyebab:** Penggunaan CSS Grid 4 kolom kaku (`repeat(4, 1fr)`) untuk menampung 5 kotak metrik menyebabkan kotak ke-5 terlempar ke baris kedua dan merusak kerapian antarmuka mobile.
- **Implementasi:**
  Menyederhanakan metrik header menjadi 3 kolom operasional utama yang seimbang di layar ponsel (`Total Unit`, `Siap Jalan`, `Kendala`). Informasi pangkalan dipindahkan seutuhnya ke `PlottingBaseTabs` di bawahnya untuk menghindari redundansi.
- **Before vs After:**
  - *Before:* 5 kotak metrik asimetris (4 di baris atas, 1 sendirian di baris bawah).
  - *After:* 3 kotak metrik rapi dan simetris (1 baris penuh), dilengkapi bilah toolbar operasional ringkas.
- **Case Skenario Lapangan:**
  Di layar ponsel berukuran kecil (360px), header tampak rapi dan elegan tanpa ada elemen yang terpotong atau wrap sembarangan.

---

### 5. BUG-184-05: Tabrakan Bilah Multi-Select & BottomNav
- **Lokasi:** `src/components/plotting/DailyPlottingPage.tsx`
- **Penyebab:** Posisi `bottom: 72px` pada bar multi-select bertabrakan langsung dengan bilah navigasi bawah `BottomNav` (tinggi ~64px + safe area).
- **Implementasi:**
  1. Menyesuaikan posisi floating bar menjadi `bottom: calc(82px + env(safe-area-inset-bottom, 0px))` dengan `zIndex: 99`.
  2. Menambah padding bawah kontainer utama halaman menjadi `calc(140px + env(safe-area-inset-bottom, 0px))` agar kartu unit paling bawah tidak tertutup oleh navigasi maupun bar multi-select.
- **Before vs After:**
  - *Before:* Bar multi-select tumpang tindih dengan menu bottom dock.
  - *After:* Bar multi-select melayang anggun tepat di atas bottom dock dengan jarak yang ergonomis dan bebas tabrakan.
- **Case Skenario Lapangan:**
  Pengawas memilih beberapa unit sekaligus. Bilah aksi multi-select muncul tepat di atas bottom dock tanpa menutupi tombol navigasi aplikasi, dan tombol aksi "Jadikan Start Priok / IGI" sangat mudah di-tap.

---

### 6. BUG-184-06: Desain Kartu Unit 2-Baris (Mobile-First)
- **Lokasi:** `src/components/plotting/PlottingUnitCard.tsx`
- **Penyebab:** 7 elemen (drag handle, order badge, nama unit, pangkalan, ritase dropdown, status button, move down button) dijejalkan dalam 1 baris flex horizontal, menyebabkan nama armada seperti "KWK 222153" terlipat menjadi 2 baris teks yang sempit.
- **Implementasi:**
  Mendesain ulang kartu unit menjadi 2 baris vertikal yang fungsional:
  - **Baris 1 (Identitas & Urutan):** Drag handle + Order badge + Nama unit (KWK 222153 - 1 baris utuh) + Badge pangkalan start + Tombol geser ke bawah.
  - **Baris 2 (Kontrol Operasional):** Stepper ritase (`- 0.5` / `+ 0.5`) + Pill target ritase interaktif + Tombol status kesiapan unit (`Siap` / `Kendala` / `OFF`).
- **Before vs After:**
  - *Before:* Teks nama unit terlipat dua baris, tombol-tombol sempit dan rawan salah tap.
  - *After:* Tampilan sangat lega, teks nama unit terbaca jelas dalam 1 baris, tombol stepper dan status sangat ramah sentuhan jempol.
- **Case Skenario Lapangan:**
  Pengawas operasional lapangan menggunakan satu tangan di jalan. Mereka dapat membaca nama unit dengan sangat jelas dan mengubah target ritase atau status kesiapan bus dalam hitungan detik tanpa salah sentuh.

---

### 7. BUG-184-07: Logika Aman Multi-Select Pangkalan
- **Lokasi:** `src/components/plotting/DailyPlottingPage.tsx`
- **Penyebab:** Fungsi `handleAssignStartPoint` sebelumnya mengatur unit terpilih ke pangkalan target DAN mereset seluruh unit unselected ke pangkalan seberangnya, sehingga seluruh pembagian armada rusak.
- **Implementasi:**
  Memperbaiki logika: HANYA unit yang berada di dalam `selectedUnits` yang diubah pangkalannya ke target point. Unit-unit lain yang tidak dipilih tetap berada pada pangkalannya masing-masing tanpa perubahan.
- **Before vs After:**
  - *Before:* Memilih 1 unit dan menekan "Jadikan Start IGI" mereset 29 unit lainnya ke pangkalan seberang.
  - *After:* HANYA 1 unit tersebut yang berpindah ke pangkalan IGI; 29 unit lainnya tetap berada di pangkalan semula.
- **Case Skenario Lapangan:**
  Pengawas memilih 3 unit bermasalah dan memindahkannya ke Pool IGI. Ketiga unit tersebut berpindah ke urutan belakang Pool IGI, sementara seluruh armada lainnya di Terminal Tanjung Priok tetap stabil di posisinya.

---

## Verifikasi & Quality Gates

Seluruh gerbang kualitas standar industri telah dijalankan dan lulus 100%:

1. **Uji Kontrak Kontras Warna (WCAG AA/AAA):**
   `pnpm vitest run src/styles/tokens/color-contract.test.ts` ➔ **116 passed (100%)**
2. **Uji Kamus Teks Sentral:**
   `pnpm vitest run src/constants/texts/texts.test.ts` ➔ **26 passed (100%)**
3. **Uji Ekstraksi Endpoint Rute:**
   `pnpm vitest run src/utils/routeEndpointUtils.test.ts` ➔ **13 passed (100%)**
4. **Uji Unit Plotting & Modal Target:**
   `pnpm vitest run src/components/plotting/` ➔ **12 passed (100%)**
5. **Uji Modal Input Trip:**
   `pnpm vitest run src/components/busCard/modal/BusInputModalTrip.test.tsx` ➔ **4 passed (100%)**
6. **Uji Komprehensif Seluruh Repositori:**
   `pnpm vitest run src/` ➔ **100% lulus tanpa kegagalan**
7. **Typecheck & Build Produksi:**
   `pnpm run build` ➔ **0 error, bundle optimal**
8. **Knowledge Graph:**
   `graphify update .` ➔ **Tersinkronisasi**
