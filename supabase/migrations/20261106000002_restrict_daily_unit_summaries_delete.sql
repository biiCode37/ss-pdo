-- ============================================================================
-- Migrasi: Tutup Hak Hapus Publik daily_unit_summaries (Refactor 204)
-- File: supabase/migrations/20261106000002_restrict_daily_unit_summaries_delete.sql
--
-- RINGKASAN (BUG-SEC-204-01):
-- Policy "Allow public insert/update daily_unit_summaries" (FOR ALL TO public
-- USING true) + grant tabel penuh (arwdDxtm) ke anon/authenticated membuat
-- siapa pun yang memegang anon key (publik di bundle JS) bisa MENGHAPUS seluruh
-- ringkasan unit lewat REST (DELETE /rest/v1/daily_unit_summaries?id=gt.0).
--
-- Jalur aplikasi hanya membutuhkan:
--   - SELECT  : Monitoring (RPC SECURITY INVOKER) & Rekap Lintas Periode
--   - INSERT + UPDATE + SELECT : upsert ON CONFLICT dari googleSheets/core.ts
-- Tidak ada jalur aplikasi yang menghapus baris. Edge Function/cron memakai
-- service_role (bypass RLS, tidak terdampak).
--
-- ponytail: INSERT/UPDATE anon tetap terbuka karena login aplikasi memakai
-- Google OAuth (bukan Supabase Auth), sehingga browser = anon. Menutupnya butuh
-- pemindahan upsert ke Edge Function tervalidasi — refact terpisah.
-- ============================================================================

-- 1. Hapus policy FOR ALL (sumber hak DELETE) dan policy SELECT duplikat
DROP POLICY IF EXISTS "Allow public insert/update daily_unit_summaries" ON public.daily_unit_summaries;
DROP POLICY IF EXISTS "Allow public read daily_unit_summaries" ON public.daily_unit_summaries;

-- Policy yang dipertahankan (sudah ada):
--   "Allow read daily_unit_summaries"   SELECT TO anon, authenticated USING (true)
--   "Allow write daily_unit_summaries"  INSERT TO anon, authenticated WITH CHECK (true)
--   "Allow update daily_unit_summaries" UPDATE TO anon, authenticated USING (true) WITH CHECK (true)

-- 2. Persempit grant tabel: tanpa DELETE/TRUNCATE/REFERENCES/TRIGGER/MAINTAIN
--    (tabel tidak memiliki grant per kolom, sehingga REVOKE ALL aman)
REVOKE ALL ON TABLE public.daily_unit_summaries FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.daily_unit_summaries TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
