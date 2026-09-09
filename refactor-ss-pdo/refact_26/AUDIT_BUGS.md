# AUDIT BUGS: UNIFIED SMART PILL & INTEGRATED FLEET-REPORT OVERHAUL (REFACTOR 26)

Dokumen ini mendokumentasikan temuan audit UI/UX terkait hilangnya teks nama rute akibat perebutan ruang horizontal (*horizontal space starvation*), penumpukan bingkai bertingkat (*capsule inception / border soup*), kekacauan warna (*carnival colors*), serta pemisahan tombol armada dan laporan yang membingungkan mental model pengguna pada SS_PDO.

---

## DAFTAR TEMUAN AUDIT

| ID Temuan | Komponen / File Terkait | Keparahan | Status |
| :--- | :--- | :--- | :---: |
| **UI-26-01** | `src/components/RouteSelectorCard.tsx` | 🔴 **HIGH** (Nama/Kode Rute Terpotong Menjadi 0px / Lenyap di Ponsel) | Terselesaikan |
| **UI-26-02** | `src/components/RouteSelectorCard.tsx` | 🔴 **HIGH** (Capsule Inception: 3 Lapis Kotak Bertingkat di Satu Bar) | Terselesaikan |
| **UI-26-03** | `src/components/RouteSelectorCard.tsx`<br>`src/components/Dashboard.tsx` | 🟡 **MEDIUM** (Carnival Colors: 4 Warna Neon Bersaing di Area Header) | Terselesaikan |
| **UX-26-04** | `src/components/RouteSelectorCard.tsx`<br>`src/components/RouteOperationalReportCard.tsx` | 🟡 **MEDIUM** (Redundansi Tombol Armada vs Laporan & Inkonsistensi Anatomi) | Terselesaikan |

---

## RINCIAN TEMUAN

### 🔴 UI-26-01: Nama/Kode Rute Terpotong Menjadi 0px / Lenyap di Ponsel

- **ID Temuan:** `UI-26-01`
- **Lokasi Kode:** `src/components/RouteSelectorCard.tsx`
- **Keparahan:** **HIGH** (Cacat Fatal Hierarki Informasi)
- **Deskripsi Masalah:**
  1. Pada bar kontrol rute, dua tombol di sisi kanan (`[ 🚌 Armada ]` dan `[ Laporan ▾ ]`) menyita lebih dari 60% lebar layar smartphone (~360–390px).
  2. Akibatnya, elemen pill di sisi kiri terhimpit parah sehingga teks kode rute (seperti `JAK.115`) terpotong habis (`width: 0px` akibat `overflow: hidden; text-overflow: ellipsis`).
  3. Yang tersisa di mata pengguna hanya ikon `📍` dan kotak kalender `[ 📅 Tgl 9 ] ▾`. Petugas tidak dapat mengetahui rute apa yang sedang dibuka tanpa mengetuk tombol tersebut terlebih dahulu.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Identitas informasi terpenting dalam operasional angkutan umum (kode rute) tidak terlihat, memicu kebingungan petugas saat bertugas cepat di lapangan.
- **Mitigasi:**
  - Hapus tombol armada mandiri dari bar horizontal atas untuk menghemat ~80px ruang horizontal.
  - Pisahkan kode rute dan tanggal menjadi tipografi inline yang lega (`JAK.115 • Tgl 9`), memberikan >70% lebar bar untuk segmen kiri.

---

### 🔴 UI-26-02: Capsule Inception: 3 Lapis Kotak Bertingkat di Satu Bar

