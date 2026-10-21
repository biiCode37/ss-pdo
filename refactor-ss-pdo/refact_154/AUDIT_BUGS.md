# Audit Temuan Bug & Keamanan Mendalam (Refactor 154)

**Tanggal:** 21 Oktober 2026  
**Auditor:** Expert Senior Software Engineering / Senior Cyber Security Specialist / Bug Bounty Researcher  
**Konteks Target:** SS_PDO (Sistem Pemantauan Data Operasional Bus & Integrasi Google Sheets + Supabase)  
**Branch:** `devmode`  

---

## Ringkasan Eksekutif

Audit komprehensif ini dilakukan dengan meninjau seluruh lapisan arsitektur aplikasi: **Boundary Keamanan (Auth & Edge Functions)**, **Database & Row-Level Security (PostgreSQL / Supabase)**, **Transport & Mutasi Google Sheets**, serta **Pengalaman Pengguna Lapangan (UX & Field Operations)**.

Berdasarkan investigasi menyeluruh, ditemukan **8 temuan kunci**:
- **2 Temuan Kritis (CRITICAL - SEV 1):** Celah SSRF / Eksekusi Remote mutasi Google Sheets tanpa autentikasi pada Supabase Edge Function (`sheets-proxy`), dan Kebijakan RLS yang terbuka penuh (`FOR ALL TO anon USING (true)`) pada tabel-tabel vital basis data (`user_profiles`, `app_page_settings`, `daily_route_reports`, `daily_fleet_shifts`).
- **1 Temuan Tinggi (HIGH - SEV 2):** Bypass otorisasi client-side (RBAC Spoofing) melalui manipulasi string `localStorage.getItem('PDO_USER_ROLE')`.
- **1 Temuan Integritas Data (HIGH - ATURAN EMAS):** Celah penimpaan kolom formula spreadsheet (`toaShift2`) pada lapisan data transport (`mutations.ts`).
- **2 Temuan Menengah (MEDIUM - SEV 3):** Asimetri normalisasi email yang menyebabkan akun petugas ditolak login (*false rejection*), dan pemalsuan sesi offline melalui manipulasi cache profil lokal.
- **2 Temuan Rendah (LOW - SEV 4):** Kebocoran pesan error teknis database Postgres ke pengguna akhir (melanggar aturan sanitasi error UI), dan risiko konflik palsu (*false-positive conflict*) pada pemrosesan antrean offline.

---

## Tabel Temuan Audit (Security & User Experience)

| ID Temuan | Lokasi Kode | Keparahan | Kategori | Deskripsi Singkat | Dampak Pengguna & Sistem | Rekomendasi Mitigasi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-154-01** | `supabase/functions/sheets-proxy/index.ts` | 🔴 **CRITICAL** (CVSS 9.8) | Broken Access Control / SSRF | Edge Function `sheets-proxy` menerima request dari siapa saja (CORS `*`) tanpa verifikasi JWT/Auth, dapat membaca/menulis sembarang file Google Sheets milik Service Account | Penyerang anonim dapat memanipulasi, mengosongkan, atau mencuri isi seluruh spreadsheet operasional PUSM | 1. Verifikasi JWT pengguna Supabase/Google.<br>2. Batasi `spreadsheetId` yang diizinkan (*allowlist*).<br>3. Hapus leak kredensial internal di aksi `health`. |
| **SEC-154-02** | `supabase/migrations/20261019000001_create_app_page_settings.sql`<br>`supabase/migrations/20260826000000_fix_rls_admin_and_audit.sql`<br>`supabase/migrations/20260827000000_fix_user_profiles_insert.sql`<br>`supabase/migrations/20260908000001_all_route_monitoring.sql`<br>`supabase/migrations/20260921000001_create_fleet_status_tables.sql` | 🔴 **CRITICAL** (CVSS 9.1) | Privilege Escalation / Open RLS | RLS policy memberikan `FOR ALL TO anon, authenticated USING (true)` pada tabel `app_page_settings`, `user_profiles`, `daily_route_reports`, dll. Publik dengan anon key dapat mengubah role menjadi superadmin atau menghapus data | Siapa pun dapat mengangkat dirinya menjadi Superadmin, menonaktifkan pengguna lain, mematikan halaman aplikasi (DoS), atau menghapus data | Wajib implementasikan Supabase Auth JWT atau pindahkan seluruh mutasi administratif ke secure backend/Edge Function dengan verifikasi peran. |
| **SEC-154-03** | `src/utils/roleStorage.ts`<br>`src/components/Dashboard.tsx`<br>`src/components/dashboard/DashboardContentTabs.tsx` | 🟠 **HIGH** (CVSS 7.5) | Client-Side RBAC Spoofing | Otorisasi antarmuka hanya memeriksa `localStorage.getItem('PDO_USER_ROLE')` tanpa verifikasi sesi terenkripsi | Pengguna umum (PDO) dapat mengetik di console browser untuk membuka UI Superadmin & Manajemen Pengguna | Sinkronkan validasi peran dengan cache profil terverifikasi dan integrasikan token verifikasi server-side. |
| **SEC-154-04** | `src/services/routes/users.ts` | 🟡 **MEDIUM** (CVSS 5.3) | Insecure Offline Deserialization | Profil offline `PDO_LAST_VERIFIED_PROFILE_${normalizedEmail}` disimpan dalam JSON mentah tanpa HMAC/signature | Pengguna dapat mengedit cache lokal untuk mendapatkan akses peran tinggi selama 30 hari dalam mode offline | Tambahkan checksum/HMAC sederhana berbasis salt sesi atau batasi hak akses offline hanya untuk peran dasar (`pdo`). |
| **SEC-154-05** | `src/services/routes/users.ts`<br>`src/components/userManagement/UserManagementPage.tsx` | 🟢 **LOW** (CVSS 3.5) | Information Disclosure | Error handling pada `addUserProfile`, `updateUserProfileRole`, dsb. meneruskan `error.message` mentah PostgreSQL ke SweetAlert2 | Pengguna awam melihat pesan teknis basis data yang membingungkan dan membocorkan skema internal sistem | Gunakan `formatUserError()` untuk mentranslasikan seluruh error teknis menjadi pesan ramah bahasa Indonesia. |
| **DAT-154-01** | `src/services/googleSheets/mutations.ts` (L36) | 🟠 **HIGH** (Aturan Emas Data) | Formula Column Overwrite Risk | Lapisan mutasi data `mutations.ts` masih mengizinkan penulisan ke kolom formula `toaShift2` | Jika ada payload mutasi lama/eksternal yang membawa `toaShift2`, formula `=TOTAL_TOA - TOA_SHIFT_1` di spreadsheet akan terhapus | Hapus mapping mutasi `toaShift2` dari `mutations.ts` secara mutlak (*Defense-in-Depth*). |
| **UX-154-01** | `src/services/routes/users.ts` (L61, 114, 344, 394, 440, 200) | 🟡 **MEDIUM** (Field UX Failure) | Email Normalization Asymmetry | `verifyUserProfile` dan service mutasi user menggunakan email mentah (case-sensitive) pada query `.eq('email', email)` | Petugas sah yang login dengan akun Google berkombinasi huruf kapital (misal: `Budi.Santoso@gmail.com`) ditolak masuk | Pastikan seluruh query pencarian dan mutasi email menggunakan `.trim().toLowerCase()`. |
| **UX-154-02** | `src/hooks/useOfflineSync.ts` (L62) | 🟢 **LOW** (Sync Ergonomics) | False-Positive Conflict | `detectCollision` menyertakan kolom formula `toaShift2` dalam pendeteksian tabrakan data | Petugas yang menyimpan offline dapat mengalami error status "Konflik" palsu saat tersambung kembali ke internet | Kecualikan kolom kalkulasi otomatis seperti `toaShift2` dari pengecekan collision offline. |

