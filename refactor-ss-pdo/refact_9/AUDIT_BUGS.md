# Audit Bug — Filter Rute & Periode Halaman Log Aktivitas (SS_PDO)

## Ringkasan
- Total: 4 temuan
- Tingkat keparahan: 1 Tinggi, 2 Sedang, 1 Rendah

## BUG-33: Log Bus Tidak Mengandung Konteks Rute & Periode
- Lokasi: `src/services/googleSheets/mutations.ts`, `src/hooks/useOfflineSync.ts`
- Tingkat: Tinggi
- Deskripsi: Log `UPDATE_BUS_DATA`, `UPDATE_BULK_BUS_DATA`, `SYNC_OFFLINE_QUEUE`, `FORMAT_WHOLE_SHEET` tidak menyimpan `route_code`, `year`, `month`, `day`. Filter rute + periode tidak mungkin dilakukan.
- Dampak: Halaman audit tidak bisa menjawab pertanyaan operasional "siapa yang mengedit rute M-01 tanggal 12 Agustus 2026". Supervisi kehilangan jejak.
- Mitigasi: Tambah `resolveRouteContext(sheetId, tabName)` di utils, populate log baru dengan `route_code` top-level + `details.year/month/day`.

## BUG-34: Filter Audit Hanya Berdasarkan Substring Kategori
- Lokasi: `src/services/routeService.ts` (fetchActivityLogs), `src/components/AuditLogPage.tsx`
- Tingkat: Sedang
- Deskripsi: `fetchActivityLogs` mendukung `userEmail` dan `actionPrefix` saja; tidak ada filter `route_code` atau periode. Filter terjadi di client pada 150 log.
- Dampak: Hasil filter terbatas jendela 150; log historis di luar jendela tidak bisa dijangkau.
- Mitigasi: Tambah opsi `routeCode`, `periodYear/Month/Day`, `dateFrom/dateTo`. Server-side query (route_code eq, JSONB details->>year/month/day, created_at range).

## BUG-35: Backfill Konteks Rute untuk Log Lama Tidak Dilakukan
- Lokasi: `supabase/migrations/20260828000000_backfill_activity_log_route_context.sql`
- Tingkat: Sedang
- Deskripsi: Log lama (pra-refactor) masih menyimpan `sheetId` di `details`; rute & periode bisa diturunkan via join `route_sheets`+`routes`. Tanpa backfill, log lama tidak akan pernah cocok dengan filter baru.
- Dampak: Filter rute/periode akan tampak "berhasil" tapi log historis tetap tidak muncul.
- Mitigasi: Migrasi SQL yang melakukan UPDATE dengan join, termasuk tanggal harian bila `tabName` numerik.

## BUG-36: Tidak Ada Index Pendukung Filter Rute + Rentang created_at
- Lokasi: `public.activity_logs` (index)
- Tingkat: Rendah
- Deskripsi: Tanpa index gabungan `route_code, created_at DESC`, filter rute + rentang waktu akan full table scan pada volume besar.
- Dampak: Lambat pada tabel dengan ribuan baris; user merasakan delay saat klik Terapkan.
- Mitigasi: `CREATE INDEX IF NOT EXISTS idx_activity_logs_route_created ON activity_logs (route_code, created_at DESC)`.
