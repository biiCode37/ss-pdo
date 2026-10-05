# Laporan Perbaikan Kode — Fase 2, Batch 2.3 Revisi Akhir (`refact_98`)

Laporan ini mendokumentasikan implementasi dan verifikasi perbaikan kode untuk temuan Codex pada `refact_97` (R97-01, R97-02, R97-03). Seluruh pekerjaan diselesaikan secara ketat pada branch `devmode` tanpa mengubah direktori arsip terdahulu (`refact_1` hingga `refact_97`) maupun artefak `dist_old/`.

---

## 1. Ringkasan Eksekutif

| Parameter | Keterangan |
|---|---|
| **Batch Kerja** | Fase 2, Batch 2.3 (Revisi Akhir Penyelarasan Dismiss Stack & Z-Index) |
| **Branch Git** | `devmode` |
| **Status Gerbang** | **`READY_FOR_REVIEW`** |
| **Temuan Diselesaikan** | **R97-01** (Stack Re-registration Flaw), **R97-02** (Render-Phase Ref Mutation & Z-Index Allocation), **R97-03** (Targeted Lint Precision & Warning Isolation) |
| **Verifikasi Unit Test** | **100% Pass** (Targeted: 6 file / 36 tes; Seluruh `src/`: 83 file / 586 tes) |
| **Build & Typecheck** | **100% Pass** (`tsc -b` lulus 0 error; `vite build --emptyOutDir false` lulus 0 error) |
| **Oxlint Target** | **0 Warning pada Kode Baru/Dimodifikasi** (`ModalShell.tsx` bersih 0 warning; 4 warning historis diisolasi) |
| **Knowledge Graph** | **Terkini** (`graphify update .` dijalankan) |

---

## 2. Rincian Implementasi Perbaikan

### R97-01: Penstabilan Posisi Stack LIFO & Sinkronisasi Escape/Back dengan Mutable Callback Ref

#### Masalah Utama
Pada `refact_96`, `useEffect` yang mendaftarkan listener keyboard Escape di `ModalShell.tsx` menyertakan `onClose` dalam dependency array. Ketika parent (`Dashboard.tsx`) merender ulang (misalnya saat membuka modal baru `ReportModalLayout`), parent membuat fungsi arrow inline baru untuk prop `onClose`. Hal ini menyebabkan efek cleanup dan registrasi ulang berjalan pada modal bawah (`QueueModal`), mendorong `QueueModal` ke urutan teratas stack LIFO `modalStackCoordinator`, padahal secara visual `ReportModalLayout` berada di atasnya dengan zIndex 99999. Tombol Escape akhirnya menutup dialog di belakang, sedangkan tombol Android Back menutup dialog di depan.

#### Solusi Implementasi
1. **Pemisahan Callback Ref (`onCloseRef`):**
   Di `ModalShell.tsx`, callback `onClose` disimpan dalam `onCloseRef` yang diperbarui setiap render menggunakan `useLayoutEffect` tanpa memicu re-render atau menjalankan ulang efek pendaftaran modal:
   ```tsx
   const onCloseRef = useRef(onClose);
   useLayoutEffect(() => {
     onCloseRef.current = onClose;
   });
   ```
2. **Isolasi Dependensi Pendaftaran Modal:**
   Dependensi efek keyboard dan pendaftaran modal diubah menjadi `[isOpen, id, baseZIndex, closeOnEscape]` tanpa menyertakan `onClose`. Saat parent merender ulang dengan callback baru, modal yang tetap terbuka (`isOpen = true`) tidak pernah melepas atau mendaftar ulang, sehingga posisi stack LIFO-nya tetap stabil.
3. **Idempotensi In-Place pada Koordinator:**
   Di `src/utils/modalStackCoordinator.ts`, fungsi `registerModalDismiss` disempurnakan: bila ID modal sudah ada di stack, entri diperbarui secara *in-place* tanpa mengubah urutan stack LIFO.
