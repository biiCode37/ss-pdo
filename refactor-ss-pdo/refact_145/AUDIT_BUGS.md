# AUDIT BUGS: Hilangnya Total Ritase per Unit Armada pada Mode Rekap Akumulasi

## 1. Metadata Audit
- **Audit ID**: `BUG-145-ACC-RITASE`
- **Tanggal**: 19 Oktober 2026
- **Cabang**: `devmode`
- **Komponen Terdampak**:
  - `src/services/googleSheets/analytics.ts` (`getAccumulatedBusData`)
  - `src/utils/unitAnalytics.ts` (`extractAccumulatedUnitList`)
  - `src/components/UnitSummaryDashboard.tsx`
  - `src/components/busList/useBulkOperations.ts`
  - `src/components/UnitCard.tsx`
  - `src/components/busCard/BusCardSummary.tsx`
  - `src/components/UnitDetailModal.tsx`

---

## 2. Deskripsi Masalah Lapangan
Pengguna melaporkan: *"Pada mode rekap akumulasi, tidak ada satupun halaman yang menampilkan total ritase per unit armada"*.
Dari bukti tangkapan layar lapangan:
1. **Halaman Armada (`UnitCard`)**: Kolom `RITASE` menampilkan tanda strip (`-`), sementara `TOTAL KM` (3.346 km) dan `PELANGGAN` (4.139 pnp) terakumulasi dengan normal.
2. **Modal Detail Armada (`UnitDetailModal`)**: Bagian *Akumulasi Total* menampilkan `RITASE: 0/0`.
3. **Halaman Input SS (`BusCard`)**: Kolom `RITASE` menampilkan tanda strip (`-`).

---

## 3. Investigasi & Akar Masalah (*Root Cause Analysis*)

### A. Omit Kolom Trip pada `getAccumulatedBusData` (`src/services/googleSheets/analytics.ts`)
1. **Deteksi Header:** Fungsi `getAccumulatedBusData` yang mengumpulkan data baris bus lintas tab harian (misal tgl 1 s/d 18) hanya mendeteksi kolom `unit`, `toaShift1`, `toaShift2`, `manualShift1`, `manualShift2`, `totalToa`, `kmAwal1`, `kmAkhir1`, `kmAwal2`, `kmAkhir2`, dan `keterangan`. Kolom `tripPergi` dan `tripPulang` tidak pernah dicari pada `compositeHeaders`.
2. **Inisialisasi Unit Baru:** Pada `unitMap.set(unitName, { ... })`, field `tripPergi` dan `tripPulang` tidak dimasukkan ke dalam objek `BusData`.
3. **Akumulasi Unit Harian Berikutnya:** Pada blok penggabungan hari (`existing`), nilai `tripPergi` dan `tripPulang` tidak pernah dijumlahkan.
4. **Fallback Sekuensial:** Pada fallback sequential saat batch fetch gagal, `tripPergi` dan `tripPulang` juga tidak dijumlahkan.

### B. Pengosongan Nilai Trip pada `extractAccumulatedUnitList` (`src/utils/unitAnalytics.ts`)
Pada fungsi `extractAccumulatedUnitList`, field `tripPergi` dan `tripPulang` di-hardcode menjadi string kosong `''`.

### C. Anomali Target Trip Harian pada Mode Akumulasi
`detectTargetTrip` mencari target trip harian (misal 7/7). Ketika dijalankan pada rentang akumulasi (misal 18 hari di mana unit berjalan 100+ trip), membandingkan target harian 7/7 dengan akumulasi 100+ trip menyebabkan anomali status (seperti peringatan rute atau modus acak). Mode akumulasi seharusnya menonaktifkan evaluasi target harian (`targetTrip = null`).

---

## 4. Dampak Pengguna
- **Operasional & Pengawas:** Tidak dapat melihat capaian total ritase per armada selama periode akumulasi (misal 1 bulan atau pertengahan bulan).
- **Integritas Informasi:** Terjadi diskrepansi informasi di mana KM dan pelanggan terakumulasi dengan benar namun ritase kosong atau `0/0`.

---

## 5. Rencana Mitigasi & Perbaikan
1. Menambahkan pendeteksian kolom `tripPergi` dan `tripPulang` di `getAccumulatedBusData` sesuai standar `core.ts`.
2. Mengakumulasikan nilai numerik `tripPergi` dan `tripPulang` lintas hari menggunakan `parseIndonesianNumber`.
3. Memperbaiki `extractAccumulatedUnitList` agar menjumlahkan `tripPergi` dan `tripPulang`.
4. Mengisolasi `targetTrip` pada mode `AKUMULASI` agar tidak mendistorsi tampilan ritase kartu dan modal.
5. Menulis unit test komprehensif untuk memastikan perhitungan trip akumulasi 100% akurat.
