-- Migration: Tabel Manajemen Halaman & Fitur Superadmin (Realtime Access Control)
CREATE TABLE IF NOT EXISTS public.app_page_settings (
  page_key text PRIMARY KEY,
  page_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('page', 'tab', 'modal')),
  is_enabled boolean NOT NULL DEFAULT true,
  disabled_message text DEFAULT 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  updated_at timestamptz DEFAULT now(),
  updated_by text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.app_page_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read app_page_settings" ON public.app_page_settings;
CREATE POLICY "Allow read app_page_settings" ON public.app_page_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow modify app_page_settings for superadmin" ON public.app_page_settings;
DROP POLICY IF EXISTS "Allow all app_page_settings" ON public.app_page_settings;
CREATE POLICY "Allow all app_page_settings" ON public.app_page_settings
  FOR ALL TO anon, authenticated USING (true);

GRANT ALL ON TABLE public.app_page_settings TO anon, authenticated;

-- Seed Initial Rows
INSERT INTO public.app_page_settings (page_key, page_name, category, is_enabled, disabled_message)
VALUES
  ('dashboard', 'Dashboard Operasional Rute', 'page', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('regional_monitoring', 'Monitoring 18 Rute Wilayah', 'page', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('user_management', 'Manajemen Pengguna RBAC', 'page', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('input', 'Form Input Bus SS PDO', 'tab', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('analytics', 'Analitik & Capaian Rute', 'tab', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('units', 'Daftar Unit Armada', 'tab', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('regional_summary', 'Tab Rekap Wilayah', 'tab', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('regional_wa_report', 'Tab Generator Laporan WA', 'tab', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('a2_report', 'Form Laporan Operasional A2', 'modal', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('accumulation', 'Rekap Akumulasi Periode', 'modal', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan')
ON CONFLICT (page_key) DO NOTHING;

-- Aktifkan Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_page_settings;

-- Catat di schema_migrations
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20261019000001', 'create_app_page_settings')
ON CONFLICT (version) DO NOTHING;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
