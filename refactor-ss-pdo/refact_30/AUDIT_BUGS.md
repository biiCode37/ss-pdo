# AUDIT BUGS: UI/UX DE-CLUTTERING, ANTI-SLOP & FLUID RESPONSIVE UNITS (REFACTOR 30)

Dokumen ini mendokumentasikan temuan audit UI/UX terkait tampilan berlebihan (*tacky/slop*), kepadatan visual ekstrem yang menyita ruang layar ponsel, penggunaan unit viewport mentah `vh` yang rentan layout shift, serta ketiadaan unit fluid `clamp()` pada aplikasi SS_PDO.

---

## DAFTAR TEMUAN AUDIT

| ID Temuan | Komponen / File Terkait | Keparahan | Status |
| :--- | :--- | :--- | :---: |
| **BUG-30-01** | `src/components/BusList.tsx` | 🔴 **CRITICAL** (Screen Hijacking: Card progress 72px & multi-row sticky header menyita ~50% tinggi layar HP) | Terselesaikan |
| **BUG-30-02** | `src/components/BusCard.tsx` | 🟠 **HIGH** (Rainbow Badges & Border Overload: 3 badge kotak bertumpuk di kanan kartu bus memicu wrapping berantakan) | Terselesaikan |
| **BUG-30-03** | `src/index.css` | 🟠 **HIGH** (Flashing Animation Norak: `.status-queued` berdenyut kuning neon secara agresif saat antrean offline) | Terselesaikan |
| **BUG-30-04** | `src/components/DailyToaTrendCard.tsx` | 🟡 **MEDIUM** (Gradien Norak & Font Terlalu Kecil: Legend menggunakan gradien 90-an dan tipografi 9.5px sulit dibaca) | Terselesaikan |
| **BUG-30-05** | `FleetStatusModal.tsx`<br>`RouteOperationalReportCard.tsx`<br>`AccumulationSheet.tsx`<br>`UnitDetailModal.tsx`<br>`ProfileMenuSheet.tsx`<br>`QueueModal.tsx`<br>`AddRouteModal.tsx`<br>`RouteSelectorSheet.tsx`<br>`LegalModals.tsx`<br>`LoginInfoModal.tsx`<br>`WaReportModal.tsx` | 🔴 **CRITICAL** (Raw Viewport `vh` Mengakibatkan Layout Shift & Tombol Terpotong di Mobile Browser) | Terselesaikan |

---

## RINCIAN TEMUAN

### 🔴 BUG-30-01: Screen Hijacking oleh Card Progress & Multi-Row Sticky Header
- **ID Temuan:** `BUG-30-01`
- **Lokasi Kode:** `src/components/BusList.tsx` (baris 434–487)
- **Keparahan:** **CRITICAL** (Kepadatan Ekstrem & Inefisiensi Viewport Mobile)
- **Deskripsi Masalah:**
  1. Pada halaman "Input SS", card progress harian (`progress-section glass`) memakan ruang vertikal setinggi ~72px, ditambah kontrol 2 baris (Set Trip, Fokus Kolom, Search, Filter) setinggi ~90px, dan sticky header utama setinggi ~96px.
  2. Total ruang sticky mencapai **280px – 310px**, menyita 45%–50% layar smartphone (667px – 844px).
  3. Pengguna hanya dapat melihat 1–2 kartu bus sekaligus tanpa leluasa melakukan scroll.
- **Dampak Lapangan:** Petugas pengawas harus melakukan scroll berulang kali untuk memeriksa unit armada yang banyak.
- **Mitigasi:**
  - Menghapus card progress tebal dan menggantinya dengan **3px Hairline Progress Bar** terintegrasi dengan counter ringkas di satu baris (`15/20 Unit • 75%`).
  - Menghemat lebih dari 60px ruang vertikal layar secara instan.

---

### 🟠 BUG-30-02: Rainbow Badges & Border Overload pada Kartu Bus
- **ID Temuan:** `BUG-30-02`
- **Lokasi Kode:** `src/components/BusCard.tsx` (baris 420–505)
- **Keparahan:** **HIGH** (Polusi Visual & Tampilan Murahan/Norak)
- **Deskripsi Masalah:**
  Di sisi kanan kartu unit terdapat 3 badge kotak terpisah (Trip, KM, Pnp), masing-masing dengan background `rgba`, border `1px solid`, dan ikon sendiri. Pada layar sempit (360px), badge-badge ini saling bertumpuk dan turun baris (*wrapping*), membuat kartu bus terlihat gemuk dan tidak rapi.
