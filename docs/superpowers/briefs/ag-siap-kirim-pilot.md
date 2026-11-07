# Brief Antigravity: Pilot "Siap Kirim" — Task 6, 7, 8

**Dari:** Claude (reviewer & penanggung jawab arsitektur)
**Untuk:** Antigravity (pelaksana)
**Tanggal:** 07 November 2026

Baca brief ini sampai habis sebelum menyentuh file apa pun. Brief ini **mengalahkan** asumsi Anda sendiri. Kalau ada yang bertentangan atau tidak jelas, **berhenti dan tulis pertanyaannya di laporan**. Jangan menebak.

## 1. Konteks singkat

Fitur baru "Siap Kirim": korlap/PJ melihat unit mana yang belum lengkap atau janggal di setiap rute, lalu mengonfirmasi rute "siap dikirim" ke pusat. Rancangan lengkap:
- Spesifikasi: `docs/superpowers/specs/2026-11-07-kelengkapan-siap-kirim-design.md`
- Rencana implementasi (berisi **kode lengkap** setiap langkah): `docs/superpowers/plans/2026-11-07-kelengkapan-siap-kirim.md`

Task 1 dan Task 2 rencana itu **sudah selesai** (commit `9f9c0a2`, `357599e`). Modul bersama di `supabase/functions/_shared/` (`completeness.ts`, `submissionRules.ts`, `pageAccess.ts`) sudah ada dan **tidak boleh Anda ubah**.

## 2. Tempat kerja (WAJIB)

- Folder kerja: **`D:\MINE\SS_PDO-ag`** (git worktree terpisah). **Jangan** bekerja di `D:\MINE\SS_PDO`; folder itu sedang dipakai Claude.
- Branch: **`ag/siap-kirim-ui`** (sudah dibuat dari `devmode`). Pastikan dengan `git branch --show-current` sebelum mulai.
- Dependensi sudah dipasang. Kalau `node_modules` belum ada, jalankan `pnpm install --frozen-lockfile`.

## 3. Tugas Anda

Kerjakan **Task 6, Task 7, dan Task 8** dari rencana implementasi, **persis** sesuai langkah dan kode di rencana, berurutan 6 → 7 → 8. Setiap task mengikuti TDD seperti tertulis:
1. Tulis test.
2. Jalankan dan pastikan **gagal**.
3. Tulis implementasi.
4. Jalankan dan pastikan **lulus**.
5. Commit.

### File yang BOLEH dibuat/diubah (hanya ini)

- `src/services/submissionReadinessService.ts`, `src/services/submissionReadinessService.test.ts`
- `src/components/monitoring/readiness/` (semua file baru di folder ini: `readinessModel.ts`, `readinessModel.test.ts`, `useSubmissionReadiness.ts`, `useSubmissionReadiness.test.tsx`, `SubmissionReadinessTab.tsx`, `SubmissionReadinessTab.test.tsx`, `ReadinessRouteCard.tsx`, `ReadinessRouteDetailModal.tsx`, `ReadinessBacklogBanner.tsx`, `WatchlistModal.tsx`)
- `src/components/monitoring/PendingUpdateBanner.tsx`
- `src/styles/components/submission.css`
- `src/index.css` (hanya menambah 1 baris `@import "./styles/components/submission.css";`)
- `src/constants/texts/text_monitoring.ts` (hanya menambah `NAV.SUBMISSION`, blok `PENDING_UPDATE`, dan blok `SUBMISSION` sesuai rencana)
- `src/constants/texts/texts.test.ts` (hanya menambah 1 test sesuai rencana)
- `docs/superpowers/briefs/reports/ag-siap-kirim-pilot-report.md` (laporan Anda)

**Semua file lain dilarang disentuh**, termasuk `AllRouteMonitoringPage.tsx` dan `MonitoringBottomNav.tsx` (itu Task 9, dikerjakan Claude), `supabase/**`, `src/styles/ui-debt-ratchet.test.ts`, `package.json`, dan lockfile.

## 4. Larangan keras

