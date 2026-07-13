# UX, Validation, and Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan 3 fitur utama sekaligus: (1) Filter Pintar & Progres Bar, (2) Validasi Data Anti-Salah Ketik, dan (3) Pemolesan UI/UX dengan animasi halus dan *sorting* urutan bus.

**Architecture:** 
1. **Validasi**: Logic validasi akan ditambahkan langsung di fungsi `handleSave` pada `BusCard.tsx`.
2. **Progres & Filter**: State `filterMode` (Semua vs Belum Selesai) dan `sortMode` akan ditambahkan di `BusList.tsx`. Progres bar akan dikalkulasi dari prop `data`.
3. **UI/UX Polish**: Akan menambahkan animasi *glassmorphism* tingkat lanjut dan transisi di `index.css`, serta menyesuaikan *layout* komponen di `BusList` dan `BusCard`.

**Tech Stack:** React, Vanilla CSS.

## Global Constraints
- Tetap menjaga performa, animasi CSS harus ringan (menggunakan `transform` dan `opacity`).
- Kompatibilitas responsif untuk layar HP (Mobile First).

---

### Task 1: Validasi Data (Pencegahan Typo)

**Files:**
- Modify: `src/components/BusCard.tsx`

**Interfaces:**
- Modifikasi fungsi `handleSave` untuk mengecek logika angka KM.

- [ ] **Step 1: Tambahkan fungsi validasi di `handleSave`**
Di dalam `BusCard.tsx`, sebelum memanggil `updateBusData`, konversi nilai string ke number dan cek apakah `kmAkhir` lebih kecil dari `kmAwal`.
Jika salah, `setError('KM Akhir tidak boleh lebih kecil dari KM Awal')` dan *return early*.

---

### Task 2: Progres Harian & Filter Pintar

**Files:**
- Modify: `src/components/BusList.tsx`

**Interfaces:**
- Menambahkan state `showOnlyUnfinished` (boolean) dan logic kalkulasi kelengkapan data.

- [ ] **Step 1: Buat helper untuk menentukan apakah bus "selesai"**
Bus dianggap selesai (memiliki data) jika salah satu *field* utama (seperti `toaShift1`, `kmAwal1`, dll) memiliki nilai.
```typescript
const isBusFilled = (bus: BusData) => {
  return !!(bus.toaShift1 || bus.kmAwal1 || bus.kmAkhir1 || bus.kmAwal2 || bus.kmAkhir2 || bus.totalToa || bus.manualShift1 || bus.manualShift2);
};
```

- [ ] **Step 2: Tambahkan UI Progres Bar & Toggle Filter**
Hitung jumlah `filledBuses` dari total `data.length`. Tampilkan *progress bar* visual.
Tambahkan tombol *toggle* untuk `showOnlyUnfinished`.

- [ ] **Step 3: Update `filteredData` logic**
Sesuaikan `useMemo` agar hasil pencarian juga difilter berdasarkan `showOnlyUnfinished`.
Tambahkan opsi *sorting* (bus yang belum diisi akan ditaruh di atas).

---

### Task 3: UI/UX Polish & Animasi

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/BusCard.tsx`

**Interfaces:**
- Modifikasi class CSS.

- [ ] **Step 1: Update `index.css` untuk Animasi**
Tambahkan kelas animasi untuk expand/collapse `BusCard`.
Tambahkan efek *pulse* untuk status "Menunggu Sinyal".
Percantik bentuk *progress bar* agar terlihat seperti aplikasi iOS/Android premium.

- [ ] **Step 2: Implementasi CSS di Komponen**
Pastikan transisi `.bus-card-content` berjalan mulus (menggunakan kombinasi `max-height` dan `opacity`).

---

## User Review Required

1. **Aturan Validasi Tambahan?** Selain KM Akhir harus >= KM Awal, apakah ada batasan lain? (Misal: TOA maksimal berapa jam?). Jika tidak ada, gua akan pasang validasi KM saja.
2. **Kriteria "Belum Diisi"**: Saat ini gua berasumsi sebuah bus dianggap "Sudah Diisi" kalau **minimal ada 1 kolom angka** (apa saja) yang terisi. Apakah ini udah benar, atau semua kolom harus terisi?
