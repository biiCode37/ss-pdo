-- ============================================================================
-- Migrasi Master Data Roles & Relasi role_id
-- File: supabase/migrations/20260910000001_create_roles_master.sql
-- ============================================================================

-- 1. Buat Tabel Master Roles
CREATE TABLE IF NOT EXISTS public.roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Aktifkan RLS & Policy Baca
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read roles" ON public.roles;
CREATE POLICY "Allow read roles"
    ON public.roles
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 3. Seed Data Master Roles
INSERT INTO public.roles (code, name, description)
VALUES
    ('superadmin', 'Superadmin', 'Akses penuh seluruh sistem, user, & konfigurasi'),
    ('admin', 'Admin', 'Pengelolaan operasional, rute, monitoring, & pengguna'),
    ('korwil', 'Koordinator Wilayah', 'Pengawasan & monitoring operasional rute per wilayah koridor'),
    ('korlap', 'Koordinator Lapangan', 'Pengawasan teknis & kelancaran unit bus di lapangan'),
    ('pdo', 'Petugas Data Operasional', 'Pencatatan & input ritase serta kendala shift harian')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = now();

-- 4. Tambah kolom role_id ke user_profiles sebagai foreign key
ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS role_id BIGINT REFERENCES public.roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON public.user_profiles(role_id);

-- 5. Backfill role_id pada data user_profiles eksisting
-- Mapping: 'petugas' -> 'pdo', 'admin' -> 'admin', 'superadmin' -> 'superadmin'
UPDATE public.user_profiles up
SET role_id = r.id
FROM public.roles r
WHERE r.code = (
    CASE 
        WHEN up.role = 'petugas' THEN 'pdo'
        ELSE up.role
    END
)
AND up.role_id IS NULL;
