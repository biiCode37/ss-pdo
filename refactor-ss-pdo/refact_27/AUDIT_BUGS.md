# AUDIT BUGS: BIDIRECTIONAL SHEET NAVIGATION & UI/UX CLEANUP (REFACTOR 27)

Dokumen ini mendokumentasikan temuan audit UI/UX terkait navigasi satu arah yang memutus alur kerja antara Status Armada dan Laporan Operasional, redundansi tombol aksi armada di dalam form laporan, bug duplikasi teks satuan headway `(Menit) (Menit)`, serta inkonsistensi visual kontainer modal pada SS_PDO.

---

## DAFTAR TEMUAN AUDIT

| ID Temuan | Komponen / File Terkait | Keparahan | Status |
| :--- | :--- | :--- | :---: |
| **UX-27-01** | `src/components/fleetStatus/FleetStatusModal.tsx`<br>`src/components/Dashboard.tsx` | 🔴 **HIGH** (Navigasi Terputus / Satu Arah: Dari sheet armada tidak bisa kembali ke sheet laporan) | Terselesaikan |
| **UI-27-02** | `src/components/RouteOperationalReportCard.tsx` | 🟡 **MEDIUM** (Redundansi Elemen UI: Tombol `[ Atur Unit Armada → ]` ganda dengan tab segmented baris atas) | Terselesaikan |
| **UI-27-03** | `src/components/RouteOperationalReportCard.tsx` | 🟢 **LOW** (Typo Label Teks: Duplikasi kata satuan `Headway (Menit) (Menit)`) | Terselesaikan |
| **UI-27-04** | `src/components/fleetStatus/FleetStatusModal.tsx`<br>`src/components/RouteOperationalReportCard.tsx` | 🟡 **MEDIUM** (Inkonsistensi Visual: Lonjakan lebar modal 560px vs 720px & ikon chat paper plane) | Terselesaikan |
| **UI-27-05** | `src/components/fleetStatus/FleetStatusModal.tsx` | 🟡 **MEDIUM** (Visual Noise: Polusi emoji, ikon dekoratif, dan label jargon "KUAS:") | Terselesaikan |

---

## RINCIAN TEMUAN

### 🔴 UX-27-01: Navigasi Terputus / Satu Arah Antara Sheet Armada & Sheet Laporan

- **ID Temuan:** `UX-27-01`
- **Lokasi Kode:**
  - `src/components/fleetStatus/FleetStatusModal.tsx`
  - `src/components/Dashboard.tsx`
- **Keparahan:** **HIGH** (Cacat Fatal Arsitektur Alur & Mental Model Pengguna)
- **Deskripsi Masalah:**
  1. Pada sheet *Laporan Operasional* (`RouteOperationalReportCard`), terdapat Segmented Control di baris atas untuk beralih ke *Status Armada*.
  2. Ketika pengguna mengetuk tab tersebut, sistem beralih ke `FleetStatusModal`. Namun di dalam `FleetStatusModal`, sama sekali tidak ada segmented control atau tombol untuk kembali ke *Laporan Operasional*.
  3. Ketika pengguna menekan tombol konfirmasi atau tanda silang (X) di `FleetStatusModal`, modal tertutup dan pengguna terlempar keluar ke halaman utama Dashboard, bukan kembali ke Laporan Operasional.
  4. Pengguna terpaksa harus mengetuk tombol laporan di header dashboard lagi untuk melanjutkan pengisian formulir.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Alur kerja terputus (*broken flow*), membingungkan petugas operasional yang mengira kedua view tersebut adalah dua sisi dari kartu formulir yang sama.
- **Mitigasi:**
  - Menambahkan prop `onNavigateToReport?: () => void` ke `FleetStatusModal`.
  - Menampilkan Segmented Control yang identik di baris atas `FleetStatusModal`:
    - Tab 1 (Aktif): `[ 🚌 Status Armada ]`
    - Tab 2 (Interaktif): `[ 📋 Laporan Operasional ]` (mengetuk tab langsung membuka sheet laporan).
  - Menyambungkan callback di `Dashboard.tsx` agar perpindahan antar sheet bersifat instan dan mulus.
  - Memperbarui tombol aksi konfirmasi bawah menjadi `Konfirmasi & Lanjut ke Laporan →` jika dibuka dalam alur terintegrasi.

---

### 🟡 UI-27-02: Redundansi Elemen UI di Form Laporan Operasional

- **ID Temuan:** `UI-27-02`
- **Lokasi Kode:** `src/components/RouteOperationalReportCard.tsx` (baris 263–286)
- **Keparahan:** **MEDIUM** (Kepadatan UI & Redundansi Elemen Interaktif)
- **Deskripsi Masalah:**
  1. Di bagian atas formulir sudah terdapat Segmented Control yang menonjol: `[ 🚌 Status Armada ]` | `[ 📋 Laporan Operasional ]`.
  2. Namun, beberapa piksel tepat di bawahnya, pada header Seksi 1 (Armada), terdapat tombol duplikat `[ Atur Unit Armada → ]` berwarna hijau tosca.
  3. Kedua tombol tersebut memiliki fungsi dan pemicu yang persis sama (`onOpenFleetStatus`), menciptakan redundansi visual dan kebisingan antarmuka (*visual noise*).
