-- ==============================================================================
-- Migrasi: Master Data Operator Mikrotrans Wilayah Utara
-- Tanggal: 2026-09-11
-- Deskripsi:
-- 1. Membuat tabel master public.operators
-- 2. Menambahkan kolom operator_id ke public.routes
-- 3. Mengisi seed data resmi untuk 7 operator di wilayah operasional
-- 4. Menghubungkan routes.operator_id secara otomatis berdasarkan routes.operator_name
-- ==============================================================================

-- 1. Buat tabel master operators
CREATE TABLE IF NOT EXISTS public.operators (
  id serial PRIMARY KEY,
  operator_code text UNIQUE NOT NULL,
  operator_name text NOT NULL,
  full_name text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- RLS untuk tabel operators
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for operators"
  ON public.operators
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow superadmin write access for operators"
  ON public.operators
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.id
      WHERE up.uuid = auth.uid()::text AND r.code = 'superadmin'
    )
  );

-- 2. Tambahkan kolom operator_id pada tabel routes
ALTER TABLE public.routes
  ADD COLUMN IF NOT EXISTS operator_id integer REFERENCES public.operators(id) ON DELETE SET NULL;

-- 3. Seed data operator resmi
INSERT INTO public.operators (operator_code, operator_name, full_name, is_active)
VALUES
  ('KLM', 'KOLAMAS JAYA', 'KOLAMAS JAYA (KLM)', true),
  ('KWK', 'KOPERASI WAHANA KALPIKA', 'KOPERASI WAHANA KALPIKA (KWK)', true),
  ('KWK AC', 'KOPERASI WAHANA KALPIKA', 'KOPERASI WAHANA KALPIKA (KWK) AC', true),
  ('KMJ', 'KOMILET JAYA', 'KOMILET JAYA (KMJ)', true),
  ('LSG', 'LESTARI SURYA GEMA PERSADA', 'LESTARI SURYA GEMA PERSADA (LSG)', true),
  ('KJG', 'KOJANG', 'KOJANG (KJG)', true),
  ('KMJ/KLM', 'KOMILET JAYA / KOLAMAS JAYA', 'KOMILET JAYA / KOLAMAS JAYA (KMJ/KLM)', true)
ON CONFLICT (operator_code) DO UPDATE
  SET operator_name = EXCLUDED.operator_name,
      full_name = EXCLUDED.full_name,
      is_active = EXCLUDED.is_active,
      updated_at = now();

-- 4. Hubungkan data operator_id pada rute-rute yang sudah ada
-- Normalisasi KLM / KOLAMAS
UPDATE public.routes r
SET operator_id = o.id
FROM public.operators o
WHERE o.operator_code = 'KLM'
  AND (r.operator_name = 'KLM' OR r.operator_name = 'KOLAMAS');

-- Normalisasi KWK AC
UPDATE public.routes r
SET operator_id = o.id
FROM public.operators o
WHERE o.operator_code = 'KWK AC'
  AND r.operator_name = 'KWK AC';

-- Normalisasi KWK Reguler (selain KWK AC)
UPDATE public.routes r
SET operator_id = o.id
FROM public.operators o
WHERE o.operator_code = 'KWK'
  AND r.operator_name = 'KWK';

-- Normalisasi KMJ / KOMIDA
UPDATE public.routes r
SET operator_id = o.id
FROM public.operators o
WHERE o.operator_code = 'KMJ'
  AND (r.operator_name = 'KMJ' OR r.operator_name = 'KOMIDA');

-- Normalisasi KMJ/KLM
UPDATE public.routes r
SET operator_id = o.id
FROM public.operators o
WHERE o.operator_code = 'KMJ/KLM'
  AND (r.operator_name = 'KMJ/KLM' OR r.operator_name = 'KMJ / KLM');

-- Normalisasi LSG
UPDATE public.routes r
SET operator_id = o.id
FROM public.operators o
WHERE o.operator_code = 'LSG'
  AND r.operator_name = 'LSG';

-- Normalisasi KJG
UPDATE public.routes r
SET operator_id = o.id
FROM public.operators o
WHERE o.operator_code = 'KJG'
  AND r.operator_name = 'KJG';
