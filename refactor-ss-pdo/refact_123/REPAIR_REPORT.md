# Laporan Perbaikan & Implementasi: Shell Modal Bus (Fase 3 Batch 3.5)

- **Tanggal:** 29 September 2026
- **Branch:** `devmode`
- **Komponen Target:** `src/components/busCard/BusInputModal.tsx`
- **File Tes:** `src/components/busCard/BusInputModal.test.tsx`
- **Status Batch:** **READY_FOR_REVIEW**

---

## 1. Ringkasan Eksekutif & Implementasi

Fase 3 Batch 3.5 memigrasikan shell modal `BusInputModal.tsx` dari portal manual, listener `keydown` Escape global pada `window`, dan manipulasi `document.body.style.overflow` langsung ke komponen arsitektural terpusat `ModalShell.tsx` (`src/components/ui/ModalShell.tsx`).

### Pokok Pekerjaan yang Diselesaikan:
1. **Penghapusan Kode Shell Ad-Hoc:**
   - Menghapus import dan pemanggilan `createPortal(..., document.body)`.
   - Menghapus pengaturan manual `document.body.style.overflow = "hidden"` dan pemulihan `document.body.style.overflow = ""`.
   - Menghapus listener `window.addEventListener("keydown", handleKeyDown)` untuk penanganan tombol Escape.
2. **Idempotent Dismissal & Siklus Hidup Timer 220 ms:**
   - Mengimplementasikan `handleDismiss` yang aman dan idempotent menggunakan guard `isClosingRef.current`. Pemicuan berulang (misal *double-tap* cepat tombol Batal atau backdrop) tidak akan memicu callback ganda maupun membuat timer tumpang tindih.
   - Seluruh jalur penutupan dialirkan ke `handleDismiss`: tombol X header (`BusInputModalHeader`), tombol Batal footer (`BusInputModalFooter`), ketukan area backdrop luar, tombol Escape keyboard, hardware back button Android via `popstate`, dan pemicuan dari `modalStackCoordinator`.
   - Menyimpan timer penutupan di `closeTimerRef` dan memastikan pembersihan menyeluruh (`clearTimeout`) di fungsi cleanup `useEffect` saat unmount atau saat `isOpen` berubah menjadi `false`.
   - Mereset status `isClosing`, `isMounted`, dan `isClosingRef` ke kondisi awal ketika modal ditutup, sehingga saat dibuka kembali tidak terdapat residu state penutupan.
3. **Penyelarasan Kontrak Hook `useBusInputForm`:**
   - Kontrak hook tetap terjaga utuh: menerima `onDismiss: handleDismiss`, `isOpen`, dan `isMounted`.
   - Tidak ada modifikasi semantik pada logika validasi submit, payload, Single Focus, tab navigasi, maupun urutan pemanggilan `onSave` dan `onDismiss`.
4. **Koordinasi Global (Scroll Lock & LIFO Stack):**
   - Scroll lock dikoordinasikan secara otomatis oleh `ModalShell` melalui `acquireScrollLock()` dari `src/utils/scrollLockCoordinator.ts` dengan sistem *reference counting*.
   - Integrasi `modalStackCoordinator` (`registerModalDismiss`): tombol Escape hanya menutup modal teratas (*topmost*), tanpa menutup `BusInputModal` jika ada dialog lain di atasnya.
   - Integrasi `useMobileBackHandler` (`pushBackNavigation`): hardware back button dan swipe-back gesture pada perangkat Android menutup modal input bus secara elegan.
5. **Aksesibilitas & Struktur Dialog Bersih:**
   - Menghilangkan duplikasi `role="dialog"` internal; hanya ada tepat 1 elemen semantik `role="dialog"` di DOM yang disediakan oleh `ModalShell`.
   - Menghubungkan `ariaLabelledBy` ke judul header bus: `bus-modal-title-${form.formId}`.
   - Fokus awal diarahkan ke input primer saat mode Single Focus aktif via `initialFocusRef={form.isSingleMode ? form.singlePrimaryInputRef : undefined}`.
   - Menjaga fokus trap (Tab / Shift+Tab) dan pemulihan fokus saat ditutup via `ModalShell`.
6. **Preservasi Layout & Geometri Mobile-First:**
   - Geometri kartu bottom-sheet (`borderTopLeftRadius: 24px`, `borderTopRightRadius: 24px`, bottom radius 0).
   - Efek backdrop blur kaca: `backdropFilter: blur(6px)`.
   - Kurva transisi fisik pegas Apple: `cubic-bezier(0.32, 0.72, 0, 1)`.
   - Adaptasi visual viewport keyboard virtual: `bottom: isKeyboardOpen ? keyboardHeight : 0` dan `maxHeight: Math.min(viewportHeight - 10, 680)`.
   - Safe-area insets padding dan scroll body internal form dengan footer yang tetap terkunci di bagian bawah.

---

## 2. Before vs After

