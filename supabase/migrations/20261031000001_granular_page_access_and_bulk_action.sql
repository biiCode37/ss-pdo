-- ============================================================================
-- Migrasi: Hak Akses Granular Per-Role & Per-Akun Serta Multi-Select Bulk Action
-- Versi: 20261031000001
-- Deskripsi:
--   1. Menambahkan kolom allowed_roles, allowed_user_emails, denied_user_emails
--      ke tabel public.app_page_settings.
--   2. Menyediakan fungsi SECURITY DEFINER:
--      - public.admin_update_page_permissions: Update izin role & user override.
--      - public.admin_bulk_update_page_settings: Update massal (status, roles, reset).
-- ============================================================================

-- 1. Penambahan Kolom Granular pada public.app_page_settings
ALTER TABLE public.app_page_settings
ADD COLUMN IF NOT EXISTS allowed_roles text[] NOT NULL DEFAULT ARRAY['superadmin', 'admin', 'korwil', 'korlap', 'pdo']::text[],
ADD COLUMN IF NOT EXISTS allowed_user_emails text[] NOT NULL DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS denied_user_emails text[] NOT NULL DEFAULT ARRAY[]::text[];

-- Set default yang tepat untuk halaman sensitif
UPDATE public.app_page_settings
SET allowed_roles = ARRAY['superadmin', 'admin', 'korwil', 'korlap']::text[]
WHERE page_key IN ('regional_monitoring', 'regional_summary', 'regional_wa_report');

UPDATE public.app_page_settings
SET allowed_roles = ARRAY['superadmin', 'admin']::text[]
WHERE page_key = 'user_management';

-- 2. Fungsi SECURITY DEFINER: Update Izin Granular Per Halaman
CREATE OR REPLACE FUNCTION public.admin_update_page_permissions(
    p_acting_email text,
    p_page_key text,
    p_allowed_roles text[],
    p_allowed_user_emails text[],
    p_denied_user_emails text[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_acting_role text;
    v_sanitized_roles text[];
BEGIN
    IF p_acting_email IS NULL OR p_page_key IS NULL THEN
        RAISE EXCEPTION 'Parameter tidak lengkap.';
    END IF;

    -- Proteksi halaman manajemen fitur inti
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
        RAISE EXCEPTION 'Akses ditolak: Hanya Superadmin aktif yang berwenang mengubah izin halaman.';
    END IF;

    -- Jamin superadmin selalu ada di allowed_roles (mencegah lockout)
    v_sanitized_roles := COALESCE(p_allowed_roles, ARRAY[]::text[]);
    IF NOT ('superadmin' = ANY(v_sanitized_roles)) THEN
        v_sanitized_roles := array_prepend('superadmin', v_sanitized_roles);
    END IF;

    UPDATE public.app_page_settings
    SET allowed_roles = v_sanitized_roles,
        allowed_user_emails = COALESCE(p_allowed_user_emails, ARRAY[]::text[]),
        denied_user_emails = COALESCE(p_denied_user_emails, ARRAY[]::text[]),
        updated_at = now(),
        updated_by = p_acting_email
    WHERE page_key = p_page_key;

    RETURN FOUND;
END;
$$;

-- 3. Fungsi SECURITY DEFINER: Operasi Massal (Bulk Action)
CREATE OR REPLACE FUNCTION public.admin_bulk_update_page_settings(
    p_acting_email text,
    p_page_keys text[],
    p_action text,
    p_is_enabled boolean DEFAULT NULL,
    p_allowed_roles text[] DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_acting_role text;
    v_target_keys text[];
    v_final_roles text[];
BEGIN
    IF p_acting_email IS NULL OR p_page_keys IS NULL OR p_action IS NULL THEN
        RAISE EXCEPTION 'Parameter tidak lengkap.';
    END IF;

    -- Validasi Superadmin aktif
    SELECT r.code INTO v_acting_role
    FROM public.user_profiles u
    JOIN public.roles r ON u.role_id = r.id
    WHERE lower(trim(u.email)) = lower(trim(p_acting_email))
      AND u.is_active = true;

    IF v_acting_role IS NULL OR v_acting_role <> 'superadmin' THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya Superadmin aktif yang berwenang menjalankan aksi massal.';
    END IF;

    -- Filter out halaman sistem 'page_management' dari target massal
    SELECT array_agg(k) INTO v_target_keys
    FROM unnest(p_page_keys) AS k
    WHERE k <> 'page_management';

    IF v_target_keys IS NULL OR array_length(v_target_keys, 1) = 0 THEN
        RETURN false;
    END IF;

    IF p_action = 'set_status' THEN
        IF p_is_enabled IS NULL THEN
            RAISE EXCEPTION 'Parameter p_is_enabled wajib untuk aksi set_status.';
        END IF;

        UPDATE public.app_page_settings
        SET is_enabled = p_is_enabled,
            updated_at = now(),
            updated_by = p_acting_email
        WHERE page_key = ANY(v_target_keys);

        RETURN FOUND;

    ELSIF p_action = 'set_roles' THEN
        IF p_allowed_roles IS NULL THEN
            RAISE EXCEPTION 'Parameter p_allowed_roles wajib untuk aksi set_roles.';
        END IF;

        v_final_roles := p_allowed_roles;
        IF NOT ('superadmin' = ANY(v_final_roles)) THEN
            v_final_roles := array_prepend('superadmin', v_final_roles);
        END IF;

        UPDATE public.app_page_settings
        SET allowed_roles = v_final_roles,
            updated_at = now(),
            updated_by = p_acting_email
        WHERE page_key = ANY(v_target_keys);

        RETURN FOUND;

    ELSIF p_action = 'reset_default' THEN
        -- Kembalikan role ke standar bawaan dan bersihkan override user
        UPDATE public.app_page_settings
        SET allowed_user_emails = ARRAY[]::text[],
            denied_user_emails = ARRAY[]::text[],
            allowed_roles = CASE
                WHEN page_key IN ('regional_monitoring', 'regional_summary', 'regional_wa_report')
                    THEN ARRAY['superadmin', 'admin', 'korwil', 'korlap']::text[]
                WHEN page_key = 'user_management'
                    THEN ARRAY['superadmin', 'admin']::text[]
                ELSE ARRAY['superadmin', 'admin', 'korwil', 'korlap', 'pdo']::text[]
            END,
            updated_at = now(),
            updated_by = p_acting_email
        WHERE page_key = ANY(v_target_keys);

        RETURN FOUND;

    ELSE
        RAISE EXCEPTION 'Aksi tidak dikenal: %', p_action;
    END IF;
END;
$$;

-- 4. Hak Eksekusi Fungsi RPC
GRANT EXECUTE ON FUNCTION public.admin_update_page_permissions(text, text, text[], text[], text[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_update_page_settings(text, text[], text, boolean, text[]) TO anon, authenticated;

-- 5. Catat Versi Migrasi
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20261031000001', 'granular_page_access_and_bulk_action')
ON CONFLICT (version) DO NOTHING;

NOTIFY pgrst, 'reload schema';
