# Roadmap perapihan SS_PDO — Codex / Gemini

Tanggal: 27 September 2026. Branch: `devmode`.

## Tujuan dan pembagian tugas

Menata codebase agar tanggung jawab mudah dipahami, komponen yang berulang dapat dipakai bersama, dan pengalaman pengguna konsisten. Ukuran keberhasilan adalah kriteria terukur di bawah. Istilah “100%” berarti seluruh ruang lingkup yang disepakati telah diperiksa dan memenuhi kriteria tersebut; tidak menyatakan perangkat lunak bebas bug selamanya atau memiliki sertifikasi industri tertentu.

| Peran | Tanggung jawab |
| --- | --- |
| Project owner | Menentukan kebutuhan produk, meneruskan paket tugas ke Gemini, dan menilai perubahan pengalaman pengguna yang memerlukan keputusan produk. |
| Codex — orchestrator | Audit awal, prioritas, batas perubahan, kontrak arsitektur, paket tugas, pemeriksaan diff dan bukti pengujian, keputusan lulus/revisi setiap fase. |
| Antigravity / Gemini — executor | Memvalidasi kondisi terbaru, menjalankan paket fase aktif, mengimplementasikan perubahan yang ditugaskan, menguji, dan menulis laporan beserta bukti. |

Serah tugas menggunakan file di proyek. Pengiriman instruksi dilakukan project owner. Status saat dokumen dibuat: **paket Fase 1 siap diteruskan; belum ada hasil eksekusi Gemini yang diterima**.

## Baseline yang sudah diperiksa

- React + TypeScript strict + Vite; styling menggunakan CSS global, CSS variables, dan inline styles. Vitest sudah tersedia. Sumber: `package.json`, `tsconfig.app.json`, `src/index.css`.
- 244 file sumber TS/TSX dan 74 file test TS/TSX. Inventory dan SHA256: `evidence/source-inventory.csv`.
- `src/index.css`: 2.165 baris fisik. Ditemukan 1.472 kemunculan `style={` pada komponen TSX di luar test. Angka ini indikator area pemeriksaan, bukan jumlah bug atau target wajib nol.
- Hotspot: `useBusInputForm.ts` 969 baris; `MonitoringRouteDetailModal.tsx` 830; `BusInputModalSingleFocus.tsx` 805; `MonitoringFleetStatusTab.tsx` 700; form Shift 1/2 masing-masing 498/499.
- Sudah ada folder per fitur, kamus teks, helper domain, skeleton, dan facade re-export. Infrastruktur yang bermanfaat ini menjadi dasar perapihan.
- Snapshot HEAD dan perubahan lokal: `evidence/baseline.json`. HEAD saja tidak merepresentasikan working tree yang diuji.
- `graphify-out/GRAPH_REPORT.md` menyebut commit `67c14813`, berbeda dari HEAD saat audit. Graf dipakai sebagai petunjuk navigasi dan diverifikasi dengan sumber terkini.
- Roadmap lama di `roadmap-to-production-grade/` masih menyebut tidak adanya Vitest dan strict mode. Klaim itu sudah berbeda dari kondisi saat ini; gunakan bukti terkini untuk pekerjaan ini.

## Fase dan gerbang kelulusan

| Fase | Fokus / keluaran | Syarat lulus | Status awal |
| --- | --- | --- | --- |
| 0 | Codex: baseline, temuan awal, roadmap, paket Gemini | Dokumen dan bukti pemeriksaan awal tersedia; batas audit dijelaskan | Selesai untuk audit awal; status pengujian tercatat di REPAIR_REPORT |
| 1 | Gemini: inventaris menyeluruh, peta pemanggil, kontrak komponen, matriks skenario | Seluruh komponen terklasifikasi; temuan punya bukti; kandidat reuse punya pemakai nyata; Codex menerima rancangan | Siap diserahkan |
| 2 | Fondasi UI minimum dan pilot penggunaan bersama | Perbaikan domain yang terkonfirmasi diuji terpisah; primitive kecil dipakai minimal dua konsumen; pilot lolos pemeriksaan perilaku dan visual | Menunggu Fase 1 |
| 3 | Form input bus dan logika interaksinya | State, kalkulasi, validasi, submit, dan tampilan punya batas jelas; seluruh skenario odometer/shift/offline tetap benar | Menunggu Fase 2 |
| 4 | Monitoring dan laporan | Modal, metrik, filter, kartu dan status memakai kontrak yang disepakati; presisi dan istilah domain benar | Menunggu Fase 3 |
| 5 | Fitur lain serta penyelesaian struktur/CSS | Semua keluarga UI tersisa diperiksa; migrasi pemanggil tuntas; kode mati terbukti sebelum dihapus; import dan kepemilikan file jelas | Menunggu Fase 4 |
| 6 | Verifikasi akhir dan panduan pemeliharaan | Semua kriteria selesai dipenuhi; bukti lengkap; Codex menyelesaikan review akhir dan owner menilai hasil UX | Menunggu Fase 5 |

