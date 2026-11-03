# Audit Bugs Mendalam: Halaman Plotting Armada Harian (Refactor 195)

Dokumen ini mencatat hasil audit kode, arsitektur, aksesibilitas WCAG, integritas data (SSOT), dan ergonomi mobile pada modul **Halaman Plotting Armada Harian** (`src/components/plotting/`, `src/services/dailyPlottingService.ts`, dan modul terkait di `SS_PDO`).

---

## Ringkasan Temuan Audit

| ID Temuan | Lokasi Kode | Kategori | Keparahan | Deskripsi Singkat | Dampak Pengguna & Sistem | Rencana Mitigasi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-195-01** | `src/components/plotting/DailyPlottingPage.tsx`<br>(`handleSavePlotting`) | Data Integrity & Quota | 🔴 **High** | Pengiriman mutasi massal tanpa filter delta murni & penghapusan paksa kolom Keterangan eksisting | Menyia-nyiakan kuota Google Sheets API (30 mutasi per simpan) dan melenyapkan catatan lapangan/driver pengawas di spreadsheet asli | Terapkan ekstraksi *dirty-only delta*. Hanya kirim baris yang nilainya berubah. Pertahankan keterangan eksisting jika tidak diubah petugas. |
| **BUG-195-02** | `src/components/plotting/DailyPlottingPage.tsx`<br>(`loadPlotting` / `useEffect`) | State Lifecycle & Supabase Quota | 🔴 **High** | Dependensi `buses` pada effect fetch data plotting memicu perulangan & reset paksa state lokal | Editan dan penataan urutan bus yang sedang dikerjakan user terhapus mendadak saat ada background sync / realtime event | Isolasi `buses` menggunakan `useRef(buses)`. Pisahkan inisialisasi awal hanya berdasar `[routeId, date]` dan lindungi dengan status `isDirty`. |
| **BUG-195-03** | `src/components/plotting/PlottingHeader.tsx`<br>`src/components/plotting/PlottingUnitCard.tsx`<br>`src/components/plotting/PlottingTroubleModal.tsx` | UI/UX & WCAG Contrast | 🔴 **High** | Pelanggaran token semantik & kegagalan kontras teks di Light Mode (`#4ade80`, `#fbbf24`, `#38bdf8`) | Teks status kesiapan, badge start pangkalan, dan tombol rolling tidak terbaca sama sekali (< 2:1) di bawah sinar matahari | Ganti dengan CSS Variables semantik adaptif dari `src/styles/tokens/semantic.css` yang lolos rasio kontras WCAG AA/AAA. |
| **BUG-195-04** | `src/components/plotting/PlottingTroubleModal.tsx`<br>(`parseInitialTroubleState`) | Parser Logic & Validation | 🟠 **Medium** | Pencocokan substring mentah (`includes`) memicu false positive pada kode 2-huruf seperti `NP` dan `OFF` | Catatan lapangan seperti `"RADIATOR TANPA AIR"` otomatis mencentang kendala `NP`, dan `"OFFICER DALOPS"` otomatis mencentang `OFF` (mereset ritase ke 0) | Terapkan boundary regex (`\bNP\b`, `\bOFF\b`) atau pemisahan token terstruktur agar tidak mencocokkan substring di dalam kata biasa. |
| **BUG-195-05** | `src/components/plotting/TargetRitaseModal.tsx`<br>`src/components/plotting/DailyPlottingPage.tsx` | Domain Modeling & Math | 🟠 **Medium** | Input numerik mengizinkan desimal bebas tanpa pembulatan 0.5 rit, merusak kalkulasi trip pergi/pulang | User mengetik `7.2 Rit`, namun sistem menyimpannya sebagai 8 trip pergi dan 7 trip pulang (`7.5 Rit`), menimbulkan ketidaksesuaian data | Validasi dan bulatkan setiap input ritase ke kelipatan `0.5` terdekat (`Math.round(val * 2) / 2`). |
| **BUG-195-06** | `src/components/plotting/DailyPlottingPage.tsx`<br>`src/components/plotting/PlottingUnitCard.tsx` | Mobile Ergonomics & Gesture | 🟠 **Medium** | Ketiadaan penanda `data-no-swipe` memicu lompatan tab tak disengaja & HTML5 drag mati di mobile touch | Layar berpindah ke tab lain saat petugas menyentuh layar ponsel, serta pegangan drag tidak merespons sentuhan jari di layar sentuh | Tambahkan atribut `data-no-swipe="true"` pada kontainer plotting dan optimalkan interaksi mobile dengan tombol panah atas/bawah. |
| **BUG-195-07** | `src/components/plotting/DailyPlottingPage.tsx`<br>(`handleApplyTargetRitase`) | Business Logic & Field Protection | 🟠 **Medium** | Preset target ritase massal ("Terapkan ke Pangkalan" / "Terapkan ke Semua") menimpa unit berstatus OFF | Unit armada yang mogok di bengkel (berstatus OFF) otomatis terisi target ritase 7.5 rit | Kecualikan unit berstatus `'OFF'` dari mutasi target ritase massal. |
| **BUG-195-08** | `src/components/plotting/PlottingHeader.tsx`<br>`src/components/plotting/PlottingUnitCard.tsx`<br>`src/components/plotting/TargetRitaseModal.tsx` | Kamus Teks Sentral | 🟡 **Low** | Ditemukan 14 string antarmuka pengguna yang di-hardcode tanpa merujuk ke `text_plotting.ts` | Inkonsistensi teks dan pelanggaran standar pemisahan teks sentral proyek SS_PDO | Pindahkan seluruh teks label, tooltip, dan aria-label ke kamus sentral `src/constants/texts/text_plotting.ts`. |
| **BUG-195-09** | `src/services/dailyPlottingService.ts`<br>`src/components/plotting/PlottingUnitCard.tsx` | Code Cleanliness & Maintenance | 🟡 **Low** | Dead prop `onMoveToBottom` dan utilitas cerdas `calculateAutoInheritedStartPoints` yang belum terintegrasi | Fitur auto-dispatch cerdas tidak aktif di halaman plotting dan kode usang tertinggal di komponen | Hapus dead prop `onMoveToBottom` dan jadwalkan integrasi `calculateAutoInheritedStartPoints` untuk auto-dispatch subuh. |

