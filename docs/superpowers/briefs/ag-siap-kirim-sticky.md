# Brief Antigravity: Kontrol Tetap Terjangkau Saat Scroll — Tab Siap Kirim

**Dari:** Claude (reviewer & penanggung jawab arsitektur)
**Untuk:** Antigravity (pelaksana)
**Tanggal:** 07 November 2026
**Nomor dokumentasi:** refact_224 (ditulis Claude; Anda **tidak** menulis folder `refactor-ss-pdo`)

Baca brief ini sampai habis sebelum menyentuh file. Kalau ada yang bertentangan atau tidak jelas, **berhenti dan tulis pertanyaannya di laporan**; jangan menebak. Tugas ini sedikit lebih terbuka daripada pilot: sebagian kode Anda tulis sendiri, tetapi **kriteria penerimaan di bagian 4 wajib terpenuhi semua**.

## 1. Konteks

Aplikasi dipakai petugas lapangan dengan satu tangan. Saat ini di tab **Siap Kirim** (halaman Monitoring):
- Dialog detail rute ("Kelengkapan JAK.58"): judul dan tombol aksi ikut tergulir. Pengguna harus scroll ke atas untuk tahu rute apa yang sedang dilihat, dan ke bawah untuk menekan Konfirmasi. Dialog juga **tidak punya tombol tutup**.
- Daftar rute: ringkasan dan tombol pemilih rute hilang saat menggulir.

Aturan barunya sudah ditulis Claude di **`.agents/rules/ui-consistency.md` bagian 8a**. Baca bagian itu dulu; itulah standar yang dinilai.

Kode yang relevan (sudah ada di `devmode`):
- `src/components/monitoring/readiness/SubmissionReadinessTab.tsx`
- `src/components/monitoring/readiness/ReadinessRouteDetailModal.tsx`
- `src/components/monitoring/readiness/WatchlistModal.tsx`
- `src/components/monitoring/readiness/readinessModel.ts`
- `src/styles/components/submission.css`
- `src/components/monitoring/MonitoringBottomNav.tsx`
- `src/components/monitoring/MonitoringHeader.tsx`
- Pola acuan tinggi header sticky: `src/components/dashboard/DashboardHeader.tsx` (`useLayoutEffect` + `ResizeObserver` → `--sticky-header-height`) beserta test-nya di `DashboardHeader.test.tsx`.

## 2. Tempat kerja (WAJIB)

- Folder: **`D:\MINE\SS_PDO-ag`**. Branch: **`ag/siap-kirim-sticky`** (sudah dibuat dari `devmode` terbaru). Pastikan dengan `git branch --show-current`.
- **Jangan** bekerja di `D:\MINE\SS_PDO`.

## 3. Pekerjaan

### A. Dialog detail rute dan dialog pemilih rute: struktur header – isi – footer

Ubah `ReadinessRouteDetailModal.tsx` dan `WatchlistModal.tsx` agar isi `ModalShell` berstruktur:

```tsx
<div className="submission-modal__header">
  <h2 className="submission-modal__title">{judul}</h2>
  {/* Detail rute saja: label status rute (ui-status + data-tone dari STATE_TONE di ReadinessRouteCard) */}
  <button type="button" className="ui-button ui-button--secondary submission-modal__close"
    aria-label={TEXT_MONITORING.SUBMISSION.BTN_CLOSE} onClick={onClose}>
    <X size={20} aria-hidden="true" />
  </button>
</div>
<div className="submission-modal__body">{/* daftar unit / grid rute — HANYA bagian ini yang di-scroll */}</div>
<div className="submission-modal__footer">{/* aksi; untuk detail rute: kolom alasan (bila ada masalah) + Cek ulang + Konfirmasi */}</div>
```

CSS di `submission.css`. Nilai di bawah sudah sesuai skala proyek; boleh disesuaikan **hanya** dengan nilai dari skala yang sama:

```css
.submission-modal { display: flex; flex-direction: column; overflow: hidden; padding: 0; gap: 0; }
.submission-modal__header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--color-border-subtle); }
.submission-modal__header .submission-modal__title { flex: 1 1 auto; min-width: 0; }
.submission-modal__close { min-width: 44px; min-height: 44px; padding: 0; }
.submission-modal__body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }
.submission-modal__footer { display: flex; flex-direction: column; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--color-border-subtle); background: var(--color-surface-raised); }
```

`.submission-modal` yang lama tetap memakai `max-height: min(80dvh, 640px)`. Hapus/ganti properti yang bertentangan (`overflow-y`, `padding`, `gap`), jangan menduplikasi selektor. Kolom alasan (`textarea`, 2 baris: `rows={2}`) dan teks petunjuknya pindah ke footer di atas tombol. `.submission-actions` tetap dipakai untuk baris tombol.

### B. Baris kontrol sticky di daftar rute

