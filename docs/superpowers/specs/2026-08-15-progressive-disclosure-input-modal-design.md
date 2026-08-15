# 📱 Spec Desain: Progressive Disclosure Chips pada Modal Input SweetAlert2

## 1. Latar Belakang & Masalah
Saat operator di lapangan menginput data bus di smartphone:
- Sebagian besar data yang dimasukkan hanya kolom utama (misal: *TOA Shift 1*, *Total TOA*, atau angka KM).
- Kolom *Manual S1*, *Manual S2*, dan *Keterangan/Catatan* bersifat opsional dan lebih sering kosong.
- Kehadiran elemen `<input>` opsional yang kosong secara default menyebabkan keyboard virtual smartphone (Gboard / iOS Keyboard) memunculkan tombol **"Next / Lanjut"** alih-alih **"Done / Masuk / Simpan"**, sehingga operator harus menekan tombol tab/next berulang kali sebelum bisa menyimpan data.

## 2. Tujuan & Sasaran
- **Speed-run Data Entry**: Operator dapat memasukkan angka utama dan langsung menekan tombol **Enter/Done** di keyboard HP untuk mengeksekusi simpan dalam satu ketukan (< 1 detik per bus).
- **Progressive Disclosure**: Kolom opsional (*Manual S1*, *Manual S2*, dan *Catatan*) hanya dimunculkan jika:
  1. Sudah memiliki data sebelumnya (agar data yang tersimpan tidak tersembunyi), ATAU
  2. Operator secara sengaja men-tap chip toggle (misal: `+ Manual S1`, `+ Catatan`).
- **Zero Layout Breakage**: Tetap mendukung mode Semua Kolom (`ALL`) dan tema Light/Dark.

## 3. Rincian Teknis & Alur Interaksi

### A. Tampilan Berdasarkan Kategori Kolom
1. **Mode TOA Shift 1 (`toaShift1`)**:
   - Tampil utama: Input *TOA Shift 1* (Autofokus).
   - Di bawah input: Container chip `[+ Manual S1]` dan `[+ Catatan]` (jika belum ada data).
   - Jika `bus.manualShift1` terisi, input *Manual S1* langsung tampil tanpa chip.
   - Jika `bus.keterangan` terisi, input *Catatan* langsung tampil tanpa chip.
2. **Mode Total TOA (`totalToa`)**:
   - Tampil utama: Input *Total TOA* (Autofokus).
   - Di bawah input: Container chip `[+ Manual S2]` dan `[+ Catatan]` (jika belum ada data).
   - Jika `bus.manualShift2` terisi, input *Manual S2* langsung tampil tanpa chip.
   - Jika `bus.keterangan` terisi, input *Catatan* langsung tampil tanpa chip.
3. **Mode Kolom KM Tunggal (`kmAwal1`, `kmAkhir1`, `kmAwal2`, `kmAkhir2`)**:
   - Tampil utama: Input KM tunggal (Autofokus).
   - Di bawah input: Chip `[+ Catatan]` (jika keterangan kosong).
4. **Mode Semua Kolom (`ALL`)**:
   - Tetap menampilkan form terstruktur lengkap (Shift 1, Shift 2, Keterangan).

### B. Interaksi & Event Binding (`didOpen` & Keydown)
- Chip `+ Manual S1` / `+ Manual S2` / `+ Catatan` saat di-tap:
  - Chip disembunyikan (`display: none`).
  - Elemen wrapper input terkait dimunculkan (`display: block`).
  - Kursor otomatis difokuskan ke input yang baru terbuka.
- Keydown `Enter`:
  - Menekan `Enter` pada input mana pun langsung memicu `pdoSwal.clickConfirm()`.

### C. Styling Token CSS
- Kelas `.pdo-swal-chip`:
  - `border: 1px dashed var(--card-border)`
  - `background: rgba(255, 255, 255, 0.05)` (Light: `rgba(0,0,0,0.04)`)
  - `color: var(--text-secondary)`
  - `border-radius: 20px`, `font-size: 11.5px`, `padding: 5px 12px`
  - Transisi halus saat hover/active.

## 4. Kriteria Keberhasilan (Quality Gates)
- Semua unit test di `alertUtils.test.ts` lulus 100%.
- `pnpm run build` sukses tanpa error TypeScript.
- Diuji pada smartphone: Tombol Enter langsung menyimpan, chip opsional berfungsi memunculkan input dengan fokus otomatis.
