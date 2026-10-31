-- Migration: 20261031000002_create_daily_route_plottings.sql
-- Description: Create daily_route_plottings table with RLS for fleet dispatch and smart ritase validation

CREATE TABLE IF NOT EXISTS public.daily_route_plottings (
  id BIGSERIAL PRIMARY KEY,
  route_id BIGINT REFERENCES public.routes(id) ON DELETE CASCADE,
  route_code TEXT NOT NULL,
  date DATE NOT NULL,
  endpoint_a_name TEXT,
  endpoint_b_name TEXT,
  units_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_daily_route_plottings UNIQUE (route_id, date)
);

-- Index for high-performance lookup per route and operational date
CREATE INDEX IF NOT EXISTS idx_daily_route_plottings_lookup
  ON public.daily_route_plottings (route_id, date);

CREATE INDEX IF NOT EXISTS idx_daily_route_plottings_route_code
  ON public.daily_route_plottings (route_code, date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.daily_route_plottings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to authenticated and anon users (safe operational data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_route_plottings' AND policyname = 'allow_select_daily_route_plottings'
  ) THEN
    CREATE POLICY allow_select_daily_route_plottings
      ON public.daily_route_plottings
      FOR SELECT
      TO authenticated, anon
      USING (true);
  END IF;
END $$;

-- Policy: Allow insert access to authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_route_plottings' AND policyname = 'allow_insert_daily_route_plottings'
  ) THEN
    CREATE POLICY allow_insert_daily_route_plottings
      ON public.daily_route_plottings
      FOR INSERT
      TO authenticated, anon
      WITH CHECK (true);
  END IF;
END $$;

-- Policy: Allow update access to authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_route_plottings' AND policyname = 'allow_update_daily_route_plottings'
  ) THEN
    CREATE POLICY allow_update_daily_route_plottings
      ON public.daily_route_plottings
      FOR UPDATE
      TO authenticated, anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Policy: Allow delete access to authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_route_plottings' AND policyname = 'allow_delete_daily_route_plottings'
  ) THEN
    CREATE POLICY allow_delete_daily_route_plottings
      ON public.daily_route_plottings
      FOR DELETE
      TO authenticated, anon
      USING (true);
  END IF;
END $$;
