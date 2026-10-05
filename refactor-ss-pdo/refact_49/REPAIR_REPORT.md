# Repair Report Refact 49: Modularisasi & Dekomposisi Kartu Armada Bus (BusCard)

Dokumen ini memuat laporan teknis implementasi dekomposisi `BusCard.tsx` menjadi submodul-submodul terisolasi di `src/components/busCard/`.

---

## 1. Implementasi & Detail Perubahan

### A. Pembagian Submodul Modular (`src/components/busCard/`)
1. **`types.ts`**:
   - Mendefinisikan interface `BusCardProps` untuk standardisasi kontrak props kartu bus.
2. **`busCardStyles.ts`**:
   - Mengisolasi kalkulasi visual hierarchy: left-border accent status stripe (kendala laka/mogok/rusak/batal, warning cadangan/bko/kurang ritase, achieved target penuh, dan kartu terkunci).
3. **`useBusCardSave.ts`**:
   - Mengelola inisialisasi dan sinkronisasi data lokal formulir bus (`formData`).
   - Melakukan *optimistic update* seketika ke UI tanpa jeda (0 ms latency).
   - Memicu navigasi otomatis mode satset (`onSaveAndNext`).
   - Mengeksekusi deteksi tabrakan data sel (*conflict resolution*) dengan membandingkan nilai sel yang diubah saja (`BUG-12`).
   - Menampilkan dialog konflik antrean (`showQueueConflictDialog`) dan opsi merge data remote (`mergeRemoteBusDataWithLocalUpdates`).
   - Menyimpan ke antrean offline IndexedDB jika terjadi kegagalan koneksi internet (`isNetworkError`).
4. **`useBusCardModal.ts`**:
   - Mengurai catatan shift 1 dan shift 2 via `splitShiftKeterangan`.
   - Mengunci input jika lembar yang dibuka adalah mode `AKUMULASI`.
   - Memblokir pengisian dan mengarahkan ke modal status armada jika status shift belum dikonfirmasi (`isShiftConfirmed === false`).
   - Memblokir pengisian untuk bus berstatus non-SGO (`OFF`, `TO EVDAL`, `BA`) via dialog interaktif SweetAlert2.
   - Membuka form modal `showBusInputModal` dan meneruskan perubahan ke `handleSaveUpdates`.
5. **`BusCardSummary.tsx`**:
   - Merender indikator ringkasan di kanan header kartu bus.
   - Mode `activeCategory !== 'ALL'`: menampilkan badge spesifik kolom (TOA S1, Total TOA, Manual S1/S2, KM Awal/Akhir S1/S2, Trip).
   - Mode `activeCategory === 'ALL'`: menampilkan shortcut trip interaktif berstatus defisit/tercapai/normal, readout KM, dan readout PNP.
6. **Kamus Teks Sentral (`src/constants/texts/text_dashboard.ts`)**:
   - Menambahkan `MANUAL_S1` dan `MANUAL_S2` pada `CATEGORIES`.
   - Menambahkan `UNCONFIRMED_BADGE` (`🔒 Belum Konfirmasi`) dan `UNIT_STATUS_TOOLTIP` pada `BUS_CARD_ACTIONS`.
   - Menambahkan pengujian assertion baru pada `src/constants/texts/texts.test.ts`.
7. **`BusCard.tsx` (Root Orchestrator)**:
   - Berkurang dari 670 baris menjadi **~157 baris** (penurunan -513 baris kode / 76%).
   - Berfungsi sebagai orchestrator bersih yang merakit hooks, styles, dan subkomponen presentasional.

---

## 2. Perbandingan Before vs After

| Aspek | Sebelum Refactor 49 (Before) | Sesudah Refactor 49 (After) |
| :--- | :--- | :--- |
| **Ukuran `BusCard.tsx`** | 670 baris (Monolitik masif) | **~157 baris** (Penurunan -513 baris kode / 76%) |
| **Struktur Subkomponen** | State, save, modal, summary, styles menyatu | 5 file terdedikasi di `src/components/busCard/` |
| **Pemisahan Logika & UI** | Logika save & modal bercampur dengan render | `useBusCardSave` & `useBusCardModal` terisolasi murni |
| **Kamus Teks Sentral** | Hardcoded string pada nama kolom manual & badge status | 100% menggunakan entri kamus terpusat di `text_dashboard.ts` |
| **Integritas Unit Test** | - | **5/5 tests `BusCard.test.tsx` passed**, **44/44 test files passed (340 tests) 100%** |
| **Kompilasi & Bundle** | - | **`tsc -b && vite build` lulus 0 error (1.21s)** |
| **Knowledge Graph** | - | Graphify 3.430 nodes, 4.407 edges terbarui |

---

## 3. Skenario Lapangan (Field Cases)

### Case 1: Pengawas Lapangan Menginput Ritase dalam Kondisi Sinyal Tidak Stabil
- **Kondisi**: Petugas di terminal menginput ritase unit bus saat berada di titik blind spot jaringan internet.
- **Before**: Logika penanganan error jaringan, snapshot pemulihan data, dan penambahan antrean IndexedDB menyatu dengan rendering kartu dan modal.
- **After**: `useBusCardSave` secara transparan mengidentifikasi kegagalan koneksi (`isNetworkError`), menyimpan snapshot mutasi ke antrean offline, menampilkan toast notifikasi ramah pengguna, dan menampilkan badge status "Menunggu Sinyal" tanpa memblokir alur kerja pengawas.

### Case 2: Petugas Mengklik Unit Bus yang Berstatus Non-SGO (OFF / TO EVDAL)
- **Kondisi**: Petugas tidak sengaja mengetuk kartu unit bus yang sedang berstatus perbaikan atau tidak jalan (OFF).
- **Before**: Pengecekan status non-SGO bercampur dengan kode dialog SweetAlert2 dan perhitungan kolom formula.
- **After**: `useBusCardModal` memvalidasi status shift unit, mencegah pembukaan formulir operasional, dan menyajikan dialog peringatan ramah pengguna dengan tombol pintas untuk langsung membuka modal perubahan status armada jika unit telah kembali siap beroperasi.

### Case 3: Mode Satset Pengisian Cepat Beruntun
- **Kondisi**: Petugas memanfaatkan mode Satset untuk memperbarui data ritase bus satu per satu secara cepat.
- **Before**: Fungsi simpan memicu callback navigasi satset di tengah-tengah alur validasi panjang.
- **After**: Logika satset terisolasi rapi di `useBusCardSave`, langsung memicu `onSaveAndNext` secara optimistik seketika sehingga transisi ke kartu bus berikutnya terasa sangat instan dan mulus.