4. **Sinkronisasi Escape & Back:**
   Handler tombol Escape mengeksekusi `onCloseRef.current()`, sedangkan `useMobileBackHandler` juga mengeksekusi `onCloseRef.current()`. Keduanya terjamin memanggil callback terbaru dari render terakhir parent.

#### Before vs After
**Before (`src/components/ui/ModalShell.tsx:195-208` - `refact_96`):**
```tsx
useEffect(() => {
  if (!isOpen) return;

  const unregister = registerModalDismiss({
    id,
    onDismiss: onClose ?? (() => {}), // Callback terikat ke closure saat render ini
    zIndex: computedZIndex,
  });
  // ...
}, [isOpen, closeOnEscape, onClose, id, computedZIndex]); // onClose memicu unregister dan push ulang ke stack!
```

**After (`src/components/ui/ModalShell.tsx:206-258` - `refact_98`):**
```tsx
// onCloseRef selalu mutakhir via useLayoutEffect terpisah
const onCloseRef = useRef(onClose);
useLayoutEffect(() => {
  onCloseRef.current = onClose;
});

// Efek registrasi hanya bereaksi saat status buka/tutup atau id berubah
useLayoutEffect(() => {
  if (!isOpen) {
    if (backdropRef.current) {
      backdropRef.current.style.zIndex = String(baseZIndex);
    }
    return;
  }

  const highestActiveZ = getHighestActiveZIndex();
  const allocatedZ =
    highestActiveZ > 0 ? Math.max(baseZIndex, highestActiveZ + 10) : baseZIndex;

  if (backdropRef.current) {
    backdropRef.current.style.zIndex = String(allocatedZ);
  }

  const unregister = registerModalDismiss({
    id,
    onDismiss: () => {
      onCloseRef.current?.(); // Selalu mengeksekusi callback render terbaru
    },
    zIndex: allocatedZ,
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isTopmostModal(id)) return;
    if (e.key === "Escape") {
      if (closeOnEscape && onCloseRef.current) {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current(); // Selalu mengeksekusi callback render terbaru
      }
      return;
    }
    // ...
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    unregister();
  };
}, [isOpen, id, baseZIndex, closeOnEscape]); // onClose dikeluarkan dari dependensi
```

#### Case: Skenario Lapangan
> **Kasus Operasional:** Petugas pengawas di lapangan sedang memeriksa antrean pengiriman offline (membuka dialog `QueueModal`, zIndex 100). Saat antrean masih terbuka, petugas menekan tombol untuk melihat rincian laporan rute (`ReportModalLayout`, zIndex 99999). Parent dashboard merender ulang untuk membuka dialog laporan dan membuat fungsi penutup baru.
> - **Sebelum Perbaikan:** Re-render parent memicu registrasi ulang `QueueModal` ke puncak stack dismiss. Saat petugas menekan tombol keyboard Escape untuk menutup dialog laporan, yang tertutup adalah dialog antrean di belakangnya, sementara laporan tetap terbuka. Petugas mengalami disorientasi karena tampilan visual dan respons tombol Escape tidak sinkron.
> - **Setelah Perbaikan:** Urutan stack LIFO tetap terkunci. `ReportModalLayout` yang dibuka terakhir menjadi modal paling atas di layar (zIndex 99999) sekaligus target tunggal tombol Escape dan Android Back. Penekanan pertama Escape/Back menutup laporan; penekanan kedua Escape/Back baru menutup antrean.

---

### R97-02: Eliminasi Mutasi Ref Saat Render & Penetapan Lapisan Visual via Layout Lifecycle

