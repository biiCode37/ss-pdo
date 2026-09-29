# Audit Codex — Fase 3 Batch 3.4

**Branch:** `devmode`  
**Keputusan:** `REVISION_REQUIRED / BATCH_3_5_HOLD`  
**Objek review:** implementasi dan bukti Gemini pada `refact_115`. Arsip sebelumnya tidak diubah.

## R116-01 — God file berpindah ke `SingleFocusKm.tsx`

- **Lokasi kode:** `src/components/busCard/modal/singleFocus/SingleFocusKm.tsx:1-676`.
- **Keparahan:** Sedang (modularitas dan kemudahan pemeliharaan).
- **Deskripsi:** Orkestrator Single Focus memang tinggal 72 baris, tetapi seluruh empat jalur KM, dua banner rollover, chip, bantuan salin, dan badge jarak disalin ke satu komponen baru sepanjang **676 baris**. Batas modularitas proyek meminta file yang mendekati 400–500 baris atau memegang lebih dari satu tanggung jawab untuk dipecah. Laporan `refact_115` menyebut file ini 299 baris; angka tersebut tidak cocok dengan file aktual.
- **Dampak user:** Perubahan alur KM satu shift dapat lebih mudah merusak shift lain; biaya review dan koreksi meningkat.
- **Mitigasi:** Pisahkan render Shift 1 dan Shift 2 ke komponen fitur lokal kecil. Ekstrak hanya potongan rollover/badge yang benar-benar identik, tanpa membuat framework field generik. Pertahankan ID, ref fokus, event, lock, copy, dan seluruh kontrak form.

## R116-02 — Teks Single Focus hampir putih di atas modal putih pada Light Mode

- **Lokasi kode:** `src/components/busCard/modal/singleFocus/singleFocusStyles.ts:7-10,35-40`; label pada `SingleFocusToa.tsx:49,137`, `SingleFocusKm.tsx:65,273,370,596`, `SingleFocusNotes.tsx:44`; tema pada `src/index.css:52-60`; latar modal pada `src/components/busCard/BusInputModal.tsx:135`.
- **Keparahan:** Tinggi (keterbacaan input operasional).
- **Deskripsi:** Komponen memakai `var(--text-main, #f8fafc)`, tetapi tidak ada definisi `--text-main` di `src/`. Light Mode mendefinisikan `--text-primary: #171717` dan `--card-bg` putih. Akibatnya label dan teks input jatuh ke fallback `#f8fafc` yang sangat terang pada latar modal terang. Input/chip juga masih memakai latar `rgba(0,0,0,...)` atau warna gelap tetap. Bagian evaluasi visual laporan `refact_115` menyebut kelas `bg-white`, `dark:bg-slate-800`, dan `min-h-[48px]`, padahal kelas itu tidak ada pada komponen hasil ekstraksi.
- **Dampak user:** Pada tema terang, label dan nilai form berkontras buruk atau sulit terlihat, khususnya di ponsel lapangan.
- **Mitigasi:** Pakai token tema yang benar (`--text-primary`, `--input-bg`, `--card-bg`, `--card-border`, dan token aksen yang sesuai) untuk input, label, chip, catatan, badge, serta state locked. Verifikasi render Light/Dark pada viewport mobile nyata dan simpan bukti/screenshot atau jelaskan batas lingkungan secara akurat. Hindari mengubah shell Batch 3.5 di revisi ini.

## R116-03 — Unit `KM` masih hardcoded dalam komponen baru

- **Lokasi kode:** `src/components/busCard/modal/singleFocus/SingleFocusKm.tsx:248,333,571,656`.
- **Keparahan:** Rendah (kepatuhan kamus teks UI).
- **Deskripsi:** Badge jarak menulis `{kmDistanceS1} KM` atau `{kmDistanceS2} KM` langsung dalam JSX. Laporan menyatakan semua literal UI sudah dipusatkan.
- **Dampak user:** Format unit jarak bisa berbeda dari tampilan lain dan tidak ikut diperbarui dari kamus.
- **Mitigasi:** Gunakan token/fungsi template domain dalam `src/constants/texts/` dan tambah tes integritas pada `texts.test.ts`.

## R116-04 — Klaim bukti visual dan ukuran file tidak sesuai implementasi

- **Lokasi dokumen:** `refactor-ss-pdo/refact_115/REPAIR_REPORT.md`, bagian Ringkasan Eksekutif, Before vs After, Case 3, dan Evaluasi Visual Mobile.
- **Keparahan:** Rendah (akurasi laporan kualitas).
- **Deskripsi:** Laporan menyebut `SingleFocusKm.tsx` 299 baris dan orkestrator 62 baris, sedangkan hasil hitung independen 676 dan 72 baris. Klaim kelas Tailwind tema dan tinggi minimum input tidak sesuai kode inline style. Case 3 juga menyebut copy KM memindahkan fokus ke field selanjutnya, sementara `handleCopyKmAkhir1ToAwal2` hanya memperbarui state KM. Semua ini perlu errata; jangan mengubah `refact_115`.
- **Dampak user/tim:** Review dan keputusan fase berikutnya dapat didasarkan pada bukti yang terlalu optimistis.
- **Mitigasi:** Catat angka dan perilaku aktual pada folder revisi baru. Jangan mengklaim pengujian visual bila hanya memeriksa kode atau Happy DOM.

## Gerbang independen yang lulus

- `vitest run src/` melalui binary lokal: **87 berkas, 661 tes lulus**, exit 0. Log Happy DOM gagal memuat skrip Google eksternal tidak menyebabkan kegagalan tes.
- `tsc -b`: exit 0.
- `vite build`: exit 0 termasuk PWA; hanya peringatan ukuran chunk.
- `oxlint` terarah pada berkas Single Focus dan kamus: exit 0.

Tes dan build hijau tidak memverifikasi kontras Light Mode atau memenuhi batas modularitas. Batch 3.4 tetap tertahan sampai R116-01 s.d. R116-04 ditangani dalam folder revisi baru.
