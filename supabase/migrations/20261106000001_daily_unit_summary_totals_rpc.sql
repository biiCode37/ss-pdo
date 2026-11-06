-- ============================================================================
-- Migrasi: RPC Agregasi Ringkasan Unit per Rute per Tanggal (Refactor 203)
-- File: supabase/migrations/20261106000001_daily_unit_summary_totals_rpc.sql
--
-- RINGKASAN:
-- Monitoring 18 rute sebelumnya menarik baris mentah daily_unit_summaries
-- (per unit bus) untuk 3 tanggal (H, H-1, H-7) lalu menjumlahkannya di browser.
-- 3 tanggal = ±1.500 baris, terpotong batas 1.000 baris PostgREST, sehingga
-- angka fallback sebagian rute salah dan setiap muat ±160 KB (BUG-QUOTA-203-01).
-- Fungsi ini menjumlahkan di database: 1 baris per (rute, tanggal), ±54 baris.
--
-- KEAMANAN: SECURITY INVOKER (RLS & grant SELECT tabel tetap berlaku), read-only
-- (STABLE), input dibatasi maksimal 31 tanggal.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_daily_unit_summary_totals(p_dates date[])
RETURNS TABLE (
  route_code text,
  year smallint,
  month smallint,
  day smallint,
  total_passengers numeric,
  total_km numeric,
  toa_shift1 numeric,
  manual_shift1 numeric,
  toa_shift2 numeric,
  manual_shift2 numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    s.route_code,
    s.year,
    s.month,
    s.day,
    SUM(COALESCE(s.total_passengers, 0)),
    SUM(COALESCE(s.total_km, 0)),
    SUM(COALESCE(s.toa_shift1, 0)),
    SUM(COALESCE(s.manual_shift1, 0)),
    SUM(COALESCE(s.toa_shift2, 0)),
    SUM(COALESCE(s.manual_shift2, 0))
  FROM public.daily_unit_summaries s
  JOIN unnest(p_dates[1:31]) AS d(dt)
    ON s.year = EXTRACT(YEAR FROM d.dt)
   AND s.month = EXTRACT(MONTH FROM d.dt)
   AND s.day = EXTRACT(DAY FROM d.dt)
  GROUP BY s.route_code, s.year, s.month, s.day;
$$;

REVOKE EXECUTE ON FUNCTION public.get_daily_unit_summary_totals(date[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_daily_unit_summary_totals(date[]) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
