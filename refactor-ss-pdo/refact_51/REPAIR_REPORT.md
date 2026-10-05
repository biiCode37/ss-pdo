# Repair Report Refact 51: Modularisasi & Dekomposisi Modal Kesiapan Armada (FleetStatusModal)

Dokumen ini memuat laporan teknis implementasi dekomposisi `FleetStatusModal.tsx` menjadi submodul-submodul terisolasi di `src/components/fleetStatus/`.

---

## 1. Implementasi & Detail Perubahan

### A. Pembagian Submodul Modular (`src/components/fleetStatus/`)
1. **`types.ts`**:
   - Mendefinisikan kontrak tipe `BrushMode`, `StatusMap`, dan `FleetStatusModalProps`.
2. **`useFleetStatusData.ts`**:
   - Mengelola inisialisasi status unit bus shift 1 dan shift 2 dari props `buses` via `splitShiftKeterangan`.
   - Menangani perubahan status saat kartu diklik (`handleCardTap`) sesuai kuas aktif (`activeBrush`).
   - Menyediakan fitur reset cepat seluruh armada menjadi siap guna operasi (`handleSgoAll`).
   - Menghitung jumlah agregat real-time `{ sgo, off, to }` pada shift aktif secara reaktif.
   - Mengisolasi pemanggilan asinkron `onConfirmStatus(currentShift, unitMap)`, status `isSaving`, dan penutupan modal.
3. **`FleetStatusHeader.tsx`**:
   - Menampilkan handle bar sentuh atas.
   - Menampilkan judul rute dinamis, badge target renops, tanggal operasional, dan tombol silang penutup modal.
4. **`FleetStatusToolbar.tsx`**:
   - Tombol toggle shift (☀️ Shift 1 / 🌙 Shift 2).
   - Toolbar kuas penentu status (SGO hijau, OFF oranye, TO merah).
   - Tombol cepat "SGO Semua Unit".
5. **`FleetStatusGrid.tsx`**:
   - Container scrollable yang merender kartu bus dalam tata letak grid responsif.
   - Visual styling adaptif untuk unit berstatus SGO (Siap Guna Operasi), OFF (Libur), T.O (Tidak Operasi / Perbaikan), dan BA (Berita Acara).
6. **`FleetStatusFooter.tsx`**:
   - Indikator ringkasan real-time per status (SGO, OFF, T.O).
   - Tombol aksi konfirmasi "Konfirmasi & Terapkan Status Shift X" dengan feedback loader.
7. **Kamus Teks Sentral (`src/constants/texts/text_fleet_status.ts`)**:
   - Menambahkan helper fungsi template `HEADER_TITLE` dan `TARGET_RENOPS`.
   - Menambahkan pengujian assertion baru pada `src/constants/texts/texts.test.ts`.
8. **`FleetStatusModal.tsx` (Root Orchestrator)**:
   - Berkurang dari 622 baris menjadi **~136 baris** (penurunan -486 baris kode / 78%).
   - Berfungsi sebagai orchestrator bersih yang merakit `useFleetStatusData`, subkomponen modal, `useMobileBackHandler`, dan body scroll lock.

---

## 2. Perbandingan Before vs After

| Aspek | Sebelum Refactor 51 (Before) | Sesudah Refactor 51 (After) |
| :--- | :--- | :--- |
| **Ukuran `FleetStatusModal.tsx`** | 622 baris (Monolitik masif) | **~136 baris** (Penurunan -486 baris kode / 78%) |
| **Struktur Subkomponen** | Map state, brush logic, toolbar, grid, footer menyatu | 5 file terdedikasi di `src/components/fleetStatus/` |
| **Pemisahan Logika & UI** | Logika brush mapping & summary bercampur dengan render | `useFleetStatusData` terisolasi murni |
| **Kamus Teks Sentral** | Hardcoded title & target string di header modal | 100% menggunakan entri kamus sentral di `text_fleet_status.ts` |
| **Integritas Unit Test** | - | **5/5 tests `FleetStatusModal.test.tsx` passed**, **44/44 test files passed (341 tests) 100%** |
| **Kompilasi & Bundle** | - | **`tsc -b && vite build` lulus 0 error (1.16s)** |
| **Knowledge Graph** | - | Graphify 3.490 nodes, 4.467 edges terbarui |

---

## 3. Skenario Lapangan (Field Cases)

### Case 1: Pengawas Lapangan Ingin Menandai 3 Bus Rusak (T.O) di Pagi Hari
- **Kondisi**: Pada awal Shift 1, petugas menerima laporan ada 3 unit bus yang mengalami kendala teknis (perbaikan bengkel).
- **Before**: Setiap tap pada kartu bus memicu re-render besar dari seluruh komponen modal 622 baris.
- **After**: `FleetStatusToolbar` memungkinkan pengawas mengklik kuas "T.O", lalu cukup mengetuk 3 kartu unit bus tersebut di `FleetStatusGrid`. Kartu berubah warna menjadi merah dengan label "T.O", dan indikator ringkasan di footer langsung memperbarui jumlah SGO dan T.O seketika.

### Case 2: Seluruh Unit Armada Beroperasi Normal (100% SGO)
- **Kondisi**: Di akhir pekan, seluruh unit armada siap jalan tanpa kendala.
- **Before**: Pengawas harus mengecek dan mengubah status unit satu per satu atau memicu fungsi yang bercampur dengan rendering.
- **After**: Pengawas cukup menekan tombol "SGO Semua Unit" di `FleetStatusToolbar`, `handleSgoAll` langsung mengosongkan seluruh catatan shift terkait dalam hitungan milidetik, dan pengawas dapat langsung menekan tombol konfirmasi.
