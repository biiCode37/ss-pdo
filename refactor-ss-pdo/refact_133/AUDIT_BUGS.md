# Audit lanjutan `EPERM unlink` cache Vite

Tanggal: 29 September 2026  
Branch: `devmode`  
Status: **TERATASI SETELAH REGENERASI CACHE; SIAP UJI MANUAL OWNER**

| ID | Lokasi | Keparahan | Deskripsi dan dampak pengguna | Mitigasi / hasil |
| --- | --- | --- | --- | --- |
| R133-01 | `node_modules/.vite/deps/`, terutama `package.json` dan `@supabase_supabase-js.js.map` | P1 untuk pengembangan lokal | Menghentikan server paralel saja tidak cukup: percobaan owner berikutnya tetap gagal `EPERM` saat Vite ingin menghapus berkas cache lama. `vite.config.ts` telah berubah sejak cache bertanggal 27 September 2026 dibuat, sehingga optimasi ulang memang diperlukan. Penyebab spesifik penolakan `unlink` oleh Windows tidak terbukti; ACL berkas/direktori menampilkan izin `Modify`, sehingga tidak tepat menyebutnya semata-mata masalah permission permanen. | **Teratasi dalam sesi Codex** dengan `vite --force` yang membangun ulang cache lewat mekanisme Vite sendiri. Metadata dan sourcemap cache kini bertanggal 29 September 2026. Setelah itu script `dev` melalui PNPM berhasil dimulai dua kali tanpa `EPERM`. Tidak ada kode atau dependensi yang diubah/dihapus. |

## Bukti pembeda dari `refact_132`

- Setelah server Codex dihentikan, owner masih melihat `EPERM` pada berkas lain. Jadi hipotesis sebelumnya (hanya benturan server paralel) tidak memadai.
- `vite.config.ts` memuat perubahan belum di-commit yang menambah konfigurasi Vitest; cache dependensi sebelumnya masih bertanggal 27 September.
- `node_modules/.bin/vite.cmd --force --host 127.0.0.1 --port 5173 --strictPort` berhasil dan memperbarui `node_modules/.vite/deps/_metadata.json` serta `@supabase_supabase-js.js.map` pada 29 September pukul 21:24.
- `pnpm.cmd run dev` dari instalasi PNPM proyek berhasil mencapai `VITE v8.1.4 ready` **dua kali** setelah cache diperbarui.
- Perintah persis `pnpm run dev` dengan executable PNPM yang dipilih shell pengguna juga berhasil dijalankan di luar pembatasan sandbox Codex dan mencapai `VITE v8.1.4 ready`.

Jika terminal Git Bash owner masih mengalami error, proses pengunci berkas yang khusus pada sesi owner perlu diidentifikasi. Jangan menghapus seluruh `node_modules`.
