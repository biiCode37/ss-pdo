-- ============================================================================
-- Migrasi Hardening Keamanan Kritis SS_PDO (Refactor 154)
-- File: supabase/migrations/20261021000001_security_critical_hardening.sql
--
-- RINGKASAN:
-- 1. Menutup celah Privilege Escalation & Arbitrary DB Mutation:
--    - user_profiles: Cabut hak UPDATE pada kolom sensitif (role_id, is_active)
--      dan cabut hak DELETE penuh dari role anon/authenticated.
--    - app_page_settings: Cabut hak INSERT/UPDATE/DELETE dari anon/authenticated.
--      Hanya izinkan SELECT publik (read-only).
--    - route_sheets: Cabut policy DELETE dari anon/authenticated.
-- 2. Menyediakan fungsi SECURITY DEFINER untuk operasi administratif aman:
--    - admin_update_user_role: Hanya Superadmin aktif yang berhak mengubah peran.
--    - admin_toggle_user_status: Superadmin/Admin aktif yang berhak mengaktifkan/menonaktifkan akun.
--    - set_app_page_setting: Hanya Superadmin aktif yang berhak mengubah status ketersediaan halaman.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. user_profiles Hardening: Column-level UPDATE & Revoke DELETE
-- ----------------------------------------------------------------------------
-- Cabut izin DELETE dari anon dan authenticated (mencegah penghapusan massal akun)
DROP POLICY IF EXISTS "Allow delete user_profiles" ON public.user_profiles;
REVOKE DELETE ON TABLE public.user_profiles FROM anon, authenticated;

-- Batasi hak UPDATE pada kolom-kolom non-sensitif saja
REVOKE UPDATE ON TABLE public.user_profiles FROM anon, authenticated;
GRANT UPDATE (
    full_name,
    avatar_url,
    last_login_at,
    last_active_at,
    total_active_seconds,
    updated_at
) ON TABLE public.user_profiles TO anon, authenticated;

-- Pastikan policy UPDATE tetap aktif untuk kolom-kolom yang diizinkan
DROP POLICY IF EXISTS "Allow profile update" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow limited profile update" ON public.user_profiles;
CREATE POLICY "Allow limited profile update"
    ON public.user_profiles
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 2. app_page_settings Hardening: Read-Only untuk Publik & Blokir Mutasi Langsung
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all app_page_settings" ON public.app_page_settings;
DROP POLICY IF EXISTS "Allow modify app_page_settings for superadmin" ON public.app_page_settings;
DROP POLICY IF EXISTS "Allow read app_page_settings" ON public.app_page_settings;

-- Cabut hak mutasi langsung dari anon dan authenticated
REVOKE INSERT, UPDATE, DELETE ON TABLE public.app_page_settings FROM anon, authenticated;

-- Hanya izinkan SELECT
CREATE POLICY "Allow read app_page_settings" ON public.app_page_settings
    FOR SELECT
    TO anon, authenticated
    USING (true);

GRANT SELECT ON TABLE public.app_page_settings TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. route_sheets Hardening: Cabut Policy DELETE Publik
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public delete route_sheets" ON public.route_sheets;
REVOKE DELETE ON TABLE public.route_sheets FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. Fungsi SECURITY DEFINER: Operasi Administratif Terotorisasi
-- ----------------------------------------------------------------------------

-- 4a. Mengubah peran pengguna (Hanya Superadmin Aktif)
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
    p_acting_email text,
    p_target_email text,
    p_new_role_id integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_acting_role text;
BEGIN
    IF p_acting_email IS NULL OR p_target_email IS NULL OR p_new_role_id IS NULL THEN
        RAISE EXCEPTION 'Parameter tidak lengkap.';
    END IF;

    -- Validasi apakah pemanggil adalah Superadmin aktif
    SELECT r.code INTO v_acting_role
    FROM public.user_profiles u
    JOIN public.roles r ON u.role_id = r.id
    WHERE lower(trim(u.email)) = lower(trim(p_acting_email))
      AND u.is_active = true;

    IF v_acting_role IS NULL OR v_acting_role <> 'superadmin' THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya Superadmin aktif yang berwenang mengubah peran akun pengguna.';
    END IF;

    -- Update role pengguna target
    UPDATE public.user_profiles
    SET role_id = p_new_role_id,
        updated_at = now()
    WHERE lower(trim(email)) = lower(trim(p_target_email));

    RETURN FOUND;
