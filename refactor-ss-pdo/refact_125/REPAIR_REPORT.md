# Laporan Perbaikan & Implementasi: Revisi Shell Modal Bus (Fase 3 Batch 3.5)

- **Tanggal:** 29 September 2026
- **Branch:** `devmode`
- **Sumber Instruksi:** `refactor-ss-pdo/refact_124/GEMINI_PHASE_03_BATCH_05_REVISION.md`
- **Komponen Target:** `src/utils/historyNavigation.ts`, `src/components/busCard/BusInputModal.tsx`
- **File Pengujian:** `src/components/busCard/BusInputModal.test.tsx`, `src/utils/historyNavigation.test.ts`
- **Status Batch:** **READY_FOR_REVIEW**

---

## 1. Ringkasan Implementasi Revisi

Revisi ini menyelesaikan seluruh temuan penahan pada audit Codex `refact_124` (**R124-01** dan **R124-02**), mengamankan koordinasi tombol Back perangkat mobile selama fase animasi keluar 220 ms, serta meluruskan akurasi bukti dokumentasi audit.

### Perubahan Teknis yang Dilakukan:
1. **Guard `isDismissing` pada `historyNavigation.ts` (R124-01):**
   - Menambahkan properti `isDismissing?: boolean` pada tipe `BackNavigationEntry`.
   - Mengubah `handlePopState`: modal teratas tidak lagi di-pop seketika saat event `popstate` pertama tiba. Sebagai gantinya, entri teratas ditandai `topEntry.isDismissing = true`, lalu `topEntry.onBack()` dijalankan.
   - Entri dipertahankan dalam `navigationStack` selama fase animasi keluar berjalan, dan baru dilepas saat komponen unmount melalui fungsi `removeBackNavigation(id)`.
   - Jika event `popstate` kedua diterima saat `topEntry.isDismissing === true` (<220 ms): event diabaikan seketika, status history diselaraskan kembali via `history.pushState`, dan eksekusi langsung kembali tanpa menyentuh modal di bawahnya ataupun navigasi root.
2. **Utilitas `markBackNavigationDismissing` (R124-01):**
   - Mengekspor `markBackNavigationDismissing(id)` pada `src/utils/historyNavigation.ts`.
   - Memanggil `markBackNavigationDismissing` di dalam `handleDismiss` pada `src/components/busCard/BusInputModal.tsx`.
   - Menjamin bahwa jika penutupan dipicu oleh interaksi UI pengguna (tombol X header, tombol Batal footer, atau backdrop tap), entri langsung dikunci dalam status `isDismissing` sehingga penekanan Back fisik yang terjadi selama transisi 220 ms tidak akan membobol modal di belakangnya.
3. **Penyempurnaan Syntax Catch Binding:**
   - Memutakhirkan seluruh blok `catch (_err) {}` di `historyNavigation.ts` menjadi ES2019 optional catch binding `catch {}` untuk menjamin `oxlint` lulus dengan 0 warning dan 0 error.
4. **Koreksi & Errata Laporan (R124-02):**
   - **SweetAlert2 Stack:** SweetAlert2 diklarifikasi secara tegas sebagai stack terpisah. SweetAlert2 hanya terkoordinasi pada tombol hardware Back via `Swal.isVisible() -> Swal.close()`, dan tidak mengandalkan `modalStackCoordinator` untuk tombol Escape.
   - **Metodologi Hitung Baris:** Menyajikan data baris fisik (*raw lines*) dan baris tidak kosong (*non-empty lines*) secara transparan pada berkas bukti `file-sizes.txt` dan tabel laporan.
5. **Suite Pengujian Regresi Komprehensif:**
   - Menambahkan 3 pengujian terarah pada `BusInputModal.test.tsx` yang secara ketat memvalidasi skenario dua modal bertumpuk, double back <220 ms pada modal tunggal, serta idempotensi Escape, backdrop, Batal, dan force close `isOpen = false`.

---

## 2. Before vs After

