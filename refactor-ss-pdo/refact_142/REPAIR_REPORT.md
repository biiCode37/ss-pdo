# Laporan Perbaikan & Refactor — Refactor 142
## Fase 4: Modernisasi Antarmuka Modal Input Bus & Single Focus Mode

### Ringkasan Eksekutif
Refactor 142 menuntaskan **Fase 4** dari transformasi desain UI/UX SS_PDO. Fokus perbaikan ini mencakup:
1. **Modern Segmented Tabs Container (iOS Style)** pada `BusInputModalTabs.tsx` yang membungkus 4 tab navigasi (`Shift 1`, `Shift 2`, `Ritase`, `Ket`) dalam kapsul terpadu dengan border-radius `12px` dan transisi fisik halus.
2. **Kamus Teks Sentral Terpadu**: Menghilangkan hardcoded string `"Shift 1"` dan `"Shift 2"` dengan mendaftarkan `TAB_SHIFT_1` dan `TAB_SHIFT_2` pada `TEXT_ALERTS.BUS_INPUT_MODAL`.
3. **Penyelarasan Header & Footer Modal**:
   - `BusInputModalHeader.tsx`: Tombol switcher mode (Semua Kolom / Mode Fokus) dan tombol Satset diselaraskan menjadi rounded micro-capsule (`10px` / `34px`) dengan kontras tajam pada tema Terang (Light) maupun Gelap (Dark).
   - `BusInputModalFooter.tsx`: Tombol Batal dan Simpan mengadopsi border-radius `12px` konsisten dengan feedback visual dinamis.
4. **Standardisasi Input Trip & Ritase PP**:
   - Menggantikan elemen `<input>` mentah di `BusInputModalTrip.tsx` dengan komponen kanonik `BusFormField`.
   - Menampilkan visualisasi ritase pulang-pergi (PP) yang ternormalisasi: $1\text{ Ritase} = 2\text{ Trip (PP)}$.
5. **Perbaikan Fallback CSS Token di Single Focus Mode**:
   - Memperbaiki `singleFocusStyles.ts` dan `SingleFocusKmRolloverBanner.tsx` dari fallback gelap hardcoded (`#171717`) menjadi token adaptif (`var(--text-primary, #ededed)`), mencegah teks tidak terlihat saat Dark Mode aktif.

---

### Implementasi Detail & Perbandingan (Before vs After)

#### 1. Segmented Control Tabs (`BusInputModalTabs.tsx`)
- **Before:**
  Tombol tab disusun dalam grid datar dengan garis bawah tipis (`borderBottom`), tanpa pembungkus kapsul terpadu, dan nama tab `"Shift 1"` serta `"Shift 2"` ditulis *hardcoded* langsung di JSX.
- **After:**
  Menggunakan container kapsul iOS terpadu (`role="tablist"`, `background: var(--input-bg, rgba(255, 255, 255, 0.04))`, border-radius `12px`). Setiap tab (`role="tab"`) memiliki status `aria-selected` yang reaktif, padding proporsional, dan teks diambil dari kamus sentral `TEXT_ALERTS.BUS_INPUT_MODAL`.

#### 2. Kontrol Header & Footer (`BusInputModalHeader.tsx` & `BusInputModalFooter.tsx`)
- **Before:**
  Tombol switch mode memakai `borderRadius: 9999px` (pill lonjong ekstrem) yang kontrasnya memudar di Light Mode, sedangkan tombol footer memakai radius `14px` yang kurang seragam dengan sistem kartu aplikasi.
- **After:**
  Semua kontrol aksi tombol diseragamkan dengan radius `10px` (header) dan `12px` (footer), menggunakan variabel `var(--input-bg)` dan `var(--card-border)` untuk kontras optimal di kedua tema.

#### 3. Standardisasi Trip & Ritase PP (`BusInputModalTrip.tsx`)
- **Before:**
  Input trip pergi dan pulang menggunakan `<input>` HTML biasa dengan inline styling manual sehingga ukuran font, outline, dan perilaku focus berbeda dari input TOA dan KM.
- **After:**
  Menggunakan `BusFormField` (variant `"hero"`, `max={MAX_TRIP_COUNT}`, font tebal 800) dengan card ringkasan total ritase PP yang jelas dan elegan.

#### 4. CSS Variable Dark/Light Adaptability (`singleFocusStyles.ts` & Banner Rollover)
- **Before:**
  `color: var(--text-primary, #171717)` menyebabkan teks label, input, dan banner fallback ke warna hitam pekat di atas modal yang berlatar gelap.
- **After:**
  Diperbarui menjadi `var(--text-primary, #ededed)` dan tombol rollover berlatar amber `#f59e0b` dengan teks hitam tegas `#000`.

---

### Case: Skenario Lapangan

#### Kasus A: Petugas Lapangan Mengisi Ritase Armada di Bawah Terik Matahari (Light Mode)
- **Kondisi:** Petugas operasional di terminal membuka modal input bus pada siang hari di bawah sinar matahari langsung dengan layar ponsel berada di mode terang (Light Mode).
- **Hasil Sebelum Refactor:** Tombol switch mode dan tombol satset di header tampak samar karena background putih transparan tanpa border kontras.
- **Hasil Sesudah Refactor:** Kontrol header menggunakan border `var(--card-border)` yang tegas dan background `var(--input-bg)` yang terdefinisi rapi, sehingga mudah dilihat dan di-tap dengan jempol tanpa salah pencet.

#### Kasus B: Pengawas Menginput Data Menggunakan Mode Single Focus di Malam Hari (Dark Mode)
- **Kondisi:** Pengawas mengisi data KM Awal secara cepat dalam mode fokus tunggal saat malam hari (Dark Mode).
- **Hasil Sebelum Refactor:** Jika token CSS fallback terpanggil, teks input dan banner rollover berisiko tampil hitam di atas kartu gelap sehingga membingungkan pengguna.
- **Hasil Sesudah Refactor:** Teks tampil putih tajam (`#ededed`) dengan banner peringatan rollover berwarna amber lembut yang sangat kontras dan ramah di mata.

---

### Status Verifikasi & Quality Gates
1. **Unit Test Suite:**
   - `pnpm vitest run src/components/busCard/modal/` ➔ **9 passed (9 files, 91 tests passed)**
   - `pnpm vitest run src/` ➔ **107 passed (107 files, 782 tests passed)**
2. **Build TypeScript & Vite:**
   - `pnpm run build` ➔ **Lulus 0 error (dist siap produksi)**
3. **Knowledge Graph:**
   - `graphify update .` ➔ **Tersinkronisasi (5.666 nodes, 7.061 edges, 540 communities)**
