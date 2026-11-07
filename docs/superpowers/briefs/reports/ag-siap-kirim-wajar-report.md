# Laporan Antigravity: Tampilan Status Wajar

## Status
Selesai

## Commit
- `771fc7e` feat(ui): tampilkan unit Wajar di detail dan hitungan kartu Siap Kirim

## File yang diubah (output `git diff --stat devmode...HEAD`)
```text
 .../readiness/ReadinessRouteCard.test.tsx          | 143 +++++++++
 .../monitoring/readiness/ReadinessRouteCard.tsx    |   2 +-
 .../readiness/ReadinessRouteDetailModal.test.tsx   | 328 +++++++++++++++++++++
 .../readiness/ReadinessRouteDetailModal.tsx        |  20 +-
 .../readiness/SubmissionReadinessTab.test.tsx      |  48 +++
 src/constants/texts/text_monitoring.ts             |   1 +
 src/constants/texts/texts.test.ts                  |   2 +
 7 files changed, 540 insertions(+), 4 deletions(-)
```

## Kriteria penerimaan (1–6: terpenuhi/tidak + bukti)
1. **Rute hanya lengkap + wajar**: Terpenuhi. Kartu menampilkan "n/n unit lengkap", dialog modal menampilkan "Semua unit lengkap." dan daftar unit wajar berstatus `ui-status[data-tone="neutral"]` dengan teks `T.ISSUE_WAJAR`, serta kolom alasan tidak tampil (`needsReason = false`).
   - Bukti test: `ReadinessRouteDetailModal.test.tsx > Kriteria 1: rute lengkap + wajar menampilkan "Semua unit lengkap." dan daftar unit wajar tanpa kolom alasan` (PASS).
2. **Rute masalah + wajar**: Terpenuhi. Masalah tampil lebih dulu dengan nada warning/error (`SEBAGIAN` -> warning, `JANGGAL`/`BELUM_DIISI` -> error), disusul unit wajar dengan nada neutral. Kolom alasan tampil dan hint alasan hanya menghitung `view.issueCount` (jumlah masalah murni tanpa unit wajar).
   - Bukti test: `ReadinessRouteDetailModal.test.tsx > Kriteria 2: rute masalah + wajar menampilkan masalah lebih dulu lalu wajar, dan hint alasan hanya menghitung masalah` (PASS).
3. **Data lama tanpa kunci `WAJAR`**: Terpenuhi. Objek `counts` tanpa kunci `WAJAR` dan array `issues` tanpa unit `WAJAR` ditampilkan seperti sebelumnya tanpa menghasilkan `NaN` atau error runtime.
   - Bukti test: `ReadinessRouteCard.test.tsx > menangani data lama tanpa kunci WAJAR tanpa menghasilkan NaN` (PASS) dan `ReadinessRouteDetailModal.test.tsx > Kriteria 3: data lama tanpa WAJAR tampil persis seperti sebelumnya` (PASS).
4. **Tanpa style statis baru & Ratchet UI aman**: Terpenuhi. Tidak ada inline style JSX `style={{}}` baru, warna mentah, string antarmuka hardcoded, emoji, maupun ikon dekoratif. Seluruh pengujian ratchet dan token warna lolos 100%.
   - Bukti test: `ui-debt-ratchet.test.ts` (17 tests PASS), `focus-ring.test.ts` (7 tests PASS), `color-contract.test.ts` (180 tests PASS).
5. **Kasus tepi teruji**: Terpenuhi. Diuji kasus `note` kosong (`Wajar · TOA S1 kosong`), missing `toaShift1` vs `totalToa`, kelengkapan bernilai `null` (`DETAIL_NO_DATA`), dan format error `header_not_found` (`DETAIL_FORMAT_ERROR`).
   - Bukti test: `ReadinessRouteDetailModal.test.tsx > Kriteria 5: menangani kasus tepi note kosong, missing totalToa vs toaShift1, null completeness, dan format error` (PASS) dan `ReadinessRouteCard.test.tsx > tidak menampilkan meta kelengkapan jika completeness null atau format error` (PASS).
6. **Test baru (TDD)**: Terpenuhi. Menggunakan alur TDD ketat (tulis test, pastikan gagal dan rekam baris error, lalu implementasikan). Seluruh test lama dan baru tetap lulus.
   - Bukti test: `ReadinessRouteCard.test.tsx` (3 tests PASS), `ReadinessRouteDetailModal.test.tsx` (4 tests PASS), `texts.test.ts` (29 tests PASS), `SubmissionReadinessTab.test.tsx` (6 tests PASS).

## Kasus tepi yang Anda pikirkan & cara mengujinya
1. **Keterangan (`note`) kosong pada unit wajar**: Diuji pada `texts.test.ts` dan `ReadinessRouteDetailModal.test.tsx`. Jika unit wajar memiliki `note: ""`, teks yang dihasilkan adalah `Wajar · TOA S1 kosong` tanpa ada karakter titik tengah pemisah tambahan di ujungnya.
2. **Variasi kolom missing (`toaShift1` vs `totalToa`)**: Diuji pada `ReadinessRouteDetailModal.test.tsx`. Pemetaan via `T.FIELD` menghasilkan `TOA S1` atau `Total TOA` secara tepat sesuai dengan kolom yang kosong pada shift tersebut.
3. **Data kelengkapan rute belum ada (`completeness = null`)**: Diuji pada `ReadinessRouteCard.test.tsx` (meta unit tidak dirender) dan `ReadinessRouteDetailModal.test.tsx` (menampilkan pesan `DETAIL_NO_DATA`).
4. **Format sheet tidak dikenali (`header_not_found`)**: Diuji pada `ReadinessRouteCard.test.tsx` dan `ReadinessRouteDetailModal.test.tsx` (menampilkan pesan `DETAIL_FORMAT_ERROR`).
5. **Data lama tanpa nilai `WAJAR` pada `counts`**: Diuji pada `ReadinessRouteCard.test.tsx` memastikan penjumlahan menggunakan `(c.counts.WAJAR ?? 0)` sehingga terhindar dari `NaN`.

