# Audit Bugs: Refactor 172 — Penyempurnaan Form Input Keterangan Bus: Multi-Select Presets, OKB Hijau, & Tombol Reset

## Ringkasan Eksekutif
Audit ini dilakukan menyusul evaluasi skenario nyata operasional harian bus Transjakarta pada modal input keterangan bus. Di lapangan sering terjadi kondisi dinamis di mana armada mengalami siklus insiden bertingkat (misalnya: armada mengalami kendala NP1 di Shift 1, lalu berhasil OKB [Operasi Kembali] pada Shift 2, namun di pertengahan Shift 2 kembali terkendala karena supir/pramudi sakit). 

Sebelumnya, tombol-tombol preset cepat (`BA`, `OFF`, `TO EVDAL`, `OKB`, `Renop`) bertindak secara kaku dan destruktif: menekan salah satu tombol preset akan menimpa/menghapus teks catatan bebas yang telah diketik atau menggugurkan status tag lainnya. Selain itu, tombol `OKB` berwana ungu (asosiasi kendala) yang kontradiktif dengan maknanya (kembali jalan), serta tidak tersedianya fitur pembersihan catatan (*one-tap reset*) pada layar sentuh ponsel operasional.

---

## Daftar Temuan Masalah

### 1. BUG-172-01: Destructive Single-Value Overwrite pada Preset Form Keterangan Bus
- **Lokasi Kode:** `src/components/busCard/modal/notes/KeteranganPresetBar.tsx` (baris 60–120) & `src/utils/keteranganUtils.ts`.
- **Keparahan:** 🔴 Tinggi (High Severity - Data Overwrite / Destructive Interaction).
- **Deskripsi:** 
  Tombol-tombol preset menggunakan pengecekan string kaku (`trimmed === "OKB"`, `trimmed === "Renop"`) atau regex penimpa teks. Saat pengguna mengklik salah satu tombol preset, sistem mengganti isi textarea secara mutlak atau menghapus teks deskripsi alasan yang sudah diketik petugas.
- **Dampak Pengguna:** 
  Pada kasus gabungan seperti:
  - Unit `OKB` lalu kendala `Pramudi Sakit`
  - Unit `OKB` lalu kendala `BA.02 NP1`
  - Unit `Renop` dengan `BA.01 Pintu Macet`
  Petugas lapangan tidak dapat memanfaatkan tombol cepat dan terpaksa mengetik ulang semuanya secara manual karena menekan tombol preset akan merusak teks yang ada.
- **Mitigasi:** 
  Membangun arsitektur token parser non-destruktif (`extractKeteranganTokens` dan `formatKeteranganTokens`) di `src/utils/keteranganUtils.ts`. Setiap status (`isOkb`, `isRenop`, `baCode`, `isOff`, `isToEvdal`, `detail`) dipetakan menjadi token independen sehingga seluruh preset mendukung interaksi **Multi-Select** tanpa saling menghapus.

---

### 2. BUG-172-02: Inkonsistensi Visual Warna Tombol OKB (Ungu/Kendala vs Hijau/Operasi)
- **Lokasi Kode:** `src/components/busCard/modal/notes/KeteranganPresetBar.tsx` (baris 135–145).
- **Keparahan:** 🟡 Sedang (Medium Severity - UI Semantics Mismatch).
- **Deskripsi:** 
  Tombol `[OKB]` ketika aktif diberi highlight warna ungu (`#a855f7`, `rgba(168, 85, 247, 0.2)`). Dalam konvensi visual Transjakarta dan dashboard PDO, warna ungu adalah aksen status `SO` / kendala operasional. Padahal akronim `OKB` (*Operasi Kembali*) secara semantik adalah status positif: armada yang sempat rusak kini telah diperbaiki dan siap melayani pelanggan kembali.
- **Dampak Pengguna:** 
  Petugas operasional bingung dan salah menafsirkan tombol `OKB` sebagai tombol kendala/masalah armada.
- **Mitigasi:** 
  Mengubah warna highlight aktif tombol `[OKB]` menjadi warna **HIJAU** (`#10b981`, `rgba(16, 185, 129, 0.2)`) yang selaras dengan indikator jalan normal dan siap beroperasi.

---

### 3. BUG-172-03: Ketiadaan Tombol Reset untuk Membersihkan Catatan Keterangan
- **Lokasi Kode:** `src/components/busCard/modal/notes/KeteranganPresetBar.tsx`.
- **Keparahan:** 🟡 Sedang (Medium Severity - Mobile Usability Friction).
- **Deskripsi:** 
  Tidak ada tombol pembersih cepat untuk mengosongkan seluruh isi catatan bus. Jika petugas ingin menghapus catatan yang panjang atau membatalkan seluruh pilihan preset, mereka harus menekan tombol backspace berulang kali di keyboard ponsel pintar atau menyeleksi blok teks manual yang sulit di layar sentuh kecil.
- **Dampak Pengguna:** 
  Proses input lambat, sering tertinggal sisa karakter atau spasi tersembunyi yang membuat status armada tetap terdeteksi berkendala di sistem.
- **Mitigasi:** 
  Menyediakan tombol `[Reset]` terintegrasi dengan ikon `<RotateCcw size={12} />` dan teks kamus sentral `TEXT_ALERTS.BTN_RESET`. Tombol ini otomatis berstatus *disabled* ketika teks kosong, dan langsung membersihkan seluruh textarea serta menonaktifkan seluruh preset saat di-tap.

---

### 4. BUG-172-04: Friksi Ketikan Spasi Setelah Preset BA Diaktifkan
- **Lokasi Kode:** `src/components/busCard/modal/notes/KeteranganPresetBar.tsx`.
- **Keparahan:** 🟢 Rendah (Low Severity - Mobile Ergonomics).
- **Deskripsi:** 
  Ketika petugas menekan tombol `BA` pada kondisi form kosong, teks yang muncul adalah `BA.01` persis tanpa spasi di belakangnya. Kursor teks menempel tepat di sebelah angka `1`.
- **Dampak Pengguna:** 
  Jika pengguna langsung mengetik kata berikutnya, kata tersebut menyatu dengan kode BA (contoh: `BA.01Pramudi Sakit`), merusak format standar laporan dan memerlukan penghapusan/penambahan spasi manual.
- **Mitigasi:** 
  Memberikan spasi pemisah otomatis di akhir string (`BA.01 ` atau `BA.02 `) saat aktivasi preset BA tanpa teks detail, sehingga pengguna dapat langsung mengetikkan alasan kendala tanpa harus menekan tombol spasi.
