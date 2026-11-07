# REPAIR REPORT: REFACTOR 205
**Modul:** Edge Function `sheets-proxy`, transport Google Sheets frontend
**Tanggal:** 06 November 2026
**Status:** Kode selesai, 4 gate lulus. Deploy wajib berurutan: **(1) frontend via PA, lalu (2) Edge Function `sheets-proxy` oleh pemilik.** Jika urutannya terbalik, bundle lama tidak mengirim sesi dan semua akses Sheets ditolak 401.

---

## 1. Implementasi Perbaikan

### A. Otorisasi Pemanggil (`supabase/functions/sheets-proxy/index.ts`) — BUG-SEC-205-01
- Aksi baru `session`: header `x-google-token` diverifikasi ke `https://www.googleapis.com/oauth2/v3/userinfo` (cache 5 menit per token), email harus `user_profiles.is_active = true` (`eq`, karena email tersimpan lowercase). Respons: `{ sessionToken, expiresAt }`.
- Sesi = `base64url(payload{email, exp, scope:"sheets-proxy"}).HMAC-SHA256`, berlaku 12 jam. Kunci HMAC = `SUPABASE_SERVICE_ROLE_KEY + ":sheets-proxy-session"`, sehingga token sesi admin-action dan sheets-proxy tidak saling diterima.
- Semua aksi selain `health` dan `session` wajib membawa header `x-proxy-session` yang valid (tanda tangan, scope, belum kedaluwarsa) dan milik akun yang masih aktif (cache 5 menit). Jika tidak, ditolak `401 PROXY_SESSION_INVALID`. Pengecekan lama "ada header apa pun" dihapus.
- CORS: `x-proxy-session` ditambahkan ke daftar header yang diizinkan.
- ponytail: sesi 12 jam dipilih agar PDO tidak diminta login ulang tiap token Google (1 jam) habis, karena mode service account memang tidak memperpanjang token Google secara proaktif.

### B. Allowlist `batchUpdate` — BUG-SEC-205-02
- `ALLOWED_BATCH_UPDATE_REQUESTS = {"repeatCell"}`. Setiap request harus berupa objek dengan tepat 1 kunci yang ada di allowlist; selain itu ditolak `400 REQUEST_TYPE_NOT_ALLOWED`.

### C. `health` Minimal — BUG-SEC-205-03
- Hanya `{ ok, configured }`. `client_email` dan blok diagnostik parsing kredensial dihapus.

### D. Frontend (`src/services/googleSheets/transport.ts`, `authGis.ts`)
- `getProxySession()`: memakai sesi tersimpan (`localStorage.PDO_SHEETS_PROXY_SESSION`, diperbarui bila sisa < 5 menit), atau menukar `getGoogleAccessToken()` lewat aksi `session`. In-flight guard: panggilan paralel berbagi satu penukaran. Penukaran yang gagal non-401 menunggu 60 detik sebelum dicoba lagi (aman saat transisi ke proxy versi lama).
- `invokeSheetsProxyWithRetry`: mengirim `x-proxy-session`. Saat 401, sesi dibuang dan diperbarui **sekali**, lalu permintaan diulang. Jika token Google tidak tersedia, event `google-auth-expired` dipicu dan prompt re-auth yang sudah ada muncul. Penanganan 401 diletakkan sebelum deteksi rate-limit agar tidak diulang dengan backoff.
- `signOut` menghapus sesi proxy tersimpan.

### E. Test (`transport.test.ts`, kini happy-dom)
- Penukaran sesi terjadi **tepat 1×** untuk 2 pembacaan; header `x-google-token` hanya dikirim ke aksi `session`; kedua `values.get` membawa `x-proxy-session`.
- 401 dengan sesi lama → sesi diperbarui → permintaan diulang dengan sesi baru (`['OLD','NEW']`).
- 401 tanpa token Google → `google-auth-expired` dipicu 1×, tanpa pengulangan.

---

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| Syarat memanggil proxy | Header apa pun (`apikey: x`) | Sesi bertanda tangan dari token Google akun `user_profiles` aktif |
| Akun dinonaktifkan | Tetap bisa (tidak dicek) | Tertolak ≤ 5 menit |
| Jenis `batchUpdate` | Semua (termasuk `deleteSheet`) | Hanya `repeatCell` |
| `health` | Membocorkan `client_email` + diagnostik | `{ ok, configured }` |
| Panggilan ekstra per pengguna | 0 | 1 penukaran sesi per 12 jam (+1 userinfo Google di server) |