---

## Analisis Akar Masalah (Deep Root Cause Analysis)

### 1. BUG-195-01: Overwriting Unchanged Fleet Rows on Save & Wiping Out Existing Keterangan
- **Lokasi:** `src/components/plotting/DailyPlottingPage.tsx` (baris 624–678)
- **Akar Masalah:**
  Pada fungsi `handleSavePlotting`, sistem melakukan iterasi ke seluruh `unitsData` dan memasukkan setiap unit ke dalam `updatesList`:
  ```typescript
  unitsData.forEach((item) => {
    const bus = busMap.get(item.unit.trim().toUpperCase());
    if (!bus) return;

    // ... kalkulasi tripPergi & tripPulang ...
    const resolvedKeterangan =
      item.status === 'READY'
        ? ''
        : item.keterangan || item.note || 'KENDALA';

    const updates: Partial<BusData> = {
      tripPergi,
      tripPulang,
      keterangan: resolvedKeterangan,
    };

    updatesList.push({
      rowIndex: bus.rowIndex,
      updates,
    });
  });
  ```
  Tidak ada pengecekan delta (*dirty-check*) apakah `bus.tripPergi === tripPergi`, `bus.tripPulang === tripPulang`, dan `(bus.keterangan || '') === resolvedKeterangan`. Seluruh armada (misalnya 30 unit) selalu dikirimkan ke Google Sheets API setiap kali simpan ditekan.
  Selain itu, `resolvedKeterangan` untuk unit `'READY'` di-hardcode menjadi `''` (string kosong). Jika pengawas atau operator sebelumnya telah menuliskan keterangan penting di spreadsheet (misalnya: *"PENGEMUDI SIANG: BAMBANG"* atau *"AC KURANG DINGIN"*), keterangan tersebut **dihapus bersih** saat plotting disimpan.
- **Mitigasi:**
  1. Bandingkan nilai baru dengan baseline `bus` di spreadsheet. Hanya masukkan ke `updatesList` jika terjadi perubahan nyata.
  2. Pertahankan `keterangan` eksisting pada unit `'READY'` kecuali jika sebelumnya berstatus kendala dan kini dinormalkan oleh pengguna.

---

### 2. BUG-195-02: Desynchronization & Overwrite Loop on `buses` Prop Change
- **Lokasi:** `src/components/plotting/DailyPlottingPage.tsx` (baris 166–210)
- **Akar Masalah:**
  `useEffect` pemuatan data plotting memiliki array dependensi:
  `[routeId, date, buses, onPlottingChange, integrateSheetValues]`.
  Ketika `handleSavePlotting` selesai, fungsi memanggil `onUpdateBus?.(bus.rowIndex, updates)` yang memperbarui `busData` di parent (`Dashboard.tsx`). Pembaruan ini menghasilkan referensi baru untuk `buses`, yang memicu `integrateSheetValues` baru, lalu memicu kembali eksekusi `useEffect`.
  Hal serupa terjadi jika terdapat event sinkronisasi offline atau Supabase Realtime di latar belakang. Akibatnya, `loadPlotting()` berjalan ulang, memanggil `fetchDailyPlotting`, dan menimpa state lokal `unitsData`.
