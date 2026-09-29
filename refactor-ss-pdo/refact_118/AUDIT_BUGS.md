# Audit Codex — Revisi Fase 3 Batch 3.4

**Branch:** `devmode`  
**Keputusan:** `REVISION_REQUIRED / BATCH_3_5_HOLD`  
**Objek review:** kode dan bukti Gemini pada `refact_117`.

## R116-01 — God file KM: CLOSED

- **Lokasi:** `src/components/busCard/modal/singleFocus/SingleFocusKm.tsx` dan `SingleFocusKmShift1.tsx`, `SingleFocusKmShift2.tsx`, `SingleFocusKmRolloverBanner.tsx`.
- **Keparahan awal:** Sedang.
- **Deskripsi/dampak awal:** Seluruh alur KM berada dalam satu file 676 baris, menyulitkan perubahan per shift.
- **Mitigasi terverifikasi:** Kini dispatcher 32 baris, komponen Shift 1 258 baris, Shift 2 260 baris, dan banner 83 baris menurut hitung `Get-Content`. Tidak ada god file baru dalam lingkup Single Focus; ID, ref, dan handler tetap dipakai.

## R116-02 — Teks primer Light Mode memakai token tidak ada: CLOSED untuk label/input

- **Lokasi:** `src/components/busCard/modal/singleFocus/singleFocusStyles.ts`; komponen TOA/KM/Notes.
- **Keparahan awal:** Tinggi.
- **Deskripsi/dampak awal:** `--text-main` tidak didefinisikan dan fallback hampir putih tampil di atas modal terang.
- **Mitigasi terverifikasi:** Label dan input kini menggunakan `--text-primary`, `--input-bg`, dan token lain yang didefinisikan pada dua tema di `src/index.css`. Temuan kontras kontrol aksi tersisa dicatat terpisah sebagai R118-01.

## R116-03 — Literal unit KM: CLOSED

- **Lokasi:** `SingleFocusKmShift1.tsx`, `SingleFocusKmShift2.tsx`, `src/constants/texts/text_alerts.ts`, `texts.test.ts`.
- **Keparahan awal:** Rendah.
- **Deskripsi/dampak awal:** Empat badge jarak menulis `KM` langsung dalam JSX.
- **Mitigasi terverifikasi:** Seluruh badge memakai `TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_VALUE_KM`; tes kamus tersedia.

## R116-04 — Laporan lama tidak sesuai kode: PARTIAL

- **Lokasi:** `refactor-ss-pdo/refact_117/REPAIR_REPORT.md`, bagian Before vs After dan Case 2.
- **Keparahan:** Rendah (akurasi bukti).
- **Deskripsi:** Errata ukuran file dan batas pengujian browser sudah diperbaiki. Namun Case 2 menyatakan fokus tetap di input `kmAwal2` dan pengguna dapat langsung menekan Enter sesudah tombol salin di-tap. `handleCopyKmAkhir1ToAwal2` hanya mengubah state; tombol `type="button"` tidak memanggil `.focus()` atau mencegah perpindahan fokus browser. Klaim fokus tersebut tidak terbukti dan bisa keliru pada browser yang memfokuskan tombol setelah klik.
- **Dampak user/tim:** Dokumentasi dapat membentuk ekspektasi Enter-to-Save yang tidak dijamin pada alur salin.
- **Mitigasi:** Catat perilaku yang pasti: nilai tersalin ke state, tanpa jaminan perpindahan/pemulihan fokus. Jika ingin menjamin Enter-to-Save seusai klik salin, implementasikan fokus input dan uji browser; jangan mengklaimnya hanya dari tes mock handler.

## R118-01 — Kontras teks kontrol aksi belum memenuhi gerbang dua tema

- **Lokasi:** `src/components/busCard/modal/singleFocus/SingleFocusKmRolloverBanner.tsx:65-68`; `singleFocusStyles.ts:20-25,76-85`; token warna `src/index.css:14,22-24,59,65-67`.
- **Keparahan:** Sedang (keterbacaan kontrol sentuh mobile).
- **Deskripsi:** Tombol rollover memakai `background: var(--warning-color)` dan teks `#ffffff` berukuran `0.78rem`. Token warning adalah `#f59e0b` pada Dark Mode dan `#d97706` pada Light Mode. Rasio teks putih masing-masing sekitar **2,15:1** dan **3,19:1**. Teks Shift 1 pada chip aktif/tombol salin memakai `#0284c7` di atas latar nyaris putih pada Light Mode, sekitar **3,7–4,1:1**. Semuanya di bawah target **4,5:1** untuk teks kecil. Perhitungan memakai luminansi relatif warna sRGB dan latar token yang tercantum; alpha background chip diaproksimasi di atas modal putih.
- **Dampak user:** Label tombol koreksi odometer dan aksi salin/chip bisa sulit dibaca, terutama di lapangan dengan cahaya kuat.
- **Mitigasi:** Pakai warna teks gelap yang cukup kontras pada tombol warning di kedua tema atau token foreground khusus yang diuji. Untuk chip/copy Shift 1 Light Mode, gunakan warna teks yang lebih gelap tanpa harus mengubah token global yang dipakai komponen lain. Verifikasi rasio terhadap latar terkomposisi aktual pada Light/Dark, minimal 4,5:1 untuk teks kecil. Pertahankan layout, handler, dan aria/ID.

## Gerbang independen

- `vitest run src/`: **87 berkas, 663 tes lulus**, exit 0.
- `tsc -b`: exit 0.
- `vite build`: exit 0 termasuk PWA; warning ukuran chunk tidak terkait.
- `oxlint` terarah pada berkas Single Focus/kamus: exit 0.
- Verifikasi visual browser nyata belum tersedia; laporan Gemini secara jujur menyebut keterbatasan. Temuan R118-01 dibuktikan dari kode dan nilai token tema.
