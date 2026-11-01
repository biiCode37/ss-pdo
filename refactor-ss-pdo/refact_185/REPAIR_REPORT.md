# Laporan Perbaikan Tata Letak Plotting, Infinity Movement, & Kartu Unit Input SS (Refactor 185)

## Ringkasan Perbaikan

Siklus **Refactor 185** menyelesaikan seluruh permasalahan tata letak (*layouting*), ergonomi interaksi peranti sentuh (*mobile-first*), serta kejelasan hierarki visual yang ditemukan pada pengujian lapangan rute **JAK.115**:
1. **Halaman Plotting Harian:**
   - Memperbaiki layouting card ringkasan header (`PlottingHeader.tsx`): Judul `Plotting Armada Harian` tidak lagi terpotong/terhimpit menjadi 3 baris di samping tombol aksi. Tombol aksi `[Atur Urutan]` dan `[Simpan Plotting]` ditata dalam baris 2-kolom tersendiri yang lapang dan simetris.
   - Memindahkan badge titik start (`📍 Priok ⇆` / `📍 IGI ⇆`) ke **sisi paling kanan** pada setiap kartu unit (`PlottingUnitCard.tsx`).
   - Menambahkan tombol panah atas (`ArrowUp`) dan panah bawah (`ArrowDown`) pada kartu unit dengan perilaku pergerakan 1 tingkat serta mekanisme **Infinity Movement** (unit teratas berputar ke paling bawah, dan unit terbawah berputar ke paling atas), dengan normalisasi urutan otomatis `1..N` untuk seluruh unit di titik start terkait.
   - Merapikan jarak clearance kartu unit terbawah dengan batas floating dock dari `140px` menjadi `calc(92px + env(safe-area-inset-bottom, 0px))`.
2. **Halaman Input SS (Dashboard Utama):**
   - Memisahkan nomor urutan antrean dan titik start menjadi **2 badge mandiri** (`[#9]` dan `[📍 IGI]`) dan menempatkan keduanya di **pojok kanan atas kartu unit** (`BusCard.tsx`), sementara nama unit berdiri bersih di sebelah kiri.
   - Merapatkan jarak antara pembungkus datepicker (`RouteSelectorCard`) dan bar progres harian (`BusListHeader`) sehingga menyatu secara proporsional sebagai satu parent kontrol tanpa celah kosong yang boros layout.
   - Memberikan clearance jarak aman (`padding-top: 8px`) pada daftar kartu bus agar bagian atas kartu unit pertama tidak lagi tertutup/tertindih oleh parent bar search input + filter.
3. **Halaman Dashboard Analitik & Rekap Armada:**
   - Memberikan clearance jarak aman (`padding-top: 12px`) pada `.analytics-container` dan `UnitSummaryDashboard` sehingga kartu teratas ("Grafik Pelanggan Harian") dan input search armada tidak lagi terhimpit/tertutup oleh pembungkus datepicker sticky.

---

## Rincian Implementasi & Before vs After

### 1. BUG-185-01: Layouting Card Ringkasan Header Plotting Bebas Patah
- **Lokasi:** `src/components/plotting/PlottingHeader.tsx`
- **Penyebab:** Judul `Plotting Armada Harian` ditempatkan dalam 1 baris flex horizontal berdampingan dengan 2 tombol aksi (`[Atur Urutan]` dan `[Simpan Plotting]`). Pada layar smartphone (< 400px), ruang judul terhimpit hingga kata "Plotting" terlipat menjadi huruf tunggal `P`, `Armada`, `Harian`.
- **Implementasi:**
  - Menempatkan Judul dan Subtitle rute/tanggal pada Baris 1 penuh.
  - Menempatkan 2 tombol aksi utama pada Baris 2 dengan grid 2-kolom simetris (`gridTemplateColumns: 1fr 1fr`), memberikan target sentuh jempol yang besar dan nyaman.
  - Baris 3 berisi 3 kotak metrik operasional (`Total Unit`, `Siap Jalan`, `Kendala`).
  - Baris 4 berisi toolbar `Target Default` dan `Rolling Kemarin`.
- **Before vs After:**
  - *Before:* Teks judul terpotong menjadi 3 baris aneh (`P`, `Armada`, `Harian`) di samping tombol.
  - *After:* Judul terbaca utuh dan elegan dalam satu baris penuh dengan tombol aksi yang ergonomis di bawahnya.
- **Case Skenario Lapangan:**
  Pengawas lapangan membuka halaman Plotting di HP dengan lebar layar 360px. Seluruh teks judul dan tombol aksi tertata sangat rapi tanpa saling mendesak.

---

