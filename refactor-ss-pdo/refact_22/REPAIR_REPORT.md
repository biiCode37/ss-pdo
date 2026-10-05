# REPAIR REPORT: LAPORAN KONDISI OPERASIONAL & ROUTE SELECTOR REFINEMENT (REFACTOR 22)

Dokumen ini mencatat implementasi penyempurnaan kartu Laporan Kondisi & Armada Rute (`RouteOperationalReportCard`), ekstraksi form Tambah Rute ke modal mandiri (`AddRouteModal`), peningkatan affordance kapsul morphing, serta eliminasi jitter pada monitoring regional (`AllRouteMonitoringPage`).

---

## 1. Implementasi & Detail Solusi

### A. Desain Ulang Laporan Kondisi & Armada Rute (`UI-22-01`)
1. **Penyelarasan Desain Sistem & Tema (Dark/Light):**
   - Menghapus seluruh inline hardcoded color (`#2563eb`, `#cbd5e1`, `#334155`, `#f1f5f9`).
   - Menerapkan shell `.glass` dengan border `var(--border-color)` dan input fields `.input-field` yang adaptif 100% terhadap tema aktif.
   - Mengganti tombol biru kaku dengan tombol utama `.btn` bergradien emerald khas aplikasi (`#3ECF8E` ke `#00C573`), lengkap dengan animasi transisi pegas dan loading spinner `Loader2`.
2. **Harmonisasi Input Shift & Headway:**
   - Input Renops & Realops Shift 1 dan Shift 2 ditata dalam kartu kontainer simetris dengan indikator dot warna (Cyan untuk Shift 1, Violet untuk Shift 2).
   - Seluruh input angka (`#renops-s1`, `#realops-s1`, `#renops-s2`, `#realops-s2`, `#headway-fastest`, `#headway-slowest`) dilengkapi utilitas `.tabular-nums`.
3. **Penyempurnaan Chips Titik Kemacetan:**
   - Mengganti warna merah bahaya `#ef4444` dengan warna amber lalu lintas yang hangat (`rgba(245, 158, 11, 0.18)` dengan aksen `#f59e0b`).
   - Input penambahan titik macet disatukan dengan form field modern dan tombol `+ Tambah` yang serasi.
4. **Accordion Header yang Bersih:**
   - Ikon bus berlatar emerald, badge status yang tegas, serta tombol chevron dengan kontainer sentuh ramah jempol.

### B. Ekstraksi Form Tambah Rute ke Modal Mandiri (`UI-22-02`)
1. **Pemisahan `AddRouteModal.tsx`:**
   - Form pembuatan rute baru kini menjadi komponen modal mandiri (`src/components/routeSelector/AddRouteModal.tsx`).
   - Kartu `RouteSelectorCard` tidak lagi melar atau meregangkan viewport saat tombol "Tambah Rute" ditekan.
   - Tetap mempertahankan seluruh fungsionalitas inspeksi live Google Sheets, deteksi duplikasi rute, dan integrasi `useMobileBackHandler`.
2. **Peningkatan Affordance Kapsul Morphing:**
   - Menambahkan ikon chevron turun (`ChevronDown size={14}`) di sisi kanan kapsul ringkas `.morph-pill-content`. Pengguna di smartphone langsung mengenali bahwa kapsul tersebut adalah elemen interaktif yang dapat dibuka kembali dengan satu ketukan.

### C. Standardisasi Tabular Numbers pada Monitoring Regional (`UI-22-03`)
1. **Eliminasi Jitter Angka Metrik:**
   - Menambahkan kelas `.tabular-nums` pada seluruh angka capaian (penumpang, kilometer, rasio armada) pada kartu ringkasan KPI dan kartu rute di `AllRouteMonitoringPage.tsx`.

---

## 2. Before vs After

### A. Laporan Kondisi & Armada Rute (`RouteOperationalReportCard.tsx`)

* **Before (Hardcoded Styles, Rusak di Dark Mode, Tombol Biru Asing):**
  ```tsx
  // Input kaku dengan border abu-abu terang hardcoded yang menyilaukan di Dark Mode
  <input
    id="renops-s1"
    style={{ border: '1px solid #cbd5e1', fontSize: '13px' }}
  />
  // Tombol simpan biru asing tanpa spinner loading
  <button style={{ background: '#2563eb', color: '#ffffff' }}>
    {saving ? 'Menyimpan...' : 'Simpan Laporan'}
  </button>
  ```

* **After (Desain Sistem Terpadu, Sempurna di 2 Tema, Loading Spinner):**
  ```tsx
  <input
    id="renops-s1"
    className="input-field tabular-nums"
    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}
  />
  <button type="submit" disabled={saving || loading} className="btn">
    {saving ? <Loader2 className="spinner" size={16} /> : <Send size={16} />}
    <span>{saving ? TEXT_PDO_FORM.BUTTONS.SUBMITTING : TEXT_PDO_FORM.BUTTONS.SUBMIT}</span>
  </button>
  ```

### B. Form Tambah Rute (`RouteSelectorCard.tsx`)

* **Before:** Form inline ~160 baris markup HTML meregangkan kartu selector rute secara mendadak ke bawah, mendorong kartu armada keluar dari pandangan.
* **After:** Form dipindahkan ke modal sheet mandiri (`AddRouteModal.tsx`), kartu selector tetap ramping dan stabil.

### C. Affordance Kapsul Morphing

* **Before:** Kapsul hanya menampilkan teks dan tanggal. Pengguna baru sering mengira kapsul tersebut adalah teks statis yang tidak bisa ditekan lagi.
* **After:** Kapsul dilengkapi ikon chevron turun lembut di ujung kanan, memberi sinyal jelas bahwa kapsul dapat diketuk untuk membuka selector kembali.

---

## 3. Case: Skenario Lapangan

### Skenario 1: Petugas Mengisi Laporan Operasional Shift Malam (Dark Mode)
* **Kondisi:** Petugas mengisi data renops/realops dan titik macet di dalam pool bus pada malam hari dengan layar ponsel dalam mode gelap.
* **Masalah Lama:** Kotak input putih dan border `#cbd5e1` sangat menyilaukan mata di tengah kegelapan, dan chip titik macet berwarna merah terkesan seperti error.
* **Hasil Perbaikan:** Form tampil elegan menyatu dengan tema gelap Supabase, input berlatar lembut tidak menyilaukan, dan chip macet berwarna amber lalu lintas yang nyaman dilihat.

### Skenario 2: Admin Menambahkan Rute Baru di Smartphone Sempit
* **Kondisi:** Admin lapangan membuka aplikasi di ponsel Android dengan lebar 360px dan menekan "Tambah Rute Baru".
* **Masalah Lama:** Form meregang ke bawah, membuat tombol muat data terdorong jauh dan layout tampak berantakan.
* **Hasil Perbaikan:** Modal "Tambah Rute Baru" terbuka anggun di tengah layar dengan background overlay gelap. Admin mengisi link Google Sheets dengan panduan live check yang jelas, lalu menutupnya dengan tombol silang atau gesture back ponsel.