### Fase 1 — audit lengkap dan kontrak

Paket aktif ada di `GEMINI_PHASE_01.md`. Periksa seluruh `src/components/`, `App.tsx`, hooks, CSS, kamus, dan helper yang dipakai UI. Inventaris juga menandai batas services, tanpa memperluas pekerjaan menjadi migrasi backend.

Klasifikasikan: halaman/orchestrator fitur, bagian fitur, primitive lintas fitur, hook, helper murni, facade kompatibilitas, dan kandidat tak terpakai. Catat pemanggil nyata, tanggung jawab, state, gaya, teks, serta skenario yang perlu dijaga. Telusuri import; kemiripan nama tidak membuktikan duplikasi atau dead code.

### Fase 2 — fondasi minimum dengan pilot

Paket implementasi diterbitkan setelah hasil Fase 1 direview. Urutan yang disarankan:

1. Perbaiki fallback ritase yang terkonfirmasi, dalam perubahan terpisah dengan tes trip ganjil, genap, nol, dan prioritas nilai sumber. Telusuri pemanggil dan format tampilan terkait sebelum menutup temuan.
2. Ambil token yang memang berulang dari sistem warna/tema yang sudah ada. Tetapkan spacing, radius, ukuran kontrol, fokus, layer modal, dan motion yang dibutuhkan konsumen pilot.
3. Pilot penggunaan bersama pada pola input Shift 1/2: label, hint/error, style input, tombol pilihan jika kontraknya sama. Masing-masing fitur tetap memiliki aturan shift sendiri.
4. Bangun komponen umum lain hanya saat ada kebutuhan yang terbukti. Kandidat awal: Button/IconButton, FormField, feedback/empty state, dan kerangka modal. Daftar ini bukan kewajiban membuat semuanya sekaligus.

API primitive memakai props kecil dan eksplisit. Komponen yang hanya meneruskan seluruh props tanpa menambah kontrak tidak perlu dibuat. Kerangka modal memerlukan pengujian fokus, Escape, tombol kembali, scroll lock, modal bertumpuk, dan keyboard mobile sebelum migrasi luas.

### Fase 3 — input bus

Prioritas: `useBusInputForm`, `BusInputModalSingleFocus`, Shift 1/2, dan shell `BusInputModal`. Susun ulang berdasarkan tanggung jawab nyata: state draft, derivasi domain murni, validasi/payload, serta interaksi fokus dan submit. Pakai helper domain yang sudah tersedia. Hindari dua sumber state untuk nilai yang sama.

Setiap bagian tampilan menerima data dan handler yang diperlukan, tanpa ketergantungan pada keseluruhan hasil hook. Buktikan single-column mode, input lengkap, Enter-to-save, prefill tiga digit, pergantian bus/tanggal, rollover, pembatalan, gagal simpan, dan antrean offline. Perubahan aturan bisnis harus dicatat tersendiri.

### Fase 4 — monitoring dan laporan

Mulai dari modal detail rute dan status armada, lalu kartu, filter, KPI, dan laporan WA/PDO. Pisahkan perhitungan/fallback dari rendering bila tanggung jawab sudah bercampur. Tentukan sumber nilai dan pemformatan yang konsisten. Komponen kartu yang berbeda kebutuhan boleh tetap terpisah; gunakan bersama bagian yang kontraknya benar-benar sama.

Koordinasikan file monitoring yang sudah berubah lokal sebelum menyunting. Verifikasi perilaku per role dan status draft/submitted/verified, loading, error, data kosong, dan filter tanpa hasil.

### Fase 5 — cakupan tersisa dan struktur

Selesaikan dashboard, route selector, bus list, fleet status, profil, user management, login, accumulation, detail unit, tren, dan laporan. Gunakan hasil inventory Fase 1 sebagai daftar cakupan resmi, termasuk file baru selama migrasi.

Pisahkan CSS menurut kepemilikan setelah primitive stabil. Pertahankan urutan cascade dan tema. Pindahkan facade atau hapus export lama hanya setelah seluruh pemanggil ditelusuri dan dimigrasikan. Jangan menyamakan keberadaan facade kecil dengan god file.

### Fase 6 — penyelesaian dan pencegahan pengulangan

Lakukan review seluruh temuan dan pemanggil, lalu satu putaran lengkap lint, test, build, pemeriksaan visual/interaksi, dan pembaruan graf sesuai aturan proyek. Buat panduan ringkas cara memilih komponen, menambahkan teks, dan menempatkan logika. Otomasi pemeriksaan tambahan harus menutup risiko nyata yang masih tersisa; gunakan tool yang sudah tersedia terlebih dahulu.

## Arah struktur yang sederhana

Pertahankan `src/components/<fitur>/`, `src/hooks/`, `src/services/`, `src/utils/`, dan `src/constants/texts/`. Tambahkan `src/components/ui/` hanya untuk komponen lintas fitur yang sudah memiliki konsumen nyata. CSS fitur berada dekat fitur; CSS global berisi fondasi yang memang global. Pemisahan `src/styles/` dapat dilakukan saat migrasi CSS, dengan entry point dan urutan impor eksplisit.