| Aspek | Before (Audit `refact_123`) | After (Revisi `refact_125`) |
|---|---|---|
| **Pelepasan Entri Navigation Stack** | `handlePopState` langsung melakukan `navigationStack.pop()`. Entri hilang seketika saat animasi 220 ms baru dimulai. | Entri dipertahankan di stack dengan status `isDismissing = true`. Entri baru dilepas saat komponen unmount via `removeBackNavigation(id)`. |
| **Back Ganda dalam <220 ms (Modal Tunggal)** | Back kedua mengenai Priority 3 (navigasi root / toast keluar) saat form bus masih tampil di layar. | Back kedua diabaikan oleh guard `isDismissing`. Form bus menutup dengan tepat 1 kali `onClose`, scroll lock dan history pulih setelah unmount. |
| **Back Ganda pada Modal Bertumpuk** | Back kedua menutup modal di bawahnya secara tidak sengaja sebelum modal atas selesai beranimasi. | Back kedua diabaikan. Hanya modal atas yang menutup. Modal bawah tetap aman dan baru bisa ditutup setelah modal atas selesai unmount. |
| **Penutupan via Tombol UI (X/Batal/Backdrop)** | Penekanan tombol Back selama animasi keluar UI berisiko membobol modal bawah. | `markBackNavigationDismissing` mengunci status dismissing seketika saat tombol UI ditekan. Back selama 220 ms diabaikan. |
| **Status Koordinasi SweetAlert2** | Diklaim terkoordinasi dengan `modalStackCoordinator` untuk Escape. | **Errata dicatat:** SweetAlert2 adalah stack terpisah dengan penanganan Escape internal pustaka; hanya terhubung di prioritas Back `popstate`. |
| **Pelaporan Ukuran Berkas** | Angka `340/908` baris disajikan tanpa keterangan metodologi hitung. | Dijelaskan secara eksplisit: baris fisik `BusInputModal.tsx` adalah **368** dan baris tidak kosong adalah **346** (tetap < 400 baris god-file). |

---

## 3. Case: Skenario Lapangan

### Skenario 1: Petugas Menekan Tombol Back Dua Kali dengan Cepat (<220 ms) Saat Mengisi KM
- **Kondisi:** Petugas sedang berada di halte lapangan. Setelah mengetik KM, petugas memutuskan membatalkan dan menekan tombol hardware Back Android dua kali secara cepat (*rapid double-tap*).
- **Sebelum Revisi:** Tekanan Back pertama memicu `handleDismiss` dan mengeluarkan entri modal dari stack. Tekanan Back kedua (50 ms kemudian) mendapati stack kosong, sehingga memicu toast *"Tekan sekali lagi untuk keluar"* dan mengacaukan riwayat navigasi browser saat modal bus masih dalam proses transisi pegas menutup.
- **Setelah Revisi:** Tekanan Back pertama menandai `topEntry.isDismissing = true` dan memulai animasi keluar 220 ms. Tekanan Back kedua ditangkap oleh guard `isDismissing`, diserap secara aman tanpa efek samping, dan tidak memicu toast root. Setelah 220 ms, modal unmount secara elegan dan seluruh status history serta scroll lock pulih normal.

### Skenario 2: Dialog Rute Bertumpuk di Atas Bus Input Modal
- **Kondisi:** Form input bus sedang terbuka. Di atasnya, petugas membuka modal rute/detail. Petugas menekan tombol Back dua kali secara berturut-turut.
- **Sebelum Revisi:** Tekanan Back pertama menutup modal atas, tetapi tekanan Back kedua langsung menutup Bus Input Modal di belakangnya, sehingga draft isian KM bus hilang.
- **Setelah Revisi:** Tekanan Back pertama hanya menutup modal atas. Tekanan Back kedua yang terjadi sebelum modal atas unmount diabaikan oleh sistem navigasi. Draft isian pada Bus Input Modal tetap utuh. Petugas harus menunggu modal atas selesai menutup sebelum tekanan Back berikutnya dapat menutup Bus Input Modal.

