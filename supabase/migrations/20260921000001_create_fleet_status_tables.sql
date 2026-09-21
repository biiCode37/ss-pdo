-- Migration: Create dedicated fleet status tables (Master, Header, Detail)
-- Digunakan untuk menampung status armada harian per rute dan shift tanpa bergantung pada Google Sheets

-- 1. Tabel Master Status Armada
CREATE TABLE IF NOT EXISTS public.fleet_statuses (
  id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  default_note text DEFAULT '',
  is_operational boolean DEFAULT false,
  is_editable_note boolean DEFAULT true,
  sort_order smallint DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Seed Master Status Awal
INSERT INTO public.fleet_statuses (code, name, default_note, is_operational, is_editable_note, sort_order)
VALUES
  ('SGO', 'Siap Guna Operasi', '', true, false, 1),
  ('TO', 'T.O (Tukar Operasi)', 'EVDAL', false, true, 2),
  ('OFF', 'Libur (OFF)', 'LIBUR', false, false, 3),
  ('SO', 'Stop Operasi (SO)', '', false, true, 4)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  default_note = EXCLUDED.default_note,
  is_operational = EXCLUDED.is_operational,
  is_editable_note = EXCLUDED.is_editable_note,
  sort_order = EXCLUDED.sort_order;

-- 2. Tabel Header: Ringkasan Status Armada per Rute & Shift
CREATE TABLE IF NOT EXISTS public.daily_fleet_shifts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  route_id bigint REFERENCES public.routes(id) ON DELETE CASCADE,
  route_code text NOT NULL,
  date date NOT NULL,
  shift smallint NOT NULL CHECK (shift IN (1, 2)),
  target_renops integer DEFAULT 0,
  realops integer DEFAULT 0,
  total_units integer DEFAULT 0,
  sgo_count integer DEFAULT 0,
  to_count integer DEFAULT 0,
  off_count integer DEFAULT 0,
  so_count integer DEFAULT 0,
  other_count integer DEFAULT 0,
  is_confirmed boolean DEFAULT false,
  confirmed_by text,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_daily_fleet_shift UNIQUE (route_id, date, shift)
);

CREATE INDEX IF NOT EXISTS idx_daily_fleet_shifts_route_date ON public.daily_fleet_shifts(route_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_fleet_shifts_date_shift ON public.daily_fleet_shifts(date, shift);

-- 3. Tabel Detail: Unit Non-SGO
CREATE TABLE IF NOT EXISTS public.daily_fleet_non_sgo_units (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fleet_shift_id bigint REFERENCES public.daily_fleet_shifts(id) ON DELETE CASCADE,
  unit_body text NOT NULL,
  status_id smallint REFERENCES public.fleet_statuses(id) ON DELETE RESTRICT,
  status_code text NOT NULL,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_shift_unit_body UNIQUE (fleet_shift_id, unit_body)
);

CREATE INDEX IF NOT EXISTS idx_daily_fleet_non_sgo_shift_id ON public.daily_fleet_non_sgo_units(fleet_shift_id);
CREATE INDEX IF NOT EXISTS idx_daily_fleet_non_sgo_unit_body ON public.daily_fleet_non_sgo_units(unit_body);

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE public.fleet_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_fleet_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_fleet_non_sgo_units ENABLE ROW LEVEL SECURITY;

-- 5. Policies untuk fleet_statuses
DROP POLICY IF EXISTS "Allow read fleet_statuses" ON public.fleet_statuses;
CREATE POLICY "Allow read fleet_statuses" ON public.fleet_statuses FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "Allow insert/update fleet_statuses" ON public.fleet_statuses;
CREATE POLICY "Allow insert/update fleet_statuses" ON public.fleet_statuses FOR ALL TO authenticated, anon USING (true);

-- 6. Policies untuk daily_fleet_shifts
DROP POLICY IF EXISTS "Allow read daily_fleet_shifts" ON public.daily_fleet_shifts;
CREATE POLICY "Allow read daily_fleet_shifts" ON public.daily_fleet_shifts FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "Allow all daily_fleet_shifts" ON public.daily_fleet_shifts;
CREATE POLICY "Allow all daily_fleet_shifts" ON public.daily_fleet_shifts FOR ALL TO authenticated, anon USING (true);

-- 7. Policies untuk daily_fleet_non_sgo_units
DROP POLICY IF EXISTS "Allow read daily_fleet_non_sgo_units" ON public.daily_fleet_non_sgo_units;
CREATE POLICY "Allow read daily_fleet_non_sgo_units" ON public.daily_fleet_non_sgo_units FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "Allow all daily_fleet_non_sgo_units" ON public.daily_fleet_non_sgo_units;
CREATE POLICY "Allow all daily_fleet_non_sgo_units" ON public.daily_fleet_non_sgo_units FOR ALL TO authenticated, anon USING (true);

-- Komentar dokumentasi
COMMENT ON TABLE public.fleet_statuses IS 'Master data jenis status armada (SGO, TO, OFF, SO)';
COMMENT ON TABLE public.daily_fleet_shifts IS 'Header ringkasan status armada per rute, tanggal, dan shift';
COMMENT ON TABLE public.daily_fleet_non_sgo_units IS 'Detail unit berstatus non-SGO beserta nomor body dan catatan kendala';
