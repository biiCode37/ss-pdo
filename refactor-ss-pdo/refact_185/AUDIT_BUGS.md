# Audit Temuan Bug & Evaluasi Ergonomi Layout (Refactor 185)

## Ringkasan Eksekutif

Audit ini diinisiasi berdasarkan pengujian antarmuka nyata pada peranti ponsel yang ditunjukkan pada tangkapan layar lapangan:
1. **Halaman Input SS (Dashboard Utama):**
   - Komponen pembungkus datepicker (`RouteSelectorCard`) dan komponen pembungkus bar progres harian + search/filter (`BusListHeader`) terpisah sehingga menimbulkan celah kosong yang boros layout di layar ponsel.
   - Bagian atas kartu unit pertama (`KWK 222153`) terpotong/tertindih oleh parent komponen search input + filter.
   - Badge urutan dan pangkalan start masih tergabung menjadi satu (`#9 • 📍 IGI`) dan berada di samping nama unit, bukan di pojok kanan kartu.
2. **Halaman Plotting Harian:**
   - Card ringkasan header plotting memiliki layout yang rusak di layar sempit: teks judul `Plotting Armada Harian` terhimpit tombol `[Atur Urutan]` dan `[Simpan Plotting]`, sehingga terpotong menjadi 3 baris (`P`, `Armada`, `Harian`).
   - Badge titik start (`📍 Priok`) berada di tengah baris pertama, bukan di sisi paling kanan kartu unit.
   - Kontrol reordering hanya memiliki tombol panah bawah (yang perilakunya langsung membuang unit ke paling akhir), belum memiliki tombol panah atas, dan belum memiliki mekanisme navigasi urutan bertahap (1 tingkat) serta rotasi melingkar tak terbatas (*infinity movement*).
   - Jarak clearance antara kartu unit terbawah dengan batas floating bottom dock terlalu jauh (`140px`).
3. **Halaman Dashboard Analitik & Rekap Armada:**
   - Komponen kartu teratas pada tab Dashboard Analitik ("Grafik Pelanggan Harian") dan tab Rekap Armada terpotong/menempel di bawah pembungkus datepicker sticky (`DashboardHeader`) karena kontainer analitik tidak memiliki jarak aman (*clearance padding-top*).

---

## Tabel Temuan Bug & Tingkat Keparahan

| ID Temuan | Lokasi Kode | Keparahan | Deskripsi Singkat | Dampak Pengguna | Rencana Mitigasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-185-01** | `src/components/plotting/PlottingHeader.tsx` | 🔴 **HIGH** | Judul `Plotting Armada Harian` terpotong/terhimpit menjadi 3 baris karena flex row dengan tombol aksi | Tampilan header rusak dan tidak profesional di layar ponsel | Pindahkan judul ke baris atas penuh tanpa himpitan flex horizontal, tata tombol aksi di baris terpisah atau toolbar yang seimbang |
| **BUG-185-02** | `src/components/plotting/PlottingUnitCard.tsx` | 🟠 **MEDIUM** | Badge titik start berada di sebelah nama unit di tengah, bukan di sisi paling kanan kartu unit | Ketidakkonsistenan tata letak dengan kartu antarmuka Input SS | Pindahkan badge titik start ke sisi paling kanan Baris 1 kartu unit |
| **BUG-185-03** | `src/components/plotting/PlottingUnitCard.tsx`<br>`src/components/plotting/DailyPlottingPage.tsx` | 🔴 **HIGH** | Belum ada tombol panah atas, tombol panah bawah langsung melempar ke paling akhir, dan belum ada *infinity movement* | Petugas tidak dapat memindahkan unit 1 tingkat ke atas atau ke bawah secara presisi; sulit menukar urutan antrean armada | Tambahkan tombol panah atas & bawah yang memindahkan unit 1 tingkat. Terapkan rotasi melingkar tak terbatas (*infinity movement*): unit teratas dengan panah atas pindah ke terbawah, dan sebaliknya |
| **BUG-185-04** | `src/components/plotting/DailyPlottingPage.tsx` | 🟡 **LOW** | Clearance padding bawah kontainer plotting terlalu renggang (`140px`) | Membuang ruang vertikal yang berharga pada scroll view mobile | Sesuaikan bottom padding kontainer menjadi `calc(90px + env(safe-area-inset-bottom, 0px))` |
| **BUG-185-05** | `src/components/busCard/BusCard.tsx` | 🟠 **MEDIUM** | Badge urutan & titik start digabung dan berada di samping nama unit pada kartu bus | Kurang rapi dan padat di samping nama unit | Pisahkan urutan dan titik start menjadi 2 badge mandiri dan posisikan keduanya di pojok kanan kartu unit |
| **BUG-185-06** | `src/components/busList/BusList.tsx`<br>`src/index.css` | 🟠 **MEDIUM** | Kartu unit pertama sedikit tertutup/tertindih oleh parent komponen search input + filter | Border dan bayangan kartu pertama terpotong saat scroll | Berikan jarak pemisah yang cukup (`padding-top: 8px` / `margin-top: 8px`) pada daftar kartu unit agar tidak tertutup sticky header |
| **BUG-185-07** | `src/components/routeSelector/UnifiedRouteControlBar.tsx`<br>`src/components/busList/BusListHeader.tsx`<br>`src/index.css` | 🟠 **MEDIUM** | Pembungkus datepicker dan bar progres harian terpisah dengan ruang kosong berlebih | Memakan ruang vertikal layar ponsel dan tampak tidak kohesif | Rapatkan margin antara datepicker dan progres harian, hilangkan jarak boros sehingga tampak sebagai satu parent kontrol terpadu |
| **BUG-185-08** | `src/index.css` (`.analytics-container`)<br>`src/components/UnitSummaryDashboard.tsx` | 🟠 **MEDIUM** | Komponen teratas Dashboard Analitik ("Grafik Pelanggan Harian") dan Rekap Armada terpotong/menempel pembungkus datepicker | Sudut melengkung dan border atas kartu terpotong/tertindih oleh header sticky | Tambahkan `padding-top: 12px` pada `.analytics-container` dan `paddingTop: '12px'` pada kontainer `UnitSummaryDashboard` |
