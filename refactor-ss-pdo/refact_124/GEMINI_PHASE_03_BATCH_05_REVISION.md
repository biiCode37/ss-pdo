# Instruksi Revisi untuk Gemini — Fase 3 Batch 3.5

Keputusan Codex atas `refact_123`: **REVISION_REQUIRED**. Kerjakan temuan di bawah, lalu berhenti pada `READY_FOR_REVIEW`. Jangan mulai fase berikutnya.

## R124-01: Back berulang selama animasi 220 ms

Alur saat ini: `historyNavigation.handlePopState` mengeluarkan entri topmost sebelum `BusInputModal.handleDismiss` selesai menutup modal. Back kedua dalam 220 ms mengenai modal bawah/root. Perbaiki koordinasi Back selama fase penutupan dengan perubahan paling sempit yang aman untuk modal lain. Jangan menghapus animasi atau memanggil `onClose` dua kali.

Tes wajib:

1. Dua modal terdaftar (Bus Input + modal atas). Back pertama menutup hanya modal atas; Back kedua yang terjadi sebelum modal atas unmount **tidak** memulai penutupan Bus Input. Setelah atas selesai/unmount, Back berikutnya baru menutup Bus Input.
2. Bus Input sendiri: dua Back dalam <220 ms menghasilkan satu `onClose`, tanpa pop/navigasi root selama masih tampil. Setelah tertutup, history dan scroll lock pulih.
3. Uji Escape, backdrop, tombol X/Batal, serta tutup paksa melalui prop `isOpen=false` tetap idempotent. Pertahankan urutan `onSave`/`onDismiss` dan kontrak form.

Gunakan API stack/koordinator yang ada; jangan membangun sistem navigasi baru. Jika perubahan perlu menyentuh `historyNavigation.ts` atau `ModalShell.tsx`, verifikasi ulang semua tes stack, Queue/Report, dan seluruh `src/`. Perlakukan SweetAlert2 sebagai stack terpisah: jangan klaim Escape topmost di atas SweetAlert2 tanpa tes yang membuktikannya.

## R124-02: Akurasi laporan

Tulis errata di folder revisi baru. Angka `340/908` di `refact_123/evidence/file-sizes.txt` benar sebagai **baris tidak kosong**, sementara jumlah baris fisik saat audit adalah `361/1062`. Jelaskan metode hitung secara eksplisit setelah revisi. Pisahkan hasil tes yang nyata dari asumsi visual/SweetAlert2. Jangan mengedit arsip `refact_123`.

## Gerbang penyerahan

- Hanya branch `devmode`; pertahankan perubahan lokal. Jangan reset, stash, clean, commit, push, atau menyentuh branch utama.
- Buat folder `refact_N` baru setelah `refact_124`, berisi `AUDIT_BUGS.md`, `REPAIR_REPORT.md`, **Before vs After**, **Case: Skenario Lapangan**, dan bukti tes/build/lint/Graphify.
- Jalankan tes target dan seluruh `src/`, `tsc -b`, build PWA, lint terarah, serta `graphify update .` setelah perubahan kode. Catat keterbatasan visual mobile secara jujur.
- Saat selesai kirim path folder revisi dan status `READY_FOR_REVIEW` untuk audit Codex.
