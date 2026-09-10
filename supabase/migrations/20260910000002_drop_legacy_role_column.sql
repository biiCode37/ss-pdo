-- ============================================================================
-- Migrasi: Hapus Kolom role Teks Lama & Set Default role_id
-- File: supabase/migrations/20260910000002_drop_legacy_role_column.sql
-- ============================================================================

-- 1. Drop check constraint lama
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- 2. Hapus kolom role teks lama
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS role;

-- 3. Set default role_id ke 5 (role 'pdo')
ALTER TABLE public.user_profiles ALTER COLUMN role_id SET DEFAULT 5;
