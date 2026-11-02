# Audit Temuan Keamanan & Akses Kontrol Google Sheets Proxy - Refactor 192

Dokumen ini mencatat audit keamanan mendalam terhadap Supabase Edge Function `sheets-proxy`, boundary otorisasi pemanggil, proteksi spreadsheet operasional, dan mekanisme kontrol CORS sesuai dengan **Standar Keamanan Basis Data & Row-Level Security (Strict RLS & Anti-Privilege Escalation)** serta **Golden Rules SS_PDO**.

---

## Ringkasan Temuan Audit

| ID Temuan | Lokasi Kode | Kategori | Keparahan | Deskripsi & Dampak Pengguna/Sistem | Mitigasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-192-01** | `supabase/functions/sheets-proxy/index.ts` | Broken Access Control / SSRF | 🔴 **High** (CVSS 8.2) | **Ketiadaan Validasi Whitelist Spreadsheet & CORS Terbuka:** `sheets-proxy` hanya memeriksa keberadaan header `authorization` atau `apikey` publik anon tanpa memvalidasi apakah `spreadsheetId` yang dituju terdaftar dalam rute operasional resmi. CORS juga diset `*`. Siapa pun yang memiliki kunci publik aplikasi berpotensi menggunakan Service Account untuk membaca/menulis sembarang file spreadsheet di Google Drive Service Account. | 1. Implementasikan validasi `spreadsheetId` terhadap tabel `public.route_sheets`.<br>2. Gunakan *in-memory caching* (TTL 5 menit) dengan fallback single-record ke DB untuk mempertahankan performa kilat.<br>3. Batasi CORS hanya pada origin yang sah (domain aplikasi Vercel & localhost).<br>4. Tambahkan validasi struktur muatan data tulis (*payload integrity*). |
| **UX-192-01** | `src/constants/texts/text_errors.ts` | Central Text Dictionary | 🟢 **Low** | **Ketiadaan Pesan Kesalahan Ramah untuk Penolakan Spreadsheet:** Belum ada entri kamus teks sentral untuk mendeskripsikan penolakan dokumen spreadsheet yang tidak terdaftar dalam bahasa Indonesia yang ramah pengguna. | Tambahkan token kamus sentral `TEXT_ERRORS.UNREGISTERED_SPREADSHEET` di `src/constants/texts/text_errors.ts` beserta unit test integritasnya. |
