# Audit Bugs & Errata: Revisi Shell Modal Bus (Fase 3 Batch 3.5)

Dokumen ini mencatat temuan teknis dari audit Codex `refact_124` dan mitigasi implementasinya dalam `refact_125`.

---

## 1. Metadata Revisi

- **Tanggal:** 29 September 2026
- **Branch:** `devmode`
- **Sumber Audit:** `refactor-ss-pdo/refact_124/AUDIT_BUGS.md`
- **Komponen Target:** `src/utils/historyNavigation.ts`, `src/components/busCard/BusInputModal.tsx`
- **File Pengujian:** `src/components/busCard/BusInputModal.test.tsx`, `src/utils/historyNavigation.test.ts`
- **Status Batch:** `READY_FOR_REVIEW`

---

## 2. Matriks Temuan & Status

| ID | Lokasi Kode / Dokumen | Keparahan | Deskripsi dan Dampak User | Mitigasi Terverifikasi | Status |
|---|---|---|---|---|---|
| **R124-01** | `src/utils/historyNavigation.ts:52-70`, `src/components/busCard/BusInputModal.tsx:44-59` | Sedang | `handlePopState` sebelumnya langsung mengeluarkan entri topmost dari `navigationStack` sebelum animasi 220 ms selesai. Tekanan Back kedua dalam <220 ms mengenai modal bawah atau navigasi root saat modal atas masih tampil. | Tambahkan guard `isDismissing` pada `BackNavigationEntry`. Pertahankan entri di stack selama fase dismiss dan abaikan Back berulang. Panggil `markBackNavigationDismissing` pada `handleDismiss`. Uji 3 skenario regresi komprehensif. | **CLOSED** |
| **R124-02** | `refactor-ss-pdo/refact_123/REPAIR_REPORT.md`, `evidence/file-sizes.txt` | Rendah | Klaim Escape topmost di atas SweetAlert2 tidak terbukti karena SweetAlert2 tidak terdaftar di `modalStackCoordinator`. Angka ukuran berkas `340/908` tidak menjelaskan metodologi baris tidak kosong vs baris fisik. | Catat errata resmi: SweetAlert2 adalah stack independen (hanya terkoordinasi via `Swal.isVisible()` pada hardware Back). Dokumentasikan kedua metodologi hitung baris secara eksplisit di tabel bukti. | **CLOSED** |

---

## 3. Rincian Temuan & Implementasi Perbaikan

### 1. ID: R124-01 (Koordinasi Back Berulang Selama Animasi Keluar 220 ms)

- **Akar Masalah:**
  Pada implementasi sebelumnya di `refact_123`, fungsi `handlePopState` di `historyNavigation.ts` menjalankan `const topEntry = navigationStack.pop()` seketika saat event `popstate` pertama diterima.
  Ketika `BusInputModal` merespons via `handleDismiss`, modal memulai animasi keluar berdurasi 220 ms sebelum memanggil `onClose()`.
  Selama rentang 220 ms tersebut:
  1. Komponen modal masih terpasang di DOM (*mounted*).
  2. Kartu modal masih terlihat (*animating out*).
  3. Modal masih memegang *scroll lock* (`acquireScrollLock`).
  4. Namun entri modal tersebut **sudah hilang** dari `navigationStack`.
  Jika pengguna menekan tombol Back fisik kedua kali secara cepat (<220 ms):
  - `handlePopState` melihat `navigationStack` sudah berkurang, sehingga memproses modal di bawahnya (jika ada dialog bertumpuk) atau langsung melompat ke Priority 3 (navigasi root / toast *"Tekan sekali lagi untuk keluar"*).
  - Hal ini merusak draft pengguna pada modal di bawahnya atau memicu navigasi keluar yang tidak diinginkan.

- **Dampak User di Lapangan:**
  Petugas operasional yang menekan tombol hardware Back atau gesture swipe-back Android dua kali secara agresif di halte berisiko menutup modal pelaporan di belakang form bus atau keluar dari aplikasi saat form bus sedang beranimasi menutup.

