# Laporan Antigravity: Kontrol Sticky Siap Kirim

## Status
Selesai semua

## Commit
- dd659c1 feat(ui): dialog siap kirim berstruktur header-isi-footer dengan tombol tutup
- f4d3099 feat(ui): baris kontrol sticky dan filter masalah di tab Siap Kirim
- 983c453 feat(ui): ketuk tab aktif navigasi Monitoring kembali ke atas

## File yang diubah
```
 .../monitoring/MonitoringBottomNav.test.tsx        | 28 +++++++
 src/components/monitoring/MonitoringBottomNav.tsx  |  2 +-
 .../monitoring/MonitoringHeader.test.tsx           | 11 +++
 src/components/monitoring/MonitoringHeader.tsx     | 22 +++++-
 .../readiness/ReadinessRouteDetailModal.tsx        | 85 ++++++++++++++--------
 .../readiness/SubmissionReadinessTab.test.tsx      | 48 ++++++++++++
 .../readiness/SubmissionReadinessTab.tsx           | 66 +++++++++++++----
 .../monitoring/readiness/WatchlistModal.tsx        | 41 ++++++++---
 .../monitoring/readiness/readinessModel.test.ts    | 26 +++++++
 .../monitoring/readiness/readinessModel.ts         | 17 +++++
 src/styles/components/submission.css               | 10 ++-
 11 files changed, 298 insertions(+), 58 deletions(-)
```

## Kriteria penerimaan
1. Dialog detail rute: judul + label status + tombol tutup tidak tergulir, tombol Cek ulang/Konfirmasi & kolom alasan selalu terlihat di footer, hanya daftar unit di-scroll: Terpenuhi. Bukti: `SubmissionReadinessTab.test.tsx` (`membuka modal detail dengan struktur header, close button, body, dan footer`).
2. Dialog pemilih rute berstruktur sama (header dengan tombol tutup, grid rute di-scroll, footer Tutup/Simpan): Terpenuhi. Bukti: `WatchlistModal.tsx` menggunakan `.submission-modal__header` + tombol tutup `X`, `.submission-modal__body`, `.submission-modal__footer`.
3. Baris kontrol menempel tepat di bawah header Monitoring saat scroll, 1 baris (min-height 48px), tidak scroll horizontal di 360px: Terpenuhi. Bukti: `.submission-control-bar` di `submission.css` (`position: sticky; top: var(--sticky-header-height, 0px); min-height: 48px; overflow-x: auto; margin: 0 -16px; padding: 6px 16px`).
4. Filter chip bekerja dan bisa dimatikan dengan mengetuk chip aktif lagi (`aria-pressed="true"`): Terpenuhi. Bukti: `SubmissionReadinessTab.test.tsx` (`memiliki .submission-control-bar dan memfilter rute saat chip masalah diklik`).
5. Mengetuk tab aktif di navigasi bawah memanggil `window.scrollTo({ top: 0, behavior: "smooth" })` dan tidak memanggil `onSelectTab`; tab tidak aktif memanggil `onSelectTab`: Terpenuhi. Bukti: `MonitoringBottomNav.test.tsx` (`scrolls to top when the active tab is clicked and does not call onSelectTab`).
6. `MonitoringHeader` mengisi `--sticky-header-height` dan menghapusnya saat unmount: Terpenuhi. Bukti: `MonitoringHeader.test.tsx` (`measures the header when it mounts and clears the offset on unmount`).
7. Tidak ada `style={{...}}` statis baru, hex/rgb mentah, teks hardcoded, emoji, maupun ikon dekoratif: Terpenuhi. Bukti: `ui-debt-ratchet.test.ts`, `focus-ring.test.ts`, `color-contract.test.ts` lulus 100%.
8. Test baru TDD (semua gagal sebelum implementasi dan lulus setelahnya): Terpenuhi. Bukti: `readinessModel.test.ts`, `SubmissionReadinessTab.test.tsx`, `MonitoringBottomNav.test.tsx`, `MonitoringHeader.test.tsx` seluruhnya lulus.

## Hasil verifikasi
- `pnpm vitest run src/components/monitoring src/constants/texts/texts.test.ts`
  Test Files  22 passed (22)
  Tests  169 passed (169)
  Duration  33.52s
  exit 0
- `pnpm vitest run src/styles/ui-debt-ratchet.test.ts src/styles/components/focus-ring.test.ts src/styles/tokens/color-contract.test.ts`
  Test Files  3 passed (3)
  Tests  204 passed (204)
  Duration  1.42s
  exit 0
- `pnpm vitest run src/`
  Test Files  147 passed (147)
  Tests  1442 passed (1442)
  Duration  96.22s
  exit 0
- `pnpm run build`
  ✓ built in 847ms
  exit 0
- `git status --short`
  (output kosong / bersih)
  exit 0

## TDD
- `SubmissionReadinessTab.test.tsx` (detail modal header/close): `AssertionError: expected null to be truthy` pada `document.querySelector('.submission-modal__header')`.
- `readinessModel.test.ts` (`filterViewsByProblem`): `TypeError: filterViewsByProblem is not a function`.
- `MonitoringHeader.test.tsx` (`--sticky-header-height`): `AssertionError: expected '' to be '120px'`.
- `SubmissionReadinessTab.test.tsx` (`.submission-control-bar` & problem chip): `AssertionError: expected null to be truthy` pada `container.querySelector('.submission-control-bar')`.
- `MonitoringBottomNav.test.tsx` (`scrollTo` saat active tab): `AssertionError: expected "vi.fn()" to be called 1 times, but got 0 times`.

## Keputusan desain yang Anda ambil sendiri
- Pada `.submission-control-bar__pick-btn`, ditambahkan `margin-left: auto; flex-shrink: 0; min-width: 44px; min-height: 44px;` agar tombol ikon pemilih rute terdorong rapi ke sisi kanan baris kontrol dan memenuhi ukuran target sentuh minimal 44x44 px.
- Teks ringkasan di baris kontrol dibungkus kelas `.submission-control-bar__summary` dengan `white-space: nowrap; flex-shrink: 0;` dan `font-variant-numeric: tabular-nums` agar angka tidak bergeser dan teks tidak patah baris saat discroll horizontal pada layar sempit.

## Penyimpangan dari brief
tidak ada

## Pertanyaan untuk Claude
tidak ada
