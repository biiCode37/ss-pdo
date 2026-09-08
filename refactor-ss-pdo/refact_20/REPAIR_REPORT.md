# REPAIR REPORT: MODERN MOBILE-FIRST UI/UX REFINEMENT (REFACTOR 20)

Dokumen ini mencatat implementasi pembaruan antarmuka dan pengalaman pengguna (UI/UX) pada halaman-halaman inti SS_PDO, mencakup perbandingan Sebelum (*Before*) dan Sesudah (*After*), serta Skenario Lapangan nyata untuk perbaikan temuan `UI-20-01`, `UI-20-02`, dan `UI-20-03`.

---

## 1. Implementasi & Detail Solusi

### A. Modern Expanding Pill Floating BottomNav (`UI-20-01`)
1. **Pembaruan Arsitektur Tab:**
   - Di `src/constants/texts/text_dashboard.ts`, ditambahkan label ringkas untuk setiap tab:
     - `INPUT_SHORT: "Input"`
     - `DASHBOARD_SHORT: "Ringkasan"`
     - `UNIT_SHORT: "Armada"`
     - `MORE_SHORT: "Menu"`
2. **Penerapan Expanding Pill Component (`src/components/BottomNav.tsx`):**
   - Menghilangkan slider background statis 25% dan menggantinya dengan tab adaptif fleksibel.
   - Tab yang aktif mengembang secara otomatis menampilkan teks ringkas dengan transisi fisik pegas Apple: `cubic-bezier(0.32, 0.72, 0, 1)`.
   - Tab yang tidak aktif menciut menjadi ikon proporsional yang rapi.
3. **Ergonomi Sentuh & Theme Adaptif (`src/index.css`):**
   - Setiap tombol tab dijamin memiliki area sentuh minimum 44px × 42px.
   - Pada Dark Mode: Tab aktif menggunakan background gradient emerald cerah (`#3ECF8E` ke `#00C573`) dengan teks hijau tua kontras tinggi (`#061a10`).
   - Pada Light Mode: Tab aktif menggunakan gradient emerald solid (`#24B47E` ke `#10b981`) dengan teks putih bersih (`#ffffff`), menjaga standar kontras AAA.
4. **Sentuhan Ergonomis Trip Badge:**
   - Menambahkan pseudo-element `::before` expander pada `.bus-card-badge-trip` (`min-height: 44px`), memperluas area sentuh efektif jempol tanpa merusak desain kartu yang kompak.

### B. Eliminasi Jitter Angka dengan Tabular Numbers (`UI-20-02`)
1. **Utility Global Tabular Numbers (`src/index.css`):**
   - Menambahkan kelas `.tabular-nums` dan menerapkan properti berikut ke semua elemen data angka:
     ```css
     .tabular-nums,
     .analytics-stat-value,
     .bus-card-cell,
     .bus-card-badge-trip,
     .bus-card-unit,
     .unit-kpi-val,
     .shift-stat-val,
     .kpi-number,
     input[type="number"] {
       font-variant-numeric: tabular-nums;
       -moz-font-feature-settings: "tnum";
       -webkit-font-feature-settings: "tnum";
       font-feature-settings: "tnum";
     }
     ```
   - Setiap digit (0–9) kini memiliki lebar glif yang identik, menghilangkan pergeseran posisi horizontal saat angka bertambah/berkurang.

### C. Visual Status Hierarchy Kartu Armada Bus (`UI-20-03`)
1. **Evaluasi Status Dinamis (`src/components/BusCard.tsx`):**
   - Menghitung class visual status berdasarkan evaluasi real-time:
     - `status-kendala`: Jika unit mengalami kendala, mogok, laka, atau dalam perbaikan.
     - `status-warning`: Jika berstatus cadangan, BKO, atau ritase bus di bawah target.
     - `status-achieved`: Jika ritase pergi dan pulang telah mencapai target.
2. **Garis Aksen Visual Tepi Kiri (`src/index.css`):**
   - Menambahkan border kiri 3.5px yang tegas dan halus (`border-left: 3.5px solid ...`):
     - Merah (`var(--danger-color, #ef4444)`) untuk Kendala.
     - Kuning (`var(--warning-color, #f59e0b)`) untuk Peringatan / Cadangan / Belum Capai Target.
     - Hijau (`var(--success-color, #3ECF8E)`) untuk Target Tercapai.

