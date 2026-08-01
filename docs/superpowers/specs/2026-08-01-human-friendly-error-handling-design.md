# Human-Friendly Error Handling & Sanitization Design

## Overview
Aplikasi SS_PDO sebelumnya menampilkan pesan kesalahan teknis (seperti `.env credentials missing`, `API Key missing`, `SQL/Network status codes`, stack traces) langsung ke layar antarmuka pengguna (*frontend*). Hal ini melanggar aturan proyek pada **AGENTS.md (Poin 6 & 7)**.

Dokumen ini mendefinisikan arsitektur terpusat untuk menyaring (*sanitize*) dan menerjemahkan error teknis menjadi pesan Bahasa Indonesia non-teknis yang ramah pengguna awam, sekaligus mempertahankan log teknis lengkap pada *developer console*.

---

## Requirements & Constraints
1. **Aturan AGENTS.md (Poin 6)**: Proteksi informasi teknis internal (variabel `.env`, kredensial API, nama kolom tabel internal, status code) dari pandangan user.
2. **Aturan AGENTS.md (Poin 7)**: Semua pesan kesalahan pada *frontend* wajib disajikan dalam bahasa non-teknis yang mudah difahami oleh pengguna awam.
3. **Developer Debugging**: Seluruh error asli beserta detail objek/stack trace wajib di-log ke `console.error` untuk kepentingan penelusuran oleh pengembang.
4. **Bahasa**: Selalu menggunakan Bahasa Indonesia yang sopan dan solutif.

---

## Component Design

### 1. `src/utils/errorFormatter.ts` [NEW]
Merupakan utilitas tunggal terpusat untuk sanitasi error.

**Fungsi Utama**:
- `formatUserError(error: unknown, fallbackMessage?: string): string | null`

**Peta Translasional Error**:
| Kategori Error Teknis | Keyword / Pattern Matching | Pesan Pengguna (Frontend) |
|---|---|---|
| **Konfigurasi System** | `credentials`, `.env`, `API Key`, `Client ID` | `"Layanan belum siap dikonfigurasi. Silakan hubungi admin operasional."` |
| **Login Interrupted** | `popup_closed_by_user`, `Login dibatalkan` | `null` *(reset state, bukan error fatal)* |
| **Login / Token Timeout** | `timeout`, `Token client`, `Identity Services` | `"Koneksi ke layanan autentikasi terganggu. Silakan coba lagi."` |
| **Koneksi Jaringan** | `Failed to fetch`, `NetworkError`, `offline` | `"Koneksi internet Anda terputus. Silakan periksa jaringan dan coba lagi."` |
| **Header Sheet Mismatch** | `No Body`, `Unit`, `kolom` | `"Format kolom pada tabel Google Sheets tidak sesuai. Mohon periksa kembali dokumen Anda."` |
| **Sheet Empty** | `Tidak ada data di sheet ini` | `"Tidak ditemukan data pada lembar kerja ini."` |
| **Akses Ditolak** | `403`, `PERMISSIONS_DENIED`, `hak akses` | `"Gagal mengakses Google Sheets. Pastikan akun Anda memiliki hak akses ke dokumen tersebut."` |
| **Fallback System** | Any unmapped error | Fallback custom atau `"Terjadi kendala sistem. Silakan coba lagi atau hubungi admin."` |

---

## Affected Files
1. **`src/utils/errorFormatter.ts` [NEW]**: Implementasi fungsi `formatUserError` beserta *unit test*.
2. **`src/utils/errorFormatter.test.ts` [NEW]**: Pengujian unit untuk memastikan seluruh pola error tersanitasi dengan benar.
3. **`src/App.tsx` [MODIFY]**: Mengganti penanganan `initError` teknis dengan `formatUserError`.
4. **`src/components/LoginScreen.tsx` [MODIFY]**: Mengganti percabangan `setError` hardcoded dengan `formatUserError(err)`.
5. **`src/components/Dashboard.tsx` [MODIFY]**: Mengganti pesan error pencarian/pembaruan sheet dengan `formatUserError(err)`.

---

## Verification Plan
1. **Unit Test**: Jalankan `pnpm test` (atau vitest/jest) untuk `errorFormatter.test.ts`.
2. **Typecheck & Build**: Jalankan `pnpm run build` untuk memverifikasi tidak ada error kompilasi TypeScript.
3. **Manual Verification**: Simulasi kegagalan login / jaringan offline / error kredensial dan pastikan pesan pada UI tampil dalam Bahasa Indonesia yang ramah pengguna tanpa kebocoran `.env` atau variabel teknis.
