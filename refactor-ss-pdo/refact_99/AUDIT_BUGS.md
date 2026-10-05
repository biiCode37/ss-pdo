# Audit Keputusan Codex — Fase 2, Batch 2.3

**Keputusan:** `PASS` untuk cakupan pilot Batch 2.3 pada branch `devmode`. Folder `refact_98` dan arsip sebelumnya tidak diubah. Review mencakup kode aktual, tes integrasi dua pilot, bukti Gemini, serta uji mandiri Codex.

## R97-01 — Urutan stack berubah ketika callback parent berubah

- **Lokasi:** `src/components/ui/ModalShell.tsx` (registrasi `useLayoutEffect` dan `onCloseRef`); `src/components/dashboard/QueueReportIntegration.test.tsx` (tes dua render); `src/components/Dashboard.tsx:352,364` (callback inline).
- **Keparahan awal:** Tinggi.
- **Deskripsi:** Pada revisi terdahulu, callback baru menyebabkan Queue mendaftar ulang dan naik di stack Escape meski Report tampil lebih depan.
- **Dampak user:** Escape berpotensi menutup modal di belakang layar, berbeda dari tombol Back.
- **Mitigasi yang diverifikasi:** `onCloseRef` menyimpan callback terbaru tanpa mengubah efek registrasi selama `isOpen` dan ID tetap. Tes membuka Queue pada render pertama, Report pada render kedua dengan callback baru, lalu memeriksa lapisan visual, stack, Escape, dan Back dalam kedua urutan.
- **Status:** **RESOLVED** pada dua pilot.

## R97-02 — Ref z-index dibaca/ditulis saat render

- **Lokasi:** `src/components/ui/ModalShell.tsx` (`backdropRef` dan efek layout); `src/utils/modalStackCoordinator.ts`.
- **Keparahan awal:** Sedang.
- **Deskripsi:** Implementasi sebelumnya mengakses `assignedZIndexRef.current` pada fase render dan memunculkan peringatan `react(refs)`.
- **Dampak user:** Urutan lapisan rentan tidak selaras pada render ulang atau pembukaan serentak.
- **Mitigasi yang diverifikasi:** Z-index dihitung dan ditempel pada backdrop di `useLayoutEffect`; tes mencakup pembukaan bertahap, serentak, dan callback yang berubah. Lint mandiri tiga file inti revisi menghasilkan 0 warning dan 0 error.
- **Status:** **RESOLVED** pada dua pilot.

## R97-03 — Ketepatan laporan lint

- **Lokasi:** `refactor-ss-pdo/refact_98/evidence/targeted-lint.txt`; `src/utils/historyNavigation.ts:79,94,113,129`.
- **Keparahan awal:** Rendah.
- **Deskripsi:** Bukti lint target `refact_98` berisi 4 warning lama pada parameter `_err` di `historyNavigation.ts`, 0 error; `ModalShell.tsx` tidak lagi menghasilkan warning baru.
- **Dampak user:** Klaim lint yang tidak membedakan warning lama dan baru dapat menyesatkan keputusan kualitas.
- **Mitigasi yang diverifikasi:** Laporan `refact_98` memisahkan empat warning lama dari file inti yang bersih; Codex menjalankan ulang lint tiga file inti dengan 0 warning/0 error.
- **Status:** **RESOLVED** untuk pelaporan targeted lint.

## R99-01 — Catatan dokumentasi dan cakupan verifikasi

- **Lokasi:** `refactor-ss-pdo/refact_98/REPAIR_REPORT.md` bagian Verifikasi Tampilan Mobile dan Root Lint.
- **Keparahan:** Rendah, tidak memblokir Batch 2.3.
- **Deskripsi:** Laporan menyebut kelas Tailwind `bg-white dark:bg-slate-900` pada Queue/Report, sedangkan kode pilot memakai inline style dan CSS variables. Lint root 1.913 warning tidak hanya berisi artefak `dist_old/`; bukti juga memuat warning pada `src/`. Tes Happy-DOM dan build tidak membuktikan kontras visual pada perangkat fisik.
- **Dampak user:** Owner dapat menafsirkan kualitas visual dan kebersihan lint seluruh codebase sebagai sudah tervalidasi penuh.
- **Mitigasi:** Catatan koreksi ini menjadi sumber keputusan review. Pada fase verifikasi menyeluruh, lakukan pemeriksaan visual mobile Light/Dark dan pisahkan warning root menurut sumber tanpa mengklaim semuanya dari `dist_old/`.
- **Status:** **OPEN / TRACKED**, dokumentasi dan quality debt lint historis; tidak ada regresi pilot yang terbukti.

## Batas terbuka dari batch terdahulu

- **R80-10:** **PARTIAL** secara global. Koordinator scroll sudah benar pada Queue dan Report, sementara modal lain masih dapat menulis `body.style.overflow` langsung.
- **R89-01:** **OPEN**. `dist_old/` tetap berada di working tree dan memengaruhi pemindaian root.
