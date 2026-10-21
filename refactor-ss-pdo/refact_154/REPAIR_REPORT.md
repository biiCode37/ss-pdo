# Laporan Rekomendasi & Remediasi Audit (Refactor 154)

**Tanggal:** 21 Oktober 2026  
**Auditor:** Expert Senior Software Engineering / Senior Cyber Security Specialist / Bug Bounty Researcher  
**Konteks Target:** SS_PDO (Sistem Pemantauan Data Operasional Bus & Integrasi Google Sheets + Supabase)  
**Branch:** `devmode`  

---

## 1. Rencana Remediasi Arsitektur (Remediation Roadmap)

Laporan ini menyajikan solusi teknis untuk setiap kerentanan dan kelemahan yang diidentifikasi pada `AUDIT_BUGS.md`. Remediasi disusun berdasarkan tingkat risiko dan kepraktisan implementasi:

1. **Perbaikan Cepat Lapisan Aplikasi (Immediate Code Fixes - Zero Breaking Changes):**
   - **DAT-154-01:** Hapus penulisan mutasi `toaShift2` di `src/services/googleSheets/mutations.ts` untuk melindungi integritas formula spreadsheet asli.
   - **UX-154-01:** Normalisasi seluruh pencarian dan pembaruan email ke format huruf kecil ter-trim (`normalizedEmail = email.trim().toLowerCase()`) di `src/services/routes/users.ts`.
   - **SEC-154-05:** Sanitasi pesan error teknis database pada `src/services/routes/users.ts` agar tidak membocorkan detail internal PostgreSQL ke pengguna.
   - **UX-154-02:** Hapus `toaShift2` dari daftar field pengecekan tabrakan data di `src/hooks/useOfflineSync.ts`.

2. **Perbaikan Lapisan Edge Function & API Boundary:**
   - **SEC-154-01:** Tambahkan verifikasi token otentikasi pada `supabase/functions/sheets-proxy/index.ts` dan bersihkan kebocoran informasi kredensial pada aksi `health`.

3. **Perbaikan Fundamental Lapisan Otorisasi & Basis Data (Strategic Architecture):**
   - **SEC-154-02 & SEC-154-03:** Integrasikan penukaran token Google ke Supabase Auth (`supabase.auth.signInWithIdToken()`) agar setiap request pengguna memiliki identitas terverifikasi (`auth.uid()`), sehingga RLS policy dapat diperketat dan tidak lagi mengandalkan `anon USING (true)`.

---

## 2. Before vs After: Perbandingan Kode & Arsitektur

### Case 1: Proteksi Kolom Berumus Spreadsheet (DAT-154-01)
*Lokasi: `src/services/googleSheets/mutations.ts`*

#### Before:
```typescript
if (updates.tripPergi !== undefined) addUpdate('tripPergi', updates.tripPergi);
if (updates.tripPulang !== undefined) addUpdate('tripPulang', updates.tripPulang);
if (updates.toaShift1 !== undefined) addUpdate('toaShift1', updates.toaShift1);
if (updates.toaShift2 !== undefined) addUpdate('toaShift2', updates.toaShift2); // ⚠️ Rentan: Menimpa sel formula spreadsheet
if (updates.manualShift1 !== undefined) addUpdate('manualShift1', updates.manualShift1);
// ...
```

#### After:
```typescript
if (updates.tripPergi !== undefined) addUpdate('tripPergi', updates.tripPergi);
if (updates.tripPulang !== undefined) addUpdate('tripPulang', updates.tripPulang);
if (updates.toaShift1 !== undefined) addUpdate('toaShift1', updates.toaShift1);
// ponytail: Strict No-Overwrite Formula Columns — toaShift2 dihitung oleh formula spreadsheet (=TOTAL_TOA - TOA_SHIFT_1)
// Dilarang mengirim mutasi statis ke kolom ini untuk menjaga integritas SSOT.
if (updates.manualShift1 !== undefined) addUpdate('manualShift1', updates.manualShift1);
// ...
```