- **Mitigasi Teknis yang Diterapkan:**
  1. **Properti `isDismissing` pada `BackNavigationEntry`:**
     Mendefinisikan flag opsional `isDismissing?: boolean` pada interface `BackNavigationEntry`.
  2. **Stack Retention Selama Fase Animasi:**
     Pada `handlePopState`, entri teratas **TIDAK langsung di-pop** dari `navigationStack`. Entri hanya ditandai `topEntry.isDismissing = true`, lalu `topEntry.onBack()` dipanggil.
     Entri baru dilepas dari `navigationStack` ketika komponen benar-benar di-unmount melalui pemanggilan `removeBackNavigation(id)` dari cleanup effect `useMobileBackHandler`.
  3. **Penyaringan Event Back Tambahan:**
     Jika `handlePopState` dipanggil saat `topEntry.isDismissing === true` (Back kedua dalam <220 ms):
     - Event Back tambahan diabaikan seketika.
     - Browser history diselaraskan kembali via `history.pushState` jika status history telah terpotong oleh browser engine.
     - Eksekusi langsung `return` tanpa menyentuh entri di bawahnya dan tanpa memicu navigasi root.
  4. **Utilitas `markBackNavigationDismissing(id)`:**
     Menambahkan dan mengekspor fungsi `markBackNavigationDismissing(id)` pada `historyNavigation.ts`.
     Fungsi ini dipanggil oleh `handleDismiss()` di `BusInputModal.tsx` sehingga jika penutupan dipicu dari elemen UI (tombol X header, tombol Batal footer, atau backdrop tap), entri langsung dikunci dalam status `isDismissing` selama animasi 220 ms berlangsung.
  5. **Verifikasi Tes Regresi Wajib:**
     - **Tes 1:** Dua modal bertumpuk (Bus Input + modal atas). Back pertama menutup hanya modal atas; Back kedua dalam <220 ms tidak memicu penutupan Bus Input; Back ketiga setelah modal atas unmount baru menutup Bus Input.
     - **Tes 2:** Bus Input sendiri. Dua Back dalam <220 ms menghasilkan tepat 1 `onClose`, tanpa navigasi root / toast root selama masih tampil; setelah unmount, history dan scroll lock pulih ke 0.
     - **Tes 3:** Idempotensi penuh untuk Escape, backdrop click ganda, tombol Batal ganda, dan penutupan paksa via properti `isOpen = false`.

---

### 2. ID: R124-02 (Akurasi Laporan, Errata SweetAlert2, & Metodologi Baris)

- **Akar Masalah:**
  1. Pada laporan `refact_123`, tercantum skenario bahwa `modalStackCoordinator` mengelola penekanan Escape secara bertumpuk di atas dialog SweetAlert2. Padahal SweetAlert2 adalah pustaka eksternal yang memiliki listener keydown Escape mandiri dan tidak pernah terdaftar pada `activeModalStack` di `modalStackCoordinator.ts`.
  2. Ukuran berkas `BusInputModal.tsx` dilaporkan sebagai 340 baris dan berkas pengujian sebagai 908 baris tanpa penjelasan bahwa angka tersebut adalah **baris tidak kosong (non-empty lines)**, sedangkan jumlah baris fisik raw-nya saat audit adalah 361 dan 1062 baris.

- **Mitigasi & Catatan Errata Resmi:**
  1. **Errata Koordinasi SweetAlert2:**
     SweetAlert2 diperlakukan secara terpisah dari `modalStackCoordinator`.
     - Untuk **Hardware Back Android (`popstate`)**, SweetAlert2 terkoordinasi pada Priority 1 di `historyNavigation.ts` (`if (Swal.isVisible()) { Swal.close(); return; }`).
     - Untuk **Escape Keyboard**, SweetAlert2 mengelola event Escape-nya sendiri melalui konfigurasi bawaan pustaka (`allowEscapeKey: true`), bukan melalui `modalStackCoordinator`. Skenario pengujian dan laporan teknis tidak lagi mencampuradukkan kedua sistem ini.
  2. **Standardisasi Metodologi Hitung Baris:**
     Mulai `refact_125`, seluruh pelaporan ukuran berkas wajib menyajikan dua metrik secara berdampingan:
     - **Baris Fisik (Raw Lines):** Total baris teks termasuk baris kosong berdasarkan `[System.IO.File]::ReadAllLines()`.
     - **Baris Tidak Kosong (Non-Empty Lines):** Total baris kode/komentar tidak kosong berdasarkan `Where-Object { $_.Trim() -ne '' }`.
     Pada `BusInputModal.tsx` pasca-revisi:
     - Baris fisik: **368 baris** (tetap memenuhi batas ketat modularitas proyek < 400 baris).
     - Baris tidak kosong: **346 baris**.
