# Standar Kontrak UI, Reusable Primitives, dan Matriks Skenario — Refact 82

- **Dokumen:** Kontrak Arsitektur Antarmuka & Matriks Skenario Lapangan (Revisi Hasil Review Codex)
- **Fase Program:** Fase 1 (Audit Lengkap & Kontrak Perapihan)
- **Tujuan:** Menetapkan spesifikasi antarmuka yang presisi, pemetaan token CSS aktual, pengelolaan scroll lock terkoordinasi, dan kontrak komponen pilot yang terbukti memiliki minimal 2 konsumen nyata.

---

## 1. Prinsip Desain & Batasan Arsitektur UI SS_PDO

1. **Mobile-First Operasional Lapangan:** Seluruh komponen dioptimasi untuk pengetikan dan navigasi satu tangan di layar ponsel (touch targets $\ge 44 \times 44$ px, kontras tinggi di bawah cahaya luar ruangan).
2. **Dua Tema Wajib (Light & Dark Mode) via Token Terverifikasi:**
   - Seluruh pewarnaan wajib menggunakan variabel CSS yang **sungguh terdefinisi di `src/index.css:3`**:
     - Latar belakang: `var(--bg-color)` (#0c0c0c), `var(--surface-color)` (#171717), `var(--card-bg)` (rgba(23, 23, 23, 0.85)), `var(--input-bg)` (rgba(30, 30, 30, 0.7)).
     - Batas (Border): `var(--card-border)` (rgba(255, 255, 255, 0.08)).
     - Tipografi: `var(--text-primary)` (#ededed), `var(--text-secondary)` (#8b8b8b).
     - Aksen & Status: `var(--accent-color)` (#3ECF8E), `var(--danger-color)` (#f75555), `var(--warning-color)` (#f59e0b).
     - Shift Semantic: `var(--shift1-color)` (#38bdf8), `var(--shift2-color)` (#c084fc), `var(--total-color)` (#4ade80).
   - *Koreksi Token:* Dilarang merujuk variabel yang belum ada seperti `var(--bg-main)`.
3. **Sentralisasi Teks Kamus (Anti-Hardcoded String):** Setiap label, placeholder, pesan validasi, dan judul dialog wajib bersumber dari `src/constants/texts/`.
4. **Zero Over-Engineering (Ponytail / YAGNI):** Tidak membuat komponen generik spekulatif. Setiap komponen bersama (*shared*) wajib memiliki **minimal 2 konsumen nyata** dengan kesamaan kontrak perilaku (bukan sekadar kesamaan visual kebetulan).
5. **Pemisahan Tegas Domain vs UI Primitive:** Komponen primitive UI (`src/components/ui/`) dilarang mengimpor tipe domain operasional bus (`BusData`, `OperationalReport`, Google Sheets API).

---

## 2. Audit Keluarga UI & Kontrak Komponen Pilot

---

### A. Kontrak Pilot Reusable Form Input Shift 1 & Shift 2 (Keluarga Form Controls)

Hasil audit membuktikan bahwa `BusInputModalShift1.tsx` dan `BusInputModalShift2.tsx` berbagi dua pola kontrol yang sama persis:
1. **Input Numerik (Hero & Secondary Input):**
   - Hero Input: Digunakan untuk TOA Shift 1 dan Total TOA Shift 2 (`fontSize: 1.15rem`, `fontWeight: 800`, `border: 1.5px solid var(--card-border)`).
   - Secondary Input: Digunakan untuk KM Awal dan KM Akhir pada kedua shift (`fontSize: 0.95rem`, `border: 1px solid var(--card-border)`).
2. **Action Toggle Chips (Manual & Keterangan):**
   - Digunakan pada Shift 1 (`BusInputModalShift1.tsx:402, 412`) untuk tombol `Manual Shift 1` dan `Catatan`.
   - Digunakan pada Shift 2 (`BusInputModalShift2.tsx:404, 414`) untuk tombol `Manual Shift 2` dan `Catatan`.
   - *Catatan Scope:* Status armada (SGO, AP, AC, dll.) **tidak dimasukkan** ke pilot form shift karena status armada adalah domain terpisah dari fitur `fleetStatus`.

#### 1. Kontrak Komponen: `BusFormField`
- **Lokasi Rencana:** `src/components/busCard/modal/fields/BusFormField.tsx`
- **Konsumen Nyata:** `BusInputModalShift1.tsx` dan `BusInputModalShift2.tsx` (2 konsumen).
- **Props Minimum:**
  ```ts
  export interface BusFormFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (val: string) => void;
    variant?: "hero" | "secondary";
    inputRef?: React.RefObject<HTMLInputElement>;
    placeholder?: string;
    readOnly?: boolean;
    hint?: string;
    error?: string | null;
    actionBadge?: React.ReactNode;
    onFocus?: () => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  }
  ```
- **Aksesibilitas:** Terhubung eksplisit ke `<label htmlFor={id}>`, `aria-invalid={Boolean(error)}`, `aria-describedby={error ? \`${id}-error\` : undefined}`.

#### 2. Kontrak Komponen: `ShiftOptionChip`
- **Lokasi Rencana:** `src/components/busCard/modal/fields/ShiftOptionChip.tsx`
- **Konsumen Nyata:** `BusInputModalShift1.tsx` (Manual S1, Catatan) dan `BusInputModalShift2.tsx` (Manual S2, Catatan) (2 konsumen, 4 call sites).
- **Props Minimum:**
  ```ts
  export interface ShiftOptionChipProps {
    id: string;
    labelActive: string;
    labelInactive: string;
    isActive: boolean;
    onToggle: () => void;
    icon?: React.ReactNode;
  }
  ```
- **Perilaku Visual:** Menghilangkan duplikasi fungsi `getChipStyle(isActive)` di kedua file dan menerapkan transisi kurva fisik pegas Apple: `cubic-bezier(0.32, 0.72, 0, 1)`.

---

### B. Kontrak Dialog & Body Scroll Lock Terkoordinasi (Keluarga Modals)

Berdasarkan tinjauan R81-04, sekadar menyimpan `prevOverflow` lokal pada masing-masing modal **tidak stack-safe** bila urutan penutupan modal dibalik (Modal A membuka Modal B, namun Modal A ditutup lebih dulu sebelum Modal B).

#### Spesifikasi Body Scroll Lock: Coordinated Reference Counter
Penguncian body scroll diatur melalui utilitas counter terpusat:
```ts
// src/utils/scrollLockCoordinator.ts
let activeModalCount = 0;
let initialBodyOverflow = "";

export function acquireBodyScrollLock(): () => void {
  if (activeModalCount === 0) {
    initialBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  activeModalCount++;

  let released = false;
  return function releaseBodyScrollLock() {
    if (released) return;
    released = true;
    activeModalCount = Math.max(0, activeModalCount - 1);
    if (activeModalCount === 0) {
      document.body.style.overflow = initialBodyOverflow;
    }
  };
}
```

#### Pengujian Wajib untuk Dua Urutan Penutupan:
1. **Urutan 1 (Standar):** Modal A buka $\rightarrow$ Modal B buka $\rightarrow$ Modal B tutup $\rightarrow$ Modal A tutup.
   - Hasil: Scroll body tetap `"hidden"` saat B tutup, dan baru pulih ke `initialBodyOverflow` saat A tutup.
2. **Urutan 2 (Terbalik / Dismiss Parent):** Modal A buka $\rightarrow$ Modal B buka $\rightarrow$ Modal A tutup lebih dulu $\rightarrow$ Modal B masih aktif.
   - Hasil: Scroll body **tetap terkunci** `"hidden"` selama `activeModalCount > 0`, dan baru pulih ketika Modal B akhirnya ditutup.

#### Kontrak Baku Dialog: `ModalShell`
- **Lokasi Rencana:** `src/components/ui/ModalShell.tsx`
- **Konsumen Pilot Terencana:** `QueueModal.tsx` dan `ReportModalLayout.tsx`.
- **Props Minimum:**
  ```ts
  export interface ModalShellProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    ariaLabel: string;
    children: React.ReactNode;
    zIndex?: number; // Default 10000
    mobileBackId?: string; // ID untuk useMobileBackHandler
    maxWidth?: string; // Default 560px
  }
  ```
- **Fitur Terintegrasi:**
  1. `createPortal(..., document.body)` untuk isolasi konteks DOM.
  2. Integrasi `acquireBodyScrollLock()` terpusat.
  3. Global listener tombol `Escape`.
  4. Integrasi `useMobileBackHandler` untuk tombol kembali Android.
  5. Aksesibilitas ARIA: `role="dialog"`, `aria-modal="true"`, `aria-label={ariaLabel}`.

---

### C. Ringkasan Status 10 Keluarga UI Lainnya

| Keluarga UI | Contoh Komponen Eksisting | Status Arsitektur | Tindakan |
| :--- | :--- | :--- | :--- |
| **Buttons & IconButtons** | `.btn` di `src/index.css`, `BusInputModalFooter.tsx` | Fungsional, sedikit variasi inline style | Pertahankan gaya saat ini; ekstrak primitif `Button` hanya jika dibutuhkan |
| **Labels & Hints** | Label input di Shift 1/2, banner rollover | Tersebar, R79-06 label error hardcoded | Sentralisasi label validasi ke `text_alerts.ts` (Batch 2.1) |
| **Route & Date Selector** | `RouteSelectorCard.tsx`, `useRouteCascade.ts` | Morphing capsule, bidirectional tap, transisi pegas | **Stabil & Sangat Baik — Pertahankan penuh** |
| **Tabs & Segmented Bar** | `BusInputModalTabs.tsx`, `MonitoringBottomNav.tsx` | Pill segmented control | Pertahankan implementasi lokal saat ini |
| **Badges & Status Chips** | `RoleBadge.tsx`, `FormattedNoteText.tsx` | SSOT badging status armada dan role | **Stabil & Sangat Baik — Pertahankan penuh** |
| **KPI & Summary Metrics** | `KPICard.tsx`, `MonitoringMacroKpiGrid.tsx` | Kartu metrik operasional | Pertahankan integritas angka SSOT murni tanpa pembulatan |
| **Cards & List Items** | `BusCard.tsx`, `MonitoringRouteCardModern.tsx` | Kartu armada dengan glowing pulse 6 detik | **Stabil & Sesuai Aturan Emas — Pertahankan** |
| **Loading & Skeletons** | `Skeletons.tsx` (360 baris) | Shimmer gradient animation | **Stabil & Menjadi SSOT Skeleton** |
| **Empty States** | Fallback pencarian bus / rute | Text informatif + tombol aksi | Pertahankan implementasi lokal |
| **Sticky Header & Nav** | `DashboardHeader.tsx`, `BottomNav.tsx` | Glassmorphism, backdrop-blur, safe-area | **Stabil & Sangat Baik — Pertahankan** |

---

## 3. Matriks Skenario Lapangan & Verifikasi Operasional

| ID Skenario | Konteks Operasional Lapangan | Perilaku yang Diharapkan | Risiko yang Diminimalkan |
| :--- | :--- | :--- | :--- |
| **SC-01** | Petugas mengisi TOA Shift 1 lalu berpindah ke Shift 2 di bawah terik siang hari. | Field Hero TOA Shift 1 dan Total TOA Shift 2 memiliki kontras, ukuran font (1.15rem), dan padding yang seragam via `BusFormField`. Nilai Total TOA tervalidasi $\ge$ TOA Shift 1. | Mencegah inkonsistensi styling antara kedua shift. |
| **SC-02** | Pengawas membuka Detail Rute pada rute dengan total trip ganjil (101 trip) saat data `totalRitasePp` dari sheet kosong. | Nilai Ritase PP tampil murni **50,5 rit** (formula: `route.totalTrips / 2` tanpa `Math.round` dan tanpa `.toFixed(1)`). Bila sheet menyediakan `totalRitasePp`, angka sheet tetap menjadi SSOT. | Mencegah terkatrolnya nilai ritase menjadi 51 rit akibat pembulatan integer sepihak. |
| **SC-03** | Petugas menginput odometer saat keyboard virtual HP terbuka, lalu menekan tombol hardware "Kembali" (Android Back). | Modal form input tertutup dengan mulus tanpa keluar dari aplikasi web; keyboard virtual tertutup; posisi scroll dashboard pulih ke posisi semula. | Mencegah browser keluar dari web aplikasi saat tombol back ditekan. |
| **SC-04** | Pengujian dua urutan penutupan modal bersarang (A tutup sebelum B dan B tutup sebelum A). | Scroll body tetap terkunci selama minimal ada 1 dialog yang aktif, dan baru pulih ke status awal ketika modal terakhir ditutup. | Mencegah kebocoran body scroll lock pada skenario penutupan dialog bertumpuk. |
| **SC-05** | Petugas mengetikkan angka odometer yang kepalanya berganti (rollover 999.998 $\rightarrow$ 000.015). | Sistem memunculkan banner saran rollover yang ramah dan opsi toggle "Abaikan jika ganti speedometer" tanpa memblokir penyimpanan data. | Mencegah form terkunci dan menolak simpan akibat pergantian odometer fisik. |
| **SC-06** | Jaringan seluler di terminal terputus saat petugas menekan tombol Simpan. | Form menyimpan data ke sync queue lokal, menampilkan toast info offline ramah non-teknis, menutup modal, dan menandai kartu bus dengan status pending sync. | Mencegah aplikasi crash atau data hilang saat jaringan tidak stabil. |
| **SC-07** | Pergantian tema dari Dark Mode ke Light Mode saat bertugas di luar ruangan. | Seluruh background kartu, teks label, hero input, dan chip status berubah warna sesuai CSS variables resmi (`--bg-color`, `--card-bg`, dll.) dengan kontras tajam. | Menghilangkan referensi token fiktif (`--bg-main`) dan mencegah teks tidak terbaca. |
