# Brief Antigravity: Tampilan Status "Wajar" di Tab Siap Kirim

**Dari:** Claude · **Untuk:** Antigravity · **Tanggal:** 08 November 2026
**Nomor dokumentasi:** refact_225 (ditulis Claude; Anda **tidak** menulis folder `refactor-ss-pdo`)

Baca brief ini sampai habis sebelum menyentuh file. Kalau ada yang tidak jelas, **atau ada kelas/gaya/teks yang dirujuk brief ini ternyata tidak ada**, berhenti dan tulis di laporan; jangan menebak.

## 1. Konteks

Aturan kelengkapan direvisi (opsi D, sudah di-commit Claude di `supabase/functions/_shared/completeness.ts`, commit `7027a2a`):
- Status unit baru **`WAJAR`**: unit **berketerangan** yang ritasenya lengkap, tetapi **hanya** TOA S1 **atau** Total TOA yang kosong (jalan satu shift: NP2, keur, renops, dst.).
- Unit `WAJAR` **bukan masalah**. `countCompletenessIssues` tidak menghitungnya, dan statusnya tidak mempengaruhi status rute. Tetapi unit ini **tetap dicantumkan** di `completeness.issues` sebagai informasi: `{ unit, status: 'WAJAR', missing: ['toaShift1'] | ['totalToa'], note: '<cuplikan keterangan ≤40 karakter>' }`.
- `completeness.counts` kini punya kunci `WAJAR`. **Data lama di database belum punya kunci itu** (`counts.WAJAR` bisa `undefined`).

Spesifikasi §2: `docs/superpowers/specs/2026-11-07-kelengkapan-siap-kirim-design.md`.

Contoh nyata: JAK.115, unit **KWK 222179**, keterangan "Program Keur/ Renops", TOA S1 kosong, Total TOA 166 → `WAJAR`.

## 2. Tempat kerja (WAJIB)

Folder **`D:\MINE\SS_PDO-ag`**, branch **`ag/siap-kirim-wajar`** (sudah dibuat dari `devmode` terbaru). Periksa dengan `git branch --show-current`. Jangan bekerja di `D:\MINE\SS_PDO`.

## 3. Pekerjaan

1. **`src/constants/texts/text_monitoring.ts`**: di blok `SUBMISSION`, tambahkan
   ```ts
   ISSUE_WAJAR: (fields: string, note: string) => `Wajar · ${fields} kosong${note ? ` · ${note}` : ""}`,
   ```
   dan test di `src/constants/texts/texts.test.ts`, misalnya
   `ISSUE_WAJAR('TOA S1', 'Program Keur/ Renops')` → `'Wajar · TOA S1 kosong · Program Keur/ Renops'`, serta kasus `note` kosong.
2. **`ReadinessRouteCard.tsx`**: hitungan "x/y unit lengkap" memperlakukan `WAJAR` sebagai lengkap:
   `lengkap = LENGKAP + (WAJAR ?? 0) + DIKECUALIKAN`. Pastikan data lama tanpa kunci `WAJAR` tidak menghasilkan `NaN`.
3. **`ReadinessRouteDetailModal.tsx`** (bagian `submission-modal__body`):
   - Pisahkan `issues` menjadi **masalah** (status ≠ `WAJAR`) dan **wajar** (status = `WAJAR`).
   - Bila tidak ada masalah, tampilkan `T.DETAIL_NO_ISSUES` (kondisi lama `c.issues.length === 0` **harus diganti**, karena kini `issues` bisa berisi unit wajar saja).
   - Daftar masalah tampil **lebih dulu** (perilaku sekarang dipertahankan). Unit wajar tampil **sesudahnya** dalam `ul.submission-issues` yang sama, dengan `ui-status data-tone="neutral"` dan teks `T.ISSUE_WAJAR(fields, issue.note ?? "")`, di mana `fields` = `issue.missing` dipetakan lewat `T.FIELD` lalu digabung `", "`.
   - Kolom alasan dan tombol Konfirmasi **tidak berubah**: alasan tetap ditentukan oleh `view.issueCount`, dan unit wajar tidak dihitung.
4. Gaya: pakai yang sudah ada. `.ui-status[data-tone="neutral"]` **sudah ada** di `src/styles/components/status.css` (sudah diverifikasi Claude). Tidak perlu CSS baru; kalau ternyata perlu, jelaskan alasannya di laporan.

## 4. Kriteria penerimaan (semua wajib)

