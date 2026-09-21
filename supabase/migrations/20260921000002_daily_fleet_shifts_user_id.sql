-- Migration: Change confirmed_by to user_id in daily_fleet_shifts
-- Menyesuaikan penampung user dari teks email (confirmed_by) menjadi referensi ID pengguna (user_id)

ALTER TABLE public.daily_fleet_shifts
  ADD COLUMN IF NOT EXISTS user_id bigint REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Backfill data existing jika confirmed_by berisi email user
UPDATE public.daily_fleet_shifts dfs
SET user_id = up.id
FROM public.user_profiles up
WHERE dfs.confirmed_by = up.email
  AND dfs.user_id IS NULL;

-- Hapus kolom lama confirmed_by
ALTER TABLE public.daily_fleet_shifts
  DROP COLUMN IF EXISTS confirmed_by;

-- Index untuk mempercepat query berdasarkan user_id
CREATE INDEX IF NOT EXISTS idx_daily_fleet_shifts_user_id ON public.daily_fleet_shifts(user_id);

COMMENT ON COLUMN public.daily_fleet_shifts.user_id IS 'ID pengguna dari user_profiles yang mengonfirmasi status armada shift';