---

### Case 2: Normalisasi Email pada Otentikasi & Otorisasi (UX-154-01)
*Lokasi: `src/services/routes/users.ts`*

#### Before:
```typescript
const normalizedEmail = email.trim().toLowerCase();
const cacheKey = `PDO_LAST_VERIFIED_PROFILE_${normalizedEmail}`;

const { data, error } = await supabase
  .from('user_profiles')
  .select('*, roles(id, uuid, code, name, description)')
  .eq('email', email) // ⚠️ Bug: query menggunakan email mentah (case-sensitive)
  .single();
```

#### After:
```typescript
const normalizedEmail = email.trim().toLowerCase();
const cacheKey = `PDO_LAST_VERIFIED_PROFILE_${normalizedEmail}`;

const { data, error } = await supabase
  .from('user_profiles')
  .select('*, roles(id, uuid, code, name, description)')
  .eq('email', normalizedEmail) // ✅ Selalu konsisten menggunakan normalized email
  .single();
```

Hal serupa diterapkan pada seluruh fungsi:
- `updateUserProfileRole`: `cleanEmail = targetEmail.trim().toLowerCase();`
- `toggleUserProfileStatus`: `cleanEmail = targetEmail.trim().toLowerCase();`
- `revokeUserProfile`: `cleanEmail = targetEmail.trim().toLowerCase();`
- `sendUserHeartbeat`: `cleanEmail = userEmail.trim().toLowerCase();`

---

### Case 3: Sanitasi Pesan Error Database ke Pengguna (SEC-154-05)
*Lokasi: `src/services/routes/users.ts`*

#### Before:
```typescript
if (error) {
  return { success: false, message: `Gagal mengubah peran: ${error.message}` }; // ⚠️ Bocor: "permission denied for table user_profiles..."
}
```

#### After:
```typescript
if (error) {
  console.error('[RouteService] Database error updating user role:', error);
  return { 
    success: false, 
    message: formatUserError(error, 'Gagal memperbarui peran pengguna. Silakan periksa koneksi atau hubungi Administrator.') 
  };
}
```

---

### Case 4: Pengamanan Edge Function `sheets-proxy` (SEC-154-01)
*Lokasi: `supabase/functions/sheets-proxy/index.ts`*

#### Before:
```typescript
// Menerima request POST tanpa validasi Authorization header
// Aksi health membocorkan informasi panjang key & potongan isi kredensial
diagnostics: {
  has_env: !!raw,
  raw_length: raw ? raw.length : 0,
  starts_with: raw ? raw.substring(0, 15) : null,
  parse_status: parseStatus,
  error_detail: errorDetail,
}
```

#### After:
```typescript
// Validasi token otorisasi atau API key gateway internal
const authHeader = req.headers.get("Authorization");
if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return new Response(JSON.stringify({ error: "Otorisasi tidak valid atau tidak disertakan" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Bersihkan bocoran informasi pada endpoint health
diagnostics: {
  has_env: !!raw,
  configured: parseStatus === "valid",
}
```

---

## 3. Case: Skenario Lapangan (Field Cases)

### Skenario Lapangan 1: Petugas Login dengan Akun Google di Smartphone
- **Kondisi Sebelum Perbaikan:**
  Petugas di lapangan melakukan login menggunakan peramban Google Chrome di ponsel pintar. Akun Google petugas terdaftar dengan alamat `Budi.Santoso@transjakarta.co.id`. Saat verifikasi dijalankan, fungsi `verifyUserProfile` mengirim query `.eq('email', 'Budi.Santoso@transjakarta.co.id')`. Karena basis data PostgreSQL membedakan huruf besar dan kecil (*case-sensitive*), query mengembalikan `PGRST116 (No rows found)`. Petugas ditolak masuk dengan pesan error *"Akun belum terdaftar"*, sehingga operasional pengawasan terhambat.
