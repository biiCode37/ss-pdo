# Laporan Perbaikan Riwayat Back Batch 3.5 — `refact_127`

Tanggal: 29 September 2026  
Branch: `devmode`  
Status: **READY_FOR_REVIEW**

---

## 1. Ringkasan Implementasi & Mitigasi R126-01

Pada siklus revisi `refact_127`, investigasi mendalam dilakukan terhadap mekanisme penanganan Back ganda pada tumpukan modal navigasi.

### Akar Masalah R126-01
Pada `refact_125`, ketika pengguna menekan tombol Back fisik kedua saat modal teratas sedang dalam animasi keluar (`isDismissing: true`), kode memanggil `history.pushState({ pdoNavId: topEntry.id }, '')`. Sesuai standar W3C HTML History API, pemanggilan `pushState` ketika pointer browser berada di belakang entri paling depan akan memotong (*truncate*) seluruh forward history. Hal ini menyebabkan entri modal bawah (`bus-modal`) terhapus dari riwayat browser. Ketika modal atas selesai unmount, pemanggilan `removeBackNavigation` memicu `history.back()`, sehingga pointer riwayat jatuh ke `pdoRootGuard`, padahal form Bus masih terbuka.

### Solusi Rekayasa
1. **Pemulihan Non-Destruktif (`history.forward()`):**
   Alih-alih membuat entri baru via `pushState` yang merusak forward history, sistem kini mendeteksi jika pointer browser mundur melampaui target yang sah (`targetId` dari entri modal di bawahnya atau `pdoRootGuard`). Jika terdeteksi mundur terlalu jauh saat modal masih `isDismissing`, sistem menjalankan traversal maju `history.forward()` dengan flag `isProgrammaticPop = true`. Traversal ini memulihkan pointer ke state yang valid tanpa memicu event popstate lanjutan dan tanpa memotong riwayat.
2. **Koordinasi Unmount Tanpa Regresi:**
   Saat modal atas selesai unmount dan memanggil `removeBackNavigation(topId)`, pointer browser telah berada di state target (`bus-modal`). Karena `history.state?.pdoNavId === topId` bernilai `false`, tidak ada pemanggilan `history.back()` redundan. Pointer tetap berada di `bus-modal` dengan aman.
3. **Pengujian Nyata dengan `window.history.back()`:**
   Seluruh tes unit di `src/utils/historyNavigation.test.ts` dan `src/components/busCard/BusInputModal.test.tsx` dimigrasikan dari event sintetis `dispatchEvent(new PopStateEvent('popstate'))` ke pemanggilan `window.history.back()` browser yang sebenarnya, memverifikasi pergerakan `history.state` dan integritas stack.

---

## 2. Before vs After

| Aspek Evaluasi | Sebelum Revisi (`refact_125` / `refact_126`) | Setelah Revisi (`refact_127`) | Dampak Teknis & Pengguna |
| --- | --- | --- | --- |
| **Penanganan Back ke-2 saat `isDismissing`** | Memanggil `history.pushState({ pdoNavId: topEntry.id })` yang memotong forward history browser. | Menggunakan `history.forward()` non-destruktif dengan `isProgrammaticPop = true` untuk memulihkan pointer. | Forward history tetap utuh; entri modal bawah tidak terhapus. |
| **State riwayat setelah modal atas unmount (bertumpuk)** | `history.state` jatuh ke `pdoRootGuard` meskipun modal Bus masih aktif di layar. | `history.state.pdoNavId` tetap menunjuk ke ID modal Bus yang sedang aktif. | Back berikutnya menutup modal Bus secara normal, bukan keluar ke root dashboard. |
| **State riwayat pada modal tunggal (Back ganda <220 ms)** | Berisiko terpental melewati root guard jika back bertubi-tubi. | Traversal tertahan di `pdoRootGuard`; setelah modal unmount, state tetap di `pdoRootGuard`. | Konsistensi root guard terjaga sempurna (tidak pernah crash keluar tanpa konfirmasi). |
| **Jalur tutup UI (Batal/X) + Back selama animasi** | Berpotensi memanggil `onClose` dua kali atau memundurkan pointer 2 level. | `markBackNavigationDismissing` mengunci handler; traversal Back diproteksi sehingga pointer tetap di target. | Tepat 1 kali `onClose`; riwayat bersih setelah unmount. |
| **Metodologi Pengujian Unit Test** | Hanya `window.dispatchEvent(new PopStateEvent('popstate'))` (event buatan tanpa mutasi riwayat). | Menggunakan `window.history.back()` nyata dengan siklus event `popstate` browser sesungguhnya. | Membuktikan keabsahan mutasi pointer `history.state` dan `history.length` di runtime. |

