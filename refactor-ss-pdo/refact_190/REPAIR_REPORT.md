# Repair report Input SS

Tanggal: 1 November 2026. Branch: `devmode`.

## Implementasi

1. **SS190-01:** DashboardHeader menyediakan slot untuk kontrol Input SS. Dashboard meneruskan target slot melalui DashboardContentTabs dan BusList. BusListHeader memakai portal agar state dan handler tetap di BusList, sementara DOM tanggal–Search/Filter berada dalam shell rute/profil yang sama. Target hanya dipakai ketika tab Input SS aktif; tab lain tidak menampilkan kontrol Input SS.
2. **SS190-02:** Pengukur tinggi pindah dari hook data ke DashboardHeader (`useLayoutEffect` + ResizeObserver). Setiap mount/remount diukur, perubahan tinggi diikuti, dan cleanup menghapus offset lama. CSS memakai satu sticky shell di `top: 0`, gutter responsif yang sama dengan app-container, header yang boleh wrap pada layar kecil, dan scroll margin berdasarkan tinggi shell utuh.
3. **SS190-03:** Hilangkan fallback warna mentah pada badge titik start A/B dan sesuaikan assertion ke token semantik langsung. Tampilan menggunakan token yang sama; tidak mengubah makna atau pilihan warna titik start.

## Before vs After

| Aspek | Before | After |
| --- | --- | --- |
| Parent kontrol | Rute/profil di header atas; tanggal–Filter pada kartu sticky terpisah | Seluruh kontrol berada dalam satu parent sticky |
| Scroll | Dua offset sticky dan Search sticky bertingkat | Satu shell tetap di atas; isi shell tidak bergeser sendiri |
| Superadmin dari Wilayah | Observer dapat tidak pernah terpasang | Header diukur saat masuk rute dan ketika kembali masuk |
| Ruang layar | Kartu kontrol memakai border, shadow, padding tambahan | Satu permukaan header dengan pemisah tipis dan Search lebih ringkas |
| Tab lain | Harus menghindari kebocoran kontrol dari portal | Kontrol kembali ke subtree tab yang tersembunyi; state pencarian bertahan |
| Scroll ke unit | Offset memperkirakan tambahan tinggi 160 px | Menggunakan tinggi seluruh header + 12 px |
| Tes badge | Dua assertion gagal karena parser fallback warna | Token langsung dapat diparsing dan kedua tes lulus |

## Case: Skenario Lapangan

- **PDO membuka Input SS:** rute, profil, tanggal/laporan, progres, kategori, pencarian, dan Filter berada pada permukaan header yang sama. Kartu pertama dimulai di bawah header.
- **Superadmin membuka rute dari Wilayah:** header baru dipasang dan diukur saat masuk. Kembali ke Wilayah lalu masuk lagi tetap mengukur tinggi aktual.
- **Petugas menggulir daftar:** rute/profil dan kontrol tetap bergerak sebagai satu blok. Pencarian tidak melayang sendiri di tengah daftar.
- **Petugas mencari satu unit lalu membuka Dashboard:** kontrol Input SS tidak bocor ke tab Dashboard. Kembali ke Input SS mempertahankan kata pencarian; Filter tetap berfungsi.
- **Layar sempit dan tema gelap:** diuji pada lebar 320, 360, 390, 768, dan 1440 px untuk kedua role dan tema; tidak ada overflow horizontal. Profil tetap berada dalam batas header.
- **Navigasi otomatis ke kartu:** `scrollIntoView()` pada kartu ke-11 menempatkan kartu di bawah shell yang aktual.
- **Badge Priok/IGI:** pemilihan token A/B tetap sama; normalisasi hanya menghapus fallback mentah yang tidak dibutuhkan.

## Verifikasi

- Uji regresi terarah: **21/21 lulus**.
- Uji badge + kontrak warna setelah normalisasi: **133/133 lulus**, termasuk **116/116 kontrak warna**.
- Browser Chromium: **20/20 kombinasi** role × tema × viewport lulus. Interaksi pencarian, Filter, perpindahan tab, remount dari Wilayah, dan scroll ke unit juga lulus.
- `pnpm vitest run src/`: **138 file, 1200/1200 tes lulus**, exit 0 (run akhir 13:13 WIB). Log masih memuat pesan dari test Google API/network dan teardown happy-dom; tidak ada test gagal.
- `pnpm run build`: **TypeScript dan Vite/PWA lulus, exit 0**, termasuk build ulang setelah normalisasi badge.
- `graphify update .`: **lulus, exit 0**; 6994 nodes, 8593 edges, 661 communities. `graph.json`, `graph.html`, dan `GRAPH_REPORT.md` diperbarui.
- Codebase-memory: full reindex selesai; coverage delapan file implementasi diperiksa ulang dan cocok dengan metadata source.
- `git diff --check`: **lulus, exit 0**.

## Bukti visual

Screenshot memakai komponen asli dengan data fixture, tanpa membaca atau menulis data produksi:

- [Superadmin terang](screenshots/superadmin-light.png)
- [Superadmin gelap](screenshots/superadmin-dark.png)
- [PDO terang](screenshots/pdo-light.png)
- [PDO gelap](screenshots/pdo-dark.png)

## Batasan

Belum diuji melalui login akun produksi atau perangkat fisik. Tidak dilakukan commit, push, atau deployment. Build memberi warning ukuran chunk lebih dari 500 kB; optimasi bundle di luar lingkup perbaikan layout ini.

Graphify menyelesaikan pembaruan dengan batasan: 28 file SQL tidak diparse karena `tree_sitter_sql` belum tersedia, tujuh file data menghasilkan nol node, 17 nama komunitas memakai fallback hub, dan enam node dari dua file yang masih ada dipertahankan secara fail-closed. Tidak ada klaim coverage penuh untuk SQL atau file data tersebut. Fixture browser sementara dan log/screenshot duplikat dibersihkan; empat screenshot bukti tetap disimpan pada folder laporan ini.
