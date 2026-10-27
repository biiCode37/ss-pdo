# Audit Temuan Bug: Refactor 167

## ID Temuan: BUG-167-01

- **Lokasi Kode**: `src/services/regionalIngestionService.ts` (Baris 163–252)
- **Keparahan**: HIGH (Integritas Data Laporan Operasional & Penyelarasan Armada Shift 2)
- **Komponen Terdampak**:
  - Ingestion data rute harian (`extractRouteDailyMetrics`)
  - Evaluasi armada non-SGO Shift 2 (`nonSgoUnitsS2` / `fleet_status_shift2`)
  - Laporan WhatsApp Kesiapan Armada Format 3 (Shift 2)

### Deskripsi Masalah

1. **Kontradiksi Status Armada Shift 2 (Anomali JAK.115)**:
   Pada spreadsheet rute tunggal, pengawas seringkali baru menginput data Shift 1 di siang hari, sementara kolom `TOA SHIFT 2` masih tertulis `0` atau kosong.
   Kode sebelumnya menguji keaktifan bus Shift 2 dengan mengecek apakah ada angka di Shift 2. Karena angka Shift 2 bernilai 0, sistem menganggap ke-30 bus tersebut "tidak aktif" di Shift 2, dan karena kolom Keterangan kosong, sistem secara otomatis memberi label `"OFF"` pada ke-30 bus tersebut di `nonSgoUnitsS2`.
   Namun pada saat menghitung angka ringkasan `realopsShift2`, sistem melakukan fallback ke Shift 1 (= 30 unit).
   Akibatnya timbul paradoks yang sangat membingungkan:
   - Target SGO: 30 Unit
   - Realisasi Ops: 30 Unit
   - Tidak Ops: 0 Unit
   - Status: LENGKAP ✅
   - Tetapi di bawahnya tercantum: `*Unit Libur (OFF) / Keterangan Khusus:*` dengan **30 unit seluruhnya dicap OFF**!

2. **Anjloknya Realisasi Operasi Shift 2 (Anomali JAK.76 & JAK.120)**:
   Pada rute JAK.76, terdapat 44 unit yang seluruhnya memiliki trip fisik penuh (12–16 trip). Namun hanya 1 unit (`KJG 230012`) yang memiliki catatan `BA02 PRAMUDI SAKIT PERUT`. Adanya 1 catatan unit tersebut membuat sistem mengira Shift 2 sudah selesai diinput, membatalkan fallback ke Shift 1, dan menetapkan Realisasi Ops hanya **1 Unit**, sementara **43 unit lainnya dicatat Tidak Ops (37 unit di antaranya dicap OFF)**.

### Dampak User

- Laporan WhatsApp Kesiapan Armada Shift 2 tidak mencerminkan fakta lapangan dan berpotensi memicu teguran manajemen/pimpinan karena armada yang jalan normal dicap sebagai unit "OFF".
- Angka ketercapaian wilayah terdistorsi menjadi rendah.

### Mitigasi

1. Unit yang memiliki trip fisik (`totalTrip > 0` atau pergerakan fisik) adalah **BEROPERASI (SGO)** untuk kedua shift. Dilarang keras mencap unit beroperasi sebagai OFF hanya karena kolom input Shift 2 belum masuk di spreadsheet.
2. Unit beroperasi dengan catatan di kolom Keterangan masuk ke `*Catatan Khusus Unit (Beroperasi):*` tanpa mengurangi nilai realops.
3. Unit beroperasi tanpa catatan adalah SGO normal dan **TIDAK DIMASUKKAN** ke daftar non-SGO.
4. HANYA unit yang benar-benar tidak memiliki trip (`totalTrip === 0` dan tanpa aktivitas fisik) yang boleh masuk ke daftar Tidak Ops / Libur (OFF).
