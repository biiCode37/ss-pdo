# Audit Codex — Fase 3 Batch 3.3

**Branch:** `devmode`  
**Keputusan:** `PASS` untuk Batch 3.3; Batch 3.4 dapat dimulai.  
**Objek review:** kode, tes, dan bukti Gemini di `refact_113`.

## R112-01 — Pesan KM pair memakai angka lama setelah rollover: CLOSED

- **Lokasi kode:** `src/components/busCard/modal/useBusInputForm.ts:268-314`; `src/components/busCard/modal/busInputValidation.ts:124-298`.
- **Keparahan awal:** Rendah.
- **Deskripsi:** Setelah KM Awal berubah karena rollover, pesan error KM pair sempat menyebut angka sebelum koreksi.
- **Dampak user awal:** Petugas membaca angka acuan yang usang saat memperbaiki KM Akhir.
- **Mitigasi terverifikasi:** Handler memakai target shift eksplisit, menghitung nilai KM sesudah rollover, lalu memanggil ulang validator murni. Tes `useBusInputForm.test.tsx:821-878` membuktikan angka pesan berubah dari `292003` ke `293003`, error lintas hari hilang, dan error KM pair tetap tampil. Tes TOA campuran dan target shift yang sama tetap lulus.

## R114-01 — Literal UI pada Single Focus: TRACKED Batch 3.4

- **Lokasi kode:** `src/components/busCard/modal/BusInputModalSingleFocus.tsx:142,149,228,235,290,387,394,505,541,649,656,767`.
- **Keparahan:** Sedang untuk konsistensi UI dan kepatuhan kamus teks; bukan perubahan Batch 3.3.
- **Deskripsi:** Label chip manual/catatan/KM, aksi salin, dan fallback tanggal masih berupa string langsung di komponen. File UI ini juga masih sekitar 800 baris.
- **Dampak user:** Copy dan terjemahan antar tampilan berpotensi tidak konsisten; pemeliharaan form sulit dan rawan beda perilaku.
- **Mitigasi:** Ekstraksi per kelompok TOA, KM, dan catatan pada Batch 3.4. Pindahkan semua literal UI ke `src/constants/texts/` dan tambah tes `texts.test.ts`. Pertahankan urutan fokus, chip, copy, dan tema mobile.

## R114-02 — Klaim dokumentasi validasi trip Single Focus terlalu luas: TRACKED sebagai errata

- **Lokasi dokumen:** `refactor-ss-pdo/refact_113/AUDIT_BUGS.md`, bagian 2.1; kode `src/components/busCard/modal/busInputValidation.ts:124-221` dan `src/utils/modals/busInput/busModalTypes.ts:48-82`.
- **Keparahan:** Rendah (akurasi dokumentasi, tidak ada jalur UI yang terdampak).
- **Deskripsi:** Laporan menyebut validator memvalidasi kategori trip dalam Single Focus. Cabang `isSingleMode` belum menangani trip, tetapi `SINGLE_COLUMN_META` memang tidak memasukkan kategori trip sehingga UI trip selalu memakai mode All dan validasinya ada di sana.
- **Dampak user/tim:** Pembaca laporan dapat mengira ada kontrak validasi Single Focus trip yang sebenarnya tidak dapat diakses dari UI.
- **Mitigasi:** Catat klarifikasi ini dalam laporan review baru; jangan mengubah arsip `refact_113`. Jika cakupan kategori Single Focus berubah di kemudian hari, tambah validasi trip dan tes sebelum membuka jalur tersebut.

## Gerbang review independen

- Branch tetap `devmode`; arsip lama tidak diubah.
- `vitest run src/` lewat binary lokal proyek: **86 berkas, 650 tes lulus**, exit 0. Happy DOM mencetak kegagalan memuat skrip Google eksternal pada lingkungan tes, tanpa kegagalan tes.
- `tsc -b`: exit 0. `vite build`: exit 0, termasuk artefak PWA; peringatan ukuran chunk tidak terkait Batch 3.3.
- `oxlint` terarah pada modul validasi, payload, hook, sub-hook, dan tes terkait: exit 0.
- Launcher `pnpm` pada lingkungan review ini gagal lebih awal karena `EPERM` membaca path profil Windows; binary lokal di `node_modules/.bin` menjalankan perintah ekuivalen. Bukti Gemini sendiri mencatat `pnpm run test src/` dan build lulus.
