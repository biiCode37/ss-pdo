# Laporan Audit Bug (Refactor 36)

Dokumen ini mencatat audit investigasi mendalam (*systematic debugging*) terkait error skema database PostgREST `fleet_confirmed_s2_at` pada saat konfirmasi status armada shift di aplikasi SS_PDO.

---

## Ringkasan Eksekutif

| Item | Deskripsi |
| :--- | :--- |
| **Siklus Refactor** | Refact 36 |
| **Branch Wajib** | `devmode` |
| **Fokus Area** | Supabase DDL Migration (`daily_route_reports` & `routes`), Error Sanitization (`Dashboard.tsx` & `errorFormatter.ts`) |
| **Metodologi** | Systematic Debugging (Phase 1: Root Cause, Phase 2: Pattern, Phase 3: Hypothesis, Phase 4: Implementation) |
| **Status Akhir** | ✅ Fixed, Migrated, Sanitized, & Fully Tested (326 unit tests passed) |

---

## Temuan Masalah

### BUG-36.1: Kolom Status Armada & Dynamic Renops Belum Diterapkan pada Database Supabase Remote

- **ID Temuan:** BUG-36.1
- **Lokasi Terkait:**
  - `supabase/migrations/20260910000003_add_fleet_status_snapshot.sql`
  - `supabase/migrations/20260909000001_dynamic_renops.sql`
  - Tabel Supabase remote: `public.daily_route_reports` & `public.routes`
- **Tingkat Keparahan:** High (Fitur Konfirmasi Status Armada gagal menyimpan ke database / throw 400 Bad Request)
- **Deskripsi Masalah:**
  Saat user menekan tombol konfirmasi status armada shift 1 atau shift 2 di modal status armada, fungsi `handleConfirmFleetStatus` di `Dashboard.tsx` memanggil `upsertDailyRouteReport` dengan payload berisi kolom `fleet_status_shift{shift}`, `is_fleet_confirmed_s{shift}`, dan `fleet_confirmed_s{shift}_at`.
  Namun, pada database Supabase remote (`sejttnsanzogsykmtwym`), migrasi `20260910000003_add_fleet_status_snapshot.sql` dan `20260909000001_dynamic_renops.sql` belum pernah dieksekusi. Akibatnya PostgREST merespons HTTP 400 Bad Request dengan error code `PGRST204`:
  `Could not find the 'fleet_confirmed_s2_at' column of 'daily_route_reports' in the schema cache`.
- **Dampak Pengguna:**
  Pengawas lapangan tidak dapat menyimpan status armada shift 2 maupun shift 1 ke Supabase, dan data tidak tersimpan permanen.
- **Mitigasi:**
  1. Eksekusi DDL migrasi `ALTER TABLE daily_route_reports ADD COLUMN IF NOT EXISTS fleet_status_shift1...` dan kolom `renops_*` pada `routes` langsung ke instance database Supabase target.
  2. Muat ulang cache PostgREST via `NOTIFY pgrst, 'reload schema';`.
  3. Catat versi migrasi ke tabel `supabase_migrations.schema_migrations` agar konsistensi status migrasi terjaga.

---

### BUG-36.2: Kebocoran Error Teknis PostgREST / Database ke UI Pengguna

- **ID Temuan:** BUG-36.2
- **Lokasi Terkait:**
  - `src/components/Dashboard.tsx` baris 716
  - `src/utils/errorFormatter.ts`
- **Tingkat Keparahan:** Medium (Pelanggaran Golden Rule UI/UX & Keamanan: pesan teknis internal database tampil ke user)
- **Deskripsi Masalah:**
  Pada blok `catch` di `handleConfirmFleetStatus` (`Dashboard.tsx`), kode memanggil:
  `showErrorToast(err?.message || TEXT_FLEET_STATUS.TOAST.APPLY_ERROR);`
  Karena `err.message` berisi teks error mentah: `Gagal menyimpan laporan operasional rute: Could not find the 'fleet_confirmed_s2_at' column of 'daily_route_reports' in the schema cache`, pesan teknis internal Supabase/PostgREST tersebut langsung muncul di layar pengguna (sebagaimana terlihat pada screenshot).
- **Dampak Pengguna:**
  Pengguna operasional di lapangan melihat pesan error teknis yang membingungkan (*schema cache*, *column of*, dll.) alih-alih pesan kesalahan ramah pengguna dalam Bahasa Indonesia.
- **Mitigasi:**
  1. Bungkus error dengan `formatUserError(err, TEXT_FLEET_STATUS.TOAST.APPLY_ERROR)` sebelum ditampilkan melalui `showErrorToast`.
  2. Perluas kamus deteksi `formatUserError` di `src/utils/errorFormatter.ts` untuk menangkal pesan error database internal (`schema cache`, `pgrst`, `column of`, `relation`, dll.) dan mengembalikannya sebagai teks ramah non-teknis.
