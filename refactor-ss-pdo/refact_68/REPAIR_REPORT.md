# 🛠️ Repair Report: Refactor 68 — Mobile Keyboard Viewport Clipping & Layout Collision

Dokumen ini mencatat perbaikan arsitektur visual viewport, pencegahan terpotongnya tombol form oleh virtual keyboard di perangkat mobile, serta eliminasi tabrakan teks horizontal pada kartu acuan odometer.

---

## 1. Implementasi Perbaikan

### A. BUG-68-01: Virtual Keyboard Viewport Clipping (Tombol Simpan & Pesan Validasi Tenggelam)
- **Modul:** `index.html`, `src/components/busCard/BusInputModal.tsx`, & `src/components/busCard/modal/BusInputModalFooter.tsx`.
- **Implementasi:**
  1. Menambahkan `interactive-widget=resizes-content` pada tag meta viewport di `index.html` agar browser Android secara native meresize konten ketika soft keyboard (numpad) terbuka.
  2. Mengangkat modal overlay secara dinamis menggunakan visual viewport hook: `bottom: isKeyboardOpen ? \`${keyboardHeight}px\` : 0`.
  3. Membatasi tinggi maksimal modal content saat keyboard aktif: `maxHeight: isKeyboardOpen ? \`${Math.min(viewportHeight - 10, 680)}px\` : "min(92dvh, 780px)"`.
  4. Menerapkan adaptive compact padding pada container modal (`12px 16px 8px 16px` saat keyboard aktif vs `18px 20px` normal).
  5. Merestrukturisasi `<form>`:
     - Area input ditempatkan di dalam container scrollable fleksibel (`<div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>`).
     - Komponen `BusInputModalFooter` diposisikan **fixed/pinned di bagian bawah form** (di luar scrollable container) dengan prop `isKeyboardOpen`. Tombol `[Simpan]` dan `[Batal]` memiliki tinggi ergonomis `42px` saat keyboard aktif dan selalu melayang tepat di atas numpad.

### B. BUG-68-02: Eliminasi Tabrakan Teks Horizontal pada Kartu Acuan KM & Jarak Tempuh
- **Modul:** `src/components/busCard/modal/BusInputModalShift1.tsx` & `src/components/busCard/modal/BusInputModalShift2.tsx`.
- **Implementasi:**
  1. Menyesuaikan `heroInputStyle`: ukuran font dioptimalkan menjadi `1.15rem` dengan padding `10px 12px` (proporsional dan estetik).
  2. Merestrukturisasi kartu acuan KM menjadi **2 baris independen**:
     - **Baris 1:** Label `KM Awal (Acuan): X` beserta chip tanggal kemarin di sisi kiri, dan tombol `[˅ Ubah]` di sisi kanan dengan jarak flex yang aman.
     - **Baris 2:** Label `Jarak Tempuh S1/S2` di sisi kiri, dan badge pill nilai jarak tempuh (misal `87.0 KM`) dengan background tinted beraksen di sisi kanan.
  3. Kotak pesan status selisih negatif / ekstrem ditempatkan di baris bawah terpisah dengan ikon `AlertTriangle`.

---

## 2. Before vs After

| Aspek | Sebelum Perbaikan (Before) | Sesudah Perbaikan (After) |
|---|---|---|
| **Posisi Tombol Simpan & Batal** | Tenggelam di bawah keyboard virtual/numpad. Pengguna harus menutup keyboard atau scroll manual untuk menekan simpan. | Menempel fixed/pinned di atas keyboard (*zero-scroll to save*). Pengguna langsung tap simpan seketika setelah mengetik angka. |
| **Tinggi Modal saat Keyboard Terbuka** | Melebihi tinggi visual viewport, terpotong oleh overlay keyboard. | Terangkat secara mulus setinggi keyboard (`bottom: keyboardHeight`) dan tinggi dibatasi proporsional terhadap `viewportHeight`. |
| **Kartu Acuan KM & Jarak Tempuh** | Teks acuan dan jarak tempuh bertumpuk di baris horizontal yang sama sehingga tidak terbaca pada layar HP 360–390px. | Terpisah bersih dalam 2 baris terstruktur: Baris 1 untuk acuan & tombol ubah; Baris 2 untuk badge pill jarak tempuh. |
| **Padding & Kerapatan Modal** | Terlalu padat (*cluttered*), padding tebal 20px membuang ruang vertikal yang sempit di mobile. | Adaptive compact padding (12px saat keyboard aktif) sehingga seluruh informasi utama muat tanpa sesak. |

---

## 3. Skenario Pengujian Lapangan

1. **Skenario Input Cepat (Satset Mobile Entry):**
   - Petugas membuka modal input bus pada ponsel Android.
   - Numpad otomatis terbuka memakan 45% layar.
   - Modal terangkat tepat di atas numpad.
   - Petugas mengetik angka TOA dan KM Akhir.
   - Nilai jarak tempuh langsung terhitung di kartu acuan 2-baris tanpa tabrakan teks.
   - Tombol `[✓ Simpan]` berwarna biru terang melayang tepat di atas tombol angka numpad dan dapat langsung di-tap seketika tanpa menutup keyboard.

2. **Skenario Deteksi Peringatan / Error:**
   - Petugas mengetik KM Akhir lebih kecil dari KM Awal.
   - Kotak peringatan merah muncul dengan jelas di atas tombol footer tanpa terpotong atau tertutup keyboard.
