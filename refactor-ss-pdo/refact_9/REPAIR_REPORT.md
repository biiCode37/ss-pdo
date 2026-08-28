# Laporan Perbaikan — Filter Rute & Periode Halaman Log (SS_PDO)

## Ringkasan
- Folder: `refactor-ss-pdo/refact_9`
- Hasil: filter kombinasi [rute, hari, bulan, tahun, rentang aksi] server-side, di-trigger tombol Terapkan, dengan backfill untuk log lama dan index pendukung.

## BUG-33: Log Bus Tidak Mengandung Konteks Rute & Periode
- **Before:** Log `UPDATE_BUS_DATA`, `UPDATE_BULK_BUS_DATA`, `SYNC_OFFLINE_QUEUE`, `FORMAT_WHOLE_SHEET` hanya simpan `sheetId`, `tabName`, `rowIndex`. Tidak ada `route_code`/`year`/`month`/`day`.
- **After:** Helper `resolveRouteContext(sheetId, tabName)` di `src/utils/auditLogContext.ts` memanfaatkan cache `route_sheets`+`routes` lokal. Setiap log baru menulis `route_code` (kolom top-level) + `details.year/month/day` (tabName numerik → day).
- **Case:** Petugas A edit data bus M-01 pada 12/08/2026. Log sebelumnya tidak menampilkan apapun kecuali nomor baris. Sekarang baris log jelas: "Budi memperbarui data bus · Rute M-01 · 12/08/2026", dapat difilter di halaman audit.

## BUG-34: Filter Audit Terbatas Substring
- **Before:** `fetchActivityLogs` hanya punya `userEmail` dan `actionPrefix`. Filter client-side pada 150 log. Tidak bisa memfilter rute/periode sama sekali.
- **After:** Opsi baru: `routeCode`, `periodYear`, `periodMonth`, `periodDay`, `dateFrom`, `dateTo`. Server-side query: `eq('route_code', …)`, `.filter('details->>year'/'->>month'/'->>day', 'eq', …)`, `.gte`/`.lte('created_at', …)`. Cache key menyertakan semua filter agar tidak bentrok.
- **Case:** Supervisor buka halaman audit, pilih Rute M-01 + Agustus 2026, klik Terapkan. Server mengirim hanya log relevan — tidak ada 150-log noise. Lebih hemat memori.

## BUG-35: Backfill Otomatis untuk Log Lama
- **Before:** Log lama (pra-refactor) yang masih menyimpan `sheetId` tidak pernah punya `route_code`/`year`/`month`/`day`. Filter rute tampak sukses tapi log historis hilang.
- **After:** Migrasi `20260828000000_backfill_activity_log_route_context.sql` melakukan `UPDATE activity_logs ... FROM route_sheets JOIN routes ...` di mana `details->>'sheetId' = rs.spreadsheet_id`; jika `tabName` numerik, day ikut diisi. Hasil: log lama otomatis kompatibel dengan filter.
- **Case:** Setelah migrasi dijalankan di Supabase, supervisor filter "Rute M-01" → log historis tampil lengkap, termasuk update dari minggu lalu.

## BUG-36: Index Pendukung
- **Before:** Tanpa index, query filter rute + rentang created_at akan scan seluruh tabel pada ribuan baris.
- **After:** `idx_activity_logs_route_created` `(route_code, created_at DESC)` pada migrasi yang sama.
- **Case:** Dengan 10.000 log, klik Terapkan langsung terasa responsif.

## Aspek Performa & Keamanan
- Tidak ada request API tambahan pada mount; fetch hanya saat user tekan Terapkan.
- Pencarian teks (searchQuery) tetap di client untuk mengurangi round-trip.
- CacheKey mencakup semua opsi filter, jadi pergantian filter tidak menumpuk cache basi.
- Tombol Terapkan/Reset disable saat `isLoading`, mencegah double-fire request.
- 5 dropdown filter (rute, tahun, bulan, hari) + 2 date input; semuanya native `<select>` dan `<input type="date">` — ringan, tanpa library tambahan.

## Verifikasi
- `npm run test`: 23 file, 207 test lulus.
- `npm run build`: sukses.
- `npm run lint`: tanpa error baru.
- File baru: `src/utils/auditLogContext.ts` + testnya, `src/utils/auditLogContext.test.ts`, migrasi `supabase/migrations/20260828000000_backfill_activity_log_route_context.sql`.
