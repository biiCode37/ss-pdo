-- ============================================================================
-- Migrasi: Restriksi RPC Administratif ke Service Role (Refactor 191)
-- File: supabase/migrations/20261102000001_restrict_admin_rpcs_to_service_role.sql
--
-- RINGKASAN:
-- 1. Cabut izin EXECUTE dari PUBLIC, anon, dan authenticated pada semua RPC admin:
--    - admin_update_user_role
--    - admin_toggle_user_status
--    - set_app_page_setting
--    - admin_update_page_permissions
--    - admin_bulk_update_page_settings
-- 2. Berikan izin EXECUTE eksklusif hanya kepada role service_role.
-- 3. Tambahkan fungsi SECURITY DEFINER public.admin_add_user_profile untuk
--    menutup celah penambahan akun dengan peran istimewa via direct INSERT.
-- ============================================================================

-- 1. Cabut izin eksekusi dari PUBLIC, anon, dan authenticated
REVOKE EXECUTE ON FUNCTION public.admin_update_user_role(text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_toggle_user_status(text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_app_page_setting(text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_page_permissions(text, text, text[], text[], text[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_bulk_update_page_settings(text, text[], text, boolean, text[]) FROM PUBLIC, anon, authenticated;

-- 2. Berikan izin eksekusi eksklusif ke service_role
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_toggle_user_status(text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_app_page_setting(text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_page_permissions(text, text, text[], text[], text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_bulk_update_page_settings(text, text[], text, boolean, text[]) TO service_role;

-- 3. Tambahkan fungsi RPC aman untuk penambahan profil pengguna baru
CREATE OR REPLACE FUNCTION public.admin_add_user_profile(
    p_acting_email text,
    p_email text,
    p_full_name text,
    p_role_id integer,
    p_notes text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_acting_role text;
    v_clean_email text;
    v_clean_name text;
    v_assigned_role_id integer;
BEGIN
    IF p_acting_email IS NULL OR p_email IS NULL THEN
        RAISE EXCEPTION 'Parameter tidak lengkap.';
    END IF;

    -- Validasi apakah pemanggil adalah Superadmin atau Admin aktif
    SELECT r.code INTO v_acting_role
    FROM public.user_profiles u
    JOIN public.roles r ON u.role_id = r.id
    WHERE lower(trim(u.email)) = lower(trim(p_acting_email))
      AND u.is_active = true;

    IF v_acting_role IS NULL OR (v_acting_role <> 'superadmin' AND v_acting_role <> 'admin') THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya Superadmin atau Admin aktif yang berwenang menambahkan pengguna baru.';
    END IF;

    -- Admin biasa dilarang membuat akun Superadmin
    v_assigned_role_id := COALESCE(p_role_id, 5);
    IF v_acting_role = 'admin' AND v_assigned_role_id = 1 THEN
        RAISE EXCEPTION 'Akses ditolak: Administrator tidak dapat menambahkan akun dengan peran Superadmin.';
    END IF;

    v_clean_email := lower(trim(p_email));
    v_clean_name := COALESCE(nullif(trim(p_full_name), ''), split_part(v_clean_email, '@', 1));

    INSERT INTO public.user_profiles (
        email,
        full_name,
        role_id,
        notes,
        created_by,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        v_clean_email,
        v_clean_name,
        v_assigned_role_id,
        nullif(trim(p_notes), ''),
        p_acting_email,
        true,
        now(),
        now()
    )
    ON CONFLICT (email) DO UPDATE
    SET role_id = EXCLUDED.role_id,
        notes = COALESCE(EXCLUDED.notes, public.user_profiles.notes),
        is_active = true,
        updated_at = now();

    RETURN FOUND;
END;
$$;

-- Cabut eksekusi dari publik dan berikan ke service_role
REVOKE EXECUTE ON FUNCTION public.admin_add_user_profile(text, text, text, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_user_profile(text, text, text, integer, text) TO service_role;

-- 4. Catat migrasi
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20261102000001', 'restrict_admin_rpcs_to_service_role')
ON CONFLICT (version) DO NOTHING;

NOTIFY pgrst, 'reload schema';
