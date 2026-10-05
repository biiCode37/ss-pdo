# 🛠️ Repair Report: Refactor 72 — Penyelesaian Total Trip Numeric & Sentralisasi URL Spreadsheet Global

Dokumen ini merangkum perbaikan teknis, Before vs After, serta skenario pengujian lapangan untuk Refactor 72.

---

## 1. Rincian Implementasi

### A. Migrasi Database Supabase (`public.daily_route_reports`)
- **Perubahan Tipe Kolom:** Mengeksekusi DDL `ALTER TABLE public.daily_route_reports ALTER COLUMN total_trip TYPE numeric USING total_trip::numeric;`.
- **Hasil:** PostgreSQL kini dapat menerima nilai ritase desimal (misal: `214.5`, `167.8`) tanpa melempar galat `22P02`.
- **Verifikasi Langsung:** Pengujian kueri upsert untuk rute `JAK.01` dengan ritase `214.5` pada tanggal `2026-09-19` berhasil 100% tersimpan di database.

### B. Pembuatan Tabel Konfigurasi Terpusat (`public.app_settings`)
- **Struktur Tabel:**
  - `key` text PRIMARY KEY
  - `value` text NOT NULL
  - `description` text
  - `updated_by` text
  - `created_at` & `updated_at` timestamptz
- **Seed Data:** Menanamkan URL spreadsheet global resmi (`https://docs.google.com/spreadsheets/d/1Hkvs4DLGWGJMPHRISV-Sg72nL_zRIHjklTuRu1yXwFYS4/edit`) sebagai konfigurasi bawaan wilayah utara.

### C. Layer Servis Konfigurasi (`src/services/appSettingsService.ts`)
- Menyediakan utilitas:
  - `getRegionalGlobalSheetUrl()`: Membaca URL dari database Supabase dengan fallback ke cache lokal.
  - `setRegionalGlobalSheetUrl(url)`: Menyimpan URL baru ke Supabase dan memperbarui cache lokal.

### D. Integrasi Modal Sinkronisasi Wilayah (`src/utils/modals/regionalSyncModal.ts`)
- Mengambil URL awal dari database cloud via `getRegionalGlobalSheetUrl()`.
- Saat pengguna menekan konfirmasi, URL baru otomatis tersimpan kembali ke database cloud (`setRegionalGlobalSheetUrl`) agar seluruh rekan korlap/pimpinan langsung tersinkronisasi.

---

## 2. Before vs After

| Aspek | Sebelum Perbaikan (Before) | Sesudah Perbaikan (After) |
| :--- | :--- | :--- |
| **Tipe Kolom `total_trip`** | `integer` (menolak pecahan ritase desimal `214.5`) | `numeric` (menerima presisi desimal ritase Transjakarta) |
| **Jumlah Rute Tersimpan** | Hanya 6 rute (yang ritasenya kebetulan bilangan bulat) | 18 dari 18 rute (100% lengkap tanpa error `22P02`) |
| **Error Console Browser** | `400 Bad Request` `{code: '22P02', message: 'invalid input syntax for type integer: "214.5"'}` | 0 Error; seluruh 18 rute ter-upsert sukses |
| **Penyimpanan URL Global** | Terisolasi di `localStorage` per peranti | Tersentralisasi di Supabase `app_settings` (semua device sinkron) |

---

## 3. Case: Skenario Lapangan

### Skenario 1: Sinkronisasi Massal 18 Rute dari Spreadsheet Capaian Global
- **Kondisi:** Korlap menekan tombol `[Tarik Data Global]` untuk tanggal 19 September 2026.
- **Aksi:** Memilih lembar `SEPTEMBER 2026` dan klik "Mulai Sinkronisasi".
- **Hasil:** Parser membaca ke-18 rute, mengirim nilai ritase desimal (`214.5`, `167.8`, dst.), dan Supabase menerima seluruh 18 rute tanpa error. Notifikasi sukses menampilkan *"Berhasil menyinkronkan 18 rute ke database."*

### Skenario 2: Pimpinan Membuka Monitoring dari Ponsel Baru
- **Kondisi:** Pimpinan baru pertama kali membuka dashboard monitoring di ponsel pribadinya (belum ada cache/localStorage).
- **Aksi:** Pimpinan mengklik tombol `[Tarik Data Global]`.
- **Hasil:** Input link spreadsheet Google Sheets sudah otomatis terisi lengkap dari database `app_settings`. Pimpinan tidak perlu repot mencari link spreadsheet atau copas manual.

---

## 4. Status Quality Gates

- ✅ **Unit Tests:** `71 test files passed (100%)`, `506 unit tests passed (100%)`.
- ✅ **TypeScript & Build:** `tsc -b && vite build` lulus 0 error.
- ✅ **Graphify:** Knowledge graph terbarukan (`4198 nodes, 5412 edges, 377 communities`).
