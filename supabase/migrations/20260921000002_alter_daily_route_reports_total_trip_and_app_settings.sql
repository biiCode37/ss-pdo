-- Migration: Ubah kolom total_trip menjadi numeric dan buat tabel app_settings untuk URL spreadsheet global wilayah
-- Menghilangkan bug 22P02: invalid input syntax for type integer ketika ritase bernilai desimal (seperti 214.5)

ALTER TABLE public.daily_route_reports
  ALTER COLUMN total_trip TYPE numeric USING total_trip::numeric;

COMMENT ON COLUMN public.daily_route_reports.total_trip IS 'Total ritase operasional rute harian (tipe numeric untuk mendukung ritase desimal/setengah trip)';

-- Tabel Konfigurasi Sistem Terpusat (Single Source of Truth Konfigurasi)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read app_settings" ON public.app_settings;
CREATE POLICY "Allow read app_settings" ON public.app_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all app_settings" ON public.app_settings;
CREATE POLICY "Allow all app_settings" ON public.app_settings FOR ALL USING (true);

-- Seed URL Spreadsheet Global Wilayah
INSERT INTO public.app_settings (key, value, description)
VALUES (
  'regional_global_sheet_url',
  'https://docs.google.com/spreadsheets/d/1Hkvs4DLGWGJMPHRISV-Sg72nL_zRIHjklTuRu1yXwFYS4/edit',
  'URL Google Sheets Capaian Operasi Global Wilayah Utara'
)
ON CONFLICT (key) DO UPDATE SET updated_at = now();
