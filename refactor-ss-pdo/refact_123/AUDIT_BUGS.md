# Audit Bugs & R80-10: Migrasi Shell BusInputModal ke ModalShell (Fase 3 Batch 3.5)

Dokumen ini mencatat temuan arsitektural dan audit teknis terkait migrasi shell dialog `BusInputModal` ke `ModalShell` standar pada Fase 3 Batch 3.5.

---

## 1. Metadata Audit

- **Tanggal:** 29 September 2026
- **Branch:** `devmode`
- **Komponen Target:** `src/components/busCard/BusInputModal.tsx`
- **File Pengujian:** `src/components/busCard/BusInputModal.test.tsx`
- **Status Batch:** `READY_FOR_REVIEW`

---

## 2. Matriks Temuan & Status

| ID | Lokasi | Keparahan | Deskripsi dan Dampak User | Mitigasi Terverifikasi | Status |
|---|---|---|---|---|---|
| **R80-10 (Bus Input Shell)** | `src/components/busCard/BusInputModal.tsx` | Sedang | Shell Bus Input sebelumnya memakai portal lokal, Escape listener window manual, dan manipulasi `document.body.style.overflow` langsung tanpa koordinasi reference counting dan LIFO modal stack. Berisiko freeze scroll, double dismissal, dan unmount memory leak. | Migrasikan ke `ModalShell`, hubungkan seluruh pemicu tutup ke `handleDismiss` idempotent (timer 220 ms), gunakan coordinated scroll lock dan topmost Escape/Back dismissal. Pertahankan struktur single `role="dialog"` dan layout mobile-first. | **CLOSED (Bus Input Scope)** *(Status R80-10 global tetap PARTIAL untuk modal non-bus)* |

---

## 3. Rincian Temuan Teknis: R80-10 (Bus Input Shell)

### A. Lokasi Kode Sebelum Perbaikan
- `src/components/busCard/BusInputModal.tsx:49-75` (Listener Escape manual dan pengaturan `document.body.style.overflow`)
- `src/components/busCard/BusInputModal.tsx:112` (Portal mandiri `createPortal(..., document.body)`)
- `src/components/busCard/BusInputModal.tsx:135` (Elemen `role="dialog"` manual)

### B. Deskripsi Masalah
1. **Tidak Ada Reference Counting pada Scroll Lock:**
   `BusInputModal` sebelumnya memanipulasi `document.body.style.overflow = "hidden"` saat render dan mengembalikannya ke `""` saat unmount/tutup. Jika terdapat modal lain yang sedang aktif bersamaan (misal modal konfirmasi SweetAlert2 atau modal pelaporan), penutupan `BusInputModal` akan mereset overflow body kembali ke normal sehingga modal yang tersisa kehilangan scroll lock.
2. **Escape Listener Tidak Memperhatikan LIFO Stack:**
   Listener `keydown` manual pada `window` akan merespons tombol Escape tanpa memeriksa apakah modal tersebut berada di lapisan paling atas (`isTopmostModal`). Akibatnya, menekan Escape pada modal di atasnya dapat menutup `BusInputModal` di latar belakang secara bersamaan.
3. **Absennya Integrasi Hardware/Gesture Back Android:**
   `BusInputModal` sebelumnya tidak terdaftar ke `useMobileBackHandler` / `pushBackNavigation`. Pengguna ponsel Android yang menekan tombol Back fisik atau swipe-to-back gesture akan memicu navigasi browser/keluar aplikasi daripada menutup modal input bus secara elegan.
4. **Idempotensi Penutupan & Siklus Hidup Timer:**
   Pengguna di lapangan yang menekan tombol tutup atau Batal berulang kali (double-tap cepat) dapat memicu pemanggilan `onClose` ganda atau meninggalkan timeout aktif setelah komponen di-unmount, menyebabkan *unhandled callback* atau *memory leak*.
