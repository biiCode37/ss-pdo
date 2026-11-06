# REPAIR REPORT: REFACTOR 210
**Modul:** Pembanding Realtime KM Lintas Hari & TOA Shift 1/Shift 2
**Tanggal:** 07 November 2026
**Status:** Selesai & lolos 4 quality gate. Belum diverifikasi visual di perangkat. Belum di-commit.

---

## 1. Implementasi Perbaikan
### A. Selisih KM lintas hari (BUG-UX-210-01)
- `useBusModalOdometer.ts`: field baru `kmLiveCrossDay: KmDistanceResult` = `computeRealtimeDistance(previousDayKmAkhir2, kmAwal1)` bila `isKmAwal1Valid` (bukan draft 3 digit); diteruskan oleh `useBusInputForm`.
- `fields/CrossDayKmIndicator.tsx`: "Selisih dari KM Akhir S2 {Kemarin}: Acuan {km} … +X KM" (info; `extreme` = warna peringatan). Negatif tidak dirender — kotak error `validateKmCrossDay` + checkbox "odometer direset" yang sudah ada tetap menahan simpan.
- Dipasang di `BusInputModalShift1.tsx` (kotak indikator odometer) dan `SingleFocusKmShift1.tsx` (kategori `kmAwal1`).

### B. Pembanding TOA (BUG-UX-210-02)
- `fields/ToaShiftComparison.tsx`: dua kotak "TOA Shift 1" & "TOA Shift 2 (otomatis)" dari `computeLiveToaShift2` yang sudah ada; invalid → kotak merah `role="alert"`.
- Menggantikan baris "Live Feedback Box" di `BusInputModalShift2.tsx`; ditambahkan di `SingleFocusToa.tsx` (kategori `totalToa`).
- Tidak ada perubahan payload/sheet: `toaShift2` tetap tidak dikirim (Strict No-Overwrite Formula Columns).

### C. Validasi TOTAL TOA (BUG-VAL-210-03)
- `validateToaPair`: `if (numTotToa < numToaS1)` (sebelumnya `numTotToa > 0 && …`).

### D. Kamus teks
- `TEXT_ALERTS.BUS_INPUT_MODAL`: `TOA_COMPARE_ARIA`, `LABEL_TOA_S2_AUTO`, `TOA_COMPARE_EMPTY`, `CROSS_DAY_DIFF_LABEL`, `CROSS_DAY_DIFF_VALUE`, `CROSS_DAY_DIFF_REF` (+ uji `texts.test.ts`).

## 2. Before vs After
| Aspek | Before | After |
|---|---|---|
| KM Awal S1 vs KM Akhir S2 kemarin | Hanya error saat negatif | Selisih realtime "+X KM"; negatif tetap error + opsi reset |
| TOTAL TOA mode Fokus Kolom | Tanpa pembanding | Kotak TOA S1 & TOA S2 otomatis |
| TOTAL TOA mode Semua Kolom | 1 baris teks, warna `rgba` mentah | Kotak pembanding, token semantik |
| TOTAL TOA "0" saat S1 = 86 | Lolos tersimpan | Ditolak, simpan tertahan |
| Kolom "TOA SHIFT 2" di sheet | Tidak dikirim | Tetap tidak dikirim |

## 3. Case: Skenario Lapangan
### Case BUG-UX-210-01: KM Awal pagi
- **Situasi:** KM Akhir S2 kemarin 316812; PDO mengetik KM Awal S1 316820.
- **Before:** Tidak ada umpan balik.
- **After:** "Selisih dari KM Akhir S2 Kemarin: Acuan 316812 · +8.0 KM". Bila mengetik 316700 → kotak error lama + opsi "odometer direset"; simpan tertahan sampai diperbaiki/dikonfirmasi reset.

### Case BUG-UX-210-02: Mengisi TOTAL TOA di mode Fokus Kolom
- **Situasi:** TOA S1 86, PDO mengetik TOTAL TOA 222.
- **Before:** Hanya kolom input.
- **After:** "TOA Shift 1: 86 · TOA Shift 2 (otomatis): 136"; yang terkirim ke sheet hanya TOTAL TOA 222.

### Case BUG-VAL-210-03: TOTAL TOA 0
- **Situasi:** TOA S1 86, TOTAL TOA diisi 0.
- **Before:** Tersimpan; rumus sheet menghasilkan TOA S2 −86.
- **After:** Peringatan merah realtime + validasi menolak simpan.

## 4. Verifikasi
07 November 2026:
1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` → **158/158 lulus**.
2. `pnpm vitest run src/` → **139 file, 1320/1320 lulus**. Test baru: `validateToaPair` (5, termasuk "0" & format "1.200"), `kmLiveCrossDay` (2), `CrossDayKmIndicator` (3), `ToaShiftComparison` (4), kamus teks; test payload `toaShift2` tidak terkirim tetap lulus.
3. `pnpm run build` → **exit 0** (`tsc -b` exit 0); `oxlint` file baru tanpa peringatan.
4. `graphify update .` → 7840 node, 13420 edge, 629 komunitas.

Belum diverifikasi: tampilan di HP (mode terang & gelap) karena butuh login Google + data rute.
