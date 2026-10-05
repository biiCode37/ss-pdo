# Audit Codex — Fase 2, Batch 2.3

Status review: **REVISI DIPERLUKAN**. Audit pada branch `devmode`, berdasarkan implementasi `refact_94`, paket kerja `refact_93/GEMINI_PHASE_02_BATCH_03.md`, kode aktual, dan uji ulang. Arsip terdahulu tidak diubah.

## R95-01 — `keepMounted` tidak menjaga state DOM saat portal berganti

- **Lokasi:** `src/components/pdoReport/ReportModalLayout.tsx:38`; `src/components/ui/ModalShell.tsx:225-231`; `src/components/pdoReport/ReportModalLayout.test.tsx:62-82`.
- **Keparahan:** Tinggi.
- **Deskripsi:** Pada aplikasi produksi, `disablePortal={isTestEnv || !isOpen}` berubah dari `false` ketika terbuka menjadi `true` ketika tertutup. `ModalShell` lalu mengganti hasil `createPortal(...)` dengan elemen inline. Pergantian tipe pohon render ini melepas dan memasang ulang subtree DOM. `keepMounted={true}` dan `display:none` tidak mencegahnya. Tes hanya merender keadaan awal tertutup, serta selalu memakai `isTestEnv=true`, sehingga tidak menguji transisi portal produksi.
- **Dampak user:** Isi input DOM yang belum tersinkron ke state React, fokus, posisi scroll internal, atau state lokal komponen anak dapat hilang saat dialog laporan ditutup dan dibuka lagi. Laporan saat ini mengklaim state form terjaga tanpa bukti transisi yang relevan.
- **Mitigasi:** Pertahankan lokasi render/portal yang stabil selama siklus buka-tutup ketika `keepMounted=true`; jangan ganti target portal berdasarkan `isOpen`. Tambahkan tes transisi **buka → ketik → tutup → buka kembali** dalam jalur portal yang setara produksi, termasuk state lokal anak dan DOM input. Jika state yang dipertahankan sengaja berbeda, jelaskan kontraknya secara tepat.
- **Rujukan teknis:** [Dokumentasi resmi React `createPortal`](https://react.dev/reference/react-dom/createPortal) menjelaskan bahwa perubahan target portal dapat membuat ulang konten.

## R95-02 — Urutan dismiss tidak sesuai lapisan visual dua pilot

- **Lokasi:** `src/components/dashboard/QueueModal.tsx:35`; `src/components/pdoReport/ReportModalLayout.tsx:37`; `src/utils/modalStackCoordinator.ts:18-39`; `src/components/ui/ModalShell.tsx:151-166`; `src/hooks/useMobileBackHandler.ts:18-34`.
- **Keparahan:** Sedang.
- **Deskripsi:** `QueueModal` memakai `z-index:100`, `ReportModalLayout` memakai `z-index:99999`, sedangkan Escape dan Android Back memakai urutan registrasi LIFO. Jika laporan terbuka lalu antrean dibuka, antrean didaftarkan paling akhir tetapi tetap berada **di bawah** laporan secara visual. Escape/Back dapat menutup dialog yang tidak terlihat sebagai lapisan teratas.
- **Dampak user:** Tombol Escape/Back tampak tidak bereaksi terhadap dialog terdepan, atau menutup antrean di belakang tanpa kejelasan.
- **Mitigasi:** Satukan urutan visual dan urutan dismiss untuk kedua pilot. Pertahankan tampilan normal masing-masing saat berdiri sendiri. Tambahkan tes integrasi yang membuka kedua pilot dalam dua urutan dan memeriksa lapisan visual, Escape, serta Back.

## R95-03 — Fokus modal bertumpuk belum dijaga

- **Lokasi:** `src/components/ui/ModalShell.tsx:113-142`; `src/components/ui/ModalShell.test.tsx:125-177`.
- **Keparahan:** Sedang.
- **Deskripsi:** Efek cleanup tiap modal selalu memulihkan fokus ke elemen pemicu masing-masing. Bila modal A ditutup sementara B tetap terbuka, cleanup A dapat memindahkan fokus keluar dari B. Selain itu, tidak ada pengendalian Tab untuk menahan fokus dalam dialog aktif, walau `aria-modal=true` dipakai. Tes fokus hanya mencakup satu dialog.
- **Dampak user:** Pengguna keyboard atau pembaca layar dapat berpindah ke kontrol di belakang dialog aktif dan kehilangan konteks kerja.
- **Mitigasi:** Pulihkan fokus hanya bila aman terhadap modal aktif yang lain; ketika B tetap terbuka, fokus harus tetap di dalam B. Tambahkan uji Tab/Shift+Tab pada dialog aktif dan urutan tutup A dahulu. Hindari perubahan perilaku fokus saat tidak ada modal lain.
- **Rujukan teknis:** [Pola dialog modal WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) menempatkan fokus awal di dalam dialog dan menjaga Tab/Shift+Tab di dalamnya.

## R95-04 — Bukti dan narasi laporan melampaui verifikasi aktual

- **Lokasi:** `refactor-ss-pdo/refact_94/AUDIT_BUGS.md`; `refactor-ss-pdo/refact_94/REPAIR_REPORT.md`; `src/components/ui/ModalShell.test.tsx`.
- **Keparahan:** Rendah.
- **Deskripsi:** Dokumen menyebut `ReportModalLayout` sebelumnya memiliki listener Back/portal ganda, padahal diff menunjukkan masing-masing satu; menyebut `aria-hidden=true` pada keadaan tertutup padahal atribut tidak ada; menyebut nama props `titleId` dan `dismissOnBackdrop` yang tidak ada; serta menyatakan Back topmost dan pelestarian state form telah teruji, sementara tes tidak mengeksekusi alur tersebut. `role=dialog` dan `aria-modal` sudah ada, tetapi klaim kepatuhan WAI-ARIA penuh belum didukung oleh pengelolaan fokus.
- **Dampak user:** Project owner bisa menganggap risiko sudah tertutup lalu melanjutkan refactor di atas fondasi yang belum stabil.
- **Mitigasi:** Koreksi klaim dalam **folder revisi baru**, tanpa mengubah `refact_94`; sertakan hasil tes Back, portal, fokus, dan batasan visual yang benar.

## Catatan terbuka yang tidak diputuskan ulang

- **R80-10:** Tetap **PARTIAL** secara global; `BusInputModal` dan `UnitDetailModal` masih menulis `body.style.overflow` secara langsung.
- **R89-01:** `dist_old/` masih membuat noise pada pemindaian root; tetap dipertahankan dan tidak dihapus.