---

## Analisis Mendalam Akar Masalah (Root Cause Analysis)

### 1. SEC-154-01: Arsitektur Proxy Service Account Tanpa Boundary Autentikasi
Pada `supabase/functions/sheets-proxy/index.ts`, developer membuat gerbang API untuk mengatasi keterbatasan kuota Google Sheets API client-side menggunakan Google Service Account server. Namun, Edge Function tersebut tidak memverifikasi apakah request berasal dari pengguna terautentikasi (`req.headers.get("Authorization")`), melainkan hanya menerima perintah JSON mentah. Dikombinasikan dengan CORS `*`, siapa saja di internet yang menemukan endpoint ini dapat memanfaatkan kredensial Google Service Account PUSM untuk membaca atau menimpa spreadsheet apa pun yang dibagikan ke Service Account tersebut.

### 2. SEC-154-02 & SEC-154-03: Ketergantungan pada Client-Side Auth Tanpa Supabase Session
Aplikasi menggunakan Google Identity Services (GIS) secara murni di sisi browser tanpa menukarkan ID token Google tersebut ke Supabase Auth (`supabase.auth.signInWithIdToken()`). Akibatnya:
- Supabase hanya melihat setiap request datang dari role database `anon`.
- Demi membuat fitur "Kelola Pengguna", "Kelola Halaman", dan "Laporan Wilayah" dapat berfungsi dari antarmuka web, migrasi database membuka kebijakan RLS: `FOR ALL TO anon USING (true)`.
- Karena tidak ada token sesi tersumpah (*cryptographically signed session*) dari server, frontend hanya mengandalkan `localStorage.getItem('PDO_USER_ROLE')`. Ini adalah konsep *Client-Side Access Control* yang sangat rapuh.

### 3. DAT-154-01: Ketiadaan *Defense-in-Depth* di Lapisan Mutasi Spreadsheet
Pada siklus Refactor 134, tim memperbaiki bug penimpaan kolom formula `toaShift2` dengan cara menghapus field tersebut di builder form UI (`busInputPayload.ts`). Namun, fungsi eksekutor mutasi tingkat rendah `updateBulkBusData` di `src/services/googleSheets/mutations.ts` tetap mempertahankan baris:
```typescript
if (updates.toaShift2 !== undefined) addUpdate('toaShift2', updates.toaShift2);
```
Hal ini melanggar prinsip *Defense-in-Depth* dan Aturan Emas Proyek: fungsi mutasi tidak boleh menyediakan mekanisme tulis ke kolom berumus.

### 4. UX-154-01: Asimetri Normalisasi Email
Pada `src/services/routes/users.ts`:
```typescript
const normalizedEmail = email.trim().toLowerCase();
const cacheKey = `PDO_LAST_VERIFIED_PROFILE_${normalizedEmail}`;

const { data, error } = await supabase
  .from('user_profiles')
  .select('*, roles(...)')
  .eq('email', email) // BUG: menggunakan email mentah!
  .single();
```
PostgreSQL melakukan komparasi string secara *exact case* (kecuali menggunakan `ILIKE`). Karena saat penambahan user email disimpan dalam format huruf kecil (`cleanEmail = params.email.trim().toLowerCase()`), input login Google yang membawa huruf besar akan gagal cocok dan menghasilkan error `PGRST116`, menolak petugas yang sah.
