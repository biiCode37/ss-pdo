# Laporan Review Codex — Fase 3 Batch 3.3

**Status:** `PASS / BATCH_3_4_OPEN`  
**Branch:** `devmode`  
**Pelaksana kode:** Gemini. Codex meninjau implementasi dan menjalankan gerbang independen tanpa mengubah kode aplikasi.

## Implementasi yang diterima

Validasi submit dipisah ke `busInputValidation.ts`; perakitan `Partial<BusData>` dan penghitungan total TOA dipisah ke `busInputPayload.ts`. `useBusInputForm.ts` tetap memegang event, state, fokus, bypass, dan urutan `onSave(updates)` lalu `onDismiss()`. Kode dan tes menunjukkan scoped updates untuk kategori Single Focus, sanitasi/penguncian KM, total TOA format Indonesia, serta validasi mode All tetap terjaga.

Perbaikan R112-01 memvalidasi ulang dengan angka KM sesudah rollover sehingga pesan yang masih berlaku memakai angka terkini. Tidak ada pemfilteran fragmen teks pada jalur ini.

## Before vs After

| Aspek | Sebelum Batch 3.3 | Sesudah Batch 3.3 |
|---|---|---|
| Validasi submit | Percabangan mode dan field berada di hook besar. | Fungsi murni `validateBusInputForm` dan `getCrossDayValidationErrors` berada dalam modul fitur. |
| Payload simpan | Perakitan `Partial<BusData>` berada di hook. | Fungsi murni `buildBusInputPayload` menjaga daftar key sesuai mode/kategori. |
| Pesan KM pair pasca-rollover | Pesan masih menyebut KM Awal lama. | Pesan langsung dihitung ulang memakai KM Awal terbaru. |
| Kontrak simpan | Hook memanggil `onSave` lalu `onDismiss`. | Urutan tetap sama; tes suite terkait tetap lulus. |
| Uji proyek | 84 berkas / 622 tes pada Batch 3.2. | 86 berkas / 650 tes lulus secara independen. |

## Case: Skenario Lapangan

Petugas memasukkan KM Awal Shift 1 `292003`, KM Akhir `291900`, dan data H-1 `292990`. Submit menampilkan error lintas hari dan KM pair. Sesudah menerima saran rollover, KM Awal menjadi `293003`: error lintas hari hilang, sedangkan error KM pair tetap tampil dan kini menyebut `293003`. Penyimpanan masih ditolak sampai KM Akhir diperbaiki.

Petugas lain membuka kategori TOA Shift 1 dalam Single Focus. Payload hanya memuat `toaShift1` dan, bila chip manual aktif, `manualShift1`; field KM, trip, dan TOA lain tidak ikut menimpa data Google Sheets. Pada mode All, field yang berhak diisi tetap terkirim sesuai aturan lama.

## Verifikasi dan batasan

- Tes independen: **86 file / 650 tes lulus**.
- TypeScript, build Vite/PWA, dan lint terarah: **lulus**. Launcher `pnpm` gagal karena izin path profil pada lingkungan review, sehingga Codex memakai binary lokal proyek untuk perintah ekuivalen.
- Bukti eksekusi Gemini tersedia di `refact_113/evidence/`.
- UI visual mobile Light/Dark belum diverifikasi pada review logika Batch 3.3; itu menjadi gerbang Batch 3.4.
- Klarifikasi laporan: kategori trip tidak masuk `SINGLE_COLUMN_META`, sehingga trip UI memakai mode All. Klaim validasi trip Single Focus dalam `refact_113` terlalu luas dan dicatat sebagai R114-02 tanpa mengubah arsip lama.

**Keputusan:** Batch 3.3 `PASS`. Tiga dari lima batch Fase 3 selesai. Instruksi Gemini berikutnya ada di `GEMINI_PHASE_03_BATCH_04.md`.