#### Masalah Utama
Di `refact_96`, `assignedZIndexRef.current` dibaca dan dimutasi langsung pada badan fungsi komponen `ModalShell`:
```tsx
if (isOpen && assignedZIndexRef.current === null) {
  const highestActiveZ = getHighestActiveZIndex();
  assignedZIndexRef.current = highestActiveZ > 0 ? Math.max(baseZIndex, highestActiveZ + 10) : baseZIndex;
}
```
Hal ini memicu 7 peringatan `react(refs)` pada `oxlint` karena melanggar aturan reaktif React Compiler. Selain itu, pembacaan koordinator eksternal saat fase render berisiko menghasilkan nilai yang salah pada pembukaan serentak sebelum effect melakukan commit.

#### Solusi Implementasi
1. **Penghapusan Total Akses Ref Saat Render:**
   `assignedZIndexRef` dihapus secara menyeluruh dari kode.
2. **Penerapan Nilai Z-Index via `backdropRef` pada Layout Lifecycle:**
   Komponen merender elemen backdrop dengan z-index dasar (`baseZIndex`). Pada fase `useLayoutEffect` (yang berjalan secara sinkron tepat setelah mutasi DOM dan sebelum layar dicat oleh peramban):
   - Nilai z-index tertinggi aktif diambil dari `getHighestActiveZIndex()`.
   - Jika modal dibuka di atas modal lain yang sudah aktif, nilai z-index dihitung secara deterministik (`Math.max(baseZIndex, highestActiveZ + 10)`).
   - Nilai tersebut langsung diterapkan ke atribut style DOM (`backdropRef.current.style.zIndex = String(allocatedZ)`).
3. **Bebas Rendering Cascading:**
   Pendekatan ini tidak memanggil `setState` di dalam effect (menghindari peringatan `react(set-state-in-effect)`), tidak memicu re-render cascading, dan sepenuhnya aman untuk optimasi React Compiler.

#### Before vs After
**Before (`src/components/ui/ModalShell.tsx:96-107` - `refact_96`):**
```tsx
const baseZIndex = zIndex ?? 100;
const assignedZIndexRef = useRef<number | null>(null);

if (isOpen && assignedZIndexRef.current === null) { // PELANGGARAN: Membaca ref saat render
  const highestActiveZ = getHighestActiveZIndex();
  assignedZIndexRef.current =
    highestActiveZ > 0 ? Math.max(baseZIndex, highestActiveZ + 10) : baseZIndex; // PELANGGARAN: Menulis ref saat render
} else if (!isOpen) {
  assignedZIndexRef.current = null;
}

const computedZIndex = assignedZIndexRef.current ?? baseZIndex;
```

**After (`src/components/ui/ModalShell.tsx:92-105, 206-224` - `refact_98`):**
```tsx
const backdropRef = useRef<HTMLDivElement>(null);
const baseZIndex = zIndex ?? 100;

useLayoutEffect(() => {
  if (!isOpen) {
    if (backdropRef.current) {
      backdropRef.current.style.zIndex = String(baseZIndex);
    }
    return;
  }

  const highestActiveZ = getHighestActiveZIndex();
  const allocatedZ =
    highestActiveZ > 0 ? Math.max(baseZIndex, highestActiveZ + 10) : baseZIndex;

  if (backdropRef.current) {
    backdropRef.current.style.zIndex = String(allocatedZ); // Bersih & aman di layout lifecycle
  }

  const unregister = registerModalDismiss({
    id,
    onDismiss: () => {
      onCloseRef.current?.();
    },
    zIndex: allocatedZ,
  });
  // ...
}, [isOpen, id, baseZIndex, closeOnEscape]);
```

#### Case: Skenario Lapangan
> **Kasus Operasional:** Peranti seluler petugas dengan spesifikasi terbatas (CPU lambat atau frame rate rendah) merender antarmuka saat transisi beberapa dialog dibuka secara cepat atau bersamaan.
> - **Sebelum Perbaikan:** Mutasi ref saat render berpotensi menyebabkan ketidakteraturan lapisan tampilan dan membuat React Compiler menonaktifkan optimasi rendering pada seluruh hierarki dialog modal.
> - **Setelah Perbaikan:** Komponen `ModalShell` dioptimasi penuh oleh compiler tanpa penalti performa, z-index diterapkan sinkron sebelum peramban melakukan *paint*, dan tidak ada *flickering* atau salah urutan lapisan visual.

