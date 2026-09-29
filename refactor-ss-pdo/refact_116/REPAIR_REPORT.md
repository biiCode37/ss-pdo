# Laporan Review Codex — Fase 3 Batch 3.4

**Status:** `REVISION_REQUIRED / BATCH_3_5_HOLD`  
**Branch:** `devmode`  
**Pelaksana kode:** Gemini. Codex hanya meninjau kode, dokumen, dan menjalankan verifikasi independen.

## Implementasi yang sudah diterima sebagian

Gemini memindahkan UI TOA dan catatan ke modul fitur, menjaga orkestrator Single Focus tetap singkat, menambah tes komponen, dan memindahkan sebagian besar label/chip ke `TEXT_ALERTS`. Tes penuh, lint terarah, TypeScript, dan build PWA lulus. Klarifikasi R114-02 bahwa trip menggunakan mode All juga sudah dicatat.

Batch belum dapat dinyatakan `PASS` karena modul KM masih 676 baris, Light Mode memakai fallback teks putih pada modal putih, empat badge jarak masih memiliki literal unit `KM`, dan laporan visual/ukuran file tidak sesuai kode aktual.

## Before vs After yang diperlukan

| Aspek | Kondisi saat review `refact_115` | Target revisi |
|---|---|---|
| Modularitas KM | `SingleFocusKm.tsx` 676 baris memuat empat kategori KM. | Pisah per shift/tanggung jawab hingga tidak ada god file baru; hindari abstraksi generik. |
| Tema Light | `--text-main` tidak didefinisikan; fallback `#f8fafc` digunakan di atas latar modal putih. | Label, nilai input, placeholder, chip, dan badge terbaca jelas dengan token tema yang benar. |
| Kamus teks | Label/chip sudah memakai kamus, tetapi empat badge jarak masih menulis `KM` langsung. | Seluruh UI string di modul hasil ekstraksi memakai `src/constants/texts/` dan dites. |
| Bukti visual/dokumen | Laporan mengklaim kelas tema, `min-h-[48px]`, serta ukuran 299/62 baris yang tidak ada pada kode aktual. | Laporan revisi menyebut file dan perilaku aktual; bukti visual mobile Light/Dark nyata bila lingkungan tersedia. |

## Case: Skenario Lapangan

Petugas membuka input KM Awal Shift 2 di ponsel dengan tema terang. Modal memakai latar putih dari `--card-bg`. Label input dari `SingleFocusKm` memakai `var(--text-main, #f8fafc)`; karena `--text-main` tidak didefinisikan, teks tampak nyaris putih di atas permukaan terang. Petugas perlu membaca label, nilai odometer, serta tombol salin sebelum mengisi, sehingga kontras ini menghambat pekerjaan. Setelah revisi, elemen tersebut harus memakai token tema yang benar dan tetap terbaca pada Light dan Dark Mode.

Petugas lain melihat badge jarak `150 KM`. Saat format unit jarak diperbarui lewat kamus, badge pada implementasi sekarang tidak ikut berubah karena literal `KM` berada di JSX. Revisi memindahkan unit ini ke kamus dan mempertahankan nilai jarak yang sama.

## Verifikasi review

- `vitest run src/` independen: **87 berkas / 661 tes lulus**.
- `tsc -b`, `vite build` dengan PWA, dan lint terarah independen: **lulus**.
- Kode dan tema statis membuktikan variabel `--text-main` tidak didefinisikan, sedangkan `--text-primary` dan latar Light Mode tersedia. Review ini tidak mengklaim screenshot visual; Gemini belum menyertakan screenshot dalam `refact_115/evidence/`.
- Ukuran aktual: `SingleFocusKm.tsx` **676** baris, `SingleFocusToa.tsx` **217**, `SingleFocusNotes.tsx` **52**, `singleFocusStyles.ts` **44**, orkestrator **72**.

## Keputusan

Batch 3.4 **perlu revisi terarah**. Progres Fase 3 tetap **3 dari 5 batch PASS** (3.1–3.3); Batch 3.5 belum dibuka. Paket instruksi executor: `GEMINI_PHASE_03_BATCH_04_REVISION.md`.
