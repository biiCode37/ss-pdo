-- Migration: Add operational metrics columns to daily_route_reports
-- Digunakan untuk menyimpan agregasi metrik capaian penumpang dan KM tempuh rute harian secara instan

ALTER TABLE public.daily_route_reports
ADD COLUMN IF NOT EXISTS toa_shift1 integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS manual_shift1 integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS toa_shift2 integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS manual_shift2 integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_passengers integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_km numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS achievement_km numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_trip integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_synced_at timestamptz DEFAULT now();

-- Komentar dokumentasi kolom
COMMENT ON COLUMN public.daily_route_reports.toa_shift1 IS 'Jumlah penumpang tiket elektronik TOA shift 1';
COMMENT ON COLUMN public.daily_route_reports.manual_shift1 IS 'Jumlah penumpang tiket manual shift 1';
COMMENT ON COLUMN public.daily_route_reports.toa_shift2 IS 'Jumlah penumpang tiket elektronik TOA shift 2';
COMMENT ON COLUMN public.daily_route_reports.manual_shift2 IS 'Jumlah penumpang tiket manual shift 2';
COMMENT ON COLUMN public.daily_route_reports.total_passengers IS 'Total akumulasi seluruh penumpang harian rute (shift 1 + shift 2)';
COMMENT ON COLUMN public.daily_route_reports.total_km IS 'Total akumulasi kilometer tempuh seluruh armada rute';
COMMENT ON COLUMN public.daily_route_reports.achievement_km IS 'Pencapaian kilometer rata-rata per bus (total_km / realops)';
COMMENT ON COLUMN public.daily_route_reports.total_trip IS 'Total ritase operasional rute harian';
COMMENT ON COLUMN public.daily_route_reports.last_synced_at IS 'Waktu timestamp terakhir sinkronisasi dari spreadsheet';
