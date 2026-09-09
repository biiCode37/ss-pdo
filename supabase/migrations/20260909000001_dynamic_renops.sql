-- ============================================================================
-- Migrasi Master Data Renops Dinamis (Hari Kerja, Sabtu, Minggu, Libur Nasional)
-- File: supabase/migrations/20260909000001_dynamic_renops.sql
-- ============================================================================

-- 1. Tambahkan 4 kolom Renops per tipe hari ke tabel public.routes
ALTER TABLE public.routes
ADD COLUMN IF NOT EXISTS renops_weekday integer,
ADD COLUMN IF NOT EXISTS renops_saturday integer,
ADD COLUMN IF NOT EXISTS renops_sunday integer,
ADD COLUMN IF NOT EXISTS renops_holiday integer;

-- 2. Backfill awal dari default_renops yang sudah ada untuk data eksisting
UPDATE public.routes
SET
  renops_weekday = COALESCE(renops_weekday, default_renops),
  renops_saturday = COALESCE(renops_saturday, default_renops),
  renops_sunday = COALESCE(renops_sunday, default_renops),
  renops_holiday = COALESCE(renops_holiday, default_renops)
WHERE default_renops IS NOT NULL;