- Primitive UI tidak mengimpor services, model operasional bus, atau komponen fitur.
- Komponen fitur boleh menggunakan primitive dan helper domain; helpers/services tidak mengimpor komponen tampilan.
- Hook khusus satu fitur tetap di fitur itu; `src/hooks/` menampung perilaku lintas fitur yang benar-benar dipakai bersama.
- Jangan menambah layer `repository`, `manager`, `factory`, registry komponen, provider global, atau form builder demi struktur semata.
- Tidak diperlukan migrasi framework, monorepo, library UI baru, atau Storybook untuk menyelesaikan program ini. Penambahan dependency memerlukan masalah konkret dan penjelasan manfaat/biayanya.
- Pecah file karena batas tanggung jawab. Ambang 400–500 baris pada aturan proyek menjadi pemicu review/dekomposisi, bukan alasan membuat puluhan fragmen tanpa makna. Test, kamus, dan generated files dinilai sesuai fungsinya.
- Inline style untuk nilai dinamis seperti tinggi grafik atau viewport boleh tetap dipakai. Aturan visual statis yang berulang dipusatkan sesuai kepemilikannya.
- Pertahankan bahasa visual aplikasi operasional, warna status domain, dua tema, dan prioritas mobile. Perubahan font, ikon, atau animasi dekoratif tidak diperlukan untuk tujuan reusable.

## Definisi selesai yang dapat diperiksa

1. **Cakupan:** 100% file komponen pada inventory terbaru diperiksa; setiap fitur punya pemilik, titik masuk, dan kontrak import yang jelas.
2. **Temuan:** semua temuan wajib dalam scope ditutup dengan lokasi perbaikan dan bukti. Deferred/blocked tetap terlihat dan tidak dihitung selesai. Perubahan scope hanya melalui keputusan owner yang tercatat.
3. **Modularitas:** setiap hotspot punya tanggung jawab yang jelas; file komponen/service mendekati 400–500 baris telah didekomposisi sesuai aturan proyek; tidak muncul god hook pengganti god component.
4. **Reuse:** seluruh pemanggil pola yang ditetapkan untuk migrasi sudah berpindah; variasi domain yang disengaja tercatat. Tidak ada komponen umum spekulatif tanpa pemakai.
5. **Teks/domain:** teks UI berada di kamus dan tambahan teks diuji; ritase PP = total trip / 2, `km_baku` adalah jarak PP; angka sumber tidak dibulatkan sepihak.
6. **Pengalaman pengguna:** loading, empty, error/retry, disabled, saving/success tersedia sesuai relevansi. Kedua tema, layar kecil, keyboard, fokus, dan navigasi kembali diperiksa dengan bukti.
7. **Regresi:** test relevan dan seluruh suite lulus, build strict lulus, lint tidak memiliki error dan tidak menambah warning. Warning aplikasi yang masuk backlog program diselesaikan; warning tooling di luar aplikasi dicatat terpisah.
8. **Kinerja:** ukuran bundle dibandingkan dengan baseline dan runtime diperiksa untuk regresi nyata; peningkatan jumlah abstraksi tidak boleh menjadi alasan menambah beban tanpa manfaat. Warning bundle tetap terlihat sampai diperbaiki atau keputusan scope tercatat.
9. **Dokumentasi:** setiap batch memiliki `AUDIT_BUGS.md`, `REPAIR_REPORT.md`, Before vs After, Case: Skenario Lapangan, perintah/hasil verifikasi, dan catatan batas pengujian.

## Cara berkoordinasi

1. Owner meneruskan file paket fase aktif ke Gemini.
2. Gemini membuat `refact_N` baru dengan nomor maksimum saat mulai + 1. Dokumentasi selesai tidak ditimpa. Cantumkan paket asal dan status `READY_FOR_REVIEW`, `BLOCKED`, atau `IN_PROGRESS` pada laporan baru.
3. Gemini menyelesaikan satu paket dan melaporkan path hasil, daftar perubahan, bukti, serta bagian yang belum terverifikasi.
4. Owner meneruskan lokasi laporan ke Codex. Codex membaca kode/diff dan menjalankan pemeriksaan yang diperlukan, lalu menulis keputusan `PASS` atau `REVISE` pada folder audit berikutnya.
5. Fase berikutnya dimulai melalui paket baru setelah review. Tidak ada klaim pengiriman otomatis atau hasil kerja Gemini sebelum benar-benar diterima.

Semua pekerjaan berlangsung di `devmode`. Perubahan lokal awal harus dipertahankan dan diperhitungkan. Jangan reset/stash/clean massal. Push `devmode` hanya atas instruksi eksplisit owner sesuai aturan proyek. Perubahan data operasional, akses rahasia, deployment, dan migrasi database tidak termasuk paket ini.