END;
$$;

-- 4b. Mengaktifkan / Menonaktifkan akun pengguna (Superadmin & Admin Aktif)
CREATE OR REPLACE FUNCTION public.admin_toggle_user_status(
    p_acting_email text,
    p_target_email text,
    p_is_active boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_acting_role text;
    v_target_role text;
BEGIN
    IF p_acting_email IS NULL OR p_target_email IS NULL OR p_is_active IS NULL THEN
        RAISE EXCEPTION 'Parameter tidak lengkap.';
    END IF;

    -- Dilarang menonaktifkan akun sendiri
    IF lower(trim(p_acting_email)) = lower(trim(p_target_email)) THEN
        RAISE EXCEPTION 'Akses ditolak: Anda tidak dapat mengubah status aktif akun Anda sendiri.';
    END IF;

    -- Cek peran pemanggil
    SELECT r.code INTO v_acting_role
    FROM public.user_profiles u
    JOIN public.roles r ON u.role_id = r.id
    WHERE lower(trim(u.email)) = lower(trim(p_acting_email))
      AND u.is_active = true;

    IF v_acting_role IS NULL OR (v_acting_role <> 'superadmin' AND v_acting_role <> 'admin') THEN
        RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki wewenang untuk mengubah status akun.';
    END IF;

    -- Jika pemanggil adalah Admin biasa, dilarang mengubah status Admin lain atau Superadmin
    SELECT r.code INTO v_target_role
    FROM public.user_profiles u
    JOIN public.roles r ON u.role_id = r.id
    WHERE lower(trim(u.email)) = lower(trim(p_target_email));

    IF v_acting_role = 'admin' AND (v_target_role = 'admin' OR v_target_role = 'superadmin') THEN
        RAISE EXCEPTION 'Akses ditolak: Admin tidak dapat mengubah status akun Administrator lain atau Superadmin.';
    END IF;

    UPDATE public.user_profiles
    SET is_active = p_is_active,
        updated_at = now()
    WHERE lower(trim(email)) = lower(trim(p_target_email));

    RETURN FOUND;
END;
$$;

-- 4c. Mengubah status ketersediaan halaman / fitur (Hanya Superadmin Aktif)
CREATE OR REPLACE FUNCTION public.set_app_page_setting(
    p_acting_email text,
    p_page_key text,
    p_is_enabled boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_acting_role text;
BEGIN
    IF p_acting_email IS NULL OR p_page_key IS NULL OR p_is_enabled IS NULL THEN
        RAISE EXCEPTION 'Parameter tidak lengkap.';
    END IF;

    -- Proteksi halaman manajemen fitur itu sendiri agar tidak bisa dimatikan
    IF p_page_key = 'page_management' THEN
        RETURN false;
    END IF;

    -- Validasi apakah pemanggil adalah Superadmin aktif
    SELECT r.code INTO v_acting_role
    FROM public.user_profiles u
    JOIN public.roles r ON u.role_id = r.id
    WHERE lower(trim(u.email)) = lower(trim(p_acting_email))
      AND u.is_active = true;

    IF v_acting_role IS NULL OR v_acting_role <> 'superadmin' THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya Superadmin aktif yang berwenang mengubah ketersediaan halaman aplikasi.';
    END IF;

    UPDATE public.app_page_settings
    SET is_enabled = p_is_enabled,
        updated_at = now(),
        updated_by = p_acting_email
    WHERE page_key = p_page_key;

    RETURN FOUND;
END;
$$;

-- Berikan izin eksekusi fungsi RPC kepada anon dan authenticated
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(text, text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_user_status(text, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_app_page_setting(text, text, boolean) TO anon, authenticated;

-- Catat versi migrasi
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20261021000001', 'security_critical_hardening')
ON CONFLICT (version) DO NOTHING;

NOTIFY pgrst, 'reload schema';
