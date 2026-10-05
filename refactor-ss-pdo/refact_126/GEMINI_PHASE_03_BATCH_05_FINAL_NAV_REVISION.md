# Instruksi Gemini — Revisi Riwayat Back Batch 3.5

Keputusan atas `refact_125`: **REVISION_REQUIRED** untuk R126-01. R124-02 sudah **CLOSED**. Kerjakan hanya sinkronisasi riwayat Back, lalu berhenti pada `READY_FOR_REVIEW`.

## Masalah yang harus diperbaiki

`isDismissing` menahan callback Back ganda, tetapi `history.state` hilang dari modal Bus setelah dua Back nyata pada dua modal bertumpuk. Urutan reproduksi: `top -> bus -> rootGuard -> push(top) -> cleanup back -> rootGuard`, sementara Bus masih terbuka. Tes saat ini hanya `dispatchEvent(popstate)` sehingga state browser tidak berubah.

## Kontrak penerimaan

1. Dengan Bus Input di bawah modal lain: jalankan `history.back()` nyata pertama dan tunggu `popstate`. Modal atas memulai penutupan; Bus tetap terbuka. Jalankan `history.back()` nyata kedua sebelum modal atas unmount; callback Bus tetap tidak dipanggil. Setelah atas unmount, `history.state.pdoNavId` harus sesuai modal Bus dan Back berikutnya menutup Bus, bukan keluar/root.
2. Dengan Bus Input tunggal: dua Back nyata dalam <220 ms menghasilkan satu `onClose`; setelah unmount state kembali ke root guard dan scroll lock kembali ke nilai awal.
3. Jalur tutup UI (X/Batal/backdrop) diikuti Back selama animasi harus memenuhi kontrak yang sama. Verifikasi urutan `history.length`/`history.state` yang relevan tanpa mengandalkan event sintetis saja.
4. Jaga modal Queue/Report, `ModalShell`, SweetAlert2 hardware Back, Escape topmost, timer 220 ms, fokus, payload/offline queue, serta semantik form. Pilih perubahan kecil pada koordinasi history yang ada; hindari sistem navigasi baru.

## Gerbang penyerahan

- Hanya branch `devmode`; jangan reset, stash, clean, commit, push, atau menyentuh branch utama.
- Buat folder `refact_N` baru setelah `refact_126` dengan `AUDIT_BUGS.md`, `REPAIR_REPORT.md`, **Before vs After**, **Case: Skenario Lapangan**, dan bukti reproduksi riwayat.
- Jalankan tes target history/Bus/Queue-Report, seluruh `src/`, `tsc -b`, build PWA, lint terarah, lalu `graphify update .` setelah perubahan kode. Catat batas verifikasi mobile fisik secara jujur.
- Kirim path folder revisi dan status `READY_FOR_REVIEW` untuk audit Codex. Jangan mulai fase berikutnya.
