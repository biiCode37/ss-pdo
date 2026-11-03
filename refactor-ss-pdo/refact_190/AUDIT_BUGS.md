# Audit Input SS: satu pembungkus header

Tanggal: 1 November 2026. Branch: `devmode`.
Lingkup: header rute/profil, kontrol Input SS, posisi sticky, dan regresi visual PDO/Superadmin. Perubahan lokal yang sudah ada dipertahankan.

| ID | Lokasi kode | Keparahan | Deskripsi | Dampak user | Mitigasi |
| --- | --- | --- | --- | --- | --- |
| SS190-01 | `src/components/dashboard/DashboardHeader.tsx`, `src/components/busList/BusListHeader.tsx`, `src/index.css` | Tinggi | Identitas/rute dan kontrol Input SS memiliki parent sticky terpisah. Panel kontrol memiliki kartu sendiri; Search juga sticky di dalamnya. | Header tampak terpisah; saat scroll kontrol dapat melayang di atas daftar bus. | Render kontrol ke slot DOM di dalam DashboardHeader menggunakan portal. Hanya shell utama yang sticky; hilangkan kartu dan sticky bertingkat. |
| SS190-02 | `src/components/dashboard/useDashboardData.ts` | Tinggi | Effect pengukur header hanya berjalan pada mount hook. Saat awal Superadmin berada di Wilayah, ref header belum terpasang. Effect tidak terpasang ulang ketika masuk rute. Offset global juga tidak dibersihkan. | Jarak sticky dapat memakai fallback atau tinggi lama, terutama setelah perpindahan view. | Pindahkan ResizeObserver ke lifecycle DashboardHeader dan bersihkan observer serta CSS variable ketika header unmount. Sesuaikan scroll margin kartu dengan tinggi header terpadu. |
| SS190-03 | `src/components/busCard/BusCard.tsx`, `src/components/busCard/BusCard.test.tsx` | Rendah | Dua tes badge pada perubahan lokal sebelumnya gagal: parser happy-dom mengosongkan `style.color` untuk `var()` dengan fallback hex. Reproduksi terisolasi mengonfirmasi penyebab tersebut. | Menghalangi verifikasi suite penuh; fallback warna mentah juga tidak diperlukan karena token sudah tersedia. Ini bukan bukti bug warna pada browser nyata. | Gunakan token semantik langsung untuk warna, latar, dan border badge A/B; pertahankan pemeriksaan token dalam tes. |

## Bukti dan cakupan

- Codebase-memory: proyek `D-MINE-SS_PDO`, root `D:/MINE/SS_PDO`, branch `devmode`, watcher aktif. Coverage seluruh file terkait diperiksa dan source dibaca langsung. Tidak ada gap tercatat pada file yang dipakai sebagai bukti; hasil graf tetap bersifat best effort.
- Tiga tes regresi baru gagal sebelum perbaikan: kontrol tidak berada di header untuk PDO/Superadmin, dan pengukuran header tidak berjalan saat header baru mount setelah Wilayah. Setelah perbaikan semuanya lulus.
- Reproduksi parser: `style.color = 'var(--color-warning-fg, #d97706)'` menghasilkan string kosong di happy-dom; bentuk tanpa fallback dipertahankan.
- Pemeriksaan browser menggunakan komponen asli dan data fixture lokal, bukan sesi akun produksi.

## Batas dampak mutasi

Tidak ada perubahan payload Google Sheets, kolom input/rumus, kalkulasi ritase, layanan penyimpanan, otorisasi, atau RLS. State pencarian/filter tetap dimiliki BusList. Tidak ada dependency atau teks UI baru. Tidak ada perubahan pengaturan tema; alur `syncThemeChrome()` yang ada tetap digunakan oleh aplikasi.