### 2. BUG-185-02: Posisi Badge Titik Start di Sisi Paling Kanan Kartu Plotting
- **Lokasi:** `src/components/plotting/PlottingUnitCard.tsx`
- **Penyebab:** Badge pangkalan start (`📍 Priok`) sebelumnya berada di tengah Baris 1 berdampingan dengan nama unit, sehingga letaknya tidak konsisten dengan pola visual kartu di halaman Input SS.
- **Implementasi:**
  - Sisi Kiri Baris 1 didedikasikan untuk identitas unit: `[Grip Handle (jika reorder)]` + `[Badge Nomor Urutan]` + `[Nama Unit KWK 222172]`.
  - Sisi Kanan Baris 1 didedikasikan untuk kontrol dan status: `[Tombol Panah Atas & Bawah]` + `[Badge Titik Start 📍 Priok ⇆]`.
  - Badge pangkalan start kini menempati posisi pojok kanan kartu.
- **Before vs After:**
  - *Before:* Badge pangkalan berada di tengah, berdesakan dengan nama unit.
  - *After:* Badge pangkalan berada di pojok kanan kartu, memberikan tata letak yang bersih dan konsisten.

---

### 3. BUG-185-03: Tombol Panah Atas & Bawah serta Infinity Movement
- **Lokasi:** `src/components/plotting/PlottingUnitCard.tsx` & `src/components/plotting/DailyPlottingPage.tsx`
- **Penyebab:** Sebelumnya hanya tersedia tombol panah bawah yang langsung memindahkan unit ke urutan paling akhir. Tidak ada tombol panah atas untuk memindahkan unit naik 1 tingkat.
- **Implementasi:**
  - Menambahkan tombol panah atas (`ArrowUp`) dan panah bawah (`ArrowDown`) pada kartu unit di mode Atur Urutan.
  - **Fungsi `handleMoveUp`:**
    - Memindahkan unit 1 tingkat ke atas (swap dengan unit di atasnya).
    - **Infinity Movement:** Jika unit berada di urutan pertama (#1), tombol panah atas memindahkannya ke urutan paling bawah pangkalan tersebut.
  - **Fungsi `handleMoveDown`:**
    - Memindahkan unit 1 tingkat ke bawah (swap dengan unit di bawahnya).
    - **Infinity Movement:** Jika unit berada di urutan terakhir, tombol panah bawah memindahkannya ke urutan paling atas pangkalan tersebut.
  - Setiap mutasi langsung mereindeks nomor antrean seluruh armada pada titik start tersebut via `normalizeBaseOrders` (`1..N`).
- **Before vs After:**
  - *Before:* Hanya ada 1 tombol panah bawah yang langsung membuang unit ke paling akhir.
  - *After:* Petugas memiliki 2 tombol panah presisi (naik/turun 1 tingkat) dengan dukungan rotasi melingkar tak terbatas (*infinity movement*).
- **Case Skenario Lapangan:**
  Petugas ingin unit urutan #1 menjadi unit urutan terakhir hari ini. Cukup tekan tombol panah atas satu kali pada unit #1, unit tersebut langsung berputar ke posisi paling bawah, dan unit #2 otomatis naik menjadi unit #1.

---

### 4. BUG-185-04: Clearance Proporsional Kartu Unit Terakhir
- **Lokasi:** `src/components/plotting/DailyPlottingPage.tsx`
- **Penyebab:** Padding bawah kontainer plotting diatur ke `140px`, menyebabkan celah kosong yang terlalu renggang antara kartu terakhir dan floating dock bawah.
- **Implementasi:**
  Menyesuaikan padding bawah kontainer menjadi `calc(92px + env(safe-area-inset-bottom, 0px))`. Memberikan ruang aman ~28px di atas floating dock tanpa memboroskan ruang scroll.
- **Before vs After:**
  - *Before:* Celah kosong 140px yang terlalu jauh di bawah kartu terakhir.
  - *After:* Jarak kartu terakhir dengan floating dock pas, proporsional, dan nyaman dipandang.

---

### 5. BUG-185-05: Pemisahan Badge Urutan & Titik Start di Pojok Kanan Kartu Input SS
- **Lokasi:** `src/components/busCard/BusCard.tsx`
- **Penyebab:** Nomor urutan dan pangkalan digabung dalam 1 badge teks (`#9 • 📍 IGI`) dan diletakkan di samping nama unit, membuat nama unit terasa padat dan tidak konsisten.
- **Implementasi:**
  - Sisi kiri header kartu bus: khusus untuk nama armada (`KWK 222153`) dan status antrean offline jika ada.
  - Sisi kanan header kartu bus: memuat 2 badge mandiri:
    1. **Badge Urutan Mandiri:** `[#9]` dengan background surface netral solid.
    2. **Badge Titik Start Mandiri:** `[📍 IGI]` dengan warna semantik adaptif (Sky Blue untuk Priok / Titik A, Amber untuk IGI / Titik B).
- **Before vs After:**
  - *Before:* `#9 • 📍 IGI` menempel di samping nama unit.
  - *After:* 2 badge elegan terpisah di pojok kanan kartu, nama unit berdiri bersih di kiri.
- **Case Skenario Lapangan:**
  Pengawas melihat daftar unit di halaman Input SS. Mata dapat langsung memindai nama armada di sisi kiri dan nomor antrean serta pangkalan start di sisi kanan secara instan dan rapi.

---

### 6. BUG-185-06 & BUG-185-07: Penyatuan Pembungkus Header & Clearance Kartu Pertama
- **Lokasi:**
  - `src/components/routeSelector/UnifiedRouteControlBar.tsx`
  - `src/components/dashboard/DashboardHeader.tsx`
  - `src/components/busList/BusListProgressBar.tsx`
  - `src/index.css`
- **Penyebab:**
  - Celah vertikal 24px antara datepicker dan progres harian terjadi karena akumulasi margin bawah `UnifiedRouteControlBar` (12px), padding bawah `DashboardHeader` (4px), dan padding atas `sticky-buslist-header` (8px).
  - Kartu bus pertama terpotong border atasnya karena ketiadaan top padding pada kontainer `.bus-list` di bawah sticky header.
- **Implementasi:**
  - Menurunkan margin bawah `UnifiedRouteControlBar` dari 12px ke 4px.
  - Menurunkan padding bawah `DashboardHeader` dari 4px ke 0px.
  - Menyesuaikan `sticky-buslist-header`: padding atas 4px, margin atas 0px, margin bawah 4px. Jarak total datepicker ke progres harian menyusut dari 24px menjadi 8px yang sangat proporsional.
  - Menambahkan `padding-top: 8px` pada `.bus-list` sehingga kartu unit pertama memiliki jarak aman yang bersih dari search bar sticky.
- **Before vs After:**
  - *Before:* Jarak renggang boros layout antara datepicker dan progres harian; border atas kartu unit pertama terpotong.
  - *After:* Datepicker, progres harian, dan search filter mengalir padu sebagai satu kesatuan kontrol yang rapat dan proporsional; kartu pertama tampil utuh sempurna tanpa terpotong.

---

### 7. BUG-185-08: Clearance Kartu Teratas pada Tab Dashboard Analitik & Rekap Armada
- **Lokasi:**
  - `src/index.css` (`.analytics-container`)
  - `src/components/UnitSummaryDashboard.tsx`
- **Penyebab:**
  Setelah margin bawah datepicker sticky dirapatkan, tab Dashboard Analitik dan Rekap Armada tidak memiliki padding atas (`padding-top: 0`), sehingga kartu pertama ("Grafik Pelanggan Harian") dan kolom pencarian armada menempel atau terpotong tepat di bawah sticky header datepicker.
- **Implementasi:**
  - Menambahkan `padding-top: 12px;` pada `.analytics-container` di `src/index.css` (total jarak dari bar datepicker menjadi 16px, selaras dengan `gap: 16px` antar kartu analitik).
  - Menambahkan `paddingTop: '12px'` pada pembungkus utama `UnitSummaryDashboard.tsx`.
- **Before vs After:**
  - *Before:* Border atas dan rounded corner kartu "Grafik Pelanggan Harian" terpotong/tertindih oleh pembungkus datepicker.
  - *After:* Kartu "Grafik Pelanggan Harian" memiliki jarak aman 16px yang bersih, seimbang, dan proporsional dari datepicker, border atas dan rounded corner tampak utuh sempurna.

---

## Verifikasi & Quality Gates

1. **Kontrak Kontras Warna (WCAG AA/AAA):**
   `pnpm vitest run src/styles/tokens/color-contract.test.ts` ➔ **116 passed (100%)**
2. **Uji Plotting & Infinity Movement:**
   `pnpm vitest run src/components/plotting/` ➔ **14 passed (100%)**
3. **Uji Bus Card (Dual Badge):**
   `pnpm vitest run src/components/busCard/BusCard.test.tsx` ➔ **16 passed (100%)**
4. **Uji Bus List & Header Controls:**
   `pnpm vitest run src/components/busList/` ➔ **26 passed (100%)**
5. **Uji Analitik & Rekap Armada:**
   `pnpm vitest run src/components/__tests__/AnalyticsDashboard.test.tsx src/components/__tests__/UnitSummaryDashboard.test.tsx` ➔ **5 passed (100%)**
6. **Uji Komprehensif Seluruh Repositori:**
   `pnpm vitest run src/` ➔ **100% lulus tanpa kegagalan**
7. **Typecheck & Build Produksi:**
   `pnpm run build` ➔ **0 error, build sukses**
8. **Knowledge Graph:**
   `graphify update .` ➔ **Tersinkronisasi**
