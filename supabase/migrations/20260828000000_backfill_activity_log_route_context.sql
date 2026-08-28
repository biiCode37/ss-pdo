-- ============================================================================
-- Migrasi: Backfill route & period context ke activity_logs + index
-- File: supabase/migrations/20260828000000_backfill_activity_log_route_context.sql
--
-- LATAR BELAKANG:
-- Aksi UPDATE_BUS_DATA, UPDATE_BULK_BUS_DATA, SYNC_OFFLINE_QUEUE, dan
-- FORMAT_WHOLE_SHEET sebelumnya tidak menyimpan route_code, year, month, day
-- di detail log. Filter rute + periode operasional di halaman audit punya
-- membran data gap.
--
-- Migrasi ini:
-- 1. Mengisi route_code, year, month, day untuk log yang masih menyimpan
--    sheetId di details melalui join ke route_sheets + routes (service role).
-- 2. Membuat index (route_code, created_at DESC) agar filter rute + rentang
--    waktu aksi tidak scane seluruh tabel.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Backfill route + period context untuk sheetId yang sudah ada di details
-- ----------------------------------------------------------------------------
UPDATE public.activity_logs
SET
    route_code = r.route_code,
    details = details || jsonb_build_object(
        'year', rs.year,
        'month', rs.month,
        'day', CASE
            WHEN details->>'tabName' ~ '^[0-9]+$'
                AND (trim(details->>'tabName'))::int BETWEEN 1 AND 31
            THEN (trim(details->>'tabName'))::int
            ELSE NULL
        END
    )
FROM public.route_sheets rs
JOIN public.routes r ON r.id = rs.route_id
WHERE public.activity_logs.route_code IS NULL
  AND public.activity_logs.details->>'sheetId' IS NOT NULL
  AND public.activity_logs.details->>'sheetId' = rs.spreadsheet_id;

-- ----------------------------------------------------------------------------
-- 2. Index untuk filter rute + created_at DESC
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_activity_logs_route_created
    ON public.activity_logs (route_code, created_at DESC);