# REPAIR REPORT: Perbaikan Akumulasi Total Ritase per Unit Armada (Refact 145)

## 1. Ringkasan Implementasi
Telah diperbaiki bug hilangnya total ritase per unit armada pada mode rekap akumulasi di seluruh halaman aplikasi (Halaman Armada `UnitCard`, Modal Detail Armada `UnitDetailModal`, dan Halaman Input SS `BusCardSummary`).

---

## 2. Rincian Perubahan Kode

### A. Layanan Google Sheets: `src/services/googleSheets/analytics.ts`
- **Pendeteksian Kolom Trip:** Menambahkan logika pencarian kolom `tripPergi` dan `tripPulang` dari `compositeHeaders` pada fungsi `getAccumulatedBusData`.
- **Ekstraksi & Akumulasi Batch:**
  - Mengekstrak numerik `tripPergi` dan `tripPulang` dari baris data menggunakan `parseIndonesianNumber`.
  - Menginisialisasi nilai trip pada `unitMap.set(unitName, { ... })`.
  - Mengakumulasikan penjumlahan `tripPergi` dan `tripPulang` antar-hari pada unit yang sama (`existing.tripPergi = sumTripP > 0 ? sumTripP.toString() : ''`).
- **Pembaruan Fallback Sekuensial:** Mengakumulasikan `tripPergi` dan `tripPulang` jika terjadi pemanggilan sekuensial per-hari.

### B. Utilitas Analitik Unit: `src/utils/unitAnalytics.ts`
- **`extractAccumulatedUnitList`:** Menghapus hardcoded string kosong `''` pada `tripPergi` dan `tripPulang`. Sekarang menyimpan dan menjumlahkan `tripPergi` dan `tripPulang` dari seluruh hari operasional.

### C. Isolasi Target Trip Harian pada Mode Akumulasi:
- **`src/components/UnitSummaryDashboard.tsx`:** Menonaktifkan perbandingan target ritase harian (`targetTrip = null`) jika `selectedTab === "AKUMULASI"`. Hal ini mencegah anomali peringatan target ritase harian 7/7 diaplikasikan ke total ritase akumulasi (misal 105 ritase).
- **`src/components/busList/useBulkOperations.ts`:** Mengembalikan `null` untuk `targetTrip` jika `tabName === "AKUMULASI"`.

---

## 3. Before vs After

| Aspek | Before | After |
| :--- | :--- | :--- |
| **Header Mapping Akumulasi** | Hanya mendeteksi TOA, KM, dan Keterangan; kolom trip diabaikan. | Mendeteksi kolom `tripPergi` dan `tripPulang` di `compositeHeaders`. |
| **Akumulasi Trip Unit** | Field `tripPergi` dan `tripPulang` tidak pernah dibuat/dijumlahkan di `getAccumulatedBusData`. | Dijumlahkan secara kumulatif numerik lintas seluruh tanggal yang dipilih. |
| **Kartu Armada (`UnitCard`)** | Menampilkan `RITASE: -` (strip kosong). | Menampilkan total ritase PP terakumulasi: `X/Y Rit` (contoh: `105/105 Rit`). |
| **Kartu Input SS (`BusCard`)** | Menampilkan `RITASE: -` (strip kosong). | Menampilkan total ritase PP terakumulasi: `X/Y Rit`. |
| **Modal Detail (`UnitDetailModal`)** | Menampilkan `RITASE: 0/0`. | Menampilkan total ritase PP terakumulasi murni: `X/Y` (contoh: `105/105`). |
| **Indikator Target pada Akumulasi** | Berisiko memunculkan icon peringatan ⚠️ karena membandingkan akumulasi 100+ trip dengan target harian 7 trip. | `targetTrip` di-set ke `null` saat mode akumulasi aktif, menghasilkan visual bersih dan akurat. |

---

## 4. Case: Skenario Lapangan

### Skenario 1: Evaluasi Armada Bulanan JAK.115 (01 - 18 Oktober 2026)
- **Kondisi Awal:** Bus KWK 222158 beroperasi selama 15 hari dengan rata-rata 7 rit PP per hari. Pada mode rekap akumulasi (01 - 18 Oktober), kartu menampilkan Total KM `3.346 km` dan Pelanggan `4.139 pnp`, namun kolom `RITASE` menampilkan `-` dan pada modal detail armada menampilkan `0/0`.
- **Hasil Setelah Perbaikan:** Kolom `RITASE` langsung menampilkan `105/105 Rit` pada kartu armada dan input SS, serta `105/105` pada kotak Akumulasi Total di Modal Detail Armada.

### Skenario 2: Armada dengan Selisih Trip (Imbalance)
- **Kondisi:** Bus sempat mengalami gangguan teknis (misal BA.02 tali kopling putus) di salah satu hari sehingga pulang 6 trip (total akumulasi 105 pergi / 104 pulang).
- **Hasil:** Aplikasi menampilkan `105/104 Rit` dengan warna indikator selisih, memudahkan Korlap melihat arah yang belum seimbang tanpa menimpa formula apapun di Google Sheets.

---

## 5. Status Verifikasi & Quality Gates
1. **Unit Test:**
   - `src/services/googleSheets/analyticsAccumulation.test.ts` (1 test passed).
   - `src/utils/unitAnalytics.test.ts` (7 tests passed).
   - `src/components/__tests__/UnitCard.test.tsx` (5 tests passed).
   - `src/components/__tests__/UnitDetailModal.test.tsx` (5 tests passed).
   - `src/components/busCard/BusCard.test.tsx` (7 tests passed).
   - **Total Full Suite:** 109 test files passed, 789 tests passed (100%).
2. **Build Test:**
   - `pnpm run build` ➔ TypeScript Strict Mode (`tsc -b`) dan Vite production build sukses 0 error dalam 1.44s.
3. **Knowledge Graph:**
   - `graphify update .` ➔ 5.725 nodes, 7.119 edges terbarui.