---

### R97-03: Pelaporan Lint Target yang Presisi dan Pemisahan Warning Historis

#### Masalah Utama
Pada `refact_96`, laporan teknis menyatakan targeted lint "bersih dari peringatan baru", padahal bukti `targeted-lint.txt` mencatat 11 warnings (7 di antaranya adalah warning baru `react(refs)` di `ModalShell.tsx`).

#### Solusi Implementasi
1. Seluruh 7 peringatan baru `react(refs)` di `ModalShell.tsx` telah diselesaikan 100%. `ModalShell.tsx` kini memiliki **0 warnings dan 0 errors** di bawah `oxlint` (116 rules).
2. Laporan targeted lint untuk ke-12 file yang terkait Batch 2.3 dipisahkan secara transparan dan jujur:
   - File baru / dimodifikasi pada Batch 2.3 (`ModalShell.tsx`, `modalStackCoordinator.ts`, `modalStackCoordinator.test.ts`, `QueueModal.tsx`, `ReportModalLayout.tsx`, `QueueReportIntegration.test.tsx`, dll): **0 Warnings, 0 Errors**.
   - Peringatan historis yang diisolasi: **Tepat 4 Warnings** (seluruhnya merupakan unused catch parameter `_err` pada `src/utils/historyNavigation.ts:79, 94, 113, 129` dari implementasi navigasi historis terdahulu).

---

## 3. Matriks Quality Gates & Hasil Verifikasi

Seluruh pemeriksaan mutu telah dijalankan dan diverifikasi:

| Gerbang Mutu | Perintah / Bukti | Target | Hasil Aktual | Status |
|---|---|---|---|:---:|
| **Targeted Tests** | `pnpm vitest run src/utils/modalStackCoordinator.test.ts src/utils/scrollLockCoordinator.test.ts src/components/ui/ModalShell.test.tsx src/components/dashboard/QueueModal.test.tsx src/components/pdoReport/ReportModalLayout.test.tsx src/components/dashboard/QueueReportIntegration.test.tsx` (`refactor-ss-pdo/refact_98/evidence/targeted-tests.txt`) | 6 file lulus 100% | **6 file lulus, 36 tes passed, 0 gagal** (Order 1 & 2 bertahap, pembukaan serentak, multi re-render, penutupan modal bawah, Escape & Back) | **PASS** |
| **Full Suite Tests** | `pnpm vitest run src/` (`refactor-ss-pdo/refact_98/evidence/full-tests.txt`) | Seluruh tes `src/` lulus | **83 file lulus, 586 tes passed, 0 gagal** | **PASS** |
| **Targeted Lint (R97-03)** | `pnpm dlx oxlint <12 targeted files>` (`refactor-ss-pdo/refact_98/evidence/targeted-lint.txt`) | 0 warning baru, `ModalShell.tsx` bersih | **4 warnings (100% historis `_err` di `historyNavigation.ts`), 0 errors**. `ModalShell.tsx` bersih 0 warning | **PASS** |
| **Root Lint (R89-01)** | `pnpm dlx oxlint` (`refactor-ss-pdo/refact_98/evidence/root-lint.txt`) | Pantau noise `dist_old/` | 1.913 warnings (noise minified di `dist_old/`, tidak ada regresi source) | **INFO** |
| **Typecheck & Build** | `pnpm exec tsc -b; pnpm exec vite build --emptyOutDir false` (`refactor-ss-pdo/refact_98/evidence/build.txt`) | Exit code 0 | **`tsc -b` 0 error; Vite build sukses dalam 1.79s** | **PASS** |
| **Knowledge Graph** | `graphify update .` | Graf AST terbarui | **5.969 nodes, 9.880 edges, 447 communities** | **PASS** |

