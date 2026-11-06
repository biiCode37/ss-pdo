# AUDIT TEMUAN OTORISASI PEMANGGIL sheets-proxy: REFACTOR 205
**Modul:** Edge Function `sheets-proxy` (Google Service Account), transport Sheets frontend (`src/services/googleSheets/transport.ts`)
**Fokus Masalah:** Saat menilai opsi Supabase Auth, ditemukan bahwa seluruh baca/tulis Google Sheets di produksi melewati `sheets-proxy` dengan service account, tetapi proxy tidak memverifikasi siapa pemanggilnya.

## Metode
- Penelusuran jalur akses Sheets: semua fungsi baca/tulis ada di `transport.ts`. Bila `health.configured=true`, semuanya dikirim ke `sheets-proxy`; token GIS pengguna hanya cadangan. Tidak ada pemanggilan Sheets API langsung di luar `transport.ts`.
- `list_edge_functions`: `sheets-proxy` ter-deploy dengan `verify_jwt: false`.
- Probe baca-saja: `spreadsheets.get` (`fields=properties.title`) ke spreadsheet rute terdaftar dengan header palsu `apikey: x`.

---

### ID Temuan: BUG-SEC-205-01
- **Lokasi Kode:** `supabase/functions/sheets-proxy/index.ts` (handler, pengecekan `authHeader`)
- **Keparahan:** Critical (akses baca/tulis tanpa autentikasi ke SSOT 18 spreadsheet)
- **Deskripsi:** Proxy hanya mengecek **ada atau tidaknya** header `authorization`/`apikey`, bukan isinya, dan gateway tidak memverifikasi JWT (`verify_jwt: false`). Probe dengan `apikey: x` mengembalikan **HTTP 200** `{"properties":{"title":"JAK.88_NOVEMBER_2026"}}`. Siapa pun di internet dapat membaca, menimpa sel (`values.batchUpdate`, termasuk kolom berumus), dan menjalankan perubahan struktural apa pun (`batchUpdate`) pada spreadsheet yang terdaftar di `route_sheets`, memakai identitas service account.
- **Dampak User:** Data operasional (TOA, KM, ritase) bisa dicuri, diubah diam-diam, atau dihapus per tab. Pemulihan harus manual lewat riwayat versi Google Sheets per file. Melanggar AGENTS.md (Proteksi Boundary Edge Function).
- **Mitigasi:** Token Google pengguna diverifikasi ke Google `userinfo` dan dicocokkan dengan `user_profiles.is_active`, lalu ditukar dengan sesi proxy bertanda tangan HMAC (12 jam, kunci turunan khusus proxy). Setiap aksi Sheets wajib membawa sesi valid milik akun aktif (dicek ulang dengan cache 5 menit).

---

### ID Temuan: BUG-SEC-205-02
- **Lokasi Kode:** `supabase/functions/sheets-proxy/index.ts` (case `batchUpdate`)
- **Keparahan:** High (perluasan dampak bila sesi sah disalahgunakan)
- **Deskripsi:** `batchUpdate` meneruskan jenis request apa pun ke Google (`deleteSheet`, `deleteDimension`, `updateSheetProperties`, dst.), padahal aplikasi hanya memakai `repeatCell` untuk format sel (`mutations.ts`).
- **Dampak User:** Akun sah yang disalahgunakan, atau bug di klien, dapat menghapus tab tanggal atau baris data.
- **Mitigasi:** Allowlist jenis request `batchUpdate`: hanya `repeatCell`. Request lain ditolak `400 REQUEST_TYPE_NOT_ALLOWED`.

---

### ID Temuan: BUG-SEC-205-03
- **Lokasi Kode:** `supabase/functions/sheets-proxy/index.ts` (aksi `health`)
- **Keparahan:** Low (kebocoran informasi)
- **Deskripsi:** Endpoint `health` publik mengembalikan `client_email` service account dan diagnostik parsing kredensial.
- **Dampak User:** Memudahkan pengintaian (identitas service account yang punya akses edit ke semua spreadsheet).
- **Mitigasi:** `health` hanya mengembalikan `{ ok, configured }`.
