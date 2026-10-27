-- Migration: Tambah kolom best_record_date pada master rute untuk mencatat tanggal capaian rekor penumpang
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS best_record_date text;

-- Update data historis rekor dari spreadsheet master operasional wilayah (SSOT)
UPDATE public.routes SET best_record_date = 'Kamis, 01 Oktober 2026' WHERE route_code = 'JAK.60';
UPDATE public.routes SET best_record_date = 'Kamis, 15 Oktober 2026' WHERE route_code = 'JAK.76';
UPDATE public.routes SET best_record_date = 'Senin, 12 Oktober 2026' WHERE route_code = 'JAK.77';
UPDATE public.routes SET best_record_date = 'Senin, 12 Oktober 2026' WHERE route_code = 'JAK.113';
UPDATE public.routes SET best_record_date = 'Selasa, 13 Oktober 2026' WHERE route_code = 'JAK.118';
UPDATE public.routes SET best_record_date = 'Senin, 12 Oktober 2026' WHERE route_code = 'JAK.120';
UPDATE public.routes SET best_record_date = 'Kamis, 01 Oktober 2026' WHERE route_code = 'JAK.05';
UPDATE public.routes SET best_record_date = 'Jumat, 02 Oktober 2026' WHERE route_code = 'JAK.15';
UPDATE public.routes SET best_record_date = 'Selasa, 06 Oktober 2026' WHERE route_code = 'JAK.58';
UPDATE public.routes SET best_record_date = 'Selasa, 13 Oktober 2026' WHERE route_code = 'JAK.110A';
UPDATE public.routes SET best_record_date = 'Rabu, 14 Oktober 2026' WHERE route_code = 'JAK.115';
UPDATE public.routes SET best_record_date = 'Senin, 12 Oktober 2026' WHERE route_code = 'JAK.117';
UPDATE public.routes SET best_record_date = 'Senin, 19 Oktober 2026' WHERE route_code = 'JAK.01';
UPDATE public.routes SET best_record_date = 'Selasa, 06 Oktober 2026' WHERE route_code = 'JAK.29';
UPDATE public.routes SET best_record_date = 'Rabu, 14 Oktober 2026' WHERE route_code = 'JAK.87';
UPDATE public.routes SET best_record_date = 'Selasa, 13 Oktober 2026' WHERE route_code = 'JAK.88';
UPDATE public.routes SET best_record_date = 'Senin, 12 Oktober 2026' WHERE route_code = 'JAK.89';
UPDATE public.routes SET best_record_date = 'Senin, 12 Oktober 2026' WHERE route_code = 'JAK.90';
