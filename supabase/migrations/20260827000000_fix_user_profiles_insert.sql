-- ============================================================================
-- Migrasi Perbaikan: User Tidak Bisa Ditambahkan (missing INSERT policy)
-- File: supabase/migrations/20260827000000_fix_user_profiles_insert.sql
--
-- LATAR BELAKANG (bug report produksi):
-- Admin tidak dapat menambahkan user via aplikasi.
--
-- AKAR MASALAH:
-- Tabel public.user_profiles hanya memiliki policy SELECT & UPDATE sejak
-- migrasi awal. Tidak pernah ada policy INSERT, sehingga RLS memblokir
-- penambahan user baru (insert dipfilter tanpa error / permission denied).
-- Ini juga membuat upsert profil saat login (upsertUserProfile) tidak pernah
-- bisa membuat baris baru dari sisi client.
--
-- Perilaku PUT/USE upsert tetap butuh INSERT + UPDATE; keduanya kini
-- tersedia (UPDATE sudah dibuka di migrasi 20260826000000, INSERT ditambah di
-- bawah). Risiko keamanan anon-key yang sama berlaku dan WAJIB ditutup saat
-- Fase Edge Function + Supabase Auth dikerjakan.
-- ============================================================================

DROP POLICY IF EXISTS "Allow insert user_profiles" ON public.user_profiles;
CREATE POLICY "Allow insert user_profiles"
    ON public.user_profiles
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

GRANT INSERT ON TABLE public.user_profiles TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- Verifikasi cepat:
--   SELECT policyname, cmd FROM pg_policies WHERE tablename='user_profiles'
--   ORDER BY cmd;
-- Harap memuat: INSERT, SELECT, UPDATE, DELETE.
-- ============================================================================
