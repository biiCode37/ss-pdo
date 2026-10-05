-- Migration: Add fleet status snapshot columns to daily_route_reports
-- Digunakan untuk menyimpan snapshot status armada per shift dan flag konfirmasi status armada

ALTER TABLE public.daily_route_reports
ADD COLUMN IF NOT EXISTS fleet_status_shift1 jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS fleet_status_shift2 jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_fleet_confirmed_s1 boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_fleet_confirmed_s2 boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fleet_confirmed_s1_at timestamptz,
ADD COLUMN IF NOT EXISTS fleet_confirmed_s2_at timestamptz;

-- Komentar dokumentasi
COMMENT ON COLUMN public.daily_route_reports.fleet_status_shift1 IS 'Snapshot unit non-SGO shift 1 (unit, note, isOff)';
COMMENT ON COLUMN public.daily_route_reports.fleet_status_shift2 IS 'Snapshot unit non-SGO shift 2 (unit, note, isOff)';
COMMENT ON COLUMN public.daily_route_reports.is_fleet_confirmed_s1 IS 'Status apakah pengawas telah mengonfirmasi status armada shift 1';
COMMENT ON COLUMN public.daily_route_reports.is_fleet_confirmed_s2 IS 'Status apakah pengawas telah mengonfirmasi status armada shift 2';
COMMENT ON COLUMN public.daily_route_reports.fleet_confirmed_s1_at IS 'Waktu timestamp konfirmasi status armada shift 1';
COMMENT ON COLUMN public.daily_route_reports.fleet_confirmed_s2_at IS 'Waktu timestamp konfirmasi status armada shift 2';