5. **Potensi Duplikasi ARIA Role Dialog:**
   Jika komponen dibungkus oleh `ModalShell` tanpa menghapus `role="dialog"` dan `aria-modal` internal pada kartu formulir, akan tercipta dua elemen dialog bersarang (*nested dialog anti-pattern*) yang membingungkan screen reader dan melanggar standar aksesibilitas WCAG.

### C. Dampak Terhadap Pengguna
- **Operasional Lapangan:** Petugas yang terburu-buru melakukan input ritase dan menekan tombol Batal dua kali dapat menyebabkan crash state atau UI glitch pada dashboard.
- **Pengguna Mobile / PWA:** Tombol Back bawaan Android tidak menutup modal, melainkan menampilkan toast konfirmasi keluar atau memicu reload halaman.
- **Tumpukan Modal:** Ketika dialog konfirmasi SweetAlert2 muncul di atas modal input bus, menekan Escape membatalkan input bus alih-alih menutup dialog konfirmasi di atasnya.

### D. Mitigasi yang Diterapkan
1. **Adopsi Penuh `ModalShell`:**
   Menghapus pemanggilan manual `createPortal`, listener `window.addEventListener("keydown", handleKeyDown)`, serta manipulasi langsung `document.body.style.overflow`. Seluruh koordinasi dialihkan ke `ModalShell` (`src/components/ui/ModalShell.tsx`).
2. **`handleDismiss` Idempotent dengan Timer 220 ms:**
   Membungkus alur penutupan dengan guard `isClosingRef.current`. Begitu dismiss dimulai, flag ditandai aktif, animasi keluar 220 ms berjalan, dan `onClose()` dipanggil tepat satu kali.
3. **Pembersihan Bersih (Clean Lifecycle & Zero Leaks):**
   Timer penutupan disimpan di `closeTimerRef` dan selalu dibersihkan (`clearTimeout`) di fungsi cleanup `useEffect` saat unmount atau saat properti `isOpen` berubah menjadi `false`. State `isMounted`, `isClosing`, dan `isClosingRef` direset ke kondisi awal sehingga saat modal dibuka kembali, tidak ada state penutupan yang tertinggal.
4. **Koordinasi Stack & Back Handler:**
   `ModalShell` secara otomatis mendaftarkan modal ke `modalStackCoordinator` (`registerModalDismiss`) dan `useMobileBackHandler` (`pushBackNavigation`). Tombol Escape dan Android gesture Back kini hanya menutup modal yang berada di posisi teratas (*topmost*).
5. **Aksesibilitas & Struktur Dialog Bersih:**
   Menghapus atribut `role="dialog"` dan `aria-modal` dari kartu internal bus input; atribut dialog semantik didelegasikan secara tunggal kepada container `ModalShell`. Menghubungkan atribut `ariaLabelledBy` ke elemen judul header `bus-modal-title-${form.formId}`.
6. **Preservasi Geometri & Animasi Mobile-First:**
   - Transisi fisik pegas Apple: `cubic-bezier(0.32, 0.72, 0, 1)`.
   - Efek backdrop blur: `backdropFilter: blur(6px)`.
   - Penyesuaian keyboard virtual ponsel: `useVisualViewport` (`bottom: isKeyboardOpen ? keyboardHeight : 0` dan `maxHeight: Math.min(viewportHeight - 10, 680)`).
   - Safe-area inset: `padding: isKeyboardOpen ? ... : "18px 20px calc(20px + env(safe-area-inset-bottom, 0px)) 20px"`.
   - Fixed footer: Tombol Simpan & Batal tetap terlihat di atas keyboard virtual.

---

## 4. Status R80-10 Global

- **Cakupan Bus Input Modal (`BusInputModal.tsx`):** **CLOSED**.
- **Cakupan Global Aplikasi:** Tetap **PARTIAL** karena masih ada dialog/modal non-bus lain (misal modal analitik atau modal utilitas tertentu) yang akan ditangani pada batch atau fase tersendiri sesuai rencana proyek.
