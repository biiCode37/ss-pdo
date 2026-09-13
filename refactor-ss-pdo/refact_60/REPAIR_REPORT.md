# Repair Report - Refact 60

## Metadata
- **Tanggal**: 13 September 2026
- **Fase**: 23 (Opsi 2 Tuntas)
- **Domain**: UI/UX & Modal Architecture (`src/components/busCard/BusInputModal.tsx`)
- **Branch**: `devmode`

---

## 1. Implementasi Modernisasi Modal Input Bus ke React JSX Deklaratif

Komponen modal input operasional bus telah berhasil dimodernisasi dari modal imperatif HTML SweetAlert2 menjadi komponen React JSX deklaratif murni:

1. **Komponen Deklaratif `BusInputModal.tsx`**:
   - Ditempatkan di `src/components/busCard/BusInputModal.tsx`.
   - Menggunakan `createPortal(..., document.body)` untuk isolasi rendering tanpa terganggu layout parent kartu bus.
   - Menggunakan transisi kurva pegas Apple iOS `cubic-bezier(0.32, 0.72, 0, 1)`.
   - Navigasi segmented tab: **Shift 1**, **Shift 2**, **Ritase (Trip)**, dan **Ket (Catatan)**.
   - Live distance calculation reaktif untuk Shift 1 dan Shift 2 (menampilkan `+XX.X KM` seketika saat KM awal/akhir diisi).
   - Live total ritase calculation reaktif (`tripPergi + tripPulang`).
   - Toggle switch **Mode Satset** terintegrasi (`getSatsetMode()` & `setSatsetMode()`).
   - Validasi input terpusat menggunakan utilitas SSOT `@/utils/modals/busInput/busModalValidation` (`validateKmPair`, `validateToaValue`, `validateTripCount`).
   - Kamus teks sentral terpadu 100% menggunakan `TEXT_ALERTS.BUS_INPUT_MODAL` dan `TEXT_COMMON` (bebas dari hardcoded string).
   - Aksesibilitas keyboard (`Escape` untuk menutup) dan body scroll lock otomatis saat modal terbuka.

2. **Integrasi Hook & Komponen**:
   - `useBusCardModal.ts` diperbarui untuk mengelola state `isModalOpen`, `modalInitialTab`, `handleCloseModal`, dan `handleSaveModalUpdates`.
   - `BusCard.tsx` membungkus kartu dalam Fragment dan merender `<BusInputModal />` secara deklaratif ketika `isModalOpen === true`.
   - `src/components/busCard/index.ts` mengekspor `BusInputModal`.

3. **Cakupan Pengujian & Zero Regression**:
   - Dibuat pengujian unit `BusInputModal.test.tsx` (7 pengujian).
   - Dibuat pengujian unit `useBusCardModal.test.tsx` (6 pengujian).
   - Diperbarui pengujian unit `BusCard.test.tsx` (5 pengujian).
   - Diperbarui pengujian kamus teks `texts.test.ts` (15 pengujian).
   - Total test suite proyek: **53 files passed, 392 tests passed 100%**.

---

## 2. Before vs After

| Aspek | Sebelum (Refact 59) | Sesudah (Refact 60) |
|---|---|---|
| **Paradigma Modal** | Imperatif SweetAlert2 (`showBusInputModal` via string HTML mentah) | Deklaratif React JSX (`BusInputModal.tsx` via `createPortal`) |
| **Event Handling** | Manual DOM query (`querySelector`, `addEventListener` di hook Swal) | Native React state & event handlers (`onChange`, `onSubmit`) |
| **Kalkulasi Live Preview** | Manipulasi `innerHTML` DOM elemen acuan secara manual | Reaktif `useMemo` murni di state React |
| **Sanitasi Data (XSS)** | Wajib wrapping string `escapeHtml()` manual di setiap interpolasi | Perlindungan sanitasi otomatis mesin JSX React |
| **Kamus Teks** | Sebagian teks alert bercampur di template HTML | Seluruh teks antarmuka dan validasi terpusat di `TEXT_ALERTS.BUS_INPUT_MODAL` |
| **Testing** | Tes modal menguji mock Swal global | Pengujian DOM React riil dengan Happy-DOM & Vitest |

---

## 3. Case: Skenario Lapangan

- **Skenario Lapangan**: Petugas operasional di lapangan membuka kartu bus JAK.15-09 dan mengisi KM Awal 1000 serta KM Akhir 1045 pada Shift 1.
- **Hasil Setelah Perbaikan**:
  1. Modal membuka secara halus dengan animasi bottom-sheet iOS style tanpa kedipan layar.
  2. Jarak tempuh secara seketika (*real-time*) menampilkan badge informatif: `Jarak Tempuh S1: 45.0 KM`.
  3. Jika petugas mengaktifkan toggle *Satset*, setelah menekan tombol Simpan, modal akan menutup mulus dan otomatis membuka form kartu bus berikutnya yang belum terisi.

---

## 4. Quality Gates Verification

1. **Vitest Unit Test**:
   - Perintah: `pnpm vitest run src/`
   - Hasil: 53 test files passed, 392 tests passed (100%).
2. **TypeScript Strict & Production Build**:
   - Perintah: `pnpm run build`
   - Hasil: `tsc -b && vite build` lulus 0 error (`built in 988ms`).
3. **Graphify Knowledge Graph**:
   - Perintah: `graphify update .`
   - Hasil: Knowledge graph terbarukan (3680 nodes, 4774 edges, 326 communities).