- **Dampak Pengguna:**
  Jika petugas sedang melakukan penataan urutan atau pengubahan ritase armada selama beberapa menit tanpa menekan simpan, event background sync seketika menghapus seluruh perubahan lokal petugas di layar!
- **Mitigasi:**
  Gunakan `busesRef` (`useRef(buses)`) untuk membaca nilai sheet tanpa mendaftarkan `buses` ke dalam dependency array `useEffect`. Pastikan `loadPlotting` hanya dijalankan saat `routeId` atau `date` berganti, serta lindungi dengan flag `isDirtyRef`.

---

### 3. BUG-195-03: Pelanggaran Kontras WCAG AA di Light Mode
- **Lokasi:**
  - `PlottingHeader.tsx`: baris 203 (`#4ade80`), baris 234 (`#f87171`), baris 311 (`#fbbf24`), baris 282 (`#38bdf8`)
  - `PlottingUnitCard.tsx`: baris 67 (`#4ade80`), baris 308 (`#38bdf8`)
- **Akar Masalah:**
  Pengembang menggunakan warna mentah heksadesimal cerah yang dirancang untuk dark mode, tanpa memperhitungkan latar kanvas putih pada Light Mode:
  - Teks `#4ade80` (Hijau Muda) di atas latar putih menghasilkan kontras **1.62:1** (ambang batas WCAG AA adalah **4.5:1**).
  - Teks `#f87171` (Merah Muda) menghasilkan kontras **2.18:1**.
  - Teks `#fbbf24` (Kuning Amber) menghasilkan kontras **1.67:1**.
  - Teks `#38bdf8` (Biru Langit) pada badge pangkalan menghasilkan kontras **1.86:1**.
- **Dampak Pengguna:**
  Di bawah terik matahari siang hari, petugas lapangan yang memakai mode terang (Light Mode) tidak dapat membaca angka status unit, badge pangkalan start, maupun tombol rolling.
- **Mitigasi:**
  Terapkan token warna semantik adaptif dari `src/styles/tokens/semantic.css`:
  - Siap: `var(--color-success-fg)` (Dark Green 800 di Light Mode, Green 300 di Dark Mode).
  - Kendala: `var(--color-warning-fg)` (Dark Amber 800 di Light Mode, Amber 300 di Dark Mode).
  - Badge Titik Start: `var(--color-info-fg)`, `var(--color-info-bg)`, `var(--color-info-border)` (Blue 800 di Light Mode, Sky 300 di Dark Mode).

---

### 4. BUG-195-04: False Positive Substring Matching pada `PlottingTroubleModal`
- **Lokasi:** `src/components/plotting/PlottingTroubleModal.tsx` (baris 35–39)
- **Akar Masalah:**
  Fungsi `parseInitialTroubleState` mencocokkan kode kendala dengan `ketUpper.includes(item.toUpperCase())`.
  Untuk kode 2-huruf seperti `"NP"`:
  Kata `"TANPA"` pada kalimat `"RADIATOR TANPA AIR"` menghasilkan `true` karena huruf ke-3 dan ke-4 adalah `'N'` dan `'P'`.
  Kata `"INPUT"` pada `"INPUT LAPORAN"` juga menghasilkan `true`.
  Kata `"OFFICER"` pada `"OFFICER DALOPS"` menghasilkan `true` untuk kode `"OFF"`.
- **Dampak Pengguna:**
  Petugas yang menuliskan keterangan `"BA.02 - RADIATOR TANPA AIR"` mendapati kendala `"NP"` otomatis tercentang. Catatan koordinasi seperti `"OFFICER DALOPS TEGUR DRIVER"` otomatis menganggap armada berstatus `"OFF"`, sehingga target ritase di-nolkan dan jadwal bus ditiadakan.
- **Mitigasi:**
  Gunakan pencocokan kata berbasis boundary regex (`new RegExp(\`\\b${escapeRegex(item)}\\b\`, 'i')`) atau pecah string berdasarkan tanda koma/strip sebelum membandingkan kode.

---

### 5. BUG-195-05: Input Desimal Bebas Merusak Konversi Trip Pergi/Pulang
- **Lokasi:** `src/components/plotting/TargetRitaseModal.tsx` & `src/components/plotting/DailyPlottingPage.tsx`
- **Akar Masalah:**
  Input teks/angka di modal mengizinkan nilai sembarang (seperti `7.2` atau `7.7`).
  Di `DailyPlottingPage.tsx`, kalkulasi trip membagi pecahan ritase secara biner (`isHalf = rit % 1 !== 0`):
  ```typescript
  if (!isHalf) {
    tripPergi = String(k);
    tripPulang = String(k);
  } else {
    // Start A -> Pergi k+1, Pulang k
    // Start B -> Pulang k+1, Pergi k
  }
  ```
  Jika pengguna memasukkan `7.2`, nilai `7.2 % 1 !== 0` bernilai `true`, sehingga sistem menetapkan trip pergi 8 dan trip pulang 7 (`15` trip = `7.5` rit). Data yang tersimpan di Google Sheets berbeda dengan apa yang dimasukkan petugas di antarmuka pengguna.