---

## 3. Case: Skenario Lapangan

### Skenario 1: Pengawas Lapangan Membuka Form Bus lalu Membuka Modal Konfirmasi di Atasnya
- **Kondisi:** Pengawas membuka form input Bus `TJ-0123`, lalu memicu dialog konfirmasi (misalnya modal konfirmasi salin KM atau sheet ringkasan). Stack riwayat: `[rootGuard, busModal, topModal]`.
- **Aksi Lapangan:** Pengawas menekan tombol Back fisik Android dengan cepat dua kali berturut-turut untuk membatalkan dialog.
- **Perilaku Sistem:**
  1. Back pertama memicu penutupan dialog konfirmasi atas (`isDismissing = true`), pointer mundur ke `busModal`. Form Bus tetap aktif di layar.
  2. Back kedua terjadi saat modal atas masih beranimasi meluncur keluar. Sistem mendeteksi pointer melompat ke `rootGuard`, lalu segera memajukan kembali ke `busModal` via `history.forward()`.
  3. Modal atas selesai unmount dan memanggil `removeBackNavigation('topModal')`. Karena pointer sudah di `busModal`, tidak ada pop tambahan.
  4. Pengawas masih melihat form Bus dengan `history.state.pdoNavId === busModal`.
  5. Pengawas menekan Back ketiga kali: form Bus tertutup dengan animasi elegan, dan riwayat kembali ke `pdoRootGuard`.

### Skenario 2: Petugas Lapangan Menekan Back Cepat Berkali-kali pada Form Bus Tunggal
- **Kondisi:** Petugas sedang mengisi form Bus, lalu berniat membatalkan dan menekan tombol Back fisik ponsel 2–3 kali dalam waktu kurang dari 200 ms.
- **Aksi Lapangan:** Back ganda <220 ms pada form tunggal.
- **Perilaku Sistem:**
  1. Back pertama memicu penutupan form Bus (`isDismissing = true`). Timer 220 ms berjalan.
  2. Back kedua (<220 ms) ditahan oleh guard: callback `onClose` tidak dipanggil ulang, toast keluar dashboard tidak terpicu secara prematur.
  3. Setelah 220 ms, `onClose` dipanggil tepat 1 kali, form unmount, scroll lock dilepaskan (kembali ke 0), dan riwayat tetap berada di `pdoRootGuard`.

### Skenario 3: Petugas Menekan Tombol Batal UI lalu Menekan Back Fisik Selama Animasi Meluncur Keluar
- **Kondisi:** Petugas menekan tombol `[Batal]` di footer form Bus.
- **Aksi Lapangan:** Tombol Batal memanggil `handleDismiss()` yang segera menjalankan `markBackNavigationDismissing(navId)`. Selama durasi animasi 220 ms, petugas secara refleks menekan tombol Back fisik peranti.
- **Perilaku Sistem:**
  1. Karena entri telah ditandai `isDismissing = true`, penekanan Back fisik tidak memicu pemanggilan ganda callback penutupan dan tidak menembus ke navigasi root.
  2. Setelah animasi selesai dan modal unmount, `removeBackNavigation` membersihkan entri secara idempoten tanpa memicu popstate redundan.
  3. Riwayat browser kembali ke `pdoRootGuard` dan scroll lock kembali normal.

