# Audit Bugs - Refactor 169

## Daftar Temuan Masalah & Celah

### BUG-169-01: Format Catatan Bebas Manual Tidak Menggunakan Huruf Kapital di Awal Setiap Kata (Title Case)
- **Lokasi Kode**: `src/utils/keteranganUtils.ts` (`toSmartTitleCase`, `normalizeKeterangan`), `src/components/busCard/modal/BusInputModalShift1.tsx`, `src/components/busCard/modal/BusInputModalShift2.tsx`, `src/components/busCard/modal/BusInputModalNotes.tsx`, `src/components/busCard/modal/singleFocus/SingleFocusNotes.tsx`
- **Tingkat Keparahan**: Sedang (Konsistensi Data & Standar Pelaporan)
- **Deskripsi**:
  Catatan kendala armada yang diketik bebas oleh petugas lapangan sebelumnya tersimpan dengan format huruf yang tidak seragam (huruf kecil semua atau kapitalisasi campur aduk). Sesuai kebutuhan standar pelaporan operasional Transjakarta dan SSOT Google Sheets, seluruh catatan bebas manual wajib diformat dengan huruf kapital di awal setiap kata (Title Case). Namun, kapitalisasi sederhana (*naive Title Case*) berisiko merusak singkatan operasional penting seperti `AC`, `TJ`, `AP`, `KSO`, `OKB`, `NP1`, `NP2`, `CCTV`, `SPBU`, `GPS`, `SIM`, `KIR`, `STNK`, `BBM` menjadi `Ac`, `Tj`, `Cctv`, dsb., serta merusak kode lambung bus seperti `TJ-0123`.
- **Dampak Pengguna**:
  Tampilan catatan pada kartu bus dan rekapitulasi Google Sheets terlihat tidak seragam, kusam, dan singkatan teknis operasional menjadi sulit dibaca jika diubah menjadi huruf kecil.
- **Mitigasi**:
  1. Mengembangkan fungsi murni `toSmartTitleCase(input)` pada `src/utils/keteranganUtils.ts` dengan set akronim armada `FLEET_ACRONYMS` serta regex pencocokan kode armada/lambung bus.
  2. Menerapkan pemformatan saat event `onBlur` pada setiap `textarea` catatan di modal input (`BusInputModalShift1`, `BusInputModalShift2`, `BusInputModalNotes`, dan `SingleFocusNotes`) sehingga pengalaman mengetik pada keyboard virtual HP (Gboard/iOS) tetap mulus tanpa reset kursor saat mengetik.
  3. Memastikan pemformatan diterapkan kembali pada saat submit melalui `normalizeKeterangan` untuk perlindungan ganda.

---

### BUG-169-02: Ketiadaan Tombol Cepat (Preset Pills) "OKB" dan "Renop" Khusus untuk Operasional Shift 2
- **Lokasi Kode**: `src/constants/texts/text_alerts.ts`, `src/components/busCard/modal/notes/KeteranganPresetBar.tsx`, `src/utils/keteranganUtils.ts`
- **Tingkat Keparahan**: Rendah - Sedang (Efisiensi UX Lapangan)
- **Deskripsi**:
  Pada dinamika operasional Shift 2 (sore/malam), armada sering mengalami status pengoperasian khusus seperti OKB (Operasi Khusus Bus) atau penyesuaian Renop (Rencana Operasi). Petugas lapangan sebelumnya harus mengetik kata-kata tersebut secara manual secara berulang. Selain itu, kedua status ini spesifik untuk operasional Shift 2 dan tidak boleh membingungkan petugas Shift 1 pagi jika dimunculkan di Shift 1.
- **Dampak Pengguna**:
  Petugas Shift 2 membuang waktu mengetik istilah umum yang repetitif, sementara antarmuka Shift 1 berisiko terganggu jika tombol tersebut muncul tanpa konteks shift.
- **Mitigasi**:
  1. Menambahkan definisi `BTN_OKB: "OKB"` dan `BTN_RENOP: "Renop"` pada kamus sentral `src/constants/texts/text_alerts.ts` lengkap dengan uji integritas di `texts.test.ts`.
  2. Menambahkan tombol preset pill `[OKB]` (warna ungu `#a855f7`) dan `[Renop]` (warna emerald `#10b981`) pada `KeteranganPresetBar.tsx`.
  3. Menerapkan isolasi kondisional berbasis prop `shift` dan `shiftLabel` (`isShift2 = shift === 2 || Boolean(shiftLabel && shiftLabel.includes("2"))`), sehingga tombol `[OKB]` dan `[Renop]` hanya muncul ketika modal/tab sedang berada di Shift 2.
  4. Mendaftarkan `OKB` dan `Renop` ke dalam parser keterangan `keteranganUtils.ts` sebagai nilai fixed preset dan meaningful note agar dikenali dengan benar di rekap kartu armada.