- **Mitigasi:**
  Validasi dan bulatkan nilai ritase ke kelipatan `0.5` terdekat (`Math.round(val * 2) / 2`) di `TargetRitaseModal` dan sebelum proses penyimpanan.

---

### 6. BUG-195-06: Swipe Gesture Tab Capture & Dead Mobile Drag Handle
- **Lokasi:** `src/components/plotting/DailyPlottingPage.tsx` & `src/components/plotting/PlottingUnitCard.tsx`
- **Akar Masalah:**
  1. Kontainer pembungkus `DailyPlottingPage` tidak memiliki kelas/atribut penolak gesture swipe (`data-no-swipe="true"`). Akibatnya, sentuhan horizontal mikro saat pengguna menggulir layar ponsel dideteksi oleh `SwipeableContainer` sebagai perintah pindah tab (ke Tab Units).
  2. Kartu unit menyediakan elemen `GripVertical` bertuliskan `"Tahan & seret untuk mengubah urutan"` yang menggunakan HTML5 Drag and Drop API (`draggable={true}`, `onDragStart`). API ini **tidak didukung** oleh peramban layar sentuh ponsel (iOS Safari & Chrome Android) tanpa pustaka polyfill sentuh. Akibatnya, saat petugas menyentuh dan menyeret handle di ponsel, browser mengeksekusinya sebagai scroll atau tap biasa (yang malah mencentang checkbox seleksi).
- **Mitigasi:**
  Tambahkan `data-no-swipe="true"` pada kontainer plotting. Sembunyikan handle drag HTML5 pada layar mobile atau ganti dengan feedback yang jelas, serta prioritaskan penggunaan tombol panah atas & bawah yang sudah terbukti andal.

---

### 7. BUG-195-07: Penimpaan Target Ritase pada Unit Berstatus OFF
- **Lokasi:** `src/components/plotting/DailyPlottingPage.tsx` (baris 461–466)
- **Akar Masalah:**
  Pada handler `handleApplyTargetRitase`:
  ```typescript
  if (scope === 'base') {
    return prev.map((u) => (u.start_point === activeBase ? { ...u, target_ritase: val } : u));
  }
  if (scope === 'all') {
    return prev.map((u) => ({ ...u, target_ritase: val }));
  }
  ```
  Fungsi menimpa `target_ritase` seluruh unit tanpa mengecek `status === 'OFF'`.
- **Dampak Pengguna:**
  Armada yang sedang mogok di bengkel (berstatus OFF dengan ritase 0) ikut terisi target ritase (misal 7.5 rit). Walaupun kolom trip di Google Sheets tetap kosong karena proteksi status OFF saat simpan, kartu unit di layar menampilkan angka yang salah (`7.5 Rit • OFF`).
- **Mitigasi:**
  Pertahankan `target_ritase: 0` untuk setiap unit yang berstatus `'OFF'` saat menerapkan target ritase massal.

---

### 8. BUG-195-08: Pelanggaran Hardcoded String UI Kamus Teks Sentral
- **Lokasi:**
  - `PlottingHeader.tsx`: Label `"Total Unit"`, `"Siap Jalan"`, `"Kendala"`, suffix `" Rit"`.
  - `PlottingUnitCard.tsx`: Tooltip title tombol panah atas/bawah, status title, aria-label selector.
  - `TargetRitaseModal.tsx`: Aria-label tombol stepper minus/plus.
- **Akar Masalah:**
  String antarmuka ditulis langsung pada atribut JSX tanpa diimpor dari kamus sentral `TEXT_PLOTTING` di `src/constants/texts/text_plotting.ts`.
- **Mitigasi:**
  Daftarkan seluruh string antarmuka ke `TEXT_PLOTTING` dan panggil secara konsisten di seluruh komponen plotting.

---

### 9. BUG-195-09: Dead Code `onMoveToBottom` & Unused `calculateAutoInheritedStartPoints`
- **Lokasi:**
  - `src/components/plotting/PlottingUnitCard.tsx`: Prop `onMoveToBottom` tidak pernah terpanggil karena tertutup cabang `onMoveDown`.
  - `src/services/dailyPlottingService.ts`: Fungsi `calculateAutoInheritedStartPoints` sudah dibuat dan diuji secara komprehensif, tetapi belum dipanggil di `DailyPlottingPage.tsx` untuk menentukan titik start otomatis dari ritase kemarin.
- **Mitigasi:**
  Bersihkan dead prop `onMoveToBottom` dan integrasikan `calculateAutoInheritedStartPoints` ke proses inisialisasi plotting subuh.
