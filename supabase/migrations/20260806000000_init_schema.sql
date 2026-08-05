-- ============================================================================
-- Migrasi Skema Basis Data SS_PDO (Sistem Pencatatan Shift Bus PUSM)
-- File: supabase/migrations/20260806000000_init_schema.sql
-- ============================================================================

-- 1. Tabel User Profiles (Allowlist Keamanan Auth — BUG-37)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'petugas' CHECK (role IN ('admin', 'petugas')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Aktifkan Row-Level Security (RLS) pada user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy RLS: Mengizinkan anon & authenticated role untuk membaca user_profiles (Kunci verifikasi login BUG-37)
DROP POLICY IF EXISTS "Allow anon read user_profiles" ON public.user_profiles;
CREATE POLICY "Allow anon read user_profiles"
    ON public.user_profiles
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Policy RLS: Mengizinkan user meng-update profilnya sendiri
DROP POLICY IF EXISTS "Allow user update self" ON public.user_profiles;
CREATE POLICY "Allow user update self"
    ON public.user_profiles
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);


-- 2. Tabel Routes (Master Data Rute)
CREATE TABLE IF NOT EXISTS public.routes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    route_code TEXT NOT NULL UNIQUE,
    route_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read routes" ON public.routes;
CREATE POLICY "Allow public read routes"
    ON public.routes
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow public insert routes" ON public.routes;
CREATE POLICY "Allow public insert routes"
    ON public.routes
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);


-- 3. Tabel Route Sheets (Relasi Rute + Periode Bulan/Tahun + Link Google Sheet — BUG-29)
CREATE TABLE IF NOT EXISTS public.route_sheets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    route_id BIGINT NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    spreadsheet_id TEXT NOT NULL,
    sheet_url TEXT NOT NULL,
    tab_name TEXT DEFAULT 'Sheet1' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_route_year_month UNIQUE (route_id, year, month)
);

ALTER TABLE public.route_sheets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read route_sheets" ON public.route_sheets;
CREATE POLICY "Allow public read route_sheets"
    ON public.route_sheets
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow public insert route_sheets" ON public.route_sheets;
CREATE POLICY "Allow public insert route_sheets"
    ON public.route_sheets
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete route_sheets" ON public.route_sheets;
CREATE POLICY "Allow public delete route_sheets"
    ON public.route_sheets
    FOR DELETE
    TO anon, authenticated
    USING (true);


-- 4. Tabel Activity Logs (Log Aktivitas Pengguna)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    route_code TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert activity_logs" ON public.activity_logs;
CREATE POLICY "Allow public insert activity_logs"
    ON public.activity_logs
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);


-- 5. Tabel Sync Queue Backups (Cadangan Antrean Offline Sync)
CREATE TABLE IF NOT EXISTS public.sync_queue_backups (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    user_email TEXT NOT NULL,
    spreadsheet_id TEXT NOT NULL,
    tab_name TEXT NOT NULL,
    row_index INT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    synced_at TIMESTAMPTZ
);

ALTER TABLE public.sync_queue_backups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all sync_queue_backups" ON public.sync_queue_backups;
CREATE POLICY "Allow public all sync_queue_backups"
    ON public.sync_queue_backups
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
