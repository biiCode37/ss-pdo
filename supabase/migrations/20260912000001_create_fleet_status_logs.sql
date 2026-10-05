-- Migration: Create fleet_status_logs table (Append-only audit trail)
-- Digunakan untuk mencatat riwayat setiap konfirmasi atau perubahan status armada tanpa menimpa data historis

CREATE TABLE IF NOT EXISTS public.fleet_status_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  route_id bigint REFERENCES public.routes(id) ON DELETE CASCADE,
  route_code text NOT NULL,
  date date NOT NULL,
  shift smallint NOT NULL CHECK (shift IN (1, 2)),
  sgo_count integer DEFAULT 0,
  to_count integer DEFAULT 0,
  off_count integer DEFAULT 0,
  total_units integer DEFAULT 0,
  fleet_status jsonb NOT NULL DEFAULT '[]'::jsonb,
  confirmed_by text,
  created_at timestamptz DEFAULT now()
);

-- Aktifkan RLS
ALTER TABLE public.fleet_status_logs ENABLE ROW LEVEL SECURITY;

-- Policy baca untuk semua pengguna terotentikasi & anon
DROP POLICY IF EXISTS "Allow read fleet_status_logs" ON public.fleet_status_logs;
CREATE POLICY "Allow read fleet_status_logs"
  ON public.fleet_status_logs
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Policy insert untuk semua pengguna terotentikasi & anon (append-only)
DROP POLICY IF EXISTS "Allow insert fleet_status_logs" ON public.fleet_status_logs;
CREATE POLICY "Allow insert fleet_status_logs"
  ON public.fleet_status_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Index untuk mempercepat query audit per rute dan tanggal
CREATE INDEX IF NOT EXISTS idx_fleet_status_logs_route_date ON public.fleet_status_logs(route_id, date);
CREATE INDEX IF NOT EXISTS idx_fleet_status_logs_created_at ON public.fleet_status_logs(created_at DESC);

-- Komentar dokumentasi tabel
COMMENT ON TABLE public.fleet_status_logs IS 'Tabel append-only catatan riwayat audit perubahan/konfirmasi status armada per shift';
COMMENT ON COLUMN public.fleet_status_logs.fleet_status IS 'Snapshot unit non-SGO dan status detailnya pada saat konfirmasi';