1. **`MonitoringHeader.tsx`**: salin pola `DashboardHeader`. Pasang `ref` pada elemen `<header>`, lalu `useLayoutEffect` + `ResizeObserver` yang mengisi `document.documentElement.style --sticky-header-height` dengan `offsetHeight` header dan **menghapusnya saat unmount**. Jangan mengubah gaya header yang lain.
2. **`readinessModel.ts`**: tambahkan fungsi murni berikut (beserta test di `readinessModel.test.ts`):
   ```ts
   export type ProblemFilter = 'all' | 'janggal' | 'belum' | 'changed';
   export function filterViewsByProblem(views: RouteReadinessView[], filter: ProblemFilter): RouteReadinessView[]
   // 'janggal' → state JANGGAL; 'belum' → BELUM_DIISI | NO_DATA | FORMAT_ERROR; 'changed' → CHANGED_AFTER_CONFIRM; 'all' → views apa adanya
   ```
3. **`SubmissionReadinessTab.tsx`**: urutan isi menjadi:
   1. segmen Kelengkapan | Armada (tidak sticky);
   2. pita tunggakan (tidak sticky);
   3. pesan error (bila ada);
   4. pilihan "Semua rute | Pantauan saya (n)" (tidak sticky);
   5. **`<div className="submission-control-bar">` yang sticky**, berisi dalam **1 baris**:
      - teks ringkas "Siap kirim x/y" (`TEXT_MONITORING.SUBMISSION.SUMMARY`);
      - chip filter masalah (`button.ui-chip-btn` dengan `aria-pressed`): "Janggal n" (tone `--error`), "Belum diisi n" (`--error`), "Berubah n" (`--warning`). Setiap chip hanya tampil bila n > 0. Mengetuk chip aktif lagi mengembalikan filter ke `'all'`.
      - tombol ikon **Pilih rute** (`ui-button ui-button--secondary`, ikon lucide `ListChecks` ukuran 20, `aria-label={TEXT_MONITORING.SUBMISSION.PICK_ROUTES}`, minimal 44×44 px) yang membuka `WatchlistModal`.
   6. daftar kartu = `filterViewsByProblem(view setelah filter pantauan, problemFilter)`.

   CSS:
   ```css
   .submission-control-bar { position: sticky; top: var(--sticky-header-height, 0px); z-index: 5; display: flex; align-items: center; gap: 8px; min-height: 48px; padding: 6px 16px; margin: 0 -16px; background: var(--color-surface-canvas); border-bottom: 1px solid var(--color-border-subtle); overflow-x: auto; }
   ```
   (`margin: 0 -16px` + `padding` 16 supaya latar sticky selebar layar di dalam `.submission-tab` yang ber-padding 16.) Baris ini **tidak boleh** menyebabkan scroll horizontal halaman di lebar 360 px; kalau isinya terlalu lebar, yang boleh scroll horizontal hanya baris itu sendiri (`overflow-x: auto`).

### C. Ketuk tab aktif = kembali ke atas

Di `MonitoringBottomNav.tsx`, `onClick` tombol menjadi:
```tsx
onClick={() => (isActive ? window.scrollTo({ top: 0, behavior: "smooth" }) : onSelectTab(item.id))}
```
Tanpa teks bantuan dan tanpa elemen baru.

## 4. Kriteria penerimaan (semua wajib)

1. Dialog detail rute: judul + label status + tombol tutup **tidak ikut tergulir**. Tombol Cek ulang / Konfirmasi (dan kolom alasan bila ada masalah) **selalu terlihat** di bawah. Hanya daftar unit yang di-scroll.
2. Dialog pemilih rute memakai struktur yang sama (header dengan tombol tutup, grid rute di-scroll, footer Tutup/Simpan).
3. Baris kontrol menempel tepat di bawah header Monitoring saat menggulir. Tingginya 1 baris (±48 px), dan halaman tidak bisa digeser horizontal di 360 px.
4. Filter chip bekerja dan bisa dimatikan dengan mengetuk chip yang aktif lagi. Chip aktif memakai `aria-pressed="true"` (gaya aktif dari kelas yang ada, **tanpa** gaya aktif baru).
5. Mengetuk tab aktif di navigasi bawah memanggil `window.scrollTo({ top: 0, behavior: "smooth" })` dan **tidak** memanggil `onSelectTab`. Tab tidak aktif tetap memanggil `onSelectTab`.
6. `MonitoringHeader` mengisi `--sticky-header-height` dan menghapusnya saat unmount.
7. Tidak ada `style={{...}}` statis baru, hex/rgb mentah, teks UI hardcoded, emoji, maupun ikon dekoratif. Semua teks dari `TEXT_MONITORING`. Kalau butuh teks baru, tambahkan di `text_monitoring.ts` **dan** test-nya di `texts.test.ts`.
8. Test baru (TDD: tulis test dulu, jalankan dan pastikan gagal, lalu implementasi):
   - `readinessModel.test.ts`: `filterViewsByProblem` untuk keempat nilai filter.
   - `SubmissionReadinessTab.test.tsx`: mengetuk chip "Janggal" hanya menampilkan rute janggal; mengetuk lagi menampilkan semua; elemen `.submission-control-bar` ada.
   - `MonitoringBottomNav.test.tsx`: tab aktif → `window.scrollTo` dipanggil 1× dan `onSelectTab` tidak; tab tidak aktif → `onSelectTab` dipanggil.
   - `MonitoringHeader.test.tsx`: variabel `--sticky-header-height` terisi saat mount dan terhapus saat unmount (contoh pola: `DashboardHeader.test.tsx`).
   - Test lama yang sudah ada **harus tetap lulus**. Jangan menghapus atau melemahkan test lama.

