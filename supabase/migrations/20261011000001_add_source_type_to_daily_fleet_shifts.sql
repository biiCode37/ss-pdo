-- Migration: Add source_type and submitted_by_role to daily_fleet_shifts
-- Digunakan untuk menandai asal data status armada (pdo_a2, spreadsheet_auto, korlap_manual)

ALTER TABLE public.daily_fleet_shifts
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'pdo_a2',
ADD COLUMN IF NOT EXISTS submitted_by_role text DEFAULT 'pdo';

COMMENT ON COLUMN public.daily_fleet_shifts.source_type IS 'Sumber penetapan data: pdo_a2, spreadsheet_auto, korlap_manual';
COMMENT ON COLUMN public.daily_fleet_shifts.submitted_by_role IS 'Peran penginput: pdo, korlap, korwil, system';
