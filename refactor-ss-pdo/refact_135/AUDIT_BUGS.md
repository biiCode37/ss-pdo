# AUDIT BUGS — Refactor 135

## Ringkasan Audit
- **Tanggal:** 6 Oktober 2026
- **Konteks:** Standardisasi format kerapihan teks/angka yang diinput pengguna ke file Google Spreadsheet asli agar seluruhnya menggunakan format bold (tebal) aktif, baik saat penginputan mode [Semua Kolom], mode [Fokus Kolom], maupun saat menjalankan fitur "Format Kerapihan Sheet".

---

### Temuan Bug / Kebutuhan Format

#### BUG-135-01: Nilai Input Angka/Teks Disimpan dengan Format Regular (`bold: false`) ke Google Spreadsheet Asli
- **Lokasi Kode:**
  - `src/services/googleSheets/mutations.ts` (`updateBulkBusData`, baris 75-80)
  - `src/services/googleSheets/mutations.ts` (`formatWholeSheet`, baris 255-260)
- **Tingkat Keparahan:** Low - Medium (Kerapihan & Standardisasi Visual Dokumen SSOT Lapangan)
- **Deskripsi:**
  Sebelumnya pada fungsi `updateBulkBusData`, format teks yang dikirim via Google Sheets API v4 (`userEnteredFormat`) hanya menyalakan format bold untuk kolom Keterangan (`bold: isKet`). Semua nilai input operasional lainnya (trip, TOA, manual, KM awal/akhir, total TOA) diformat dengan `bold: false`. Selain itu pada fungsi `formatWholeSheet`, format grid dasar juga menyetel `bold: false`. Hal ini menyebabkan kontras keterbacaan data hasil input petugas operasional di spreadsheet menjadi kurang tegas dan tidak seragam dengan standar format laporan PDO.
- **Dampak Pengguna:**
  Data angka yang diinput oleh petugas tampil tipis/normal pada Google Spreadsheet, mengurangi keterbacaan saat dilihat oleh pengawas maupun saat lembar kerja diekspor/dicetak.
- **Mitigasi:**
  1. Ubah `textFormat.bold` pada `updateBulkBusData` menjadi `true` untuk semua sel yang diinput (`formatCells`).
  2. Ubah `textFormat.bold` pada `formatWholeSheet` menjadi `true` untuk seluruh baris data operasional bus.
