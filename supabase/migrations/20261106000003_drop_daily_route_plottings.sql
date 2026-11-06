-- ============================================================================
-- Migrasi: Hapus fitur Plotting Armada Harian (refact_206)
-- Versi: 20261106000003
-- Deskripsi: Halaman Plotting dihapus berdasarkan keputusan operasional.
--            Ritase kini hanya diinput lewat Input SS (Set Jumlah Trip & kartu unit).
--            - Drop tabel public.daily_route_plottings (data tidak dipakai, dibuang).
--              Sekaligus menutup policy INSERT/UPDATE/DELETE untuk role anon.
--            - Hapus baris 'plotting' dari public.app_page_settings.
-- ============================================================================

DROP TABLE IF EXISTS public.daily_route_plottings;

DELETE FROM public.app_page_settings WHERE page_key = 'plotting';

NOTIFY pgrst, 'reload schema';