| Aspek | Before (Batch 3.4) | After (Batch 3.5) |
|---|---|---|
| **Portal Container** | Manual `createPortal(..., document.body)` langsung di `BusInputModal.tsx`. | Terpusat via `ModalShell.tsx` dengan target portal default `document.body`. |
| **Scroll Lock Management** | Manipulasi manual `document.body.style.overflow = "hidden"` / `""`. Jika ada modal lain, scroll bisa pulih secara prematur. | Coordinated scroll lock dengan *reference counting* via `acquireScrollLock()`. Aman untuk modal bertumpuk. |
| **Escape Key Handling** | Listener `keydown` langsung di `window` tanpa memeriksa tumpukan modal. | Dikoordinasikan oleh `modalStackCoordinator`: hanya modal teratas (*topmost*) yang merespons Escape. |
| **Android Back Button** | Tidak terhubung ke `useMobileBackHandler`. Back fisik memicu navigasi browser / toast keluar aplikasi. | Terdaftar di LIFO navigation stack via `useMobileBackHandler`. Tombol Back fisik menutup modal secara elegan. |
| **Idempotensi Penutupan** | Potensi pemanggilan ganda jika pengguna menekan tombol tutup berkali-kali secara cepat. | Dijamin idempotent oleh `isClosingRef`: pemanggilan berulang selama jendela 220 ms diabaikan. |
| **Pembersihan Timer Unmount** | Risiko timer 220 ms tetap berjalan dan memanggil `onClose` setelah unmount. | `closeTimerRef` dibersihkan seketika pada unmount atau saat `isOpen: false`. |
| **Residu State `isClosing`** | Jika modal dibuka kembali setelah ditutup cepat, state `isClosing` bisa tertinggal aktif. | State `isClosing`, `isMounted`, dan ref flag direset ke `false` seketika saat `isOpen` berubah ke `false`. |
| **Struktur ARIA Dialog** | Berpotensi terjadi nested dialog jika dibungkus shell tanpa membersihkan elemen anak. | Tepat 1 elemen `role="dialog"` di DOM, dengan `aria-labelledby` terhubung ke judul heading form. |
| **Ukuran Berkas Komponen** | `BusInputModal.tsx` sebelumnya 390 baris dengan boilerplate portal & listener. | `BusInputModal.tsx` kini **340 baris** (ringkas, bersih, dan jauh di bawah batas 400 baris god-file). |

---

## 3. Case: Skenario Lapangan

### Skenario 1: Petugas di Lapangan Melakukan Double-Tap Cepat pada Tombol Batal
- **Kondisi:** Petugas sedang mengisi KM bus di halte, lalu karena terburu-buru menekan tombol Batal atau tombol X header dua kali secara agresif (*rapid double tap*).
- **Sebelum Perbaikan:** Listener memicu pemanggilan `onClose()` dua kali, yang pada beberapa kondisi menyebabkan error sinkronisasi state induk atau modal berkedip.
- **Setelah Perbaikan:** Pemicuan pertama mengunci guard `isClosingRef.current = true` dan memulai animasi keluar 220 ms. Ketukan kedua pada milidetik ke-50 langsung dibatalkan tanpa efek samping. Setelah 220 ms, `onClose()` dipanggil tepat 1 kali.

### Skenario 2: Dialog Konfirmasi Terbuka di Atas Modal Bus (Stacked Modals)
- **Kondisi:** Petugas mengisi data bus, lalu memicu dialog konfirmasi (misal SweetAlert2 atau konfirmasi shift) yang muncul di atas modal bus. Petugas kemudian menekan tombol fisik Escape pada keyboard tablet atau gesture Back Android.
- **Sebelum Perbaikan:** Keduanya merespons event Escape; dialog konfirmasi tertutup sekaligus modal input bus di belakangnya ikut tertutup dan membuang draft inputan pengguna.
- **Setelah Perbaikan:** `modalStackCoordinator` dan `historyNavigation` mengevaluasi tumpukan LIFO. Hanya dialog konfirmasi teratas yang ditutup. Modal input bus tetap terbuka dengan data yang belum tersimpan tetap utuh. Scroll lock pada `document.body` tetap bertahan (`count = 1`).

### Skenario 3: Input Ritase dengan Keyboard Virtual Ponsel Aktif
- **Kondisi:** Pengguna mengetik angka odometer pada smartphone Android/iOS sehingga keyboard virtual muncul menutupi separuh layar bawah.
- **Sebelum Perbaikan:** Modal berisiko terdorong keluar layar atau backdrop menutupi area yang tidak semestinya.
- **Setelah Perbaikan:** `useVisualViewport` menghitung tinggi keyboard aktual. `backdropStyle` menyesuaikan `bottom: ${keyboardHeight}px` dan kartu modal membatasi `maxHeight: Math.min(viewportHeight - 10, 680)px`. Footer tombol Simpan/Batal tetap terlihat di atas keyboard dan body form dapat di-scroll lancar di dalam kontainer internal.