---

## 4. Pemenuhan Kontrak Penerimaan

1. **Kontrak 1 (Bus Input di bawah modal lain):**
   - Back nyata pertama: modal atas memulai penutupan, Bus tetap terbuka.
   - Back nyata kedua sebelum modal atas unmount: callback Bus tidak dipanggil.
   - Setelah modal atas unmount: `history.state.pdoNavId` terbukti sesuai modal Bus.
   - Back berikutnya: menutup modal Bus, bukan keluar/root.
   - *Status: TERPENUHI & TERVERIFIKASI pada `BusInputModal.test.tsx` (baris 990) dan `historyNavigation.test.ts` (baris 54).*
2. **Kontrak 2 (Bus Input tunggal):**
   - Dua Back nyata dalam <220 ms: menghasilkan tepat 1 kali `onClose`.
   - Setelah unmount: state kembali ke `pdoRootGuard: true` dan scroll lock kembali ke 0.
   - *Status: TERPENUHI & TERVERIFIKASI pada `BusInputModal.test.tsx` (baris 1083) dan `historyNavigation.test.ts` (baris 100).*
3. **Kontrak 3 (Jalur tutup UI + Back selama animasi):**
   - Tombol Batal/X/backdrop diikuti Back nyata selama animasi: menghasilkan tepat 1 kali penutupan, urutan `history.state` konsisten kembali ke root guard setelah unmount.
   - *Status: TERPENUHI & TERVERIFIKASI pada `BusInputModal.test.tsx` (baris 1155) dan `historyNavigation.test.ts` (baris 131).*
4. **Kontrak 4 (Integritas Fitur Eksisting):**
   - Modal Queue & Report: 8/8 tes integrasi lulus pada `QueueReportIntegration.test.tsx`.
   - `ModalShell`: koordinasi Escape topmost, backdrop, scroll lock reference counting tetap utuh.
   - SweetAlert2 hardware Back: prioritas utama tetap menutup alert aktif tanpa merusak riwayat.
   - Form payload, odometer prefill, dan offline queue tetap berfungsi 100% tanpa perubahan struktur data.

---

## 5. Ringkasan Ukuran Berkas & Rekapitulasi Kode

Sesuai aturan arsitektur anti god-file:
- `src/utils/historyNavigation.ts`: **185 baris** (5.692 bytes) — *jauh di bawah batas 400 baris*.
- `src/utils/historyNavigation.test.ts`: **159 baris** (5.478 bytes).
- `src/components/busCard/BusInputModal.tsx`: **369 baris** (12.626 bytes) — *di bawah batas 400 baris*.
- `src/components/busCard/BusInputModal.test.tsx`: **1.386 baris** (41.482 bytes).

---

## 6. Log Eksekusi Quality Gates

Seluruh gerbang kualitas telah dijalankan dan lulus 100%:
- **Targeted Tests:** `pnpm exec vitest run src/components/busCard/BusInputModal.test.tsx src/utils/historyNavigation.test.ts src/components/dashboard/QueueReportIntegration.test.tsx` ➔ **45 tests passed** (lihat `evidence/targeted-tests.txt`).
- **All Src Tests:** `pnpm exec vitest run src/` ➔ **88 files, 675 tests passed** (lihat `evidence/src-tests.txt`).
- **Targeted Linter:** `pnpm exec oxlint ...` ➔ **0 warnings, 0 errors** (lihat `evidence/targeted-lint.txt`).
- **TypeScript Check:** `pnpm exec tsc -b` ➔ **0 errors** (lihat `evidence/typecheck.txt`).
- **Production Build:** `pnpm exec vite build --emptyOutDir false` ➔ **PWA v1.3.0 generated successfully** (lihat `evidence/build.txt`).
- **Knowledge Graph:** `graphify update .` ➔ **6600 nodes, 10530 edges, 525 communities updated**.

Status: **READY_FOR_REVIEW**.
