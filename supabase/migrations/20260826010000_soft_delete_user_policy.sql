-- ============================================================================
-- Migrasi: Enforce Soft Delete pada user_profiles (is_active = FALSE)
-- File: supabase/migrations/20260826010000_soft_delete_user_policy.sql
--
-- DESKRIPSI:
-- Sesuai arsitektur dan requirement sistem, pencabutan / penghapusan akses user
-- dilakukan melalui Soft Delete (mengubah is_active = FALSE via UPDATE)
-- agar riwayat aktivitas, audit log, dan data historis pengguna tetap utuh.
--
-- Untuk mencegah hard-delete (penghapusan baris permanen) yang tidak disengaja
-- dari sisi client anon/authenticated, hak DELETE pada tabel user_profiles dicabut.
-- ============================================================================

-- 1. Hapus policy DELETE pada user_profiles
DROP POLICY IF EXISTS "Allow delete user_profiles" ON public.user_profiles;

-- 2. Cabut hak DELETE dari role anon dan authenticated
REVOKE DELETE ON TABLE public.user_profiles FROM anon, authenticated;

-- 3. Pastikan hak UPDATE tetap aktif untuk mengubah status is_active
GRANT UPDATE ON TABLE public.user_profiles TO anon, authenticated;