---

## 2. Before vs After

### A. Bottom Navigation Bar

* **Before (Statis, 4 Ikon Tanpa Teks, Rawan Salah Tap):**
  ```tsx
  // Hanya menampilkan 4 ikon tanpa teks sama sekali
  <button onClick={() => onSelectTab("input")} className="bottom-nav-item">
    <ClipboardList size={20} />
  </button>
  ```
* **After (Expanding Pill, Teks Muncul Dinamis pada Tab Aktif):**
  ```tsx
  <button
    onClick={() => handleTabClick("input")}
    className={`bottom-nav-item ${activeTab === "input" ? "active" : ""}`}
    data-testid="bottom-nav-input"
  >
    <div className="bottom-nav-icon-wrapper">
      <ClipboardList size={19} />
      {pendingQueueCount > 0 && <span className="bottom-nav-badge">{pendingQueueCount}</span>}
    </div>
    <span className="bottom-nav-label">{TEXT_DASHBOARD.TABS.INPUT_SHORT}</span>
  </button>
  ```

### B. Stabilitas Angka Metrik (Tabular Numbers)

* **Before:** Angka metrik menggunakan proporsi default sehingga angka '1' lebih sempit dari angka '8'. Ketika angka berubah saat diketik di form atau saat refresh data, seluruh kolom bergeser beberapa piksel (jitter layout).
* **After:** Menggunakan `font-variant-numeric: tabular-nums`, setiap angka memiliki lebar horizontal seragam layaknya grid akuntansi monospaced modern. Angka tetap tenang dan kokoh tanpa pergeseran sekecil apa pun.

### C. Kartu Bus (`BusCard`)

* **Before:** Tampilan kartu monoton abu-abu gelap/terang tanpa garis aksen. Petugas tidak tahu status bus sebelum membaca teks detail di dalamnya.
* **After:** Garis aksen tepi kiri langsung memberitahukan status:
  - 🔴 Garis Merah = Kendala / Trouble / Laka / Mogok
  - 🟡 Garis Kuning = Cadangan / BKO / Belum Mencapai Target
  - 🟢 Garis Hijau = Target Ritase Tercapai

---

## 3. Case: Skenario Lapangan

### Skenario 1: Petugas Lapangan Baru di Pool Bus
* **Kondisi:** Petugas baru yang belum hafal letak menu sedang bertugas di pool saat pergantian shift sore.
* **Masalah Lama:** Petugas bingung membedakan tombol "Ringkasan Statistik" dengan "Daftar Armada" karena keduanya hanya berupa ikon grafik dan bus kecil tanpa label.
* **Hasil Perbaikan:** Saat tab diklik, dock bawah secara elegan mengekspansikan kapsul aktif dengan label teks jelas ("Ringkasan", "Armada", "Input"). Petugas langsung mengerti posisi halamannya tanpa keraguan.

### Skenario 2: Input Cepat Angka Ritase & KM di Dalam Bus yang Bergetar
* **Kondisi:** Petugas mencatat angka KM dan menyentuh tombol trip saat bus sedang berjalan.
* **Masalah Lama:** Tombol trip kecil sulit ditekan jempol, dan angka KM yang diketik tampak bergetar/bergeser ke kiri dan kanan.
* **Hasil Perbaikan:** Tombol trip kini memiliki touch-target ≥ 44px melalui expander tak terlihat, memudahkan jempol men-tap secara akurat pada percobaan pertama. Angka KM tersaji kokoh berkat `tabular-nums`.

### Skenario 3: Evaluasi Kilat Mandor Operasional Terhadap Armada Bermasalah
* **Kondisi:** Mandor membuka daftar unit rute untuk mengecek armada mana saja yang mengalami gangguan di jalan.
* **Masalah Lama:** Mandor harus menggulir dan membaca catatan kecil di bawah setiap kartu untuk mencari bus yang mogok.
* **Hasil Perbaikan:** Kartu unit yang mogok atau mengalami kendala langsung menyala dengan garis aksen merah tebal di tepi kiri. Mandor dapat mengidentifikasi armada bermasalah hanya dalam 1 detik sekilas pandang.