1. Rute yang hanya berisi unit lengkap + wajar: kartu menampilkan "n/n unit lengkap", dialog menampilkan "Semua unit lengkap." **dan** daftar unit wajar (nada netral), tanpa kolom alasan.
2. Rute dengan masalah + wajar: masalah tampil lebih dulu (nada warning/error seperti sekarang), unit wajar sesudahnya (nada netral). Kolom alasan menyebut jumlah masalah **tanpa** menghitung unit wajar.
3. Data lama (`counts` tanpa `WAJAR`, `issues` tanpa status `WAJAR`) tampil persis seperti sebelumnya, tanpa `NaN` atau error.
4. Tanpa `style={{}}` statis baru, warna mentah, teks hardcoded, emoji, maupun ikon dekoratif. Ratchet UI tidak naik.
5. **Kasus tepi wajib dipikirkan dan diuji:** `note` kosong; `missing` berisi `totalToa` maupun `toaShift1`; rute tanpa `completeness`; rute `header_not_found`. Kalau menemukan kasus tepi lain, uji juga dan sebutkan di laporan.
6. Test baru (TDD: test dulu, pastikan gagal, baru implementasi):
   - `texts.test.ts`: `ISSUE_WAJAR`.
   - `SubmissionReadinessTab.test.tsx` **atau** test baru `ReadinessRouteDetailModal.test.tsx`: kriteria 1, 2, dan 3.
   - Test kartu (boleh file baru `ReadinessRouteCard.test.tsx`): hitungan lengkap termasuk `WAJAR`, dan data lama tanpa `WAJAR`.
   - Semua test lama tetap lulus; jangan menghapus atau melemahkannya.

## 5. File yang BOLEH diubah/dibuat (hanya ini)

`src/constants/texts/text_monitoring.ts`, `src/constants/texts/texts.test.ts`, `src/components/monitoring/readiness/ReadinessRouteCard.tsx`, `ReadinessRouteDetailModal.tsx`, `SubmissionReadinessTab.test.tsx`, file test baru `ReadinessRouteDetailModal.test.tsx` / `ReadinessRouteCard.test.tsx` di folder yang sama, dan laporan `docs/superpowers/briefs/reports/ag-siap-kirim-wajar-report.md`.

## 6. Larangan keras

- **Jangan** mengubah `supabase/**` (aturan kelengkapan adalah wilayah Claude), service, hook, `readinessModel.ts`, ratchet, `package.json`, maupun lockfile.
- **Jangan** push, merge, rebase, ganti branch, atau menyentuh `devmode`/`main`.
- **Jangan** `git add -A` / `git add .`. `graphify-out/` tidak boleh di-commit.

## 7. Verifikasi wajib (dari `D:\MINE\SS_PDO-ag`)

```bash
pnpm vitest run src/components/monitoring src/constants/texts/texts.test.ts src/services/submission
pnpm vitest run src/styles/ui-debt-ratchet.test.ts src/styles/components/focus-ring.test.ts src/styles/tokens/color-contract.test.ts
pnpm vitest run src/
pnpm run build
git status --short
```

`git status --short` harus menjadi **perintah TERAKHIR** yang Anda jalankan, **setelah** laporan di-commit (jangan menyunting laporan lagi sesudahnya). Salin output aslinya ke pesan penutup.

## 8. Commit

- `feat(ui): tampilkan unit Wajar di detail dan hitungan kartu Siap Kirim`
- Laporan: `docs: laporan Antigravity tampilan status Wajar`

## 9. Format laporan

`docs/superpowers/briefs/reports/ag-siap-kirim-wajar-report.md`:

```markdown
# Laporan Antigravity: Tampilan Status Wajar

## Status
## Commit
## File yang diubah (output `git diff --stat devmode...HEAD`)
## Kriteria penerimaan (1–6: terpenuhi/tidak + bukti)
## Kasus tepi yang Anda pikirkan & cara mengujinya
## Hasil verifikasi (baris ringkasan output asli)
## TDD (baris error saat test gagal sebelum implementasi)
## Keputusan desain sendiri
## Penyimpangan dari brief
## Pertanyaan untuk Claude
```

## 10. Penutup (WAJIB)

```
Pesan untuk Claude:
AG selesai: brief ag-siap-kirim-wajar · branch ag/siap-kirim-wajar · commit terakhir <hash> · laporan docs/superpowers/briefs/reports/ag-siap-kirim-wajar-report.md · status <selesai/sebagian/terhenti> · penyimpangan <ada/tidak> · pertanyaan <ada/tidak> · git status: <salin output, atau "bersih">
```
