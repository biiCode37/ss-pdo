# Audit Codex — Revisi Batch 2.3 (`refact_96`)

**Status gerbang:** REVISI DIPERLUKAN. Review dilakukan pada branch `devmode`. Implementasi `refact_96` memperbaiki portal stabil dan menambahkan uji fokus, tetapi sinkronisasi lapisan visual dengan stack dismiss belum benar pada alur pembukaan bertahap yang dipakai aplikasi. Arsip `refact_94`–`refact_96` tidak diubah.

## R97-01 — Pendaftaran ulang callback mengubah stack tanpa mengubah lapisan visual

- **Lokasi kode:** `src/components/ui/ModalShell.tsx:193-229` (efek keyboard bergantung pada `onClose`); `src/components/Dashboard.tsx:352,364` (callback `onClose` dibuat inline setiap render); `src/components/dashboard/DashboardModals.tsx:119-157` (Report dirender sebelum Queue); `src/utils/modalStackCoordinator.ts:18-32`.
- **Keparahan:** Tinggi.
- **Deskripsi:** Ketika Queue sudah terbuka lalu Report dibuka, parent `Dashboard` merender ulang dan menghasilkan callback `onClose` baru untuk kedua modal. Dalam fase efek, Report mendaftar ke stack, lalu Queue yang lebih akhir dalam pohon komponen melepas dan mendaftar ulang listener karena dependensi `onClose` berubah. Queue menjadi entri stack terakhir, sementara z-index Queue tetap 100 dan Report 99999. Akibatnya, Escape menarget Queue yang berada di belakang Report. Jalur Back memakai stack lain dan dapat menarget Report: kedua tombol tidak lagi konsisten.
- **Dampak user:** Pengguna melihat Report di depan tetapi Escape menutup Queue di belakang. Perilaku penutupan berbeda antara Escape dan Back pada dua dialog yang sama.
- **Mitigasi:** Pertahankan identitas dan posisi registrasi modal selama `isOpen=true`, meski fungsi `onClose` berubah. Perbarui callback aktif tanpa unregister/re-register modal yang tetap terbuka. Pastikan satu sumber urutan modal dipakai atau kedua stack disinkronkan dengan lapisan visual. Tambahkan tes integrasi **Queue buka terlebih dahulu → render parent lagi dengan callback baru → Report buka → Escape dan Back menutup Report tepat sekali**. Periksa juga urutan sebaliknya dan penutupan modal bawah lebih dulu.
- **Bukti:** `evidence/stack-order-reproduction.case.tsx` adalah probe yang sebelumnya dijalankan sebagai tes Vitest. Probe lulus dengan membuktikan kondisi salah: `zIndex(Report) > zIndex(Queue)` sekaligus `isTopmostModal("queue-modal") === true` setelah dua render. Hasil eksekusi dicatat di `evidence/REPRO_RESULT.md`. Tes integrasi `refact_96` untuk label “Queue opened first” membuka kedua modal dalam satu render, sehingga tidak mencakup kejadian ini.

## R97-02 — Kalkulasi z-index memakai ref saat render dan memunculkan peringatan baru

- **Lokasi kode:** `src/components/ui/ModalShell.tsx:94-107`; `refactor-ss-pdo/refact_96/evidence/targeted-lint.txt`.
- **Keparahan:** Sedang.
- **Deskripsi:** `assignedZIndexRef.current` dibaca dan ditulis selama render. Oxlint memberi tujuh peringatan `react(refs)` pada kode baru dan menyatakan React Compiler melewati optimasi komponen. Nilai juga bergantung pada stack eksternal yang didaftarkan baru setelah commit, sehingga pembukaan serentak dua modal tidak dapat menghitung urutan lapisan dari state stack saat render.
- **Dampak user:** Urutan visual dapat tidak sesuai urutan pembukaan pada kasus transisi tertentu; fondasi modal baru memiliki perilaku render yang sulit diprediksi dan memperbesar risiko regresi.
- **Mitigasi:** Hitung dan tetapkan lapisan melalui lifecycle/effect atau state yang aman untuk React, tanpa membaca atau menulis ref untuk hasil render. Pastikan uji pembukaan satu per satu dan serentak, serta callback yang berubah, semuanya menyelaraskan visual, Escape, dan Back. Pertahankan solusi sekecil mungkin.

## R97-03 — Hasil lint dilaporkan terlalu bersih

- **Lokasi:** `refactor-ss-pdo/refact_96/REPAIR_REPORT.md:17,171`; `refactor-ss-pdo/refact_96/AUDIT_BUGS.md` bagian R89-01; `refactor-ss-pdo/refact_96/evidence/targeted-lint.txt`.
- **Keparahan:** Rendah.
- **Deskripsi:** Bukti targeted lint sebenarnya menyatakan **11 warnings, 0 errors**. Empat peringatan lama berasal dari `historyNavigation.ts`, tetapi tujuh peringatan `react(refs)` berasal dari `ModalShell.tsx` yang baru direvisi. Klaim bahwa file baru/dimodifikasi bebas dari peringatan baru tidak sesuai bukti.
- **Dampak user:** Project owner dapat menganggap fondasi modal telah lolos lint bersih meski masih ada peringatan baru yang terkait langsung dengan R97-02.
- **Mitigasi:** Perbaiki peringatan baru di `ModalShell.tsx`, lalu laporkan hitungan lint target secara tepat dalam folder revisi baru. Peringatan historis di file lain harus dipisahkan secara jujur; jangan ubah arsip `refact_96`.

## Temuan yang membaik dan catatan terbuka

- **R95-01:** Portal Report sekarang stabil saat buka/tutup; tes transisi mempertahankan node input dan state anak. Diterima pada review ini.
- **R95-03:** Tes fokus tumpukan dan Tab/Shift+Tab telah ditambahkan. Diterima untuk cakupan pilot yang diuji; verifikasi perangkat nyata tetap belum dilakukan.
- **R95-04:** Sebagian besar klaim historis sudah dikoreksi, tetapi ketepatan laporan lint perlu R97-03.
- **R80-10:** Tetap PARTIAL secara global karena modal lain masih menulis `body.style.overflow` langsung.
- **R89-01:** Tetap OPEN; `dist_old/` dipertahankan.
