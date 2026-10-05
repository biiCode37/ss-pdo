# Standar Kontrak UI, Reusable Primitives, dan Matriks Skenario — Refact 80

- **Dokumen:** Kontrak Arsitektur Antarmuka & Matriks Skenario Lapangan
- **Fase Program:** Fase 1 (Audit Lengkap & Kontrak Perapihan)
- **Tujuan:** Menetapkan spesifikasi antarmuka yang presisi, props minimum, pemetaan token, pengelolaan aksesibilitas, dan kontrak perilaku mobile-first sebelum implementasi kode pada Fase 2.

---

## 1. Prinsip Desain & Batasan Arsitektur UI SS_PDO

1. **Mobile-First Operasional Lapangan:** Seluruh komponen dioptimasi untuk penggunaan satu tangan di layar ponsel petugas lapangan (touch targets $\ge 44 \times 44$ px, kontras tinggi di bawah terik matahari, tanpa scrollbar fisik mengganggu).
2. **Dua Tema Wajib (Light & Dark Mode):** Seluruh token warna mengambil variabel CSS sentral (`var(--bg-main)`, `var(--card-bg)`, `var(--card-border)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--accent-color)`). Dilarang keras menaruh warna hardcoded yang tidak adaptif.
3. **Sentralisasi Teks Kamus (Anti-Hardcoded String):** Setiap label, placeholder, pesan validasi, dan judul dialog wajib bersumber dari `src/constants/texts/`.
4. **Zero Over-Engineering (Ponytail / YAGNI):** Tidak membuat abstraksi "generik" spekulatif yang hanya dipakai 1 kali. Setiap komponen bersama (*shared*) wajib memiliki **minimal 2 konsumen nyata** dengan kesamaan kontrak perilaku (bukan sekadar kesamaan visual kebetulan).
5. **Pemisahan Tegas Domain vs UI Primitive:** Komponen primitive UI (`src/components/ui/`) dilarang mengimpor tipe domain operasional bus (`BusData`, `OperationalReport`, Google Sheets API). Komponen primitive hanya menerima data primitif murni (`string`, `number`, `boolean`, `ReactNode`, `callback`).

---

## 2. Audit 12 Keluarga Komponen UI