- **Dampak Lapangan:** Tampilan terasa ramai, berat, dan membingungkan fokus visual petugas saat mencocokkan nomor unit bus.
- **Mitigasi:**
  - Menggabungkan ketiga metrik ke dalam **Satu Baris Tipografis Bersih (Clean Data Strip)** berpemisah titik halus (`8/8 rit • 124.5 KM • 382 Pnp`) dalam satu kontainer kapsul tipis.
  - Mempertahankan aksesibilitas dan interaktivitas tombol trip modal (`.bus-card-badge-trip`).

---

### 🟠 BUG-30-03: Animasi Berkedip Kasar (*Infinite Flashing*) Saat Offline
- **ID Temuan:** `BUG-30-03`
- **Lokasi Kode:** `src/index.css` (baris 405–425)
- **Keparahan:** **HIGH** (Kelelahan Visual & Desain Norak)
- **Deskripsi Masalah:**
  Status antrean offline `.status-queued` memiliki animasi `@keyframes pulse-warning` 2 detik looping tak henti dengan glow kuning neon `box-shadow: 0 0 10px rgba(234, 179, 8, 0.4)`. Jika ada 20 unit bus dalam antrean, layar berkedip-kedip secara agresif.
- **Dampak Lapangan:** Menimbulkan kelelahan mata (*visual fatigue*) dan kepanikan yang tidak perlu pada petugas lapangan.
- **Mitigasi:**
  - Menghapus animasi `pulse-warning` dan neon glow.
  - Mengubah `.status-queued` menjadi badge flat dengan warna latar amber tenang (`rgba(245, 158, 11, 0.12)`) dan teks tajam terbaca.

---

### 🟡 BUG-30-04: Gradien Norak & Font Terlalu Kecil pada Grafik Tren
- **ID Temuan:** `BUG-30-04`
- **Lokasi Kode:** `src/components/DailyToaTrendCard.tsx` (baris 360–508)
- **Keparahan:** **MEDIUM** (Legibilitas Rendah & Aksen Visual Jadul)
- **Deskripsi Masalah:**
  1. Tiga kartu metrik mini (Tertinggi, Terendah, Rata-rata) memiliki teks berukuran `9.5px` dan `10px`, yang terlalu kecil di layar HP luar ruangan (*outdoor daylight*).
  2. Legend chart menggunakan gradien vertikal 3 warna mencolok (hijau, oranye, merah-muda).
- **Dampak Lapangan:** Keterbacaan rendah di bawah terik matahari terminal.
- **Mitigasi:**
  - Menstandarkan font ukuran mini menjadi minimal `11px` dengan `tabular-nums`.
  - Mengganti gradien menjadi dot indikator semantik solid (Linear/Apple restraint style).

---

### 🔴 BUG-30-05: Raw Viewport `vh` Mengakibatkan Layout Shift & Tombol Terpotong di Mobile
- **ID Temuan:** `BUG-30-05`
- **Lokasi Kode:** 11 file komponen dialog/modal/sheet
- **Keparahan:** **CRITICAL** (Bug Tata Letak Browser Mobile Android & Safari iOS)
- **Deskripsi Masalah:**
  Seluruh sheet modal menggunakan `maxHeight: '90vh'` atau `'92vh'`. Pada peramban ponsel, bilah URL dan bilah navigasi bawah muncul dan menghilang secara dinamis. Nilai `vh` statis tidak memperhitungkan bilah ini, sehingga tombol "Simpan" atau "Konfirmasi" di bagian bawah sering tertutup atau terdorong ke luar layar.
- **Dampak Lapangan:** Pengguna tidak dapat menekan tombol Simpan karena tertutup navigation bar ponsel.
- **Mitigasi:**
  - Memigrasikan seluruhnya ke unit dinamis modern: `max-height: min(90dvh, 760px)`.
  - Menerapkan padding aman terhadap gestur home bar: `env(safe-area-inset-bottom)`.