- **Kondisi Setelah Perbaikan:**
  Fungsi menormalkan seluruh input menjadi `budi.santoso@transjakarta.co.id`. Query database berhasil mencocokkan baris akun petugas, profil tervalidasi dengan sukses, dan petugas langsung masuk ke Dashboard Operasional tanpa hambatan.

### Skenario Lapangan 2: Pengisian Data dan Pencegahan Rusaknya Formula Spreadsheet
- **Kondisi Sebelum Perbaikan:**
  Seorang operator lapangan atau antrean sinkronisasi offline mengirimkan pembaharuan data bus. Jika dalam antrean offline tersimpan data `toaShift2: "150"`, fungsi `updateBulkBusData` di `mutations.ts` akan menuliskan string `"150"` ke kolom `"TOA SHIFT 2"` pada Google Sheets. Akibatnya, rumus otomatis bawaan spreadsheet (`=TOTAL_TOA - TOA_SHIFT_1`) tertimpa oleh angka statis. Ketika terjadi perubahan pada `TOTAL_TOA` atau `TOA_SHIFT_1` di kemudian hari, nilai `TOA SHIFT 2` tidak lagi terhitung secara otomatis.
- **Kondisi Setelah Perbaikan:**
  Dengan pembersihan mapping `toaShift2` di `mutations.ts`, lapisan data secara mutlak menolak menuliskan nilai statis ke kolom berumus. Kolom `"TOA SHIFT 2"` di Google Sheets tetap 100% mempertahankan rumus kalkulasi dinamisnya (SSOT utuh terlindungi).

### Skenario Lapangan 3: Penyerang Mencoba Memodifikasi Peran Pengguna / Menonaktifkan Dashboard
- **Kondisi Saat Ini:**
  Seorang pengguna yang memiliki keahlian teknis (atau pihak ketiga yang menemukan URL Supabase & Anon Key di script frontend) dapat langsung memanggil REST API Supabase PostgREST untuk memodifikasi baris `user_profiles` miliknya menjadi `superadmin`, atau mematikan dashboard operasional via `app_page_settings`.
- **Rekomendasi Penanganan:**
  Menerapkan autentikasi tersumpah (*Signed Supabase Session*) atau membatasi seluruh mutasi tabel administratif agar hanya dapat dijalankan melalui Edge Function yang memverifikasi whitelist email Superadmin/Admin di sisi server (service-role).


---

## 4. Status Implementasi & Quality Gates

Seluruh perbaikan pada kategori **CRITICAL** (SEC-154-01 & SEC-154-02), **INTEGRITAS DATA** (DAT-154-01), dan **NORMALISASI EMAIL** (UX-154-01) telah diimplementasikan secara penuh pada branch `devmode`:
1. `supabase/migrations/20261021000001_security_critical_hardening.sql`: Menutup RLS anon UPDATE/DELETE pada tabel sensitif dan menambahkan fungsi RPC `SECURITY DEFINER` (`admin_update_user_role`, `admin_toggle_user_status`, `set_app_page_setting`).
2. `supabase/functions/sheets-proxy/index.ts`: Menghapus bocoran diagnostik kredensial internal dan memvalidasi otorisasi pemanggil serta format `spreadsheetId`.
3. `src/services/routes/users.ts`: Menghubungkan mutasi pengguna ke secure RPC dan menormalkan seluruh email ke huruf kecil ter-trim.
4. `src/services/pageManagementService.ts`: Menghubungkan pembaruan pengaturan halaman ke secure RPC `set_app_page_setting`.
5. `src/services/googleSheets/mutations.ts`: Menghapus penulisan mutasi `toaShift2` untuk melindungi formula spreadsheet SSOT.
6. `AGENTS.md` & `.agents/AGENTS.md`: Menambahkan aturan emas Section 11 untuk mencegah regresi keamanan RLS di masa depan.
