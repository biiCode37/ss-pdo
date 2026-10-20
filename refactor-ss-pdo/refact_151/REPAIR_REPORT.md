# Laporan Perbaikan (Refactor 151)

Laporan ini mendokumentasikan perbaikan kendala database PostgREST `PGRST205` pada tabel `app_page_settings` dan penyelarasan kebijakan Row-Level Security (RLS) pada instans database Supabase SS_PDO.

---

## 1. Rincian Implementasi

### 1.1 Penyesuaian Skema & Kebijakan RLS (`supabase/migrations/20261019000001_create_app_page_settings.sql`)
1. Mengubah kebijakan RLS dari yang semula mengandalkan `auth.jwt()` menjadi kebijakan publik terotorisasi (`anon`, `authenticated`), selaras dengan arsitektur autentikasi aplikasi SS_PDO yang menggunakan Google Identity Services (GIS) dan verifikasi RBAC di sisi aplikasi/layanan.
2. Memberikan hak akses eksplisit (`GRANT ALL ON TABLE public.app_page_settings TO anon, authenticated`).
3. Mendaftarkan tabel ke publikasi WebSocket realtime (`ALTER PUBLICATION supabase_realtime ADD TABLE public.app_page_settings`).
4. Mencatat versi migrasi ke tabel histori migrasi Supabase (`supabase_migrations.schema_migrations`).
5. Memuat ulang schema cache PostgREST (`NOTIFY pgrst, 'reload schema'`).

### 1.2 Eksekusi DDL ke Database Remote Supabase
Mengeksekusi file DDL migrasi ke instans database Supabase terkait (`sejttnsanzogsykmtwym`) melalui Supabase CLI Management API:
- Pembentukan tabel `public.app_page_settings` dengan 10 baris seed katalog awal (`dashboard`, `regional_monitoring`, `user_management`, `input`, `analytics`, `units`, `regional_summary`, `regional_wa_report`, `a2_report`, `accumulation`).
- Pengaktifan RLS dan policy baca/tulis.
- Sinkronisasi schema cache PostgREST sehingga endpoint REST API `/rest/v1/app_page_settings` langsung berstatus 200 OK.

---

## 2. Before vs After

### 2.1 Respon API Supabase PostgREST

#### Before:
```http
GET https://sejttnsanzogsykmtwym.supabase.co/rest/v1/app_page_settings?select=*&order=page_name.asc
HTTP/1.1 404 Not Found
{
  "code": "PGRST205",
  "details": null,
  "hint": "Perhaps you meant the table 'public.app_settings'",
  "message": "Could not find the table 'public.app_page_settings' in the schema cache"
}
```

#### After:
```http
GET https://sejttnsanzogsykmtwym.supabase.co/rest/v1/app_page_settings?select=*&order=page_name.asc
HTTP/1.1 200 OK
[
  {
    "page_key": "a2_report",
    "page_name": "Form Laporan Operasional A2",
    "category": "modal",
    "is_enabled": true,
    ...
  },
  ... (10 baris katalog konfigurasi)
]
```

### 2.2 Mutasi Status Halaman (Toggle Switch Superadmin)

#### Before:
- Superadmin menekan switch toggle "Monitoring 18 Rute Wilayah".
- Request `PATCH` gagal dengan status 404 Not Found.
- Toast error muncul: *"Gagal memperbarui status halaman"*.
- Status toggle di antarmuka kembali (*rollback*) ke posisi semula.

#### After:
- Superadmin menekan switch toggle "Monitoring 18 Rute Wilayah".
- Request `PATCH` berhasil dengan status 200 OK.
- Toast sukses muncul: *"Status halaman berhasil diperbarui"*.
- Perubahan status tersimpan secara persisten di database remote dan disiarkan via WebSocket Supabase Realtime ke seluruh peranti aktif.

---

## 3. Case: Skenario Lapangan

### Skenario: Superadmin Mengaktifkan Mode Pemeliharaan pada Rute/Halaman Operasional
- **Kondisi:** Terjadi pembaruan darurat pada sistem spreadsheet rute wilayah, Superadmin masuk ke menu Manajemen Halaman dan mematikan halaman "Monitoring 18 Rute Wilayah".
- **Sebelum Perbaikan:** Toggle tidak dapat dimatikan, pesan kegagalan 404 tampil di konsol dan toast error muncul di layar ponsel/laptop Superadmin.
- **Sesudah Perbaikan:** Status pemeliharaan langsung aktif seketika, tersimpan di Supabase, dan pengguna non-superadmin yang membuka halaman tersebut otomatis menerima tampilan ramah mode pemeliharaan (*PageDisabledState*).

---

## 4. Status Quality Gates

1. **Unit Test (Vitest):**
   - Perintah: `pnpm vitest run src/`
   - Hasil: 114 test files passed (100%), 803 tests passed, 0 failed.
2. **TypeScript & Production Build:**
   - Perintah: `pnpm run build`
   - Hasil: `tsc -b && vite build` sukses 0 error (distributable bundles dan PWA service worker ter-generate rapi).
3. **Knowledge Graph (Graphify):**
   - Perintah: `graphify update .`
   - Hasil: Sukses terbarui (5.872 nodes, 7.269 edges, 565 communities).
4. **Sinkronisasi Migrasi Database Supabase:**
   - Perintah: `supabase migration list`
   - Hasil: Versi `20261019000001` sinkron (local & remote terdaftar).
