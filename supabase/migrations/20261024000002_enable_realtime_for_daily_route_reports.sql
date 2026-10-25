-- Aktifkan replikasi penuh dan publikasi realtime untuk daily_route_reports
ALTER TABLE public.daily_route_reports REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'daily_route_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_route_reports;
  END IF;
END $$;
