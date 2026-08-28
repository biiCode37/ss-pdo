# ADR 0002: Supabase RBAC, Soft-Delete User Policy, dan Audit Trail

## Status
Approved / Implemented

## Konteks
Aplikasi SS_PDO memerlukan tata kelola akses pengguna yang aman dan terstruktur karena melibatkan banyak pengawas operasional (*petugas*), pengatur rute (*admin*), dan administrator sistem (*superadmin*). Kebutuhan esensial mencakup:
1. Pembatasan akses berbasis peran (*Role-Based Access Control / RBAC*) yang ditegakkan langsung di level basis data melalui PostgreSQL Row-Level Security (RLS).
2. Pencabutan akses (*revoking user*) yang aman tanpa menghapus riwayat log atau data historis pengguna (*zero hard-delete data loss*).
3. Jejak audit (*audit trail*) yang mencatat setiap aksi operasional, login, maupun manajemen rute secara transparan dan mudah diaudit.
4. Desain antarmuka mobile-first untuk kelola pengguna dan audit log dengan dukungan theming gelap dan terang.

## Keputusan Arsitektur & Teknikal

### 1. Multi-Role RBAC & Row-Level Security (RLS)
- Menerapkan 3 tingkatan peran:
  - `superadmin`: Akses penuh mutlak ke seluruh data, modifikasi peran pengguna, dan konfigurasi rute.
  - `admin`: Akses monitoring, pengelolaan rute, dan pendaftaran akun petugas.
  - `petugas`: Akses pencatatan operasional harian bus pada rute yang ditugaskan.
- Penegakan izin RLS di database Supabase pada tabel `user_profiles`, `routes`, `route_sheets`, dan `activity_logs`.

### 2. Kebijakan Soft-Delete pada Akun Pengguna
- Operasi pencabutan izin (*revoke*) tidak menjalankan SQL `DELETE`, melainkan memperbarui kolom `is_active = FALSE` dan `updated_at = NOW()`.
- Policy RLS untuk operasi `DELETE` pada tabel `user_profiles` di-drop guna mencegah *accidental hard delete*.
- Pengguna yang dinonaktifkan (`is_active = FALSE`) langsung ditolak saat verifikasi login dengan pesan ramah non-teknis.

### 3. Log Aktivitas & Jejak Audit (Audit Trail)
- Tabel `activity_logs` mencatat seluruh peristiwa sistem:
  - `LOGIN`, `LOGOUT`.
  - `USER_ADDED`, `USER_ROLE_CHANGED`, `USER_STATUS_CHANGED`, `USER_REVOKED`.
  - `CREATE_ROUTE`, `DELETE_ROUTE`.
  - `UPDATE_BUS_DATA`, `UPDATE_BULK_BUS_DATA`.
  - `SYNC_OFFLINE_QUEUE`.
  - `FORMAT_WHOLE_SHEET`.
- **Kontrak Payload Log:** Log baru `UPDATE_BUS_DATA`, `UPDATE_BULK_BUS_DATA`, `SYNC_OFFLINE_QUEUE`, `FORMAT_WHOLE_SHEET` menyimpan:
  - `route_code` (kolom top-level) — hasil resolver `resolveRouteContext(sheetId, tabName)`.
  - `details.sheetId`, `details.tabName`, `details.rowIndex`/`unitCount`/`busCount`.
  - `details.year`, `details.month`, `details.day` (day hanya jika `tabName` numerik).
  - `details.changedValues: { before, after }` (khusus `UPDATE_BUS_DATA`).
- **Backfill:** Migrasi `20260828000000_backfill_activity_log_route_context.sql` mengisi `route_code`, `details.year/month/day` untuk log lama yang masih menyimpan `sheetId` di `details`, dengan join ke `route_sheets`+`routes`.
- **Index Pendukung:** `idx_activity_logs_route_created (route_code, created_at DESC)` agar filter rute + rentang created_at tidak melakukan full table scan.
- **UI Plain-Language:** Semua role melihat kartu log dengan kalimat awam, nama pelaku yang mudah dibaca (turunan email), objek aktivitas, konteks rute, dan waktu. ID teknis (`sheetId`, `queueItemId`, dll) serta raw JSON tidak ditampilkan di permukaan.
- **Filter Kategori:** Tab `Semua`, `Data Bus`, `Pengguna`, `Rute`, `Sinkronisasi`, `Login`, dan `Sistem`.
- **Filter Lanjutan:** Panel "Filter rute dan waktu" (kolapsibel) dengan dua grup:
  - Periode operasional (rute, tahun, bulan, hari) — via `route_code` eq + JSONB `details->>year/month/day`.
  - Rentang waktu aksi (dari–sampai) — via `created_at` `gte`/`lte`.
  - Tombol Terapkan memicu request server-side; tidak ada auto-fetch per keystroke.
- **Detail Aktivitas:** Tombol `Lihat detail` membuka panel dua kolom tanpa request tambahan. Log baru `UPDATE_BUS_DATA` menyimpan `details.changedValues: { before, after }`; nilainya ditampilkan sebagai `SEBELUM` dan `SESUDAH`. Log lama yang belum memiliki snapshot menampilkan pemberitahuan bahwa nilai historis belum tersedia.
- **Batas Data:** Halaman mengambil maksimal 150 log per query terfilter, dengan cache key yang menyertakan semua opsi filter.

### 4. Proteksi & UX Kartu Pengguna
- **Kartu Superadmin:** Tombol toggle status aktif/nonaktif dan tombol ubah peran disembunyikan secara otomatis pada akun Superadmin untuk mencegah degradasi hak akses atau penguncian sistem.
- **Toggle Switch iOS Style:** Interaksi status aktif/nonaktif akun menggunakan animasi pegas Apple `cubic-bezier(0.32, 0.72, 0, 1)`.
- **Render Foto Profil Google:** Mendukung `referrerPolicy="no-referrer"` pada gambar Google OAuth CDN dengan *fallback* inisial monogram biru dan sinkronisasi otomatis Google User Info ke Supabase.

### 5. Sistem Modal Terpadu SweetAlert2 (`pdoSwal`)
- Menggantikan dialog alert default dengan wrapper `pdoSwal` yang mematuhi token tema (`light` / `dark`) dan dilengkapi sanitasi anti-XSS (`escapeHtml`).

## Konsekuensi
- **Positif:**
  - Keamanan database terjamin secara desentralisasi via RLS PostgreSQL.
  - Tidak ada data historis yang hilang saat akun dinonaktifkan (*audit integrity terjaga*).
  - Pengalaman pengguna mobile-first sangat halus, konsisten, dan mudah dimengerti oleh petugas non-teknis di lapangan.
- **Netral:**
  - Aplikasi memerlukan environment variable `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` yang harus dikonfigurasikan di setiap deployment.