---

## 4. Verifikasi Tampilan Mobile & Aksesibilitas (Light / Dark Theme)

Sesuai aturan `AGENTS.md` dan `.agents/AGENTS.md`:
- **Kompatibilitas Tema (Light & Dark):**
  - Backdrop dialog menggunakan overlay semitransparan konsisten (`rgba(0, 0, 0, 0.65)`).
  - Kontainer dialog `QueueModal` menggunakan token Tailwind `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100`.
  - Kontainer dialog `ReportModalLayout` menggunakan `bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100`.
  - Kedua tema memiliki kontras visual yang tajam dan nyaman di layar peranti seluler petugas lapangan.
- **Aksesibilitas Keyboard & WAI-ARIA:**
  - `role="dialog"` dan `aria-modal="true"` saat terbuka.
  - Fokus terperangkap di dalam dialog teratas menggunakan handler Tab / Shift+Tab.
  - Restorasi fokus yang aman ke elemen pemicu tanpa mengganggu dialog lain yang masih aktif di bawahnya.
- **Batasan Uji Visual:**
  - Pengujian dilakukan melalui lingkungan headless Happy-DOM dan bundling Vite. Verifikasi peranti fisik Android langsung dengan gesture swipe back sistem peramban mobile direkomendasikan pada pengujian lapangan pengguna berikutnya.

---

## 5. Daftar File yang Dimodifikasi

1. **`src/utils/modalStackCoordinator.ts`**
   - Menambahkan mekanisme pembaruan callback & z-index *in-place* ketika modal dengan `id` yang sama didaftarkan ulang, mencegah perubahan posisi stack LIFO saat parent re-render.
2. **`src/utils/modalStackCoordinator.test.ts`**
   - Menambahkan pengujian unit untuk memastikan registrasi ulang dengan ID yang sama memperbarui callback tanpa mengubah urutan stack LIFO dan tetap idempoten saat unregister ganda.
3. **`src/components/ui/ModalShell.tsx`**
   - Memisahkan `onClose` ke dalam `onCloseRef` yang diperbarui via `useLayoutEffect`.
   - Menghapus dependensi `onClose` dari efek registrasi modal dan handler Escape.
   - Menghapus pembacaan/penulisan `assignedZIndexRef` pada render body untuk mengeliminasi 7 peringatan `react(refs)` oxlint.
   - Menetapkan z-index melalui `backdropRef.current.style.zIndex` di `useLayoutEffect` tanpa memicu re-render cascading (`react(set-state-in-effect)`).
4. **`src/components/dashboard/QueueReportIntegration.test.tsx`**
   - Menambahkan pengujian bertahap (*staggered 2-render flow*): Order 1 (Queue buka render 1, parent re-render dengan callback baru & Report buka render 2) untuk tombol Escape dan Android Back.
   - Menambahkan pengujian bertahap Order 2 (Report buka render 1, parent re-render dengan callback baru & Queue buka render 2) untuk tombol Escape dan Android Back.
   - Menambahkan pengujian pembukaan serentak (*simultaneous*).
   - Menambahkan pengujian re-render parent berulang kali (4 render) dengan identitas callback baru untuk membuktikan bahwa urutan modal tidak bergeser dan Escape mengeksekusi callback render terbaru.
   - Menambahkan pengujian penutupan modal bawah terlebih dahulu dengan mempertahankan modal atas tetap utuh dan fokus terjaga.

---

## 6. Status Akhir

**`READY_FOR_REVIEW`** — Seluruh temuan revisi Codex (R97-01, R97-02, R97-03) telah diselesaikan secara tuntas. Seluruh pengujian unit target (36/36) dan suite lengkap (586/586) lulus 100%, build produksi lulus tanpa error, lint target bebas dari peringatan baru, dan knowledge graph telah terbarui.
