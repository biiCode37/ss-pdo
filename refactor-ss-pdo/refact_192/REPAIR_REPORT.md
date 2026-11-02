# Laporan Implementasi Perbaikan Keamanan Google Sheets Proxy (Refactor 192)

Dokumen ini mencatat implementasi perbaikan hasil audit **Refactor 192: Pengamanan Edge Function `sheets-proxy` (Whitelist Database `route_sheets`, In-Memory Caching, Origin-Based CORS, & Validasi Payload Mutasi)** pada aplikasi **SS_PDO**.

---

## 1. SEC-192-01: Validasi Whitelist Database & In-Memory Caching pada `sheets-proxy`

- **Lokasi:** `supabase/functions/sheets-proxy/index.ts`
- **Sebelum Perbaikan:** 
  Edge Function hanya memeriksa apakah request memiliki header `authorization` atau `apikey` publik serta format regex `spreadsheetId`. Tidak ada pemeriksaan apakah `spreadsheetId` tersebut merupakan rute resmi PUSM atau spreadsheet eksternal/acak. CORS diset terbuka lebar (`Access-Control-Allow-Origin: "*"`).
- **Sesudah Perbaikan:**
  1. Diintegrasikan Supabase Admin client (`service_role`) di dalam Deno Edge Function.
  2. Dibuat mekanisme **In-Memory Cache (TTL: 5 menit)** yang memuat seluruh `spreadsheet_id` terdaftar dari tabel `public.route_sheets`.
  3. Diterapkan mekanisme *Cache-Miss Fallback*: jika suatu spreadsheet belum ada dalam memori (misalnya rute baru didaftarkan oleh admin beberapa detik yang lalu), fungsi melakukan kueri cepat ke `route_sheets` untuk spreadsheet tersebut. Jika ditemukan, ID ditambahkan ke cache.
  4. Jika `spreadsheetId` tidak ditemukan di `route_sheets`, request langsung ditolak dengan status HTTP **`403 Forbidden`** dan kode error `SPREADSHEET_NOT_ALLOWED`.
  5. CORS disaring ketat melalui `getCorsHeaders(req)` yang hanya mengizinkan origin resmi (localhost development dan domain `*.vercel.app` / `*.supabase.co`).
  6. Ditambahkan validasi struktur payload untuk aksi mutasi tulis (`values.batchUpdate` dan `batchUpdate`).
- **Before vs After:**
  ```typescript
  // BEFORE:
  const authHeader = req.headers.get("authorization") || req.headers.get("apikey");
  if (!authHeader) return 401;
  // Langsung eksekusi Google Sheets API tanpa verifikasi spreadsheetId terhadap database

  // AFTER:
  const isAllowed = await isSpreadsheetAllowed(spreadsheetId);
  if (!isAllowed) {
    return new Response(
      JSON.stringify({
        error: "Akses ditolak: Spreadsheet ID tidak terdaftar dalam rute operasional resmi.",
        code: "SPREADSHEET_NOT_ALLOWED",
      }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  ```
- **Case: Skenario Lapangan:**
  - *Skenario 1 (Penyusupan / Eksploitasi Kunci Publik):* Penyerang yang mengekstrak `anon key` Supabase mencoba mengirim perintah cURL untuk membaca atau menghapus spreadsheet internal lain yang dibagikan ke Service Account. Edge Function seketika memotong request dengan HTTP 403 `SPREADSHEET_NOT_ALLOWED`. Spreadsheet aman terlindungi.
  - *Skenario 2 (Petugas Operasional Resmi):* Petugas di terminal rute JAK.115, JAK.60, dll. membuka dashboard dan menginput data ritase bus. `sheets-proxy` memeriksa in-memory cache dalam waktu < 1 ms dan menemukan bahwa spreadsheet rute terdaftar di `route_sheets`. Operasi baca dan tulis berjalan lancar tanpa kendala (zero downtime, zero disruption).

---

## 2. UX-192-01: Standardisasi Kamus Teks Sentral

- **Lokasi:** `src/constants/texts/text_errors.ts`, `src/constants/texts/texts.test.ts`
- **Sebelum Perbaikan:** Pesan penolakan spreadsheet belum distandarisasi di kamus sentral.
- **Sesudah Perbaikan:** Ditambahkan entri sentral `TEXT_ERRORS.UNREGISTERED_SPREADSHEET` bernilai `'Dokumen spreadsheet tidak terdaftar dalam rute operasional resmi.'` dan diuji integritasnya melalui Vitest.
- **Before vs After:**
  ```typescript
  // AFTER:
  export const TEXT_ERRORS = {
    ...
    UNREGISTERED_SPREADSHEET: 'Dokumen spreadsheet tidak terdaftar dalam rute operasional resmi.',
    ...
  } as const;
  ```
- **Case: Skenario Lapangan:** Ketika spreadsheet yang tidak valid dicoba dimuat, antarmuka menampilkan pesan bahasa Indonesia yang sopan dan jelas tanpa istilah teknis database yang membingungkan.

---

## 3. Hasil Verifikasi Live & Pengujian Otomatis

1. **Uji Live Edge Function `sheets-proxy` (`sejttnsanzogsykmtwym`):**
   - Health check: `HTTP 200` (`configured: true`).
   - Akses dengan ID palsu/acak: `HTTP 403` (`SPREADSHEET_NOT_ALLOWED`).
   - Akses dengan ID rute resmi terdaftar (`1VymDYWJPkXtzha9Le8m20njIeI5tosJ6fH-WenFL24w`): `HTTP 200` (Judul: `JAK.115_OKTOBER_2026`).
2. **Unit Test Transport:**
   - `src/services/googleSheets/transport.test.ts` lulus 6/6 pengujian termasuk pengujian mitigasi `SPREADSHEET_NOT_ALLOWED`.
3. **Kamus Teks:**
   - `src/constants/texts/texts.test.ts` lulus 26/26 pengujian.
