# Audit Temuan Refact 57: Dekomposisi Layanan Otentikasi Google `googleSheets/auth.ts` (~569 baris)

Dokumen audit ini mencatat analisis arsitektural dan dekomposisi terhadap modul otentikasi Google Sheets `src/services/googleSheets/auth.ts` yang memuat logika pemuatan skrip eksternal GAPI & GIS, inisialisasi client token OAuth2, trigger popup login/logout, siklus masa berlaku token di localStorage, timer penyegaran otomatis proaktif, dan validasi sesi saat cold start.

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF57-ARCH-001: God File Service `src/services/googleSheets/auth.ts` (569 baris)

- **Lokasi Kode**: `src/services/googleSheets/auth.ts` (569 baris)
- **Tingkat Keparahan**: **MEDIUM-HIGH** (Separation of Concerns & Maintainability)
- **Deskripsi Masalah**:
  Modul `auth.ts` memikul dua domain tanggung jawab yang berbeda:
  1. **Injeksi & Manajemen Google Identity Services (GIS) / GAPI**:
     - Memuat skrip CDN eksternal `apis.google.com/js/api.js` dan `accounts.google.com/gsi/client`.
     - Mengelola instance `tokenClient` Google OAuth2.
     - Menangani alur interaktif popup `signIn()` dan revocation token pada `signOut()`.
  2. **Manajemen Sesi & Siklus Hidup Token**:
     - Menyimpan dan memvalidasi token sesi di `localStorage` (`PDO_IS_SIGNED_IN`, `GAPI_ACCESS_TOKEN`, `PDO_USER_EMAIL`).
     - Menyegarkan token secara senyap di latar belakang (*silent token refresh*).
     - Menjadwalkan timer penyegaran 5 menit sebelum kedaluwarsa (`startTokenRefreshTimer`).
     - Melakukan pengecekan status login asinkron saat startup aplikasi (`checkSignedInAsync`).
     - Membungkus eksekusi API dengan penanganan auto-retry auth (`withAuthRetry`).

- **Dampak User & Pengembang**:
  - Berkas yang panjang menyulitkan isolasi masalah ketika terjadi error network atau perubahan kebijakan Google GIS SDK.
  - Siklus hidup token bercampur dengan pemuatan library DOM eksternal.

- **Mitigasi**:
  Dekomposisi ke dalam submodul di `src/services/googleSheets/`:
  1. **`authGis.ts`** (~220 baris):
     - Mengisolasi injeksi skrip GAPI/GIS, inisialisasi `tokenClient`, `signIn`, dan `signOut`.
  2. **`authSession.ts`** (~270 baris):
     - Mengisolasi pengelolaan token di storage, silent token refresh, `checkSignedInAsync`, `startTokenRefreshTimer`, dan `withAuthRetry`.
  3. **`auth.ts`** (~25 baris):
     - Bertindak sebagai facade re-export bersih dengan 100% backward compatibility (*Zero Breaking Change*).
  4. **Pengujian Unit Mandiri**:
     - Memperluas `src/services/googleSheets/auth.test.ts` (7 pengujian lulus 100%).
