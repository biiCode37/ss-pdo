# Audit Codex — Fase 3 Batch 3.5 (Shell Modal Bus)

Tanggal: 29 September 2026  
Branch: `devmode`  
Paket yang ditinjau: `refactor-ss-pdo/refact_123/`  
Keputusan: **REVISION_REQUIRED**

## R124-01 — Back berulang dapat melewati modal yang masih tampil

- **Lokasi kode:** `src/utils/historyNavigation.ts:45-66` (`handlePopState`), `src/components/busCard/BusInputModal.tsx:50-57` (`handleDismiss`), `src/components/ui/ModalShell.tsx:106-114` (`useMobileBackHandler`).
- **Keparahan:** Sedang.
- **Deskripsi:** `handlePopState` langsung `navigationStack.pop()` sebelum menjalankan `onBack()`. Pada Bus Input, `onBack()` memulai animasi dan baru memanggil `onClose()` setelah 220 ms. Selama jeda tersebut Bus Input masih terpasang, terlihat, serta memegang scroll lock, tetapi tidak lagi ada di navigation stack. Tekanan Back kedua sebelum 220 ms akan diteruskan ke dialog di bawahnya atau ke jalur Back root. Guard `isClosingRef` tidak melindungi jalur ini karena callback Bus Input tidak dipanggil lagi.
- **Dampak user:** Double-tap Back pada ponsel dapat menutup dialog di belakang atau memicu navigasi root sementara form Bus Input masih tampak, sehingga draft atau konteks pengguna berisiko hilang. Escape tidak memiliki celah yang sama karena entri `modalStackCoordinator` tetap terdaftar sampai unmount.
- **Mitigasi:** Koordinasikan periode penutupan dengan stack Back sehingga input Back tambahan selama dialog teratas masih terlihat tidak diteruskan ke lapisan bawah. Pertahankan semantik satu Back per modal setelah modal teratas benar-benar selesai menutup. Buat tes integrasi dua modal dengan dua `popstate` dalam <220 ms, lalu uji Back berikutnya setelah unmount, termasuk pemulihan history dan scroll lock. Pilih perubahan terkecil yang menjaga perilaku modal lain.
- **Status:** OPEN, penahan Batch 3.5.

## R124-02 — Klaim bukti melampaui tes dan metode hitung baris tidak dijelaskan

- **Lokasi dokumen:** `refactor-ss-pdo/refact_123/REPAIR_REPORT.md` bagian Before vs After, Skenario 2, dan `evidence/file-sizes.txt`.
- **Keparahan:** Rendah.
- **Deskripsi:** Laporan menyatakan Back pada modal bertumpuk aman secara umum, tetapi tes baru hanya menekan Back sekali pada Bus Input tanpa modal kedua. Bukti juga menyebut kasus SweetAlert2 di atas Bus Input tanpa tes integrasi Escape pada SweetAlert2; SweetAlert2 tidak terdaftar di `modalStackCoordinator`. Angka 340 baris untuk `BusInputModal.tsx` dan 908 untuk tes ternyata menghitung **baris tidak kosong**; jumlah baris fisik masing-masing 361 dan 1062. Metode hitung tidak dijelaskan, sehingga klaim ukuran mudah disalahartikan.
- **Dampak user/tim:** Owner dapat menganggap gerbang topmost Back/SweetAlert2 sudah teruji padahal belum; angka modularitas ambigu.
- **Mitigasi:** Dalam folder revisi baru, buat errata yang membedakan bukti yang benar-benar diuji dari asumsi, jelaskan metode hitung baris tidak kosong vs baris fisik, dan uji klaim stack yang dipertahankan. Jangan ubah dokumen `refact_123` yang telah diserahkan.
- **Status:** OPEN, dibetulkan bersama R124-01.

## Pemeriksaan independen yang lulus

- Migrasi ke `ModalShell` terbukti ada; portal lokal, listener Escape lokal, dan pengaturan `body.style.overflow` langsung sudah hilang dari `BusInputModal.tsx`.
- `vitest run src/`: **88 berkas, 669 tes lulus**, exit 0. Happy DOM mencetak diagnostik pemuatan Google API pada tes auth, tanpa kegagalan tes.
- `tsc -b`: exit 0.
- `vite build`: exit 0, PWA dihasilkan. Ada peringatan chunk >500 kB yang tidak terkait batch ini.
- `oxlint` terarah pada Bus Input dan tesnya: exit 0.
- Layout Light/Dark, keyboard fisik/virtual, dan interaksi perangkat nyata belum diverifikasi secara visual oleh Codex. Bukti DOM/CSS yang tersedia tidak cukup untuk menyatakan hasil visual perangkat nyata.

Fase 3 tetap **4/5 batch PASS**; Batch 3.5 menunggu revisi dan review ulang. R80-10 global tetap PARTIAL.
