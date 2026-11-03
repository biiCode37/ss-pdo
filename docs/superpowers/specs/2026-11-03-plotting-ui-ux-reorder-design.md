# Spesifikasi Desain: Optimalisasi UI/UX & Mekanisme Reorder Halaman Plotting
**Tanggal:** 03 November 2026  
**Status:** Approved by User  
**Terkait:** `src/components/plotting/`

---

## 1. Latar Belakang & Tujuan
Pada halaman Plotting Armada Harian (`DailyPlottingPage`), pengawas lapangan membutuhkan efisiensi visual dan kecepatan aksi saat menyusun giliran jalan subuh hari (pukul 04:00 - 05:30 WIB).
Audit sebelumnya mengidentifikasi beberapa inefisiensi interaksi:
1. Ikon checklist lingkaran kosong (`○`) di setiap kartu menambah kebisingan visual dan memakan ruang horizontal yang seharusnya menjadi hak nomor unit bus.
2. Penukaran urutan armada yang berjarak jauh (misal dari urutan #14 ke urutan #2) mengharuskan pengawas menekan tombol panah berkali-kali (12x tap), menyebabkan kelelahan jari tangan dan rentan salah hitung.
3. Tidak tersedianya mekanisme untuk memindahkan beberapa unit bus sekaligus (*Multi-Unit Block Reorder*).
4. Ikon drag handle HTML5 (`::`) rawan konflik dengan gestur gulir layar sentuh (*touch scroll*) pada smartphone.

---

## 2. Keputusan Desain yang Disepakati

### A. Seleksi Kartu Bebas Hambatan (Clean Tap-to-Select + Conditional Checkmark)
- Menghapus ikon bulatan checkbox kosong (`○`) saat kartu dalam kondisi normal (*idle*).
- Menyentuh area netral kartu (area nama unit/nomor urut) langsung memilih/membatalkan pilihan unit (*toggle select*).
- Saat kartu terpilih:
  - Border neon menyala (`1.5px solid var(--color-action-primary-bg, #38bdf8)`).
  - Background berubah menjadi *tinted highlight* (`rgba(56, 189, 248, 0.12)`).
  - Menampilkan **centang mini halus (*conditional checkmark*)** di sudut kartu sebagai konfirmasi ganda visual.

### B. Penghapusan Ikon Drag Handle di Mobile
- Menghapus ikon titik seret `GripVertical` (`[::]`) untuk memaksimalkan ruang horizontal nama unit dan menghilangkan ambiguitas interaksi sentuh di ponsel.

### C. Penempatan Urutan Relatif Satuan (*Direct Order Placement*)
- Menyentuh badge nomor urut `[ # ]` pada kartu membuka modal cepat: **`PlottingOrderModal`**.
- Modal menyediakan 2 kelompok opsi:
  1. **Pilihan Cepat 1-Ketuk:** `[ ⤒ Jadikan Paling Depan (#1) ]` dan `[ ⤓ Jadikan Paling Belakang ]`.
  2. **Penempatan Relatif Kontesktual:**
     - Toggle arah: `[ Di Atas Unit ]` atau `[ Di Bawah Unit ]`.
     - Dropdown unit acuan menampilkan: `#Urut • Nama Unit` dari armada di pangkalan start yang sama (mengecualikan unit yang sedang dipindahkan).

### D. Multi-Unit Block Reorder (Penyelipan Rombongan Armada)
- Ketika $\ge 2$ unit terpilih, pada **Floating Action Bar** muncul tombol baru: **`[ ⇅ Atur Posisi (N) ]`**.
- Memilih tombol ini membuka `PlottingOrderModal` dalam mode multi-unit:
  - Menampilkan ringkasan unit yang terpilih.
  - Dropdown unit acuan secara otomatis mengecualikan seluruh unit yang sedang terpilih.
  - Logika pemindahan menerapkan **Preserve Relative Order** (urutan relatif antar unit di dalam rombongan tetap terjaga secara berurutan saat disisipkan ke posisi baru).

---

## 3. Komponen & Alur Data

1. **`PlottingOrderModal.tsx` (Komponen Baru):**
   - Modal/Bottom-Sheet responsif untuk memilih posisi target (Paling Depan, Paling Belakang, atau Relatif Di Atas/Di Bawah Unit Acuan).
   - Props:
     ```ts
     interface PlottingOrderModalProps {
       isOpen: boolean;
       unitsToMove: string[]; // 1 atau banyak unit
       allBaseUnits: UnitPlottingItem[]; // Daftar unit di base yang sama
       onClose: () => void;
       onApplyMove: (
         unitsToMove: string[],
         placement: 'TOP' | 'BOTTOM' | 'ABOVE' | 'BELOW',
         referenceUnit?: string
       ) => void;
     }
     ```

2. **Utilitas Logika Pemindahan Array (`src/utils/plottingOrderUtils.ts`):**
   - Fungsi murni murni (*pure function*) yang menghitung urutan baru array `UnitPlottingItem[]` berdasarkan target penempatan dan menjaga sequential order 1..N.
   - Dilengkapi 100% unit test dengan vitest.

3. **`PlottingUnitCard.tsx` (Penyesuaian):**
   - Hapus checkbox lingkaran idle.
   - Tampilkan centang mini saat `isSelectedForMultiSelect === true`.
   - Jadikan badge urutan `[ # ]` tombol interaktif untuk membuka `PlottingOrderModal`.

4. **`DailyPlottingPage.tsx` (Penyesuaian):**
   - Tambahkan state `orderModal: { isOpen: boolean; units: string[] }`.
   - Hubungkan tombol `[ ⇅ Atur Posisi (N) ]` pada Floating Action Bar.
   - Integrasikan mutasi urutan baru ke `unitsData`.
