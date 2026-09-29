# Audit gangguan startup Vite `EPERM unlink`

Tanggal: 29 September 2026  
Branch: `devmode`  
Status: **TERATASI PADA SESI INI**

| ID | Lokasi | Keparahan | Deskripsi dan dampak pengguna | Mitigasi / hasil |
| --- | --- | --- | --- | --- |
| R132-01 | Proses dev server dan `node_modules/.vite/deps/package.json` | P1 untuk pengembangan lokal | Saat owner menjalankan `pnpm run dev`, Vite gagal `EPERM` ketika hendak mengganti cache dependensi. Pada waktu yang sama, server Vite yang saya jalankan untuk uji baca masih aktif. Proses bersamaan dapat mengunci berkas cache di Windows; penyebab lock tidak dapat dibuktikan sampai tingkat proses pemegang berkas, jadi ini dicatat sebagai penyebab paling mungkin. Owner tidak dapat membuka aplikasi lokal untuk uji manual. | Server uji saya dihentikan. Vite dijalankan ulang dari direktori proyek dan berhasil siap di `127.0.0.1:5173`; permintaan halaman mengembalikan HTTP 200. Server verifikasi kemudian dihentikan. Tidak perlu menghapus cache atau mengubah kode. |

## Bukti

- Pesan owner: `EPERM: operation not permitted, unlink 'D:\MINE\SS_PDO\node_modules\.vite\deps\package.json'`.
- Sebelum perbaikan, sesi Vite milik Codex masih aktif. Sesudah dihentikan, `node_modules/.bin/vite.cmd --host 127.0.0.1 --port 5173 --strictPort` menghasilkan `VITE v8.1.4 ready`.
- `Invoke-WebRequest http://127.0.0.1:5173/` menghasilkan status `200`.
- Setelah verifikasi, tidak ada listener pada port `5173` dari sesi Codex. Branch tetap `devmode`.

Jika `pnpm run dev` kembali gagal dengan pesan yang sama tanpa server paralel, perlu investigasi proses pemegang berkas atau izin filesystem. Jangan menghapus seluruh `node_modules` sebagai langkah pertama.
