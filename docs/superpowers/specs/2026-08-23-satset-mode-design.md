# Spesifikasi Desain: Optimistic Background Save & Mode Satset Beruntun (Auto-Next Bus)

Tanggal: 2026-08-23  
Branch: `devmode`  
Status: Approved  

---

## 1. Latar Belakang & Masalah
Saat pengguna melakukan input data bus (TOA / KM / Keterangan) dan menekan tombol "Simpan", antarmuka aplikasi saat ini menampilkan animasi loading dan menunggu respons jaringan dari Google Sheets API (~1.5–3 detik). Hal ini memperlambat alur kerja pengguna operasional yang membutuhkan kecepatan input berturut-turut untuk puluhan unit bus.

## 2. Tujuan Solusi
1. **Optimistic Background Save:** Menghilangkan waktu tunggu respons jaringan saat tombol "Simpan" ditekan. Modal langsung tertutup, nilai di UI kartu bus langsung berubah instan, dan proses simpan ke Google Sheets berjalan di *background worker*.
2. **Mode Satset Beruntun (Auto-Next Bus):** Fitur opsional yang bisa di-toggle on/off langsung di dalam modal input. Ketika aktif, setelah pengguna menyimpan unit saat ini, modal input untuk unit bus berikutnya langsung terbuka otomatis dengan input terfokus (*auto-focus + select*).
3. **Persistensi State:** Status toggle disimpan di `localStorage` (`pdo_satset_mode`), berstatus default `OFF`, dan tetap `ON` hingga pengguna mematikannya secara manual.

---

## 3. Komponen & Alur Data

### A. Penyimpanan Status Satset (`localStorage`)
- Key: `'pdo_satset_mode'`
- Helper functions: `getSatsetMode(): boolean` dan `setSatsetMode(enabled: boolean): void`
- Default: `false`

### B. UI Toggle di Form Modal (`busInputModal.ts`)
- Diletakkan di bagian atas modal (di bawah judul unit atau samping kanan header) pada semua mode (Mode Spesifik Kolom maupun Mode ALL).
- Kapsul interaktif dengan styling CSS:
  - OFF: `⚡ Satset: OFF` (warna netral/abu-abu).
  - ON: `⚡ Satset: ON` (warna emerald/hijau glowing).
- Saat di-tap di dalam modal, toggle langsung memperbarui state DOM dan `localStorage` secara real-time.

### C. Alur Optimistic Save di `BusCard.tsx` & `BusList.tsx`
1. `showBusInputModal` mengembalikan hasil input berserta flag `satsetMode`.
2. `BusCard` langsung memanggil `onUpdate(updatedBus)` secara instan (optimistic UI update).
3. `BusCard` menjalankan `updateBusData` di background tanpa memblokir interaksi pengguna.
4. Jika `satsetMode === true`, `BusList` memicu pembukaan modal untuk unit berikutnya yang belum terisi.

### D. Alur Auto-Next di `BusList.tsx`
1. `BusList` menyediakan callback `onSaveBus(bus, updates, shouldAutoNext)`:
   - Mencari index unit bus saat ini dalam `filteredBuses`.
   - Mencari unit berikutnya yang belum terisi (`!isBusFilled(bus, activeCategory)`), atau unit dengan index `+1`.
   - Jika ditemukan: panggil pembukaan modal untuk unit tersebut setelah jeda transisi mikro (~120ms).
   - Jika semua unit sudah terisi: tampilkan notifikasi toast *"🎉 Semua unit selesai diisi!"*.

---

## 4. Keamanan & Quality Gates
- **Anti-XSS:** Semua nilai dinamis pada SweetAlert2 tetap menggunakan `escapeHtml()`.
- **SSOT Integrity:** Parsing angka tetap menggunakan `parseIndonesianNumber()`.
- **Testing:** Unit test Vitest ditambahkan untuk memvalidasi `getSatsetMode`, `setSatsetMode`, toggle event di DOM modal, dan alur auto-next.
- **Branch:** Seluruh pengerjaan pada branch `devmode`.