- **ID Temuan:** `UI-26-02`
- **Lokasi Kode:** `src/components/RouteSelectorCard.tsx`
- **Keparahan:** **HIGH** (Anti-Pola Desain: Border Soup & Visual Clutter)
- **Deskripsi Masalah:**
  1. Terdapat 3 lapis bingkai kontainer yang bertumpuk:
     - Lapis 1: Kontainer bar terluar (`.unified-route-control-bar`).
     - Lapis 2: Pill selektor kiri dengan background gelap dan border terpisah.
     - Lapis 3: Kotak badge kalender `.morph-pill-badge` di dalam pill kiri yang memiliki border dan background sendiri.
  2. Penumpukan ini membuat tampilan terasa kaku, tebal, berat, dan sempit (*border soup*).
- **Dampak ke Pengguna Lapangan (User Impact):**
  Tampilan terasa amat padat dan tidak elegan, melanggar estetika modern Apple HIG / Linear utility.
- **Mitigasi:**
  - Hilangkan background dan border dari inner pill dan badge tanggal.
  - Jadikan segmen kiri satu kesatuan area sentuh yang bersih dan menyatu dengan kontainer bar utama.

---

### 🟡 UI-26-03: Carnival Colors: 4 Warna Neon Bersaing di Area Header

- **ID Temuan:** `UI-26-03`
- **Lokasi Kode:**
  - `src/components/RouteSelectorCard.tsx`
  - `src/components/Dashboard.tsx`
- **Keparahan:** **MEDIUM** (Kekacauan Palet & Kehilangan Kontras Semantik)
- **Deskripsi Masalah:**
  1. Dalam rentang vertikal hanya ~90px, terdapat 4 warna aksen neon yang menyala bersamaan:
     - Tombol Wilayah: Biru elektrik (`#3b82f6`)
     - Ikon Pin / Tanggal: Cyan / Tosca
     - Tombol Armada: Hijau Mint (`#3ECF8E`)
     - Tombol Laporan: Amber / Oranye Pekat (`#f59e0b`)
  2. Tidak ada ketenangan visual (*visual calmness*), warna tidak lagi membawa arti semantik yang jelas.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Mata petugas cepat lelah; antarmuka tampak seperti kumpulan tombol warna-warni yang tidak profesional.
- **Mitigasi:**
  - Terapkan palet slate netral semi-transparan dengan aksen emerald lembut (`#3ECF8E`) sebagai warna identitas tunggal.
  - Warna amber/hijau/biru pada tombol Laporan hanya menyala sebagai indikator status (Draft vs Submitted vs Verified).
  - Lembutkan tombol `[ 🌐 Wilayah ]` dengan token `var(--input-bg)` dan teks netral sekunder.

---

### 🟡 UX-26-04: Redundansi Tombol Armada vs Laporan & Inkonsistensi Anatomi

- **ID Temuan:** `UX-26-04`
- **Lokasi Kode:**
  - `src/components/RouteSelectorCard.tsx`
  - `src/components/RouteOperationalReportCard.tsx`
- **Keparahan:** **MEDIUM** (Pemisahan Aksi yang Membingungkan Alur Pikir Pengguna)
- **Deskripsi Masalah:**
  1. Menampilkan tombol `Armada` dan `Laporan` berdampingan di header menimbulkan ambiguitas bagi petugas: *"Apakah laporan operasional berbeda dengan status armada?"*. Padahal jumlah Realops pada laporan operasional bersumber langsung dari unit armada SGO.
  2. Anatomi ketiga tombol di header sebelumnya tidak seragam (ada yang ber-ikon tanpa chevron, ada yang ber-chevron tanpa ikon).
- **Dampak ke Pengguna Lapangan (User Impact):**
  Keraguan memilih aksi yang tepat dan risiko salah ketuk (*mis-tap*) akibat tombol berukuran sempit.
- **Mitigasi:**
  - Satukan akses status armada ke dalam drawer Laporan Operasional melalui tombol aksi `[ 🚌 Atur Unit Armada → ]` pada seksi armada dan segmented control di bagian atas drawer.
  - Sisi kanan top bar disederhanakan menjadi satu tombol tunggal `[ ⚡ Laporan ▾ ]` dengan indikator status dot dan chevron konsisten.
