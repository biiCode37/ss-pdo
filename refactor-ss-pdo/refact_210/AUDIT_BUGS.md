# AUDIT TEMUAN PEMBANDING REALTIME KM & TOA: REFACTOR 210
**Modul:** Modal input unit — tab Shift 1/Shift 2 (mode Semua Kolom) & mode Fokus Kolom (`SingleFocusKmShift1`, `SingleFocusToa`), validasi (`busModalValidation.ts`), odometer (`useBusModalOdometer.ts`)
**Fokus Masalah:** Petugas belum melihat selisih KM antar hari saat mengisi KM Awal S1, dan belum melihat pembanding TOA S1/S2 saat mengisi TOTAL TOA (terutama di mode fokus).

---

### ID Temuan: BUG-UX-210-01
- **Lokasi Kode:** `src/components/busCard/modal/BusInputModalShift1.tsx`, `singleFocus/SingleFocusKmShift1.tsx`, `useBusModalOdometer.ts`
- **Keparahan:** Medium (salah ketik odometer lolos tanpa terlihat)
- **Deskripsi:** Selisih realtime hanya ada untuk KM Awal→Akhir dalam satu shift. Tidak ada tampilan selisih KM Awal S1 hari ini terhadap KM Akhir S2 hari sebelumnya, padahal datanya (`previousDayKmAkhir2`) sudah tersedia di form.
- **Dampak User:** Lonjakan KM antar hari (mis. salah ketik 1 digit) baru disadari saat rekap.
- **Mitigasi:** `kmLiveCrossDay = computeRealtimeDistance(KM Akhir S2 kemarin, KM Awal S1)` (hanya saat KM Awal S1 lengkap) + komponen `CrossDayKmIndicator` di kedua mode. Kasus negatif tetap ditangani kotak error lama (`validateKmCrossDay`) yang menahan simpan dengan opsi "odometer direset".

### ID Temuan: BUG-UX-210-02
- **Lokasi Kode:** `src/components/busCard/modal/singleFocus/SingleFocusToa.tsx` (kategori `totalToa`), `BusInputModalShift2.tsx`
- **Keparahan:** Medium (input kumulatif tanpa pembanding)
- **Deskripsi:** Mode Fokus Kolom TOTAL TOA tidak menampilkan TOA S1 maupun hasil TOA S2. Mode Semua Kolom hanya satu baris teks "TOA Shift 2: X (total − S1)" dengan warna mentah `rgba(...)`.
- **Dampak User:** Petugas mudah salah mengisi TOTAL TOA sebagai angka shift 2 saja.
- **Mitigasi:** Komponen `ToaShiftComparison` (kotak TOA S1 & TOA S2 otomatis = TOTAL − S1) di kedua mode, token semantik. **Hanya tampilan**: payload tetap tidak mengirim `toaShift2` (sudah dijamin `busInputPayload.ts` + test `busInputPayload.test.ts:198`).

### ID Temuan: BUG-VAL-210-03
- **Lokasi Kode:** `src/utils/modals/busInput/busModalValidation.ts` (`validateToaPair`)
- **Keparahan:** Medium (data tidak masuk akal tersimpan)
- **Deskripsi:** Syarat `numTotToa > 0 && numTotToa < numToaS1` meloloskan TOTAL TOA "0" ketika TOA S1 > 0.
- **Dampak User:** TOTAL TOA 0 dengan S1 86 tersimpan → TOA S2 di sheet (rumus) menjadi −86.
- **Mitigasi:** Tolak setiap TOTAL TOA terisi yang < TOA S1 (termasuk "0"); penyimpanan tertahan lewat jalur validasi yang sama.