---

## 3. Case: Skenario Lapangan

### Case BUG-SEC-205-01: Pihak luar mengetahui URL proxy
- **Situasi:** URL `…/functions/v1/sheets-proxy` terlihat di tab Network browser siapa pun yang membuka aplikasi, dan ID spreadsheet bisa dibaca dari `route_sheets`.
- **Before:** Cukup `curl` dengan header palsu untuk membaca seluruh isi 18 spreadsheet atau menimpa TOA/KM di sheet tanggal mana pun.
- **After:** Tanpa token Google milik akun terdaftar dan aktif, semua aksi ditolak 401.

### Case BUG-SEC-205-02: Bug klien atau akun disalahgunakan
- **Situasi:** Request `batchUpdate` berisi `deleteSheet` untuk tab tanggal berjalan.
- **Before:** Tab terhapus memakai service account.
- **After:** Ditolak `400 REQUEST_TYPE_NOT_ALLOWED`; hanya format sel yang diteruskan.

### Case transisi: PDO memakai app saat token Google habis
- **Situasi:** PDO sudah membuka aplikasi lebih dari 1 jam (token Google kedaluwarsa), lalu menyimpan input.
- **After:** Sesi proxy (12 jam) masih berlaku, jadi penyimpanan langsung jalan. Bila sesi habis, aplikasi menukar ulang secara diam-diam lewat silent refresh GIS; jika gagal, prompt masuk ulang yang sudah ada muncul.

---

## 4. Verifikasi

| Gate | Status | Hasil |
|---|---|---|
| 1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` | Lulus | 116/116 tes |
| 2. `pnpm vitest run src/` | Lulus | 145 file, 1.310/1.310 tes (+3 tes transport) |
| 3. `pnpm run build` (`tsc -b` + Vite) | Lulus | exit 0 |
| 4. `graphify update .` | Lulus | Graf diperbarui |
| Tambahan: `deno check supabase/functions/sheets-proxy/index.ts` | Lulus | Deno 2.9.3 |

### Verifikasi Produksi (6 Nov 2026, setelah PA `5cff3ed` dan deploy `sheets-proxy` v3 oleh pemilik)

Probe dari luar:

| Uji | Hasil |
|---|---|
| `spreadsheets.get` dengan `apikey: x` (sebelumnya 200 + judul spreadsheet) | **401** `PROXY_SESSION_INVALID` |
| `values.get` dengan `x-proxy-session` palsu | **401** `PROXY_SESSION_INVALID` |
| `session` dengan `x-google-token` palsu | **401** `GOOGLE_AUTH_REQUIRED` |
| `health` | `{"ok":true,"configured":true}` (tanpa `client_email`) |

Log `function_edge_logs` dan `activity_logs`:
- Perangkat pemilik (15:24 UTC): `health` 200 → `session` 200 (269 ms) → baca Sheets 200 → `UPDATE_BUS_DATA` / `UPDATE_BULK_BUS_DATA` JAK.115 tercatat (15:25).
- Ponsel Android petugas: 401 berpola bundle lama (retry 1,5 dtk / 3 dtk) pukul 15:12. Setelah aplikasi dimuat ulang, 15:13:40 menerima 401 → `session` 200 → rangkaian baca 200, lalu simpan JAK.15 berhasil (15:21–15:22 UTC). Ini membuktikan alur pembaruan sesi saat 401 bekerja.
- `POST /rest/v1/daily_unit_summaries` sejak 15:13: 40× **200**. Upsert pasca-refact_204 juga terbukti berjalan dari aplikasi sungguhan.
- Masih ada 1 perangkat (IP `114.10.x`) dengan pola 401 bundle lama pukul 15:21 UTC; perangkat itu perlu memuat ulang aplikasi.

**Belum diverifikasi:** aksi format sel (`batchUpdate` + allowlist `repeatCell`) dari aplikasi, dan penolakan request non-`repeatCell` dengan sesi sah, karena keduanya tidak diuji dari luar tanpa sesi sah.
