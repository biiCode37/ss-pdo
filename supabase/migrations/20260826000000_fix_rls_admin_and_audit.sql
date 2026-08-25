-- ============================================================================
-- Migrasi Perbaikan Bug: Silent RLS Filtering pada Admin Ops & Audit Log
-- File: supabase/migrations/20260826000000_fix_rls_admin_and_audit.sql
--
-- LATAR BELAKANG (bug report produksi):
-- 1. "Revoke user via app tidak mengubah DB" — DELETE pada user_profiles
--    TIDAK PERNAH punya policy sejak migrasi awal. RLS memblokir tanpa
--    error (PostgREST sukses dengan 0 baris) sehingga app menampilkan
--    "berhasil" padahal tidak ada perubahan.
-- 2. "Halaman Log Aktivitas kosong" — activity_logs hanya punya policy
--    INSERT, tidak ada SELECT. Halaman audit selalu menerima array kosong.
--
-- KEPUTUSAN PRODUK:
-- Fitur kelola pengguna (ubah role, toggle status, revoke) HARUS tetap
-- berfungsi dari aplikasi sampai Fase Edge Function + Supabase Auth
-- diterapkan. Migrasi ini MEMBUKA KEMBALI akses UPDATE penuh & menambah
-- policy DELETE pada user_profiles.
--
-- ⚠️ TRADEOFF KEAMANAN YANG SADAR:
-- Anon key adalah publik (ter-bundle di JS). Dengan policy ini, siapa pun
-- yang memiliki bundle berpotensi melakukan hal yang sama dengan admin UI.
-- Risiko ini DISETUJUI sementara dan WAJIB ditutup saat Fase 1-4
-- (Supabase Auth + Edge Function) dikerjakan. Revert: cukup jalankan ulang
-- pembatasan dari migrasi 20260825000000.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. BUG #2 FIX: Izinkan read activity_logs untuk halaman Audit
--    (riwayat log historis yang sudah terkumpul akan langsung tampil)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow read activity_logs" ON public.activity_logs;
CREATE POLICY "Allow read activity_logs"
    ON public.activity_logs
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- ----------------------------------------------------------------------------
-- 2a. Restore UPDATE penuh pada user_profiles (mensupersedes column-grant
--     terbatas dari migrasi hardening agar toggle status & ubah role jalan)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow limited profile update" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow user update self" ON public.user_profiles;

CREATE POLICY "Allow profile update"
    ON public.user_profiles
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

REVOKE UPDATE ON TABLE public.user_profiles FROM anon, authenticated;
GRANT UPDATE ON TABLE public.user_profiles TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2b. BUG #1 FIX: Policy DELETE untuk user_profiles (belum pernah ada —
--     revoke via app selama ini diam-diam gagal total)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow delete user_profiles" ON public.user_profiles;
CREATE POLICY "Allow delete user_profiles"
    ON public.user_profiles
    FOR DELETE
    TO anon, authenticated
    USING (true);

GRANT DELETE ON TABLE public.user_profiles TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- Verifikasi cepat pasca-migrasi (jalankan manual di SQL Editor):
--   SELECT policyname, cmd FROM pg_policies
--   WHERE tablename IN ('user_profiles','activity_logs')
--   ORDER BY tablename, cmd;
-- Harap memuat: SELECT/UPDATE/DELETE di user_profiles,
--               INSERT/SELECT di activity_logs.
-- ============================================================================
