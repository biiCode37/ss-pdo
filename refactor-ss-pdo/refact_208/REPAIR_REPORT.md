# REPAIR REPORT: REFACTOR 208
**Modul:** Kosongkan Trip Massal, Swipe Navigasi, Pewarnaan Ritase
**Tanggal:** 07 November 2026
**Status:** Selesai & lolos 4 quality gate. Belum dicek di perangkat nyata.

---

## 1. Implementasi Perbaikan
### A. Kosongkan trip massal (BUG-TRIP-208-01)
- `bulkModals.ts`: kedua kolom kosong → `{ tripPergi: "", tripPulang: "" }`; hanya satu kosong → `REQUIRED_OR_CLEAR`. Tambah petunjuk `CLEAR_HINT` di modal.
- `useBulkOperations.ts`: `isClearResult` + `confirmClearTrips` (`showConfirmDialog`, `isDanger`). Set Jumlah Trip: konfirmasi `N unit`, kirim `""` lewat `persistTripUpdates` yang sama (1 request batch, 1 log audit), lalu `bulkPergi/bulkPulang` direset **setelah** data diperbarui agar target dihitung ulang dari data. Set Trip Terpilih: konfirmasi jumlah unit eligible, unit OFF/TO EVDAL tetap dilewati.
- `updateBulkBusData` sudah meneruskan `""` (hanya `undefined` yang dilewati) → sel benar-benar kosong, kolom input trip saja (bukan kolom berumus).
- Kamus: `BULK_TRIP.REQUIRED_OR_CLEAR`, `CLEAR_HINT`, `CLEAR_CONFIRM_TITLE/TEXT/BTN`, `BUS_LIST.TRIP_CLEARED_SUCCESS`.

### B. Swipe vs scroll (BUG-NAV-208-02)
- `SwipeableContainer.tsx`: `onTouchMove` mengunci sumbu setelah 10px (`AXIS_LOCK_DISTANCE`); `'x'` hanya bila `|dx| > |dy| × 2` (`HORIZONTAL_DOMINANCE`). `onTouchEnd`: swipe hanya bila sumbu `'x'`, jarak ≥ `minSwipeDistance`, dominasi 2×, dan `window.scrollY` tidak bergeser > 4px. `onTouchCancel` & multi-touch me-reset gestur. Bila tidak ada `touchmove` tercatat, arah dinilai dari titik akhir dengan syarat yang sama.

### C. Pewarnaan ritase (BUG-UI-208-03)
- `unitAnalytics.ts`: fungsi baru `evaluateTripStatus(pergi, pulang, targetTrip)` → `{ hasTrip, ritase, isBelowTarget, isTargetAchieved, isAnomaly }` dalam satuan ritase PP.
- Dipakai di `BusCardSummary.tsx` (badge Trip & kolom Ritase), `busCardStyles.ts` (garis status kartu), `UnitCard.tsx` (halaman Armada).
- Warna mentah diganti token: `--color-warning-*`, `--color-success-*`, `--color-error-*`, `--color-text-primary/secondary`.
- Tooltip anomali: "Selisih trip lebih dari 1 (cek kembali): p/q Trip" (sebelumnya "Trip Tidak Seimbang: p/q Rit").

## 2. Before vs After
| Aspek | Before | After |
|---|---|---|
| Kosongkan trip massal | Ditolak ("Harap isi…"); hanya bisa isi 0 | Kosongkan kedua kolom → konfirmasi → sel SS kosong |
| Scroll cepat dengan jempol melengkung | Bisa pindah tab (dx 140, dy 70 lolos) | Sumbu terkunci vertikal → tidak pindah tab |
| Syarat swipe horizontal | dx ≥ 50 & dx > dy × 1,2 | Terkunci `'x'` sejak awal, dx ≥ 50, dx > dy × 2, halaman tidak ter-scroll |
| 8/7 tanpa target | Kuning | Hijau |
| 7/8 vs target rute 8/7 | Kuning ⚠️ (per kolom) | Hijau (7,5 = 7,5 Rit) |
| 8/7 vs target 8/8 | Kuning ⚠️ | Kuning ⚠️ (memang kurang 0,5 Rit) |
| 8/5 (salah ketik) | Kuning | Kuning + tooltip "cek kembali" |
| Warna | hex/rgba mentah di 3 file | Token semantik |

## 3. Case: Skenario Lapangan
### Case BUG-TRIP-208-01: Salah Set Jumlah Trip di tanggal yang keliru
- **Situasi:** PDO menerapkan 8/8 ke 20 unit di tab tanggal yang salah.
- **Before:** Tidak bisa dihapus dari aplikasi; harus buka Google Sheets atau isi 0 (angka 0 tercatat).
- **After:** Buka Set Jumlah Trip → kosongkan kedua kolom → "Kosongkan Trip? 20 unit…" → Ya → sel trip kosong, toast "Trip 20 unit berhasil dikosongkan di Spreadsheet".

### Case BUG-NAV-208-02: Menggulir daftar 30 unit dengan cepat
- **Situasi:** PDO scroll naik-turun cepat dengan satu jempol.
- **Before:** Sesekali terlempar ke halaman Armada.
- **After:** Gestur yang diawali vertikal terkunci sebagai scroll; pindah tab hanya dengan geser mendatar yang jelas.

### Case BUG-UI-208-03: Unit start B, 7,5 Rit
- **Situasi:** Target rute 8/7 (7,5 Rit); unit start dari Titik B menjalani 7/8.
- **Before:** Kartu kuning ⚠️ "kurang ritase".
- **After:** Kartu hijau (target tercapai). Kuning hanya untuk ritase < target atau selisih > 1 trip.

## 4. Verifikasi
07 November 2026:
1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` → **116/116 lulus**.
2. `pnpm vitest run src/` → **137 file, 1239/1239 lulus**. Test baru: `evaluateTripStatus` (5), `BusCardSummary` warna (4), swipe (5, digabung ke `__tests__/SwipeableContainer.test.tsx`), kosongkan trip massal/terpilih (4, termasuk `updateBulkBusData` `toHaveBeenCalledTimes(1)` dengan `""` & batal konfirmasi tanpa request), kamus teks.
3. `pnpm run build` → **exit 0**.
4. `graphify update .` → 7766 node, 13240 edge, 635 komunitas.
- Bukti regresi: test swipe baru dijalankan terhadap `SwipeableContainer.tsx` versi HEAD → **4 gagal** (scroll melengkung, diagonal, halaman ter-scroll, touchcancel); versi baru → 11/11 lulus.

Belum diverifikasi: rasa swipe & scroll di perangkat Android/iOS nyata (ambang 10px/2× mungkin perlu disetel), tampilan dialog konfirmasi kosongkan di HP.