## 5. File yang BOLEH diubah (hanya ini)

`src/components/monitoring/readiness/SubmissionReadinessTab.tsx`, `SubmissionReadinessTab.test.tsx`, `ReadinessRouteDetailModal.tsx`, `WatchlistModal.tsx`, `readinessModel.ts`, `readinessModel.test.ts`, `src/components/monitoring/MonitoringBottomNav.tsx`, `MonitoringBottomNav.test.tsx`, `src/components/monitoring/MonitoringHeader.tsx`, `MonitoringHeader.test.tsx`, `src/styles/components/submission.css`, `src/constants/texts/text_monitoring.ts` + `texts.test.ts` (hanya bila butuh teks baru), dan laporan `docs/superpowers/briefs/reports/ag-siap-kirim-sticky-report.md`.

## 6. Larangan keras

- **Jangan** push, merge, rebase, ganti branch, atau menyentuh `devmode`/`main`.
- **Jangan** `git add -A` / `git add .`. Tambahkan file satu per satu. `graphify-out/` tidak boleh ikut di-commit.
- **Jangan** menaikkan `BASELINE` di `src/styles/ui-debt-ratchet.test.ts`, menambah dependency, atau menyentuh `supabase/**`, `package.json`, dan lockfile.
- **Jangan** mengubah logika data, service, hook, atau Realtime (`useSubmissionReadiness.ts`, `submissionReadinessService.ts` tidak boleh disentuh).
- Sebelum menampilkan pesan penutup, **`git status --short` wajib bersih** (kecuali `graphify-out/`). Semua perubahan Anda harus sudah di-commit.

## 7. Verifikasi wajib (dari `D:\MINE\SS_PDO-ag`)

```bash
pnpm vitest run src/components/monitoring src/constants/texts/texts.test.ts
pnpm vitest run src/styles/ui-debt-ratchet.test.ts src/styles/components/focus-ring.test.ts src/styles/tokens/color-contract.test.ts
pnpm vitest run src/
pnpm run build
git status --short
```

Semua test harus lulus dan build exit 0. Salin baris ringkasan output asli ke laporan. Kalau ada yang gagal dan tidak bisa diperbaiki dalam batas brief, berhenti dan laporkan dengan output asli.

## 8. Commit

- `feat(ui): dialog siap kirim berstruktur header-isi-footer dengan tombol tutup`
- `feat(ui): baris kontrol sticky dan filter masalah di tab Siap Kirim`
- `feat(ui): ketuk tab aktif navigasi Monitoring kembali ke atas`
- Laporan: `docs: laporan Antigravity kontrol sticky siap kirim`

## 9. Format laporan

Tulis ke `docs/superpowers/briefs/reports/ag-siap-kirim-sticky-report.md`:

```markdown
# Laporan Antigravity: Kontrol Sticky Siap Kirim

## Status
Selesai semua / Sebagian / Terhenti (alasan)

## Commit
(hash + pesan setiap commit)

## File yang diubah
(output `git diff --stat devmode...HEAD`, apa adanya)

## Kriteria penerimaan
(nomor 1–8: terpenuhi/tidak + bukti singkat: nama test atau cara memeriksa)

## Hasil verifikasi
(setiap perintah di bagian 7 + baris ringkasan output asli)

## TDD
(untuk setiap test baru: baris error saat test gagal sebelum implementasi)

## Keputusan desain yang Anda ambil sendiri
(apa dan kenapa, misalnya penyesuaian nilai CSS atau letak elemen)

## Penyimpangan dari brief
(tidak ada / daftar + alasan + bukti)

## Pertanyaan untuk Claude
(tidak ada / daftar)
```

## 10. Penutup (WAJIB)

Setelah laporan di-commit dan `git status` bersih, tampilkan **persis** blok ini (isi bagian `<...>`):

```
Pesan untuk Claude:
AG selesai: brief ag-siap-kirim-sticky · branch ag/siap-kirim-sticky · commit terakhir <hash> · laporan docs/superpowers/briefs/reports/ag-siap-kirim-sticky-report.md · status <selesai / sebagian / terhenti> · penyimpangan <ada/tidak> · pertanyaan <ada/tidak>
```

Jujurlah dalam laporan. Claude akan memeriksa ulang semua klaim lewat `git diff`, menjalankan test sendiri, dan memverifikasi tampilan di browser.
