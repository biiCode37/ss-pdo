# Audit Temuan Bug & Evaluasi Logika: Refactor 166

## ID Temuan: BUG-166-01

- **Lokasi Kode**: `src/services/regionalIngestionService.ts` (Baris 158–217)
- **Keparahan**: HIGH (Integritas Data Operasional & Akurasi Klasifikasi Unit)
- **Komponen Terdampak**:
  - Ingestion laporan ringkasan 18 rute (`extractRouteDailyMetrics`)
  - Status kesiapan armada (`nonSgoUnitsS1`, `nonSgoUnitsS2`)
  - Laporan WhatsApp Format 3 (`*Rincian Tidak Ops:*` vs `*Catatan Khusus Unit (Beroperasi):*`)

### Deskripsi Masalah

1. **Miskonsepsi Kolom Trip Spreadsheet (SSOT)**:
   Pada implementasi sebelumnya, terdapat variabel:
   ```typescript
   const trip1 = parseIndonesianNumber(bus.tripPergi);
   const trip2 = parseIndonesianNumber(bus.tripPulang);
   ```
   Variabel ini secara keliru diasumsikan mewakili ritase Shift 1 dan Shift 2. Padahal, file spreadsheet rute tunggal asli hanya membagi shift pada kolom Pelanggan (`TOA Shift 1/2`, `Manual Shift 1/2`) dan Spidometer (`KM Awal/Akhir Shift 1/2`). Kolom Trip adalah **Arah Trayek Fisik** (Arah Pergi vs Arah Pulang) untuk akumulasi 1 hari operasional penuh.
2. **Ketergantungan Regex Kata Kunci Kendala (`isExplicitKendala`)**:
   Sistem sebelumnya menggunakan regex kata kunci (`MOGOK`, `RUSAK`, `LAKA`, `BAP`, `SERVICE`, `PERBAIKAN`, `TROUBLE`, `RADIATOR`, dll) pada kolom Keterangan untuk menentukan apakah unit aktif atau tidak.
   Pola ini bermasalah karena:
   - Teks korlap/pengawas sangat dinamis, bebas, dan bervariasi di tiap depo/operator.
   - Bus yang sebenarnya beroperasi (misal jalan 4 trip di pagi hari) tetapi mengalami kendala ringan dan dicatat *"Mogok radiator"* keliru dianggap tidak aktif (`hasActivityS1 = false`) dan didiskualifikasi dari Realisasi Operasi.
   - Bus yang tidak beroperasi (`trip = 0`) dengan keterangan di luar kamus kata kunci berisiko salah diklasifikasikan.

### Dampak User

1. Nilai Realisasi Operasi (Realops) di monitoring wilayah bisa terdistorsi jika unit yang sempat beroperasi memiliki catatan kendala di kolom keterangan.
2. Unit beroperasi yang memiliki catatan lapangan keliru masuk ke kelompok `*Rincian Tidak Ops:*` alih-alih `*Catatan Khusus Unit (Beroperasi):*`.

### Mitigasi

1. Hapus seluruh ketergantungan pada regex kata kunci kendala `isExplicitKendala`.
2. Gunakan akumulasi trip fisik 1 hari murni (`totalTrip = tripPergi + tripPulang`) sebagai penentu mutlak:
   - `totalTrip === 0` atau tidak ada nilai ➔ Unit **TIDAK BEROPERASI (1 hari full)**.
   - `totalTrip > 0` ➔ Unit **BEROPERASI**. Jika ada keterangan di spreadsheet, dicatat sebagai `isOperatingWithNote: true, isOff: false` dan tampil di `*Catatan Khusus Unit (Beroperasi):*` tanpa mengurangi Realisasi Operasi.
