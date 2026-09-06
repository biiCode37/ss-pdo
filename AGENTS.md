# AI Agent Rules

## Dokumentasi Audit dan Refactor

Setiap audit kode atau refactor SS_PDO wajib didokumentasikan di `refactor-ss-pdo`.

1. Buat folder urutan baru: `refactor-ss-pdo/refact_N`.
2. Simpan `AUDIT_BUGS.md` berisi ID temuan, lokasi kode, keparahan, deskripsi, dampak user, dan mitigasi.
3. Simpan `REPAIR_REPORT.md` berisi implementasi, **Before vs After**, serta **Case: Skenario Lapangan** relevan untuk setiap perbaikan.
4. Jangan mengubah atau menghapus dokumentasi `refact_N` yang telah selesai. Revisi lanjutan wajib memakai folder urutan baru.
5. Dokumentasi wajib selesai sebelum audit/refactor dianggap selesai.

## Kebijakan Branch (Wajib `devmode`)

1. Seluruh pengerjaan fitur, debugging, audit, dan refactor **WAJIB** berada di branch `devmode`.
2. Jika branch `devmode` belum ada pada repositori/proyek, agent wajib membuatnya terlebih dahulu sebelum melakukan modifikasi file (`git checkout -b devmode`).
3. Agent dilarang keras menyentuh, mengakses, atau mengubah branch `main` / `master` / `production` kecuali ada instruksi eksplisit langsung dari pengguna.
