-- Migration: Tambah kolom data_source ke daily_route_reports
-- Digunakan untuk membedakan data hasil input aplikasi (app_input) vs tarikan sheet (sheet_ingestion)

ALTER TABLE public.daily_route_reports
  ADD COLUMN IF NOT EXISTS data_source text DEFAULT 'app_input';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_route_reports_data_source_check'
  ) THEN
    ALTER TABLE public.daily_route_reports
      ADD CONSTRAINT daily_route_reports_data_source_check
      CHECK (data_source IN ('app_input', 'sheet_ingestion'));
  END IF;
END $$;

COMMENT ON COLUMN public.daily_route_reports.data_source IS 'Indikator asal data: app_input (input langsung via aplikasi) atau sheet_ingestion (ditarik dari spreadsheet rute)';