- **Jangan** push, merge, rebase, atau mengganti branch. **Jangan** menyentuh `devmode`, `main`, atau branch lain.
- **Jangan** `git add -A` / `git add .`. Tambahkan file **satu per satu** dari daftar di atas. Folder `graphify-out/` berubah otomatis oleh hook dan **tidak boleh** ikut di-commit.
- **Jangan** menjalankan migrasi, deploy, `supabase` CLI, atau perintah yang menyentuh database/produksi.
- **Jangan** menaikkan `BASELINE` di `src/styles/ui-debt-ratchet.test.ts`. Kalau ratchet gagal, **perbaiki kode Anda**.
- **Jangan** menambah dependency.
- **Jangan** menambah `style={{...}}` statis, warna hex/rgb mentah, emoji, ikon dekoratif, atau teks UI yang ditulis langsung di `.tsx` (semua teks lewat `TEXT_MONITORING`).
- **Jangan** mengubah kode dari rencana tanpa alasan. Bila terpaksa (misalnya test atau `tsc` gagal karena detail rencana keliru), lakukan perubahan **sekecil mungkin** dan **catat** di bagian "Penyimpangan" laporan: apa yang diubah, kenapa, dan bukti error-nya.

## 5. Aturan proyek yang berlaku

Patuhi `AGENTS.md` dan `.agents/rules/ui-consistency.md`. Ringkasnya:
- teks UI di `src/constants/texts/`;
- warna hanya `var(--color-*)`;
- font 12/13/14/16/18/20/24 px; jarak dari skala genap 0–64; radius 8/12/16/999px/50%;
- pakai ulang kelas yang ada (`.ui-button`, `.ui-segmented`, `.ui-segmented-btn`, `.ui-option-btn`, `.ui-status`, `.ui-tone-panel`, `.ui-input`) dan `ModalShell`.

## 6. Verifikasi wajib (jalankan dari `D:\MINE\SS_PDO-ag`)

Setelah tiap task, jalankan test task itu (perintahnya ada di rencana). Setelah ketiga task selesai, jalankan semua ini dan **salin output ringkasnya apa adanya** ke laporan:

```bash
pnpm vitest run src/components/monitoring/readiness src/services/submissionReadinessService.test.ts src/constants/texts/texts.test.ts
pnpm vitest run src/styles/ui-debt-ratchet.test.ts src/styles/components/focus-ring.test.ts
pnpm vitest run src/styles/tokens/color-contract.test.ts
pnpm vitest run src/
pnpm run build
```

Semua harus lulus. Kalau ada yang gagal dan tidak bisa diperbaiki dalam batas brief ini, **berhenti**, commit pekerjaan yang sudah lulus, lalu laporkan kegagalannya beserta output asli. Jangan menandai pekerjaan sebagai selesai.

## 7. Commit

Satu commit per task, memakai pesan commit dari rencana:
- Task 6: `feat(submission): service data dan model murni kelengkapan siap kirim`
- Task 7: `feat(submission): hook kelengkapan dengan realtime in-place tanpa muat ulang`
- Task 8: `feat(ui): tab Siap Kirim — kelengkapan, tunggakan, pantauan, dan konfirmasi`

Laporan di-commit terpisah: `docs: laporan Antigravity pilot siap kirim`.

## 8. Format laporan (WAJIB)

Tulis ke `docs/superpowers/briefs/reports/ag-siap-kirim-pilot-report.md`:

```markdown
# Laporan Antigravity: Pilot Siap Kirim (Task 6–8)

## Status
Selesai semua / Sebagian (sebutkan task yang belum) / Terhenti (alasan)

## Commit
- Task 6: <hash> <pesan>
- Task 7: <hash> <pesan>
- Task 8: <hash> <pesan>

## File yang diubah
(hasil `git diff --stat devmode...HEAD`, salin apa adanya)

## Hasil verifikasi
(untuk setiap perintah di bagian 6: perintah, lalu baris ringkasan output asli seperti "Tests 1310 passed (1310)" atau "exit 0")

## TDD
(untuk tiap task: apakah test benar-benar gagal dulu sebelum implementasi? sertakan baris error-nya)

## Penyimpangan dari rencana
(tidak ada / daftar: file, apa yang diubah, alasan, bukti error)

## Pertanyaan untuk Claude
(tidak ada / daftar)
```

## 9. Penutup (WAJIB)

Setelah laporan di-commit, tampilkan **persis** satu blok berikut kepada pengguna (isi bagian `<...>`), supaya pengguna bisa meneruskannya ke Claude:

```
Pesan untuk Claude:
AG selesai: brief ag-siap-kirim-pilot · branch ag/siap-kirim-ui · commit terakhir <hash> · laporan docs/superpowers/briefs/reports/ag-siap-kirim-pilot-report.md · status <selesai / sebagian / terhenti> · penyimpangan <ada/tidak> · pertanyaan <ada/tidak>
```

Jujurlah dalam laporan. Test yang gagal ditulis gagal, langkah yang dilewati ditulis dilewati. Claude akan memeriksa ulang semua klaim lewat `git diff` dan dengan menjalankan test sendiri.
