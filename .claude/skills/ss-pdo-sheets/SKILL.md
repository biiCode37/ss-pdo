---
name: ss-pdo-sheets
description: Cara SS_PDO membaca dan menulis Google Sheets — deteksi header & kolom, kolom berumus yang tidak boleh ditimpa, payload builder, transport (service account via sheets-proxy vs OAuth), format sel, dan efek samping (log, realtime). Pakai sebelum mengubah apa pun yang menyentuh data spreadsheet, form input bus, atau payload mutasi.
---

# Google Sheets di SS_PDO

Spreadsheet adalah **SSOT** input lapangan. Satu file per rute/bulan (terdaftar di tabel `route_sheets`), satu tab per tanggal, satu baris per unit bus.

## Lokasi kode
| File | Peran |
|---|---|
| `src/services/googleSheets/core.ts` | `HEADER_KEYWORDS`, `detectHeaderRowAndBuildComposite`, `findColumnIndex`, `getBusData` (baca + bangun `headerMap`), `getBusRowData`, `getTabGid`, `numberToColumnName`. |
| `src/services/googleSheets/mutations.ts` | `updateBulkBusData` (satu-satunya jalur tulis nilai), `updateBusData` (delegasi ke bulk), `formatWholeSheet`. |
| `src/services/googleSheets/transport.ts` | `fetchSpreadsheetMeta`, `fetchSheetValues(Batch)`, `updateSheetValuesBatch`, `batchUpdateSpreadsheet`; mode `service_account` / `client_oauth` / `auto` + `checkProxyHealth`. |
| `src/services/googleSheets/types.ts` | `BusData`, `HeaderMap`. |
| `src/components/busCard/modal/busInputPayload.ts` | `buildBusInputPayload` — dari form ke `Partial<BusData>`. |
| `src/utils/sheetColorUtils.ts` | Warna baris berdasarkan keterangan (RGB desimal Sheets API). **SSOT Sheets — jangan diubah untuk keperluan UI.** |
| `src/utils/keteranganUtils.ts` | `normalizeKeterangan`, parsing token keterangan, `isUnitOff`, `isUnitTo`. |
| `supabase/functions/sheets-proxy/index.ts` | Proxy service account + whitelist `spreadsheetId`. |

Barrel: `src/services/googleSheets/index.ts` (diimpor sebagai `services/googleSheets`).

## Deteksi header
- Cari baris header di 5 baris pertama: baris yang memuat kolom unit (`nobody|unit|bus|body`) dan ≥50% sel berupa teks.
- Jika baris berikutnya kosong pada kolom unit → header 2 tingkat; header digabung (`"TOA" + " SHIFT 1"`), sel induk kosong mewarisi header sebelumnya.
- Pencocokan kolom: `normalizeString` (lowercase, buang non-alfanumerik) lalu `includes` kata kunci di `HEADER_KEYWORDS`. Urutan kata kunci penting (mis. `totalToa` memuat `'total'`).
- **Trip Pergi/Pulang tidak punya kata kunci**: posisinya `unitIdx + 1` dan `unitIdx + 2` selama headernya tidak mengandung "toa". Label diambil dari header aktual (`tripPergiLabel`/`tripPulangLabel`).
- `headerMap` berisi indeks kolom 0-based (`-1` bila tidak ada). `rowIndex` pada `BusData` adalah **1-based** baris sheet.

## Field `BusData`
`unit`, `tripPergi`, `tripPulang`, `toaShift1`, `toaShift2`, `manualShift1`, `manualShift2`, `totalToa`, `kmAwal1`, `kmAkhir1`, `kmAwal2`, `kmAkhir2`, `keterangan`, `originalRow`. Kolom turunan yang hanya dibaca: `totalKmShift1`, `totalKmShift2`.

## Kolom berumus — DILARANG ditulis
| Kolom | Alasan |
|---|---|
| `toaShift2` ("TOA SHIFT 2") | Rumus `=TOTAL_TOA - TOA_SHIFT_1`. Input pengguna shift 2 masuk ke `totalToa`. |
| `totalKmShift1/2` | Rumus selisih KM. |
| Total ritase / total KM / rekap | Rumus sheet. |

Penjaga saat ini (jangan dilonggarkan):
- `updateBulkBusData` tidak punya cabang `addUpdate('toaShift2', …)` sama sekali — walau `updates.toaShift2` dikirim, nilainya diabaikan.
- `buildBusInputPayload` tidak mengisi `updates.toaShift2`; `computeEffectiveTotalToa` mengembalikan `totalToa` input pengguna apa adanya.

Saat menambah field yang ditulis: tambahkan `addUpdate` eksplisit di `updateBulkBusData`, pastikan kolomnya input murni (cek file contoh di `contoh_file_ss/`), dan tambahkan test yang membuktikan kolom berumus tidak ikut di payload.

## Alur tulis (`updateBulkBusData`)
1. Kumpulkan range `Tab!<Kolom><baris>` hanya untuk field yang `!== undefined` dan kolomnya ada di `headerMap`. `keterangan` dinormalisasi dulu.
2. `updateSheetValuesBatch` dengan `valueInputOption: 'USER_ENTERED'`.
3. Format (best-effort, error hanya `console.warn`): sel yang ditulis → bold, center, middle, wrap; jika `keterangan` berubah → warna latar baris dari `getKeteranganColor` (putih bila null), rentang kolom `unit` … `getRowEndCol(headerMap)`.
4. Efek samping: `logActivity` **1 baris** `UPDATE_BULK_BUS_DATA` per batch; `triggerRealtimeSheetSync(routeCode, date)` (debounce 1 dtk per rute+tanggal → `sheet-sync-webhook` → `daily_route_reports`); `broadcastBusUpdate` per baris ke perangkat lain.
5. Error auth dilempar ulang apa adanya (`isAuthError`) agar alur re-login jalan.

Konteks rute/tanggal dari `sheetId`+`tabName`: `resolveRouteContext` (`utils/auditLogContext.ts`), `getRouteCodeForSheet` / `getMonthYearForSheet` (`utils/cacheUtils.ts`).

## Transport
- `service_account`: semua request lewat Edge Function `sheets-proxy` (header auth Supabase). Proxy menolak `spreadsheetId` yang tidak lolos regex `^[a-zA-Z0-9-_]{15,100}$` atau tidak ada di `route_sheets`. Spreadsheet baru wajib didaftarkan di `route_sheets` dulu.
- `client_oauth`: gapi dengan token Google pengguna (`authGis.ts`, `authSession.ts`).
- `auto`: pakai proxy bila `checkProxyHealth` aktif, selain itu OAuth.

## Angka & teks
- Nilai sel bisa "5.589,06", "4.670", "192,73", "-", "#REF!" → selalu `parseIndonesianNumber(val, fallback)`.
- Perbandingan nilai untuk konflik/integritas: `normalizeFieldValue`; penggabungan konflik: `utils/conflictMerge.ts`.
- Keterangan shift digabung/dipisah dengan `combineShiftKeterangan` / `splitShiftKeterangan`.

## Test terkait
`core.test.ts`, `transport.test.ts`, `busInputPayload.test.ts`, `busInputValidation.test.ts`, `useBusInputForm.test.tsx`, `sheetColorUtils.test.ts`, `keteranganUtils.test.ts`. Jalankan yang relevan dulu, lalu `/verify`.
