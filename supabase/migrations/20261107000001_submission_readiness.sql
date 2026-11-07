-- ============================================================================
-- Migrasi: Kelengkapan Data & Konfirmasi "Siap Dikirim"
-- File: supabase/migrations/20261107000001_submission_readiness.sql
-- Spec: docs/superpowers/specs/2026-11-07-kelengkapan-siap-kirim-design.md
--
-- 1. daily_route_reports.completeness: ringkasan kelengkapan per rute/tanggal,
--    HANYA ditulis oleh sheet-sync-webhook (service_role).
-- 2. route_submission_confirmations: konfirmasi siap kirim per rute/tanggal.
--    Anon/authenticated hanya boleh MEMBACA; tulis hanya lewat Edge Function
--    route-confirmation (service_role).
-- ============================================================================

ALTER TABLE public.daily_route_reports
  ADD COLUMN IF NOT EXISTS completeness jsonb;

CREATE TABLE IF NOT EXISTS public.route_submission_confirmations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  route_id bigint NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  route_code text NOT NULL,
  date date NOT NULL,
  confirmed_by text NOT NULL,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  issues_at_confirm integer NOT NULL DEFAULT 0 CHECK (issues_at_confirm >= 0),
  reason text CHECK (reason IS NULL OR char_length(reason) <= 300),
  fingerprint_at_confirm text,
  CONSTRAINT route_submission_confirmations_route_date_key UNIQUE (route_id, date),
  CONSTRAINT route_submission_confirmations_reason_required
    CHECK (issues_at_confirm = 0 OR (reason IS NOT NULL AND char_length(btrim(reason)) >= 5))
);

CREATE INDEX IF NOT EXISTS idx_route_submission_confirmations_date
  ON public.route_submission_confirmations (date);

ALTER TABLE public.route_submission_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read route_submission_confirmations" ON public.route_submission_confirmations;
CREATE POLICY "Allow read route_submission_confirmations"
  ON public.route_submission_confirmations
  FOR SELECT TO anon, authenticated
  USING (true);

-- Default privileges Supabase memberi hak penuh ke anon/authenticated pada tabel baru: persempit ke SELECT saja
REVOKE ALL ON TABLE public.route_submission_confirmations FROM anon, authenticated;
GRANT SELECT ON TABLE public.route_submission_confirmations TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.route_submission_confirmations;

NOTIFY pgrst, 'reload schema';
