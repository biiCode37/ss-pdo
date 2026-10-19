# AUDIT BUGS: Perombakan Konsep UI Minimalis & Anti-Clutter Kartu Armada (Fase 1)

## Informasi Refactor
- **ID Refactor:** `refact_139`
- **Tanggal:** 18 Oktober 2026
- **Branch:** `devmode`
- **Domain:** UI/UX Redesign, Typography & Layout Cleanup, Mobile-First Performance

---

## Daftar Temuan Masalah

### 1. BUG-139-01: Visual Clutter & Layout Overflow pada Header Kartu Bus (`BusCard`)
- **Lokasi Kode:**
  - `src/components/busCard/BusCard.tsx` (baris 83–134)
  - `src/components/busCard/BusCardSummary.tsx` (baris 188–280)
- **Keparahan:** Medium (UX Clutter & Kerapian Visual Mobile)
- **Deskripsi:**
  Pada mode tampilan default (`activeCategory === "ALL"`), seluruh metrik operasional armada (Shortcut Trip, Total KM Tempuh, dan Total Penumpang) dipadatkan ke dalam satu baris header kanan di samping nomor bus dan badge status. Pada layar ponsel beresolusi 360px–390px, kombinasi nomor bus (misal `JAK.15-01`), status Non-SGO (`OFF`), status antrean (`Menunggu Sinyal`), dan kapsul metrik (`Trip • KM • Pnp`) saling berdesakan hingga memicu pembungkusan baris (*awkward text wrapping*) dan layout shift.
- **Dampak User:**
  Petugas operasional di lapangan merasa layar sesak (*cluttered*), angka metrik penting sulit dibaca cepat (*low glanceability*), dan tampilan terkesan padat bertumpuk (*jadul*).
- **Mitigasi:**
  1. Memisahkan struktur kartu menjadi 2 baris bersih: Baris Header (Identitas Unit, Status Operasi, Indikator Sinkronisasi) dan Baris Metrik Bawah (*3-Column Metric Strip*).
  2. Menerapkan CSS Grid 3 kolom berimbang dengan tipografi *tabular numbers* (`tabular-nums`) untuk metrik Ritase, Total KM, dan Pelanggan.
  3. Mengganti badge kosong merah agresif dengan placeholder angka nol yang tenang dan konsisten agar tinggi kartu seragam tanpa *layout shift*.

---

### 2. BUG-139-02: Terminologi Status dan Pemisah Pipa Bertumpuk pada Kartu Ringkasan Armada (`UnitCard`)
- **Lokasi Kode:**
  - `src/components/UnitCard.tsx` (baris 26–130, 207–305)
  - `src/constants/texts/text_dashboard.ts` (baris 146–150)
- **Keparahan:** Low (Kerapian Typografi & Terminologi)
- **Deskripsi:**
  Label status shift pada `UnitCard` menggunakan terminologi kaku dan panjang seperti `"Negatif Data S1"`, `"Negatif Data S2"`, dan `"Negatif Data S1 & S2"` yang memakan hampir separuh lebar kartu. Selain itu, baris statistik kedua menggunakan pemisah pipa vertikal mentah (`|`) dengan font bold yang tidak proporsional dan tidak selaras dengan bahasa desain kartu bus utama.
- **Dampak User:**
  Bahasa antarmuka terkesan teknis/kaku bagi petugas lapangan, dan desain terlihat tidak konsisten antara tab "Input" dan tab "Armada".
- **Mitigasi:**
  1. Memodernisasi kamus status menjadi ringkas dan bersahabat: `"2 Shift Lengkap"`, `"Hanya Shift 1"`, `"Hanya Shift 2"`, dan `"Belum Terisi"`.
  2. Mengadopsi arsitektur *3-Column Metric Strip* yang seragam dengan `BusCard` sehingga pengalaman visual antartab terasa kohesif, modern, dan elegan.

---

### 3. BUG-139-03: Duplikasi Redundan Catatan Status Tetap pada Bagian Bawah Kartu (`BusCard` & `UnitCard`)
- **Lokasi Kode:**
  - `src/components/busCard/BusCard.tsx` (baris 150–185)
  - `src/components/UnitCard.tsx` (baris 273–303)
  - `src/utils/keteranganUtils.ts` (fungsi baru `hasMeaningfulNote`)
- **Keparahan:** Medium (UX Visual Clutter & Redundansi Informasi)
- **Deskripsi:**
  Ketika unit armada berstatus non-operasi terjadwal murni seperti `"OFF"`, `"T.O"`, atau `"TO EVDAL"`, kartu telah menampilkan pill status tegas berwarna merah/amber di baris header atas di samping nomor bus. Namun, blok catatan bawah kartu tetap merender baris terpisah dengan ikon peringatan `⚠️` dan mengulang kembali badge `[OFF]`. Hal ini menghasilkan duplikasi 100% redundan (`[OFF]` di atas dan `⚠️ [OFF]` di bawah), membuat kartu terlihat kotor, membuang ruang vertikal layar HP, dan menimbulkan kesan compang-camping (*unpolished*).
- **Dampak User:**
  Layar terasa sesak dengan informasi berulang yang tidak memiliki nilai tambah operasional, serta ikon segitiga bahaya `⚠️` mengaburkan perbedaan antara status terjadwal normal (OFF giliran) dengan insiden/kerusakan darurat di lapangan.
- **Mitigasi:**
  1. Menambahkan utilitas predikat kanonik `hasMeaningfulNote(raw?: string | null): boolean` pada `src/utils/keteranganUtils.ts`.
  2. Menyaring dan mensupresi baris catatan bawah secara otomatis jika catatan hanya murni status tetap (`OFF`, `T.O`, `TO`, `TO EVDAL`, `SO`, `SGO`, atau kombinasinya `OFF | OFF`).
  3. Baris catatan bawah hanya dimunculkan jika terdapat rincian kendala operasional yang nyata (seperti `"OFF - BAN PECAH"`, `"BA.02 PRAMUDI MERIANG"`, `"RUSAK AC"`), lengkap dengan styling elegan ber-border pemisah halus `border-top: 1px solid var(--card-border)`.
