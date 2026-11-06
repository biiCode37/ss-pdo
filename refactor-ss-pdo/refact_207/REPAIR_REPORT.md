# REPAIR REPORT: REFACTOR 207
**Modul:** Set Trip Unit Terpilih (Input SS)
**Tanggal:** 06 November 2026
**Status:** Selesai & lolos 4 quality gate. Belum dicek visual di browser.

---

## 1. Implementasi Perbaikan
### A. Mode Pilih & bar aksi (BUG-SEL-207-01)
- `BusListControlBar.tsx`: tombol **"Pilih"** (ikon `ListChecks`, `aria-pressed`) di samping Set Jumlah Trip; grid baris 1 jadi `auto auto 1fr`. `BusListHeader.tsx` meneruskan prop.
- `BusList.tsx`: state `isSelectionMode` + `selectedRows: Set<rowIndex>`; `handleToggleSelect` (updater fungsional, deps `[]`); pilihan direset saat `sheetId/tabName` berubah; dikunci di tab AKUMULASI; spacer 72px saat mode pilih.
- `BusListSelectionBar.tsx` (baru): bar mengambang di atas BottomNav via portal ke `body` — "N unit dipilih · Batal · Set Trip Terpilih"; token semantik saja.
- `BusCard.tsx`/`types.ts`: prop `isSelectionMode`, `isSelected`, `onToggleSelect`. Di mode pilih, ketukan kartu (termasuk kolom Ritase) hanya memilih; tampil kotak centang `role="checkbox"` + outline `--color-action-primary-bg`.
- `useBulkOperations.ts`: jalur simpan bersama `persistTripUpdates` (online: 1x `updateBulkBusData` = 1 log audit; offline: antrean per baris; lalu `onUpdateBus`). `handleOpenBulkTripModal` direfaktor memakai jalur ini (perilaku sama). Handler baru `handleApplyTripToSelected`.
- `bulkModals.ts`: opsi `isSelection` & `skippedCount` → judul "Set Trip Unit Terpilih" + deskripsi unit terpilih.
- Kamus: `BUS_LIST.SELECT_MODE_*`, `SELECTED_*`, `SET_TRIP_SELECTED_*`, `BULK_TRIP.TITLE_SELECTED/DESCRIPTION_SELECTED/SKIPPED_NOTE` (+ uji di `texts.test.ts`).
- Payload hanya kolom input `tripPergi`/`tripPulang` — tidak menyentuh kolom berumus.

### B. Lewati unit OFF/TO EVDAL (BUG-SEL-207-02)
- `handleApplyTripToSelected`: filter `isUnitOffOrToEvdal`; semua OFF → `showWarningToast`, tanpa modal & tanpa request. Toast sukses menyebut jumlah yang dilewati.

### C. Target rute tidak berubah (BUG-SEL-207-03)
- `handleApplyTripToSelected` tidak memanggil `setBulkPergi/setBulkPulang`. Toast sukses menampilkan ritase PP: `(pergi + pulang) / 2`.

## 2. Before vs After
| Aspek | Before | After |
|---|---|---|
| Isi trip 4 dari 20 unit | 4x buka kartu, 4x simpan, 4 request | Pilih 4 kartu → 1 modal → 1 request batch |
| Log audit | 4 baris | 1 baris (batch `updateBulkBusData`) |
| Unit OFF ikut terpilih | — | Dilewati + diberi tahu |
| Target rute (warna kartu) | — | Tetap dari Set Jumlah Trip |
| Tab AKUMULASI | — | Mode pilih dikunci (toast) |

## 3. Case: Skenario Lapangan
### Case BUG-SEL-207-01: 4 unit berangkat terlambat
- **Situasi:** 20 unit; 16 unit 8/8, 4 unit 7/8.
- **Before:** Set Jumlah Trip 8/8, lalu buka & simpan 4 kartu satu per satu.
- **After:** Set Jumlah Trip 8/8 → "Pilih" → ketuk 4 kartu → "Set Trip Terpilih" → isi 7/8 → toast "Trip 7/8 (7.5 Rit) disimpan … 4 unit terpilih"; mode pilih tertutup.

### Case BUG-SEL-207-02: Salah ketuk unit OFF
- **Situasi:** PDO memilih 3 unit, salah satunya OFF.
- **Before:** —
- **After:** Modal menyebut "2 unit terpilih … 1 unit berstatus OFF/TO EVDAL dilewati"; unit OFF tidak berubah.

### Case BUG-SEL-207-03: Warna kartu unit lain
- **Situasi:** Setelah 4 unit diisi 7/8.
- **Before:** —
- **After:** Tombol tetap "Set Jumlah Trip (8/8)"; 16 unit lain tetap hijau, 4 unit tampil di bawah target sesuai faktanya.

## 4. Verifikasi
06 November 2026 (satu working tree dengan refact_206):
1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` → **116/116 lulus**.
2. `pnpm vitest run src/` → **136 file, 1221/1221 lulus** (termasuk test baru: `BusList` mode pilih — `updateBulkBusData` `toHaveBeenCalledTimes(1)` hanya baris terpilih non-OFF, semua-OFF tanpa request, Batal mengosongkan pilihan, kunci AKUMULASI; `BusCard` ketuk di mode pilih tidak membuka modal; kamus teks).
3. `pnpm run build` → **exit 0**.
4. `graphify update .` → 7713 node, 13177 edge, 612 komunitas.

Belum diverifikasi: tampilan & posisi bar aksi di ponsel nyata (butuh login Google + data rute).
