-- ============================================================================
-- Migrasi Hardening Keamanan & Perbaikan Schema Drift SS_PDO
-- File: supabase/migrations/20260825000000_security_hardening.sql
--
-- RINGKASAN:
-- 1. Tambah kolom user_profiles yang dirujuk frontend tapi belum ada di DB
--    (notes, created_by, last_active_at, total_active_seconds) — memperbaiki
--    error PGRST204 pada telemetry heartbeat setiap 3 menit.
-- 2. Perluas CHECK constraint role agar menerima 'superadmin' (dipakai UI).
-- 3. Buat tabel daily_unit_summaries yang HILANG dari migrasi awal —
--    upsert cache akumulasi & fitur Rekap Lintas Periode sebelumnya selalu
--    gagal silently karena tabel tidak pernah dibuat.
-- 4. Tutup lubang RLS kritis:
--    a. sync_queue_backups: FOR ALL terbuka -> INSERT-only.
--    b. user_profiles UPDATE: scope via column-level grant. Sebelumnya siapa
--       pun dengan anon key (publik di bundle JS) bisa mengubah role sendiri
--       menjadi superadmin / menonaktifkan akun orang lain (privilege
--       escalation). Setelah migrasi ini, kolom role/is_active/email hanya
--       bisa diubah melalui service_role (dashboard SQL editor / backend).
--
-- CATATAN OPERASIONAL:
-- Fitur "Kelola Pengguna" (ubah peran, aktif/nonaktif, cabut akses) dari
-- aplikasi client kini akan ditolak database dengan pesan jelas — pengelolaan
-- harus dilakukan lewat Supabase Dashboard (SQL editor, sebagai service role),
-- contoh:
--   UPDATE public.user_profiles SET role='admin' WHERE email='x@gmail.com';
--   UPDATE public.user_profiles SET is_active=false WHERE email='y@gmail.com';
-- Jika tim sadar risiko dan tetap ingin mengizinkan dari client, jalankan
-- blok "REVERT" di bagian paling bawah file ini (TIDAK disarankan).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Kolom user_profiles yang hilang (dirujuk routeService.ts & types)
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS total_active_seconds INTEGER NOT NULL DEFAULT 0;

-- ----------------------------------------------------------------------------
-- 2. Role 'superadmin' pada CHECK constraint
--    (constraint lama: role IN ('admin','petugas') -> insert superadmin gagal)
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('superadmin', 'admin', 'petugas'));

-- ----------------------------------------------------------------------------
-- 3a. Tabel daily_unit_summaries (cache agregasi lintas periode)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_unit_summaries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    route_sheet_id BIGINT REFERENCES public.route_sheets(id) ON DELETE SET NULL,
    route_code TEXT NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    day INT NOT NULL CHECK (day BETWEEN 1 AND 31),
    unit TEXT NOT NULL,
    total_km NUMERIC NOT NULL DEFAULT 0,
    toa_shift1 NUMERIC NOT NULL DEFAULT 0,
    manual_shift1 NUMERIC NOT NULL DEFAULT 0,
    toa_shift2 NUMERIC NOT NULL DEFAULT 0,
    manual_shift2 NUMERIC NOT NULL DEFAULT 0,
    total_toa NUMERIC NOT NULL DEFAULT 0,
    total_passengers NUMERIC NOT NULL DEFAULT 0,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    -- Constraint WAJIB: target onConflict upsert di routeService.ts
    CONSTRAINT unique_daily_unit_summary UNIQUE (route_code, year, month, day, unit)
);

CREATE INDEX IF NOT EXISTS idx_daily_unit_summary_range
    ON public.daily_unit_summaries (route_code, year, month, day);

ALTER TABLE public.daily_unit_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read daily_unit_summaries" ON public.daily_unit_summaries;
CREATE POLICY "Allow read daily_unit_summaries"
    ON public.daily_unit_summaries
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow write daily_unit_summaries" ON public.daily_unit_summaries;
CREATE POLICY "Allow write daily_unit_summaries"
    ON public.daily_unit_summaries
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update daily_unit_summaries" ON public.daily_unit_summaries;
CREATE POLICY "Allow update daily_unit_summaries"
    ON public.daily_unit_summaries
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 3b. sync_queue_backups: tutup policy FOR ALL yang terbuka penuh.
--     Frontend hanya perlu INSERT (backupSyncQueue); SELECT/UPDATE/DELETE
--     antrean milik semua user oleh publik = kebocoran data operasional.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public all sync_queue_backups" ON public.sync_queue_backups;

DROP POLICY IF EXISTS "Allow insert sync_queue_backups" ON public.sync_queue_backups;
CREATE POLICY "Allow insert sync_queue_backups"
    ON public.sync_queue_backups
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 4. user_profiles: batasi UPDATE via column-level privileges.
--    Anon key adalah publik (ter-bundle di JS), sehingga policy USING(true)
--    memungkinkan siapa pun mengangkat dirinya menjadi superadmin.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow user update self" ON public.user_profiles;
CREATE POLICY "Allow limited profile update"
    ON public.user_profiles
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

REVOKE UPDATE ON TABLE public.user_profiles FROM anon, authenticated;
GRANT UPDATE (
    full_name,
    avatar_url,
    last_login_at,
    last_active_at,
    total_active_seconds,
    updated_at
) ON TABLE public.user_profiles TO anon, authenticated;

-- ============================================================================
-- [REVERSE ONLY — JANGAN DIJALANKAN KECUALI TIM SADAR RISIKO]
-- Blok berikut mengembalikan akses admin-management dari client, TAPI juga
-- membuka kembali privilege escalation publik:
--
-- REVOKE UPDATE ON TABLE public.user_profiles FROM anon, authenticated;
-- GRANT UPDATE ON TABLE public.user_profiles TO anon, authenticated;
--
-- Dan untuk mengembalikan sync_queue_backups penuh:
-- DROP POLICY IF EXISTS "Allow insert sync_queue_backups" ON public.sync_queue_backups;
-- CREATE POLICY "Allow all sync_queue_backups" ON public.sync_queue_backups
--     FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- ============================================================================