### Skenario 4: Pembukaan Kembali Cepat (Quick Re-open)
- **Kondisi:** Pengguna menutup modal unit JAK.15-09 lalu seketika dalam 100 ms membuka modal unit JAK.15-10 dari daftar dashboard.
- **Sebelum Perbaikan:** Jika transisi 220 ms belum tuntas, state `isClosing` modal baru dapat tertinggal dalam kondisi `true`, menyebabkan modal baru langsung menghilang atau tidak bisa berinteraksi.
- **Setelah Perbaikan:** Efek pembersihan `useEffect([isOpen])` seketika membatalkan timer penutupan unit lama dan mereset `isClosingRef.current = false` serta `isClosing = false`. Modal unit baru langsung me-mount dengan animasi pegas masuk yang bersih.

---

## 4. Checklist Quality Gates & Bukti Perintah

| Quality Gate | Perintah Eksekusi | Hasil Verifikasi | Status |
|---|---|---|---|
| **Targeted Unit Tests** | `pnpm exec vitest run src/components/busCard/BusInputModal.test.tsx` | **27 dari 27 tes lulus (100%)** dalam 1.9 detik. Bukti di `refact_123/evidence/targeted-tests.txt`. | **PASS** |
| **All Test Suite (src/)** | `pnpm run test src/` | **88 test files lulus, 669 tes lulus (0 gagal)**. Bukti di `refact_123/evidence/src-tests.txt`. | **PASS** |
| **Targeted Linting** | `pnpm exec oxlint src/components/busCard/BusInputModal.tsx src/components/busCard/BusInputModal.test.tsx` | **0 errors, 0 warnings** (Finished in 11ms on 2 files). Bukti di `refact_123/evidence/targeted-lint.txt`. | **PASS** |
| **TypeScript Strict** | `pnpm exec tsc -b` | **Exit code 0, 0 type error**. | **PASS** |
| **Production Build** | `pnpm exec vite build --emptyOutDir false` | **Exit code 0, PWA generated (sw.js, workbox, index.html)**. Bukti di `refact_123/evidence/build.txt`. | **PASS** |
| **Knowledge Graph** | `graphify update .` | **6523 nodes, 10463 edges, 515 communities**. AST terbarui tanpa biaya API LLM. | **PASS** |
| **Git Working Tree** | `git status` | Tetap di branch **`devmode`**, tidak ada modifikasi di branch utama. Bukti di `refact_123/evidence/git-status.txt`. | **PASS** |

---

## 5. Verifikasi Visual Light/Dark Mode & DOM Layout

- **Pemeriksaan Kontras & Token Tema:**
  - Latar kartu modal: `var(--card-bg, #171717)` (kompatibel penuh dengan tema gelap `#171717` dan tema terang `#ffffff`).
  - Garis batas modal: `var(--card-border, rgba(255, 255, 255, 0.1))` pada Dark Mode dan border adaptif pada Light Mode.
  - Backdrop overlay: `rgba(0, 0, 0, 0.65)` dengan `backdropFilter: blur(6px)` memberikan kontras visual dramatis di atas konten dashboard di latar belakang pada kedua tema.
- **Aksesibilitas DOM:**
  - Hanya ada 1 elemen `[role="dialog"]` yang dirender di level portal `ModalShell`.
  - Atribut `aria-modal="true"` dan `aria-labelledby="bus-modal-title-${form.formId}"` terpasang valid mengarah ke elemen `<h2>` judul header unit bus.
- **Keterbatasan Pengujian Visual Nyata:**
  - Sesuai panduan proyek, pengujian berbasis browser headless Happy DOM telah memverifikasi struktur DOM, event handler, timer, LIFO stack, dan atribut aksesibilitas secara komprehensif. Pengujian visual fisik pada layar perangkat nyata dapat divalidasi lebih lanjut pada tahap Vercel Preview.

---

## 6. Daftar Berkas Bukti (`refactor-ss-pdo/refact_123/evidence/`)

1. [`targeted-tests.txt`](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_123/evidence/targeted-tests.txt): Hasil 27 tes unit pada `BusInputModal.test.tsx`.
2. [`src-tests.txt`](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_123/evidence/src-tests.txt): Hasil pengujian 88 test files dan 669 tes di `src/`.
3. [`targeted-lint.txt`](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_123/evidence/targeted-lint.txt): Hasil linting `oxlint` (0 error, 0 warning).
4. [`build.txt`](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_123/evidence/build.txt): Hasil kompilasi `tsc -b` dan build Vite PWA.
5. [`git-status.txt`](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_123/evidence/git-status.txt): Status git status pada branch `devmode`.
6. [`file-sizes.txt`](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_123/evidence/file-sizes.txt): Ukuran berkas dan jumlah baris kode modul terkait.

---

## 7. Status Keputusan

Pekerjaan Fase 3 Batch 3.5 telah selesai secara menyeluruh sesuai batasan dan kriteria penerimaan.
Status pengerjaan: **READY_FOR_REVIEW**.
*(Pengerjaan batch atau fase berikutnya menunggu keputusan resmi review Codex).*
