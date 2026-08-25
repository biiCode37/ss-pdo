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
  - `USER_LOGIN` (metode login Google GIS).
  - `SAVE_BUS_ROW` / `UPDATE_BUS_DATA` dengan ringkasan field terurai (Ritase, Penumpang, Pendapatan, Keterangan).
  - `USER_ROLE_UPDATED`, `USER_STATUS_TOGGLED`, `USER_CREATED`.
  - `QUEUE_SYNCED` (sinkronisasi antrean offline).
- Antarmuka `AuditLogPage.tsx` menyediakan filter kategori bersih (*Semua, Input Operasional, Pengguna, Sistem*) tanpa elemen counter yang mengganggu konsentrasi.

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
