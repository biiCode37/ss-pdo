# Supabase Route Registry & Metadata Architecture Design

## 1. Overview & Objectives
Desain ini mendefinisikan integrasi Supabase sebagai **Katalog Metadata Terpusat & Sistem Audit** untuk aplikasi PDO Mobile. Integrasi ini bertujuan untuk:
1. Mengelola **Katalog Rute & Link File Google Sheets per Periode (Bulan/Tahun)** secara terpusat dan berhirarki.
2. Menyiapkan **Profil Pengguna & Audit Log Aktivitas** untuk pencatatan riwayat operasional.
3. Menyediakan **Cadangan Antrean Offline & Log Error** untuk memastikan 0% potensi kehilangan data saat terjadi hambatan koneksi.

**Prinsip Utama (Golden Rule)**: Google Sheets **TETAP 100% menjadi Single Source of Truth (SSOT)** untuk seluruh data transaksi operasional bus/shift (KM Awal/Akhir, TOA, Keterangan). Supabase HANYA mengelola data metadata dan audit log secara terpisah.

---

## 2. Database Schema (Supabase PostgreSQL)

### A. Katalog Rute & File SS (`routes` & `route_sheets`)
```sql
-- 1. Tabel Master Rute
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- Contoh: 'JAK.76', 'JAK.48A'
    name TEXT NOT NULL,        -- Contoh: 'Semper - Rorotan'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel File Sheet per Periode Bulan/Tahun
CREATE TABLE route_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    year INT NOT NULL,         -- Contoh: 2026
    month INT NOT NULL,        -- Contoh: 8 (Agustus)
    sheet_url TEXT NOT NULL,   -- Link Google Sheets
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_route_period UNIQUE (route_id, year, month)
);
```

### B. Profil Pengguna & Audit Log (`user_profiles` & `activity_logs`)
```sql
-- 3. Tabel Profil Pengguna
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'operator', -- 'admin' atau 'operator'
    last_login TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Audit Log Aktivitas Operasional
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,        -- Contoh: 'UPDATE_BUS_DATA', 'ADD_ROUTE'
    route_code TEXT,
    details JSONB,               -- Detail ringkas perubahan (tanpa mengubah SSOT)
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### C. Cadangan Antrean Offline & Log Error (`sync_queue_backups` & `error_logs`)
```sql
-- 5. Tabel Cadangan Antrean Offline
CREATE TABLE sync_queue_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    sheet_id TEXT NOT NULL,
    tab_name TEXT NOT NULL,
    row_index INT NOT NULL,
    updates JSONB NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Log Error Sistem
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Architecture & Offline Caching Policy

```
+-----------------------------------------------------------------------+
|                           PDO MOBILE CLIENT                           |
|                                                                       |
|  +---------------------------+       +-----------------------------+  |
|  |   Google Sheets Service   |       |   Supabase Metadata Client  |  |
|  |     (Operational SSOT)    |       |  (Routes, Logs, Backups)    |  |
|  +-------------+-------------+       +--------------+--------------+  |
+----------------|------------------------------------|-----------------+
                 | (Direct Read/Write)                | (Metadata Sync)
                 v                                    v
       +-------------------+                +-------------------+
       |   Google Sheets   |                | Supabase Database |
       |  (Single Source   |                |  (Metadata Catalog|
       |     of Truth)     |                |  & Audit Logs)    |
       +-------------------+                +-------------------+
```

1. **Offline Caching**:
   - Seluruh daftar Rute & Link File SS di-sync dari Supabase ke `localStorage` (`PDO_CACHE_ROUTES`).
   - Saat perangkat offline, UI membaca dari `PDO_CACHE_ROUTES` sehingga aplikasi dapat berfungsi 100% tanpa hambatan.
2. **Asynchronous Audit Logging**:
   - Pencatatan `activity_logs` dan `sync_queue_backups` dilakukan secara *non-blocking* di latar belakang.

---

## 4. UI/UX Component Specifications

1. **`RouteSelectorCard.tsx`**:
   - Selector Hirarki 3 Tingkat: **Nama Rute** ➔ **Periode Bulan/Tahun** ➔ **Tanggal Tab**.
   - Menciut otomatis menjadi bentuk kapsul (*compact pill*) setelah data dimuat.
2. **Route Manager Modal**:
   - Modal rapi untuk menambahkan rute baru dan mendaftarkan file SS bulan baru ke Supabase.