Di bawah ini adalah hasil audit menyeluruh atas 12 keluarga UI di seluruh codebase SS_PDO, mencatat pola yang sudah konsisten dan kontrak untuk perapihan:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TAKSONOMI KELUARGA UI SS_PDO                         │
├──────────────────────────┬─────────────────────────────────────────────┤
│ 1. Buttons & IconButtons │ 7. KPI & Summary Metrics                    │
│ 2. Form Inputs & Numeric │ 8. Cards & List Items                       │
│ 3. Labels, Hints, Errors │ 9. Modals & Bottom Sheets (Shell Baku)      │
│ 4. Route & Date Selector │ 10. Loading, Skeleton & Shimmers            │
│ 5. Tabs & Segmented Bar  │ 11. Empty & Zero-State Fallbacks            │
│ 6. Badges & Status Chips │ 12. Sticky Headers & Bottom Navigation      │
└──────────────────────────┴─────────────────────────────────────────────┘
```

---

### Keluarga 1: Buttons & Icon Buttons

- **Kondisi Eksisting:**
  - Sebagian tombol menggunakan kelas CSS `.btn`, `.btn-primary`, `.btn-secondary` (`src/index.css:253`).
  - Sebagian tombol di form modal (`BusInputModalFooter`, `ShiftConfirmationAlertBar`) menggunakan inline style ad-hoc untuk padding, border-radius, dan transisi fisik pegas.
- **Pola yang Dipertahankan:**
  - Animasi sentuh aktif `transform: scale(0.97)` / `active:scale-95`.
  - Haptic feedback visual dengan kurva pegas Apple: `cubic-bezier(0.32, 0.72, 0, 1)`.
- **Kontrak Komponen Primitive Usulan (`src/components/ui/Button.tsx`):**
  - **Props Minimum:**
    ```ts
    interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
      variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
      size?: 'sm' | 'md' | 'lg';
      isLoading?: boolean;
      icon?: React.ReactNode;
      children: React.ReactNode;
    }
    ```
  - **Konsumen Pertama:** `BusInputModalFooter.tsx` (Simpan & Batal) dan `ReportModalLayout.tsx` (Tutup & Verifikasi).

---

### Keluarga 2: Form Inputs & Numeric Controls (Pilot Utama)

- **Kondisi Eksisting:**
  - `BusInputModalShift1.tsx` dan `BusInputModalShift2.tsx` menduplikasi 100% definisi `heroInputStyle` dan `secondaryInputStyle` (R79-02 / R80-02).
  - Terdapat perbedaan kecil pada penanganan `inputMode="numeric"` vs `inputMode="text"`.
- **Pola yang Dipertahankan:**
  - Input angka primer bergaya **Hero Input** (font size 1.15rem - 1.25rem, font-weight 800, border 1.5px solid) untuk angka krusial (Total TOA & KM Akhir).
  - Input sekunder bergaya ringkas (font size 0.95rem, font-weight 600, border 1px solid) untuk KM Awal dan Manual TOA.
- **Kontrak Komponen Primitive Usulan (`src/components/busCard/modal/fields/BusFormField.tsx`):**
  - **Props Minimum:**
    ```ts
    interface BusFormFieldProps {
      id: string;
      label: string;
      value: string;
      onChange: (val: string) => void;
      variant?: 'hero' | 'secondary';
      inputRef?: React.RefObject<HTMLInputElement>;
      placeholder?: string;
      readOnly?: boolean;
      hint?: string;
      error?: string | null;
      icon?: React.ReactNode;
      actionBadge?: React.ReactNode;
      onFocus?: () => void;
      onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    }
    ```
  - **Konsumen Pertama:** `BusInputModalShift1.tsx` dan `BusInputModalShift2.tsx`.
  - **Aksesibilitas:** Terhubung dengan `<label htmlFor={id}>`, `aria-invalid={!!error}`, `aria-describedby={error ? \`${id}-err\` : undefined}`.

---

### Keluarga 3: Labels, Hints & Validation Banners

- **Kondisi Eksisting:**
  - Label field ditulis tersebar di TSX, sebagian mengambil `TEXT_ALERTS.BUS_INPUT_MODAL`, sebagian hardcoded literal (R79-06).
  - Banner saran rollover (`ROLLOVER_SUGGESTION_TEXT`) dirender dinamis di `BusInputModalShift1.tsx` dan `BusInputModalSingleFocus.tsx`.
- **Pola yang Dipertahankan:**
  - Banner warning berlatar oranye/kuning amber dengan ikon `AlertTriangle`, teks saran rollover, dan tombol pintas satu sentuhan `ROLLOVER_APPLY_BTN`.
- **Kontrak Baku:**
  - Label input: teks 0.8rem, font-weight 600, warna `var(--text-secondary, #94a3b8)`.
  - Banner Rollover Odometer:
    ```ts
    interface RolloverSuggestionBannerProps {
      suggestedKm: string;
      diffKm: number;
      onApply: (suggestedKm: string) => void;
      onBypassToggle: () => void;
      isBypassed: boolean;
    }
    ```

---

### Keluarga 4: Date & Route Cascade Selectors

- **Kondisi Eksisting:**
  - Dikelola oleh `RouteSelectorCard.tsx` dan hook `useRouteCascade.ts`.
  - Menciut (*morphing*) menjadi kapsul ringkas di header setelah data terpilih.
- **Pola yang Dipertahankan:**
  - Animasi transisi fisik pegas Apple: `cubic-bezier(0.32, 0.72, 0, 1)`.
  - Bidirectional tap: Mengetuk kapsul header langsung membuka kembali panel rute tanpa tombol ubah yang mengganggu.
  - Cascade berurutan: Tahun $\rightarrow$ Bulan $\rightarrow$ Kode Rute $\rightarrow$ Tanggal Tab.
- **Status:** **Stabil & Konsisten — Pertahankan penuh.**

---

### Keluarga 5: Tabs, Segmented Controls & Filter Pills

- **Kondisi Eksisting:**
  - Form bus memiliki toggle shift: Shift 1 vs Shift 2 vs Mode All (`BusInputModalTabs.tsx`).
  - Monitoring memiliki filter Korlap (Semua, Korlap 1, Korlap 2, Korlap 3) dan segmented tabs di footer (`MonitoringBottomNav.tsx`).
  - Detail Rute memiliki tab 3 arah: Operasional, Pelanggan, Produktivitas.
- **Pola yang Dipertahankan:**
  - Segmented control dengan kapsul aktif berbayang halus (`box-shadow: 0 2px 8px rgba(0,0,0,0.2)`), latar pill transparan bertepi 1px solid.
- **Kontrak Komponen Primitive Usulan (`src/components/ui/SegmentedControl.tsx`):**
  - **Props Minimum:**
    ```ts
    interface SegmentedOption<T extends string> {
      id: T;
      label: string;
      badge?: string | number;
      icon?: React.ReactNode;
    }
    interface SegmentedControlProps<T extends string> {
      options: SegmentedOption<T>[];
      activeId: T;
      onChange: (id: T) => void;
      size?: 'sm' | 'md';
    }
    ```
  - **Konsumen Pertama:** `MonitoringRouteDetailModal.tsx` (tabs 3 arah) dan `MonitoringRoutesTab.tsx` (filter supervisor).

---

### Keluarga 6: Badges & Status Chips

- **Kondisi Eksisting:**
  - `RoleBadge.tsx` (Admin, Pengawas, Petugas Operasional).
  - Badge Status Armada: SGO (Hijau Siap Guna Operasi), AP (Kuning Aral Perjalanan), AC (Merah Aral Cuaca), dll.
  - Badge Provenance: `Input App` (Biru) vs `Tarik Sheet` (Abu-abu/Hijau).
  - `FormattedNoteText.tsx` untuk smart badging kode berita acara (BA.01-04, OFF, NP1/NP2).
- **Pola yang Dipertahankan:**
  - Standar visual pill badge (`borderRadius: 9999px`, font-size 0.75rem - 0.8rem, font-weight 700, warna status domain yang paten).
- **Status:** **Stabil & Sangat Baik — Pertahankan.** `RoleBadge` dan `FormattedNoteText` tetap menjadi SSOT visual.

---

### Keluarga 7: KPI & Summary Metrics

- **Kondisi Eksisting:**
  - `KPICard.tsx` di dashboard operasional harian.
  - `MonitoringMacroKpiGrid.tsx` di monitoring 18 rute.
  - Kotak metrik modal detail rute (`paxPerKm`, `ritasePerBus`, `totalRitasePp`).
- **Pola yang Dipertahankan:**
  - Angka metrik berukuran besar (1.25rem - 1.5rem, font-weight 800), label di atas/bawah berukuran 0.75rem `var(--text-secondary)`.
  - Aturan Emas: Nilai angka murni sesuai SSOT, dilarang pembulatan sepihak (termasuk koreksi R79-05).

---

### Keluarga 8: Cards & List Items

- **Kondisi Eksisting:**
  - `BusCard.tsx` / `BusCardSummary.tsx` untuk unit bus harian.
  - `MonitoringRouteCardModern.tsx` untuk kartu ringkasan rute monitoring.
  - `UserCardItem.tsx` untuk manajemen user RBAC.
- **Pola yang Dipertahankan:**
  - Background bergradasi halus `var(--card-bg)`, border 1px solid `var(--card-border)`, border-radius 16px.
  - Efek glowing pulse berdenyut selama 6 detik ketika unit bus disentuh dari daftar keterangan (aturan emas `.agents/AGENTS.md`).

---

### Keluarga 9: Modals & Bottom Sheets (Shell Baku — Hotspot R79-03)

- **Audit Rantai Parent & Efek Global:**

| Fitur / File Modal | Portal Target | Escape Key | Android Back (`useMobileBackHandler`) | Body Scroll Lock | Z-Index Layer | Status Kontrak |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `BusInputModal.tsx` | `document.body` | Ya | **Tidak** | `overflow: hidden` (reset `""`) | 99999 | Butuh perapihan shell |
| `ReportModalLayout.tsx`| `document.body` | **Tidak** | **Ya** (`route_operational_report_sheet`) | `overflow: hidden` (simpan `prevOverflow`) | Modal overlay | Butuh Escape handler |
| `MonitoringRouteDetailModal.tsx` | **Inline (Non-Portal)** | **Tidak** | **Tidak** | **Tidak Ada** | 1000 | **Hotspot Kritis** |
| `QueueModal.tsx` | **Inline (Non-Portal)** | Ya | **Tidak** | `overflow: hidden` (reset `""`) | 100 | Butuh perapihan shell |
| `FleetStatusModal.tsx` | `document.body` | Ya | **Tidak** | `overflow: hidden` | 9999 | Butuh Android back |
| `AccumulationSheet.tsx`| `document.body` | **Tidak** | **Tidak** | Gesture lock | 9999 | Butuh perapihan shell |

- **Spesifikasi Kontrak Modal Baku (`src/components/ui/ModalShell.tsx`):**
  - **Props Minimum:**
    ```ts
    interface ModalShellProps {
      isOpen: boolean;
      onClose: () => void;
      title?: string;
      ariaLabel: string;
      children: React.ReactNode;
      zIndex?: number; // Default 10000
      mobileBackId?: string; // ID untuk useMobileBackHandler
      maxWidth?: string; // Default 560px
      isBottomSheet?: boolean; // Default true (slide up on mobile)
    }
    ```
  - **Efek Global Wajib Ditangani Shell:**
    1. `createPortal(..., document.body)` untuk melepaskan modal dari overflow dan transform parent.
    2. Stack-safe Body Scroll Lock: Mencatat `prevOverflow = document.body.style.overflow`, menetapkan `"hidden"` saat aktif, dan memulihkan nilai `prevOverflow` asli saat ditutup.
    3. Keyboard Escape: Event listener global `Escape` yang memicu `onClose`.
    4. Hardware Back Android: Mengaktifkan `useMobileBackHandler` bila `mobileBackId` diberikan.
    5. Aksesibilitas ARIA: `role="dialog"`, `aria-modal="true"`, `aria-label={ariaLabel}`.
    6. Viewport Keyboard Safe-Area: Penyesuaian `maxHeight: "90dvh"` dan `paddingBottom: "env(safe-area-inset-bottom)"` agar tombol aksi bawah tidak tertutup keyboard virtual.

---

### Keluarga 10: Loading, Skeleton & Shimmers

- **Kondisi Eksisting:**
  - `src/components/Skeletons.tsx` (360 baris) menyediakan skeleton kartu bus, skeleton KPI, dan skeleton tabel rute.
- **Pola yang Dipertahankan:**
  - Animasi shimmer berulang dengan gradien linier transparan di atas background kartu.
- **Status:** **Stabil & Sangat Reusable — Jadikan SSOT skeleton.**

---

### Keluarga 11: Empty & Zero-State Fallbacks

- **Kondisi Eksisting:**
  - Terdapat pesan kosong saat pencarian bus tidak menemukan nomor unit, saat rute tidak memiliki data armada, atau saat antrean offline kosong.
- **Pola yang Dipertahankan:**
  - Ikon informatif di tengah, judul singkat 14px bold, deskripsi ramah non-teknis, dan tombol aksi pemulihan jika relevan (misal: "Reset Filter").

---

### Keluarga 12: Sticky Headers & Bottom Navigation

- **Kondisi Eksisting:**
  - `DashboardHeader.tsx` dan `MonitoringHeader.tsx` menggunakan `position: sticky; top: 0; z-index: 50; backdrop-filter: blur(12px)`.
  - `BottomNav.tsx` dan `MonitoringBottomNav.tsx` melayang di bagian bawah dengan `safe-area-inset-bottom`.
- **Pola yang Dipertahankan:**
  - Efek kaca akrilik (*glassmorphism*) dengan kontras solid di baliknya agar teks operasional tidak bertabrakan dengan konten yang digulir.

---

## 3. Matriks Skenario Lapangan & Verifikasi Operasional

Tabel berikut menjadi kriteria penerimaan pengujian untuk setiap komponen UI dan alur bisnis terkait:

| ID Skenario | Konteks Operasional Lapangan | Perilaku yang Diharapkan | Risiko Regresi |
| :--- | :--- | :--- | :--- |
| **SC-01** | Petugas mengisi TOA Shift 1 lalu berpindah ke Shift 2 di bawah terik siang hari. | Field Hero TOA Shift 1 dan Total TOA Shift 2 memiliki kontras, ukuran font (1.15rem), dan padding yang identik. Nilai Total TOA otomatis tervalidasi $\ge$ TOA Shift 1. | Style input di Shift 2 berbeda dari Shift 1 jika token tidak dipusatkan. |
| **SC-02** | Pengawas membuka Detail Rute pada rute dengan total trip ganjil (101 trip) saat data `totalRitasePp` dari sheet kosong. | Nilai Ritase PP tampil murni **50,5 rit** (bukan 51 rit). Metrik `ritasePerBus` terhitung berbasis 50,5 rit. Jika sheet menyediakan `totalRitasePp`, angka sheet tetap menjadi SSOT. | Terpotong / dibulatkan menjadi integer 51 jika `Math.round` masih tersisa. |
| **SC-03** | Petugas menginput odometer saat keyboard virtual HP terbuka, lalu menekan tombol hardware "Kembali" (Android Back). | Modal form input tertutup dengan mulus tanpa keluar dari aplikasi web; keyboard tertutup; posisi scroll dashboard pulih ke posisi semula. | Browser melakukan navigasi history back keluar dari aplikasi jika tidak ada `useMobileBackHandler`. |
| **SC-04** | Petugas membuka form bus, lalu dari form tersebut membuka dialog antrean offline / bantuan, kemudian menutup dialog tersebut. | `BusInputModal` yang berada di bawah tetap memiliki body scroll lock aktif; latar dashboard di belakangnya tidak bisa tergulir secara liar. | Body scroll lock bocor (ter-reset ke `""`) akibat penutupan dialog kedua. |
| **SC-05** | Petugas mengetikkan angka odometer yang kepalanya berganti (rollover 999.998 $\rightarrow$ 000.015). | Sistem memunculkan banner saran rollover yang ramah dan tombol "Gunakan 1.000.015" atau opsi toggle "Abaikan jika ganti speedometer". Pesan error tidak memblokir simpan jika bypass dicentang. | Form macet dan menolak simpan dengan pesan error membingungkan petugas. |
| **SC-06** | Jaringan seluler di terminal terputus saat petugas menekan tombol Simpan. | Form menyimpan data ke sync queue lokal, menampilkan toast info offline ramah non-teknis, menutup modal, dan menandai kartu bus dengan status pending sync. | Aplikasi error crash atau data hilang saat offline. |
| **SC-07** | Pergantian tema dari Dark Mode ke Light Mode saat bertugas di luar ruangan. | Seluruh background kartu, teks label, hero input, dan chip status berubah warna sesuai CSS variables dengan rasio kontras $\ge 4.5:1$. Tidak ada teks putih di atas latar putih. | Teks tidak terbaca karena warna di-hardcode dengan `#ffffff` atau `#000000`. |
