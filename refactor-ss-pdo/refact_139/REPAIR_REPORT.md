# REPAIR REPORT: Perombakan Konsep UI Minimalis & Anti-Clutter Kartu Armada (Fase 1)

## Informasi Refactor
- **ID Refactor:** `refact_139`
- **Tanggal:** 18 Oktober 2026
- **Branch:** `devmode`
- **Terkait Temuan:** BUG-139-01, BUG-139-02

---

## Implementasi Perbaikan

### 1. Arsitektur Kartu Bus Minimalis Modern (`BusCard` & `BusCardSummary`)
- **Struktur Baris Terpisah (Progressive Glanceability):**
  - **Baris 1 (Header):** Kiri berisi nomor unit bus (tegas, Plus Jakarta Sans, 16px) bersama pill status operasional (OFF / T.O / Antrean). Kanan berisi tombol pill shortcut trip atau mode kategori terpilih + spinner loader.
  - **Baris 2 (Data Strip 3 Kolom):**
    - Kolom 1 (Ritase): Format `pergi/pulang` dengan aksen warna semantik (hijau tercapai, amber kurang ritase, atau `-` jika belum ada).
    - Kolom 2 (Total KM): Angka format desimal rapi (`var(--shift1-color)`) dengan satuan mikro `km`.
    - Kolom 3 (Pelanggan): Angka format ribuan rapi (`var(--text-primary)`) dengan satuan mikro `pnp`.
  - **Baris 3 (Catatan Operasional):** Menampilkan catatan penting (misal kendala armada, pergantian kru) dengan format rapi tanpa border ganda.
- **Optimasi CSS & DOM Slimming:**
  - Menghilangkan wrapper dan separator manual tak perlu; memanfaatkan CSS Grid 3 kolom (`.bus-metric-strip`) dengan pemisah visual berbasis `border-right` tipis `var(--card-border)`.
  - Menggunakan `font-variant-numeric: tabular-nums` agar angka tidak bergetar/flicker saat data dimuat ulang.

---

### 2. Standarisasi Tampilan Kartu Unit (`UnitCard`) & Kamus Teks Sentral
- **Pembersihan Kamus Teks (`src/constants/texts/text_dashboard.ts`):**
  - Mengubah label kaku `"Negatif Data..."` menjadi terminologi operasional yang bersahabat:
    - `STATUS_FULL_COMPLETE`: `"2 Shift Lengkap"`
    - `STATUS_SHIFT_1_ONLY`: `"Hanya Shift 1"`
    - `STATUS_SHIFT_2_ONLY`: `"Hanya Shift 2"`
    - `STATUS_EMPTY`: `"Belum Terisi"`
- **Konsistensi Visual Antartab:**
### 3. Eliminasi Redundansi Catatan Status Non-Operasi (`hasMeaningfulNote`)
- **Pembersihan Logika Render Catatan Bawah:**
  - Menghapus rendering blok catatan berikon `⚠️ [OFF]` jika data keterangan unit hanya murni status tetap (`OFF`, `T.O`, `TO`, `TO EVDAL`, `SO`, `SGO`).
  - Status tetap tersebut sudah 100% tersampaikan secara elegan melalui pill status di baris header atas, sehingga baris bawah ditiadakan.
  - Jika terdapat catatan operasional nyata (seperti `"OFF - BAN PECAH"`, `"BA.02 PRAMUDI MERIANG"`, `"RUSAK RADIATOR"`), baris catatan tetap dirender dengan styling modern `border-top: 1px solid var(--card-border)` dan latar transparan amber subtil `rgba(245, 158, 11, 0.04)`.
- **Konsistensi Lintas Komponen:**
  - Diterapkan secara seragam pada `src/components/busCard/BusCard.tsx` dan `src/components/UnitCard.tsx`.

---

## Perbandingan Before vs After

### 1. Layout, Kepadatan, & Redundansi Kartu Bus
| Parameter | Sebelum Refactor (Before) | Sesudah Refactor (After) |
|---|---|---|
| **Header Density** | Seluruh metrik berdesakan di header kanan (3 metrik + 1 shortcut + nomor bus + status) | Header bersih: Nomor bus di kiri, aksi cepat di kanan |
| **Penyajian Metrik** | Inline capsule sempit dengan pemisah titik `•` rawan wrap | Dedicated 3-column metric strip yang lapang & simetris |
| **Visual State Kosong** | Badge merah agresif `[Kosong]` yang memicu layout shift | Strip metrik berangka tenang/placeholder seragam |
| **Kamus Status Armada** | *"Negatif Data S1 & S2"*, *"Negatif Data S2"* | *"Belum Terisi"*, *"Hanya Shift 1"*, *"2 Shift Lengkap"* |
| **Redundansi Catatan Non-SGO** | Muncul ganda: Header `[OFF]` dan baris bawah `⚠️ [OFF]` | Bersih murni: Header `[OFF]`, baris catatan bawah otomatis disupresi |
| **Kerapian Catatan Kendala** | Teks catatan menempel tanpa batas pembatas yang jelas | Terdapat border pemisah tipis elegan (`1px solid var(--card-border)`) |

---

## Case: Skenario Lapangan

### Skenario 1: Petugas Lapangan dengan Layar Ponsel Sempit (Resolusi 360px - 380px)
- **Sebelum Perbaikan:** Saat membuka rute dengan banyak catatan (misal status OFF atau antrean sinkronisasi), nomor bus dan kapsul metrik bertumpuk menjadi 2 baris tidak beraturan, memotong angka KM.
- **Sesudah Perbaikan:** Header tetap lapang dengan nomor bus jelas terbaca dalam 1 detik (*glanceable*). Angka ritase, jarak, dan penumpang tersaji rapi di bawahnya tanpa terpotong.

### Skenario 2: Identifikasi Armada Belum Beroperasi di Tab Armada
- **Sebelum Perbaikan:** Pengawas melihat badge teks panjang bertuliskan *"Negatif Data S1 & S2"* yang membingungkan pramudi dan pengawas baru.
- **Sesudah Perbaikan:** Muncul kapsul modern berwarna netral bertuliskan *"Belum Terisi"* dengan angka `-` yang tenang dan profesional.

### Skenario 3: Armada dengan Status Libur/OFF Terjadwal Murni (Sesuai Screenshot Pengguna)
- **Sebelum Perbaikan:** Kartu bus unit libur (misal KWK 222173) menampilkan header `KWK 222173 [OFF]`, strip metrik `- - -`, lalu di bawahnya menampilkan kembali baris `⚠️ [OFF]` yang 100% berulang dan membuang ruang layar ponsel.
- **Sesudah Perbaikan:** Baris catatan bawah `⚠️ [OFF]` otomatis hilang. Kartu berukuran proporsional, ringkas, dan fokus hanya pada informasi penting tanpa redundansi.

