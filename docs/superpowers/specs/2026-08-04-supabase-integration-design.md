# Supabase Integration & Metadata Catalog Design Specification

Date: 2026-08-04
Status: Approved by User

## Goal
Integrate Supabase as a Metadata Catalog (Routes & Period Sheets), User Profile Registry, Audit Logging System, and Offline Sync Backup Queue without altering Google Sheets as the Single Source of Truth (SSOT) for operational bus data.

## System Constraints & Golden Rules
1. **Single Source of Truth (SSOT):** Google Sheets remains 100% SSOT for operational bus shift data.
2. **Supabase Scope:** Supabase is ONLY used for:
   - Route catalog & period sheet registry (`routes`, `route_sheets`)
   - User profiles & role management (`user_profiles`)
   - Audit trail activity logging (`activity_logs`)
   - Backup queue for offline pending syncs (`sync_queue_backups`)
3. **Offline-First Support:** Local caching using key `PDO_CACHE_ROUTES` ensures full app functionality even when Supabase or internet connection is offline.
4. **Permanent User Session:** Google OAuth token silent renewal operates seamlessly without forcing user logouts.

---

## Database Schema (PostgreSQL / Supabase DDL)

```sql
-- 1. Tabel Master Rute Bus
CREATE TABLE IF NOT EXISTS routes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uuid uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  route_code text NOT NULL UNIQUE,
  route_name text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_routes_route_code ON routes(route_code);

-- 2. Tabel Registry Spreadsheet Periode Rute
CREATE TABLE IF NOT EXISTS route_sheets (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uuid uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  route_id bigint REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  year int2 NOT NULL,
  month int2 NOT NULL CHECK (month >= 1 AND month <= 12),
  spreadsheet_id text NOT NULL,
  sheet_url text NOT NULL,
  tab_name text DEFAULT 'PDO' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_route_period UNIQUE (route_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_route_sheets_route_id ON route_sheets(route_id);

-- 3. Tabel Profil Pengguna (User Profiles & Roles)
CREATE TABLE IF NOT EXISTS user_profiles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uuid uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  avatar_url text,
  role text DEFAULT 'petugas' NOT NULL CHECK (role IN ('admin', 'petugas')),
  is_active boolean DEFAULT true NOT NULL,
  last_login_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- 4. Tabel Audit Log Aktivitas Pengguna
CREATE TABLE IF NOT EXISTS activity_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uuid uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  user_email text NOT NULL,
  action text NOT NULL,
  route_code text, -- Text murni tanpa FK untuk preservasi audit trail
  details jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_route_code ON activity_logs(route_code);

-- 5. Tabel Backup Antrean Sinkronisasi Luring
CREATE TABLE IF NOT EXISTS sync_queue_backups (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uuid uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  user_email text NOT NULL,
  spreadsheet_id text NOT NULL,
  tab_name text NOT NULL,
  row_index integer NOT NULL,
  payload jsonb NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'synced', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  synced_at timestamptz
);
```

---

## Application Architecture & Services Layer

### 1. Types & Client Initialization
- **`src/types/supabase.ts`**: Tipe TypeScript lengkap untuk `Route`, `RouteSheet`, `UserProfile`, `ActivityLog`, dan `SyncQueueBackup`.
- **`src/services/supabase.ts`**: Inisialisasi Klien `@supabase/supabase-js` menggunakan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.

### 2. Service Layer (`src/services/routeService.ts`)
- `fetchRoutesWithSheets()`: Memuat rute aktif beserta lembar periode `route_sheets`. Hasil disimpan ke `localStorage` (`PDO_CACHE_ROUTES`). Mendukung fallback otomatis saat offline.
- `upsertUserProfile(profile)`: Menyingkronkan profil pengguna Google ke tabel `user_profiles` saat login berhasil.
- `logActivity(log)`: Pengiriman log audit secara asinkron (*fire-and-forget*).
- `backupSyncQueue(item)`: Menyimpan data antrean sinkronisasi offline ke database Supabase sebagai backup.

### 3. UI Component Layer
- Update **`LoginScreen.tsx`** / callback login untuk memanggil `upsertUserProfile`.
- Update **`RouteSelectorCard.tsx`** untuk menampilkan rute & bulan/tahun berbasis metadata Supabase / Cache lokal.

---

## Verification Plan

### Automated Verification
- Menjalankan `pnpm run build` untuk memastikan tidak ada kesalahan tipe TypeScript atau sintaks.

### Manual Verification
- Pengujian fallback offline dengan menonaktifkan jaringan internet di browser devtools.
- Memastikan `localStorage` menyimpan `PDO_CACHE_ROUTES` dengan benar.
