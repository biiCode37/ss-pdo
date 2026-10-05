# Repair Report Refact 55: Modularisasi & Dekomposisi Handler Modal Input Bus (busModalHandlers)

Dokumen ini memuat laporan teknis implementasi dekomposisi `src/utils/modals/busInput/busModalHandlers.ts` menjadi submodul-submodul mandiri di `src/utils/modals/busInput/`.

---

## 1. Implementasi & Detail Perubahan

### A. Pembagian Submodul Modular (`src/utils/modals/busInput/`)

1. **`busModalKeterangan.ts`**:
   - `setupSmartKeteranganLogic(popup: HTMLElement)`: Menangani interaksi chip keterangan, badge prefix terkunci (`BA.01-04`), dropdown kontekstual `BA.02` (`NP1`/`NP2`/`__CUSTOM__`), dan tombol reset keterangan.
   - `extractKeteranganFromForm(popup: HTMLElement)`: Mengekstrak kombinasi prefix + detail, mengintegrasikan dropdown `BA.02`, dan menormalisasi teks akhir keterangan.

2. **`busModalPreConfirm.ts`**:
   - `handleModalPreConfirm(popup, options, isAll, singleMeta)`: Memvalidasi masukan form SweetAlert2 sebelum dikirim ke lembar kerja / antrean offline.
   - Dipecah secara rapi ke dalam 3 fungsi pembantu khusus domain:
     - `validateAndExtractTripMode`: Validasi kuota trip maksimal (20) dan pembaruan kolom trip pergi/pulang.
     - `validateAndExtractSingleMode`: Validasi angka positif, perbandingan KM awal/akhir, batas TOA/manual $\le 999$, perbandingan Total TOA $\ge$ Shift 1, dan pembaruan kolom tunggal.
     - `validateAndExtractAllMode`: Validasi komprehensif seluruh field pada mode penuh (ALL).
   - Memastikan unit bertatus `OFF` secara otomatis mengosongkan nilai operasional angka yang tidak relevan.

3. **`busModalEventListeners.ts`**:
   - `setupModalEventListeners(popup, options, isAll, initTab)`: Menginisialisasi event listeners modal (tab switcher, auto-focus, keyboard smooth scroll, tombol salin KM, live diff KM Akhir terhadap batas 230 KM, progressive disclosure chips, dan toggle Mode Satset).

4. **`busModalHandlers.ts` (Facade / Re-export)**:
   - Berkurang dari 759 baris menjadi **15 baris** (penurunan -744 baris / 98%).
   - Berfungsi sebagai jembatan ekspor yang menjaga 100% kompatibilitas pemanggilan (*Zero Call-Site Left Behind*).

5. **Pengujian Unit Mandiri**:
   - `src/utils/modals/busInput/busModalKeterangan.test.ts`: 5 pengujian (ekstraksi string kosong, prefix + catatan kustom, dropdown BA.02 NP1, klik chip preset OFF, dan reset keterangan).
   - `src/utils/modals/busInput/busModalPreConfirm.test.ts`: 5 pengujian (validasi mode trip sukses, penolakan trip melampaui batas maksimal, validasi kolom tunggal TOA, penolakan KM akhir lebih kecil dari KM awal, pembersihan field unit OFF).

---

## 2. Perbandingan Before vs After

| Aspek | Sebelum Refactor 55 (Before) | Sesudah Refactor 55 (After) |
| :--- | :--- | :--- |
| **Ukuran `busModalHandlers.ts`** | 759 baris (God File Monolitik) | **15 baris** (Penurunan -744 baris / 98%) |
| **Struktur Submodul** | Seluruh logika modal tertumpuk di satu file | 3 submodul terfokus di `src/utils/modals/busInput/` |
| **Pemisahan Validasi PreConfirm** | Satu blok if/else raksasa > 300 baris | Terisolasi per domain (Trip, Single Column, ALL) di `busModalPreConfirm.ts` |
| **Pemisahan Smart Keterangan** | Menyatu dengan event listeners tombol dan form | Terisolasi penuh di `busModalKeterangan.ts` |
| **Kamus Teks Sentral** | - | 100% menggunakan entri kamus terpusat di `text_alerts.ts` |
| **Integritas Unit Test** | - | **10/10 tests passed** pada 2 berkas pengujian baru, total **50/50 test files passed (369 tests) 100%** |
| **Kompilasi & Bundle** | - | **`tsc -b && vite build` lulus 0 error (1.20s)** |
| **Knowledge Graph** | - | Graphify 3.584 nodes, 4.605 edges, 312 communities terbarui |

---

## 3. Skenario Lapangan (Field Cases)

### Case 1: Pengawas Mengisi Keterangan BAP Khusus BA.02 (NP1 / NP2)
- **Kondisi**: Petugas ingin menandai bus yang tidak beroperasi pada Shift 1 dengan klausul resmi BA.02 NP1.
- **Before**: Logika pemilihan dropdown BA.02 dan sinkronisasi input manual bercampur dengan ratusan baris listener form lainnya.
- **After**: `setupSmartKeteranganLogic` pada `busModalKeterangan.ts` mengelola dropdown secara responsif, dan `extractKeteranganFromForm` langsung menghasilkan format baku `"BA.02 NP1"` yang bersih tanpa kesalahan ketik oleh pengawas di lapangan.

### Case 2: Salah Ketik Odometer KM Akhir Lebih Kecil dari KM Awal
- **Kondisi**: Petugas secara tidak sengaja memasukkan angka KM Akhir 80 padahal KM Awal adalah 100.
- **After**: `validateAndExtractSingleMode` pada `busModalPreConfirm.ts` mendeteksi anomali ini dan menampilkan pesan validasi ramah pengguna via SweetAlert2, mencegah data korup tersimpan ke spreadsheet Google Sheets.