- **Dampak ke Pengguna Lapangan (User Impact):**
  Tampilan terasa sesak dan kurang profesional karena elemen aksi yang sama muncul berulang-ulang dalam jarak dekat.
- **Mitigasi:**
  - Menghapus tombol redundan `[ Atur Unit Armada → ]` pada header Seksi 1.
  - Menjadikan Segmented Control di atas sebagai titik kendali tunggal (*Single Point of Interaction*) yang bersih dan elegan.

---

### 🟢 UI-27-03: Typo Label Teks: Duplikasi Kata Satuan `(Menit) (Menit)`

- **ID Temuan:** `UI-27-03`
- **Lokasi Kode:** `src/components/RouteOperationalReportCard.tsx` (baris 527 & 556)
- **Keparahan:** **LOW** (Cacat Tipografi & Finishing UI)
- **Deskripsi Masalah:**
  1. Konstanta `TEXT_PDO_FORM.HEADWAY.FASTEST_LABEL` bernilai `'Headway Tercepat (Menit)'`.
  2. Konstanta `TEXT_PDO_FORM.HEADWAY.SLOWEST_LABEL` bernilai `'Headway Terlama (Menit)'`.
  3. Pada template JSX, label tersebut ditulis sebagai:
     `{TEXT_PDO_FORM.HEADWAY.FASTEST_LABEL} (Menit)`
  4. Hasil render di layar pengguna menjadi:
     `Headway Tercepat (Menit) (Menit)` dan `Headway Terlama (Menit) (Menit)`.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Mengurangi kesan profesionalisme dan estetika antarmuka.
- **Mitigasi:**
  - Menghapus imbuhan manual `(Menit)` pada template JSX sehingga murni menampilkan konstanta `FASTEST_LABEL` dan `SLOWEST_LABEL`.

---

### 🟡 UI-27-04: Inkonsistensi Visual: Lonjakan Lebar Modal & Ikon Chat Paper Plane

- **ID Temuan:** `UI-27-04`
- **Lokasi Kode:**
  - `src/components/RouteOperationalReportCard.tsx`
  - `src/components/fleetStatus/FleetStatusModal.tsx`
- **Keparahan:** **MEDIUM** (Inkonsistensi Dimensi Kontainer & Semantik Ikon)
- **Deskripsi Masalah:**
  1. Lebar maksimal `RouteOperationalReportCard` adalah `560px`, sedangkan `FleetStatusModal` adalah `720px`.
  2. Saat pengguna beralih antar sheet di layar tablet atau desktop, terjadi lonjakan dimensi kontainer horizontal (melompat selebar 160px) yang tampak kasar (*layout jank*).
  3. Ikon pada tab Laporan Operasional sebelumnya menggunakan ikon `Send` dengan rotasi -20deg yang menyerupai pesawat kertas pesan Telegram/chat, bukan simbol audit/laporan transportasi operasional.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Pengalaman pengguna terasa melompat-lompat dan metafora ikon kurang tepat secara konteks operasional bus.
- **Mitigasi:**
  - Menyeragamkan lebar kontainer kedua modal menjadi `maxWidth: '580px'` yang proporsional dan nyaman di semua viewport.
  - Mengganti ikon tab Laporan Operasional menjadi `ClipboardList` dari `lucide-react` yang merefleksikan lembar laporan/inspeksi operasional.

---

### 🟡 UI-27-05: Visual Noise: Polusi Emoji, Ikon Dekoratif, dan Label Jargon "KUAS:"

- **ID Temuan:** `UI-27-05`
- **Lokasi Kode:** `src/components/fleetStatus/FleetStatusModal.tsx`
- **Keparahan:** **MEDIUM** (Kepadatan Visual & Bahasa Antarmuka Non-Standar)
- **Deskripsi Masalah:**
  1. Sheet Status Armada dipenuhi emoji berwarna-warni (`🌅`, `🌇`, `🟢`, `🟡`, `🔴`, `🔵`, `✨`, `✓`) dan kotak ikon bus besar yang membuat antarmuka terasa ramai (*cluttered*), kekanak-kanakan, dan tidak profesional.
  2. Adanya label bertuliskan `"KUAS:"` terasa janggal dan merupakan jargon non-standar yang membingungkan petugas operasional transportasi publik.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Mengurangi estetika modern, profesional, dan ketenangan antarmuka lapangan (melanggar prinsip *Anti-Slop* dan *Apple/Linear Design*).
- **Mitigasi:**
  - Menghapus label teks `"KUAS:"` sepenuhnya, membiarkan tombol filter status (`[SGO]`, `[OFF]`, `[T.O]`, `[BA / Kendala]`) berbicara sendiri melalui tipografi dan warna aksen yang bersih.
  - Menghapus seluruh ikon dekoratif dan emoji (`Bus` header, emoji `🌅`/`🌇` shift, emoji bulat `🟢🟡🔴🔵` pada chip dan ringkasan, `Sparkles` ✨, dan `Check` ✓).
  - Tetap mempertahankan ikon fungsional `✕` (Tutup) di pojok kanan atas untuk aksesibilitas dan kemudahan penutupan modal.