### Skenario 3: Penutupan Dipicu dari Tombol UI Lalu Diikuti Tombol Back
- **Kondisi:** Petugas menekan tombol `Batal` pada footer form bus, lalu secara refleks menekan tombol Back fisik Android dalam rentang waktu <220 ms.
- **Sebelum Revisi:** Penutupan UI tidak menandai status dismissing pada navigation stack, sehingga tombol Back fisik memproses modal di bawahnya atau navigasi root.
- **Setelah Revisi:** Fungsi `handleDismiss` langsung memanggil `markBackNavigationDismissing`. Status dismissing aktif seketika sehingga tombol Back fisik yang ditekan selama animasi keluar diserap dengan aman tanpa mempengaruhi lapisan di bawahnya.

---

## 4. Checklist Quality Gates & Bukti Perintah

| Quality Gate | Perintah Eksekusi | Hasil Verifikasi | Status |
|---|---|---|---|
| **Targeted Unit Tests** | `pnpm exec vitest run src/components/busCard/BusInputModal.test.tsx` | **29 dari 29 tes lulus (100%)** dalam 873ms. Bukti di `refact_125/evidence/targeted-tests.txt`. | **PASS** |
| **All Test Suite (src/)** | `pnpm run test src/` | **88 test files lulus, 671 tes lulus (0 gagal)**. Bukti di `refact_125/evidence/src-tests.txt`. | **PASS** |
| **Targeted Linting** | `pnpm exec oxlint src/components/busCard/BusInputModal.tsx src/components/busCard/BusInputModal.test.tsx src/utils/historyNavigation.ts` | **0 errors, 0 warnings** (Finished in 12ms on 3 files). Bukti di `refact_125/evidence/targeted-lint.txt`. | **PASS** |
| **TypeScript Strict** | `pnpm exec tsc -b` | **Exit code 0, 0 type error**. | **PASS** |
| **Production Build** | `pnpm exec vite build --emptyOutDir false` | **Exit code 0, PWA generated**. Bukti di `refact_125/evidence/build.txt`. | **PASS** |
| **Knowledge Graph** | `graphify update .` | **6564 nodes, 10499 edges, 525 communities**. AST terbarui tanpa biaya API LLM. | **PASS** |
| **Git Working Tree** | `git status` | Tetap di branch **`devmode`**, tanpa commit, push, stash, atau reset. Bukti di `refact_125/evidence/git-status.txt`. | **PASS** |

---

## 5. Keterbatasan Verifikasi Visual Nyata

- **Pemeriksaan Visual Otomatis (DOM/CSS):**
  - Seluruh mekanisme LIFO stack, penyerapan event popstate ganda, scroll lock reference counting, dan token tema (`--card-bg`, `--card-border`) teruji 100% lulus melalui simulasi lingkungan headless Happy DOM.
- **Keterbatasan Layar Nyata:**
  - Pengujian respons fisik gesture swipe-back Android pada berbagai versi WebView dan rendering visual interaktif perangkat fisik belum dapat divalidasi langsung di terminal lokal. Hal ini akan diverifikasi lebih lanjut pada tahap Vercel Preview deployment sesuai alur proyek.

---

## 6. Daftar Berkas Bukti (`refactor-ss-pdo/refact_125/evidence/`)

1. [`targeted-tests.txt`](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_125/evidence/targeted-tests.txt): Hasil 29 tes unit pada `BusInputModal.test.tsx` (termasuk 3 pengujian R124-01).
2. [`src-tests.txt`](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_125/evidence/src-tests.txt): Hasil pengujian 88 berkas tes dan 671 tes di seluruh `src/`.
3. [`targeted-lint.txt`](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_125/evidence/targeted-lint.txt): Hasil linting `oxlint` 0 warning dan 0 error pada seluruh berkas yang dimodifikasi.
4. [`build.txt`](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_125/evidence/build.txt): Hasil kompilasi `tsc -b` dan build produksi Vite PWA.
5. [`git-status.txt`](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_125/evidence/git-status.txt): Status git status pada branch `devmode`.
6. [`file-sizes.txt`](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_125/evidence/file-sizes.txt): Rincian ukuran berkas dengan metodologi baris fisik vs baris tidak kosong.

---

## 7. Status Keputusan

Seluruh temuan pada audit `refact_124` telah terselesaikan dan teruji tanpa regresi.
Status pengerjaan: **READY_FOR_REVIEW**.
*(Pengerjaan batch atau fase berikutnya menunggu keputusan review Codex).*
