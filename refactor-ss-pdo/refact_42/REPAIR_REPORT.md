# Repair Report Refact 42: Modularisasi & Dekomposisi Formulir Laporan Operasional Rute (RouteOperationalReportCard)

Dokumen ini memuat laporan teknis implementasi dekomposisi god file `RouteOperationalReportCard.tsx` menjadi submodul-submodul terisolasi di `src/components/pdoReport/`.

---

## 1. Implementasi & Detail Perubahan

### A. Pembagian Submodul Modular (`src/components/pdoReport/`)
1. **`ReportStatusBadge.tsx`**:
   - Menangani rendering pill badge status laporan operasional (`draft`, `submitted`, `verified`) dengan penataan tema warna dan kontras yang presisi.
2. **`ReportArmadaSection.tsx`**:
   - Mengisolasi input numerik Renops & Realops untuk Shift 1 (indikator titik biru) dan Shift 2 (indikator titik ungu), mempertahankan ID input `renops-s1`, `realops-s1`, `renops-s2`, dan `realops-s2` untuk kompatibilitas unit test dan audit UI.
3. **`ReportHeadwaySection.tsx`**:
   - Mengisolasi input numerik headway bus tercepat (`headway-fastest`) dan terlambat (`headway-slowest`) dalam menit dengan ikon jam.
4. **`ReportTrafficJamsSection.tsx`**:
   - Mengisolasi selektor chips titik kemacetan rute dengan titik indikator aktif, serta input penambahan titik kemacetan kustom baru via tombol `Enter` atau tombol `+`.
5. **`ReportIssuesSection.tsx`**:
   - Mengisolasi textarea input kendala operasional lapangan (`kendala-text`) serta tombol pengiriman laporan dengan feedback indikator *spinner* saat proses penyimpanan berlangsung.
6. **`ReportModalLayout.tsx`**:
   - Mengisolasi kontainer modal bottom sheet:
     - React Portal ke `document.body` (dengan fallback render langsung untuk lingkungan pengujian Vitest/Happy-DOM).
     - Body scroll locking (`overflow: hidden`) saat modal terbuka.
     - Integrasi hook tombol fisik/gesture kembali perangkat seluler (`useMobileBackHandler`).
     - Header modal dengan tombol tutup silang (`title="Tutup"`).
7. **`ReportAccordionHeader.tsx`**:
   - Mengisolasi header kartu accordion ketika komponen ditampilkan dalam mode inline kartu non-modal.
8. **`RouteOperationalReportCard.tsx` (Root Orchestrator)**:
   - Berkurang dari 979 baris menjadi **~210 baris** (penurunan -769 baris kode / 78%).
   - Menjaga integritas ekspor `export const RouteOperationalReportCard = memo(...)` dan `default RouteOperationalReportCard`.

---

## 2. Perbandingan Before vs After

| Aspek | Sebelum Refactor 42 (Before) | Sesudah Refactor 42 (After) |
| :--- | :--- | :--- |
| **Ukuran `RouteOperationalReportCard.tsx`** | 979 baris (God File monolitik) | **~210 baris** (Penurunan -769 baris kode / 78%) |
| **Struktur Subkomponen** | Semua form section, modal portal, accordion menyatu | 7 file terdedikasi di `src/components/pdoReport/` |
| **Pemisahan Logika & UI** | Form body, chip toggle, status badge, modal menyatu | Single Responsibility Principle murni per bagian form |
| **Integritas Unit Test** | - | **5/5 tests `RouteOperationalReportCard.test.tsx` passed**, **41/41 test files passed (331 tests) 100%** |
| **Kompilasi & Bundle** | - | **`tsc -b && vite build` lulus 0 error (1.12s)** |
| **Knowledge Graph** | - | Graphify 3.233 nodes, 4.246 edges terbarui |

---

## 3. Skenario Lapangan (Field Cases)

### Case 1: Petugas Lapangan Mengisi Laporan Titik Macet di Jam Sibuk Sore
- **Kondisi**: Petugas lapangan Transjakarta mengisi laporan operasional rute JAK.15 pada pukul 17:30 WIB melalui ponsel di halte ujung. Terjadi kemacetan mendadak di simpang baru yang belum ada di daftar bawaan.
- **Before**: Pengetikan teks titik macet baru di dalam god file 979 baris memicu re-render pada seluruh pohon komponen termasuk wrapper modal dan field shift armada.
- **After**: Subkomponen `ReportTrafficJamsSection.tsx` kini terisolasi rapi. Penambahan custom spot baru di-handle secara efisien tanpa lag pada keyboard layar sentuh smartphone.

### Case 2: Menutup Sheet Laporan via Tombol Back Fisik Android
- **Kondisi**: Petugas membuka sheet laporan operasional rute, lalu menekan tombol *Back* fisik perangkat seluler untuk kembali ke dashboard rute.
- **Before**: Logika modal, history popstate, dan scroll-lock bertumpuk dalam satu file panjang sehingga rawan terjadi kebocoran *body scroll lock* (`document.body.style.overflow`).
- **After**: Seluruh tata kelola modal dan pembersihan scroll-lock diisolasi di `ReportModalLayout.tsx`. Saat sheet tertutup, body scroll dipulihkan seketika dengan aman.
