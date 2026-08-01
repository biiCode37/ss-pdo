# Daily TOA Trend Chart Design

## 1. Overview
Fitur ini menambahkan diagram tren visual interaktif (**Diagram Capaian TOA Harian**) pada tab Analitik Dashboard. Diagram ini menampilkan perkembangan volume penumpang TOA harian dari **Tanggal 1 sampai Hari Ini** (atau Tanggal 1-31 untuk file arsip bulan lalu).

---

## 2. Requirements & Constraints
1. **Batas Tanggal Otomatis**:
   - Untuk bulan berjalan: Menampilkan tren dari **Tanggal 1 s.d. Tanggal `N`** (hari ini), mencegah pemuatan hari-hari mendatang yang belum terisi.
   - Untuk bulan lalu: Menampilkan tren lengkap **Tanggal 1 s.d. 30/31**.
2. **Visual Aesthetics (Mobile-First & Dual Theme)**:
   - Menggunakan SVG Smooth Curved Line/Area Chart yang ringan.
   - Mendukung Light Mode & Dark Mode dengan warna aksen bernuansa gradient.
3. **Interaktivitas Dua Arah**:
   - Data point untuk tanggal yang sedang dibuka memiliki efek *glowing pulse*.
   - Men-tap data point pada diagram akan otomatis berpindah tab ke tanggal tersebut.
4. **Performa**:
   - Batch fetching latar belakang untuk nilai total TOA per tanggal.
   - Penyiapan cache lokal `localStorage` (`PDO_TOA_TREND_<sheetId>_<year>_<month>`).

---

## 3. Architecture & Affected Files

1. **`src/components/DailyToaTrendCard.tsx` [NEW]**:
   - Komponen React pengendali diagram SVG tren TOA harian.
2. **`src/components/AnalyticsDashboard.tsx` [MODIFY]**:
   - Menampilkan `DailyToaTrendCard` di dalam antarmuka analitik.
3. **`src/services/googleSheets.ts` [MODIFY]**:
   - Menambahkan helper `getMonthlyToaTrend(sheetId, maxDay)` untuk pengambilan ringkasan TOA harian secara efisien.

---

## 4. Verification Plan
1. **Visual & Interaction Check**:
   - Verifikasi grafik hanya menampilkan titik tanggal 1 s.d. hari ini untuk bulan berjalan.
   - Verifikasi men-tap data point pada grafik berhasil memindahkan tab tanggal aktif di dashboard.
   - Verifikasi kontras warna di Light Mode dan Dark Mode.
2. **Build Verification**:
   - Jalankan `pnpm run build` untuk memverifikasi tidak ada error TypeScript maupun bundler Vite.