## Hasil verifikasi (baris ringkasan output asli)
1. `pnpm vitest run src/components/monitoring src/constants/texts/texts.test.ts src/services/submission`:
   ```text
   Test Files  28 passed (28)
        Tests  231 passed (231)
     Start at  01:04:28
     Duration  23.78s (transform 7.77s, setup 0ms, import 29.37s, tests 26.82s, environment 68.47s)
   ```
2. `pnpm vitest run src/styles/ui-debt-ratchet.test.ts src/styles/components/focus-ring.test.ts src/styles/tokens/color-contract.test.ts`:
   ```text
   Test Files  3 passed (3)
        Tests  204 passed (204)
     Start at  01:04:56
     Duration  652ms (transform 144ms, setup 0ms, import 444ms, tests 92ms, environment 0ms)
   ```
3. `pnpm vitest run src/`:
   ```text
   Test Files  149 passed (149)
        Tests  1456 passed (1456)
     Start at  01:05:02
     Duration  103.23s (transform 21.71s, setup 0ms, import 102.76s, tests 63.75s, environment 387.35s)
   ```
4. `pnpm run build`:
   ```text
   > pusm-pdo-app@0.0.0 build D:\MINE\SS_PDO-ag
   > tsc -b && vite build

   vite v8.1.4 building client environment for production...
   ✓ 2082 modules transformed.
   ✓ built in 1.46s
   ```

## TDD (baris error saat test gagal sebelum implementasi)
1. `src/constants/texts/texts.test.ts`:
   ```text
   FAIL  src/constants/texts/texts.test.ts > Centralized UI Text Dictionary > exports TEXT_MONITORING.SUBMISSION untuk fitur siap kirim
   TypeError: TEXT_MONITORING.SUBMISSION.ISSUE_WAJAR is not a function
    ❯ src/constants/texts/texts.test.ts:520:39
   ```
2. `src/components/monitoring/readiness/ReadinessRouteCard.test.tsx`:
   ```text
   FAIL  src/components/monitoring/readiness/ReadinessRouteCard.test.tsx > ReadinessRouteCard > memperlakukan status WAJAR sebagai lengkap pada hitungan unit
   AssertionError: expected '9/11 unit lengkap' to be '11/11 unit lengkap' // Object.is equality
    ❯ src/components/monitoring/readiness/ReadinessRouteCard.test.tsx:63:31
   ```
3. `src/components/monitoring/readiness/ReadinessRouteDetailModal.test.tsx`:
   ```text
   FAIL  src/components/monitoring/readiness/ReadinessRouteDetailModal.test.tsx > ReadinessRouteDetailModal > Kriteria 1: rute lengkap + wajar menampilkan "Semua unit lengkap." dan daftar unit wajar tanpa kolom alasan
   AssertionError: expected 'Kelengkapan JAK.115Lengkap, belum dik…' to contain 'Semua unit lengkap.'
    ❯ src/components/monitoring/readiness/ReadinessRouteDetailModal.test.tsx:90:39

   FAIL  src/components/monitoring/readiness/ReadinessRouteDetailModal.test.tsx > ReadinessRouteDetailModal > Kriteria 2: rute masalah + wajar menampilkan masalah lebih dulu lalu wajar, dan hint alasan hanya menghitung masalah
   AssertionError: expected 'error' to be 'neutral' // Object.is equality
    ❯ src/components/monitoring/readiness/ReadinessRouteDetailModal.test.tsx:176:47

   FAIL  src/components/monitoring/readiness/ReadinessRouteDetailModal.test.tsx > ReadinessRouteDetailModal > Kriteria 5: menangani kasus tepi note kosong, missing totalToa vs toaShift1, null completeness, dan format error
   AssertionError: expected 'TOA S1 kosong' to be 'Wajar · TOA S1 kosong' // Object.is equality
    ❯ src/components/monitoring/readiness/ReadinessRouteDetailModal.test.tsx:272:64
   ```

## Keputusan desain sendiri
1. Menggunakan pemetaan `issue.note ?? ""` saat memanggil `T.ISSUE_WAJAR(fields, issue.note ?? "")` agar aman menangani kemungkinan nilai `undefined` maupun string kosong.
2. Memisahkan `problems` (`status !== "WAJAR"`) dan `wajarIssues` (`status === "WAJAR"`), sehingga daftar masalah selalu dirender lebih dulu dengan nada peringatan/error, lalu daftar wajar menyusul di urutan belakang dengan nada netral.
3. Menampilkan teks `T.DETAIL_NO_ISSUES` apabila `problems.length === 0`, bahkan ketika `wajarIssues.length > 0` (karena unit wajar bukanlah masalah yang menghalangi kelengkapan).

## Penyimpangan dari brief
Tidak ada. Semua instruksi diikuti persis sesuai brief.

## Pertanyaan untuk Claude
Tidak ada. Seluruh spesifikasi telah terimplementasi dan terverifikasi secara penuh.
