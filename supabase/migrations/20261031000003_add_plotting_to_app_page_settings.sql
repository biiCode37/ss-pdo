-- ============================================================================
-- Migrasi: Tambahkan Halaman Plotting ke Tabel app_page_settings
-- Versi: 20261031000003
-- Deskripsi: Mendaftarkan 'plotting' (Plotting Armada Harian) ke tabel
--            public.app_page_settings agar dapat dikelola hak akses & statusnya
--            oleh Superadmin pada Manajemen Halaman.
-- ============================================================================

INSERT INTO public.app_page_settings (
    page_key,
    page_name,
    category,
    is_enabled,
    disabled_message
)
VALUES (
    'plotting',
    'Plotting Armada Harian',
    'tab',
    true,
    'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'
)
ON CONFLICT (page_key) DO UPDATE
SET page_name = EXCLUDED.page_name,
    category = EXCLUDED.category;

-- Catat di schema_migrations jika tabel ada
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations'
    ) THEN
        INSERT INTO supabase_migrations.schema_migrations (version, name)
        VALUES ('20261031000003', 'add_plotting_to_app_page_settings')
        ON CONFLICT (version) DO NOTHING;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
