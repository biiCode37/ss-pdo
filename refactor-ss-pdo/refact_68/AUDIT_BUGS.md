# 📋 Audit Bugs: Refactor 68 — Mobile Keyboard Viewport Clipping & Layout Collision

Dokumen audit ini mencatat temuan bug UX dan tampilan visual modal input bus saat keyboard virtual ponsel (numpad) aktif di lapangan.

---

## Daftar Temuan Bug

### BUG-68-01: Virtual Keyboard Viewport Clipping (Tombol Simpan & Pesan Validasi Tenggelam)
- **Lokasi Kode:** `src/components/busCard/BusInputModal.tsx` & `src/components/busCard/modal/BusInputModalFooter.tsx`.
- **Keparahan:** 🔴 Kritis (High / Severe Mobile Usability Block).
- **Deskripsi:** Ketika soft keyboard (numpad) muncul di ponsel, tinggi viewport mengecil drastis (~40-50%). Modal content menempel pada `bottom: 0` layout viewport browser, mengakibatkan dasar modal beserta tombol `[Simpan]` dan `[Batal]` tenggelam di balik keyboard. Pengguna harus menutup keyboard atau melakukan scrolling manual hanya untuk menekan tombol Simpan.
- **Dampak User:** Menghambat kecepatan penginputan pengawas/petugas operasional di lapangan secara signifikan.
- **Mitigasi:**
  1. Tambahkan `interactive-widget=resizes-content` pada `index.html`.
  2. Gunakan `bottom: isKeyboardOpen ? \`${keyboardHeight}px\` : 0` pada modal overlay / container.
  3. Posisikan `BusInputModalFooter` secara sticky/pinned di atas keyboard dan gunakan adaptive compact padding (`12px` vs `20px`) saat keyboard aktif.

---

### BUG-68-02: Horizontal Text Overlap Collision pada Kartu Acuan KM & Jarak Tempuh
- **Lokasi Kode:** `src/components/busCard/modal/BusInputModalShift1.tsx` & `src/components/busCard/modal/BusInputModalShift2.tsx`.
- **Keparahan:** 🟡 Sedang (Medium / Visual Glitch & Unreadable Information).
- **Deskripsi:** Pada baris kartu acuan KM Awal dan Jarak Tempuh, seluruh elemen (`KM Awal S1 (Acuan): X`, tombol `[Ubah]`, dan label `Jarak Tempuh: Y KM`) ditempatkan dalam satu container `display: flex; justify-content: space-between;` tanpa *wrap*. Pada layar ponsel 360-390px, teks kiri dan kanan saling menabrak dan bertumpukan sehingga tidak terbaca.
- **Dampak User:** Tampilan antarmuka tampak berantakan, tidak profesional, dan menyulitkan petugas membaca angka jarak tempuh.
- **Mitigasi:** Restrukturisasi kartu acuan menjadi 2 baris terpisah yang bersih dan elegan (Baris 1: Info Acuan KM & tombol Ubah; Baris 2: Badge pill Jarak Tempuh beserta status realtime).
