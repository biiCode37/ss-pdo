-- ==============================================================================
-- Migrasi: Normalisasi Many-to-Many Route Operators
-- Tanggal: 2026-09-11
-- Deskripsi:
-- 1. Membuat tabel pivot public.route_operators
-- 2. Menghapus baris gabungan palsu (KMJ/KLM dan KMJ & KJG) dari public.operators
-- 3. Menghapus kolom turunan full_name dari public.operators
-- 4. Mengisi data relasi route_operators untuk seluruh 18 rute
-- 5. Menghapus kolom operator_name dan operator_id dari public.routes
-- ==============================================================================

-- 1. Buat tabel pivot route_operators
CREATE TABLE IF NOT EXISTS public.route_operators (
  id serial PRIMARY KEY,
  route_id bigint REFERENCES public.routes(id) ON DELETE CASCADE,
  operator_id integer REFERENCES public.operators(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(route_id, operator_id)
);

-- RLS untuk route_operators
ALTER TABLE public.route_operators ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'route_operators' AND policyname = 'Allow public read route_operators'
  ) THEN
    CREATE POLICY "Allow public read route_operators"
      ON public.route_operators
      FOR SELECT
      TO authenticated, anon
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'route_operators' AND policyname = 'Allow superadmin write route_operators'
  ) THEN
    CREATE POLICY "Allow superadmin write route_operators"
      ON public.route_operators
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles up
          JOIN public.roles r ON up.role_id = r.id
          WHERE up.uuid = auth.uid() AND r.code = 'superadmin'
        )
      );
  END IF;
END $$;

-- 2. Hapus baris operator campuran dari operators
DELETE FROM public.operators WHERE operator_code IN ('KMJ/KLM', 'KMJ & KJG');

-- 3. Hapus kolom full_name dari tabel operators
ALTER TABLE public.operators DROP COLUMN IF EXISTS full_name;

-- 4. Hubungkan 18 rute ke tabel pivot route_operators
DELETE FROM public.route_operators;

-- KLM (JAK.01)
INSERT INTO public.route_operators (route_id, operator_id)
SELECT r.id, o.id FROM public.routes r, public.operators o
WHERE r.route_code = 'JAK.01' AND o.operator_code = 'KLM';

-- KWK Reguler (JAK.05, 15, 29, 58, 60, 110A, 113, 115, 117, 118)
INSERT INTO public.route_operators (route_id, operator_id)
SELECT r.id, o.id FROM public.routes r, public.operators o
WHERE r.route_code IN ('JAK.05', 'JAK.15', 'JAK.29', 'JAK.58', 'JAK.60', 'JAK.110A', 'JAK.113', 'JAK.115', 'JAK.117', 'JAK.118')
  AND o.operator_code = 'KWK';

-- KWK AC (JAK.120)
INSERT INTO public.route_operators (route_id, operator_id)
SELECT r.id, o.id FROM public.routes r, public.operators o
WHERE r.route_code = 'JAK.120' AND o.operator_code = 'KWK AC';

-- LSG (JAK.87)
INSERT INTO public.route_operators (route_id, operator_id)
SELECT r.id, o.id FROM public.routes r, public.operators o
WHERE r.route_code = 'JAK.87' AND o.operator_code = 'LSG';

-- KMJ (JAK.88, 89, 90)
INSERT INTO public.route_operators (route_id, operator_id)
SELECT r.id, o.id FROM public.routes r, public.operators o
WHERE r.route_code IN ('JAK.88', 'JAK.89', 'JAK.90') AND o.operator_code = 'KMJ';

-- JAK.76 (KSO: KMJ dan KJG)
INSERT INTO public.route_operators (route_id, operator_id)
SELECT r.id, o.id FROM public.routes r, public.operators o
WHERE r.route_code = 'JAK.76' AND o.operator_code = 'KMJ';

INSERT INTO public.route_operators (route_id, operator_id)
SELECT r.id, o.id FROM public.routes r, public.operators o
WHERE r.route_code = 'JAK.76' AND o.operator_code = 'KJG';

-- JAK.77 (KSO: KMJ dan KLM)
INSERT INTO public.route_operators (route_id, operator_id)
SELECT r.id, o.id FROM public.routes r, public.operators o
WHERE r.route_code = 'JAK.77' AND o.operator_code = 'KMJ';

INSERT INTO public.route_operators (route_id, operator_id)
SELECT r.id, o.id FROM public.routes r, public.operators o
WHERE r.route_code = 'JAK.77' AND o.operator_code = 'KLM';

-- 5. Hapus kolom operator_name dan operator_id dari routes
ALTER TABLE public.routes DROP COLUMN IF EXISTS operator_name;
ALTER TABLE public.routes DROP COLUMN IF EXISTS operator_id;
