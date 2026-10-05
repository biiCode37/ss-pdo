# Audit Report - Refact 60

## Metadata
- **Tanggal**: 13 September 2026
- **Fase**: 23 (Opsi 2 Tuntas)
- **Domain**: UI/UX & Modal Architecture (`src/components/busCard/BusInputModal.tsx`)
- **Branch**: `devmode`

---

## Ringkasan Temuan Audit

### ID Temuan: MODAL-60-001
- **Lokasi Kode**: `src/utils/modals/busInputModal.ts`, `src/components/busCard/useBusCardModal.ts`
- **Kategori**: Anti-Pattern Imperatif SweetAlert2 & Resiko Sanitasi DOM
- **Tingkat Keparahan**: Sedang (Maintainability, React Reactivity & UI Modernization)
- **Deskripsi Masalah**:
  Pengeditan data operasional bus pada kartu bus sebelumnya mengandalkan library modal imperatif SweetAlert2 (`showBusInputModal`) yang merender string HTML mentah berukuran besar dan memasang event listener via query selector DOM langsung (`addEventListener` manual, `innerHTML`, dsb.). Pola ini menciptakan keterikatan yang tinggi antara logic React dan lifecycle SweetAlert2, meningkatkan beban parsing template literal HTML, dan mempersulit integrasi state reaktif React (seperti live preview jarak tempuh dan responsive layout mobile-first).
- **Dampak User & Sistem**:
  1. Pengguna di lapangan mendapatkan pengalaman modal yang statis tanpa transisi pegas modern khas mobile modern.
  2. Perubahan nilai KM atau trip tidak menampilkan preview kalkulasi secara seketika (*live reactive preview*).
  3. Ketergantungan manipulasi string HTML meningkatkan resiko regresi XSS atau inkonsistensi event binding saat komponen di-unmount.
- **Mitigasi**:
  Membuat komponen modal React JSX deklaratif murni `BusInputModal.tsx` menggunakan `createPortal` ke `document.body` dengan kurva fisik iOS `cubic-bezier(0.32, 0.72, 0, 1)`, segmented tab navigasi, kalkulasi live distance & total ritase reaktif, integrasi Mode Satset, tombol penutup keyboard Escape & backdrop tap, serta sanitasi input otomatis murni JSX tanpa HTML injection mentah.
