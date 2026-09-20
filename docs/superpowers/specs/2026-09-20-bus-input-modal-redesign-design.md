# Design Spec: Redesign Bus Input Modal (SS_PDO Field Data Entry)

**Tanggal:** 2026-09-20  
**Status:** Approved by User  
**Tujuan:** Merombak pengalaman pengguna (*UX*) dan estetika visual form input armada bus (`BusInputModal`) agar nyaman, presisi, cepat (*satset*), dan 100% bebas dari benturan keyboard virtual ponsel bagi petugas operasional lapangan.

---

## 1. Latar Belakang & Masalah
Form input bus saat ini (`BusInputModal` dan subkomponennya) dirancang dengan input HTML standar yang kecil, tata letak kaku, dan rawan tertutup oleh keyboard virtual smartphone saat input aktif. Petugas lapangan di halte/pool membutuhkan form yang:
1. Mengelompokkan data yang biasa diisi berbarengan per shift.
2. Mengotomasi pengisian 3 digit awal odometer (KM) yang relatif konstan.
3. Menyediakan indikator selisih KM dan kalkulasi TOA secara *real-time*.
4. Mengunci tombol aksi *Simpan* di atas keyboard virtual (*keyboard-aware sticky footer*).
5. Mendukung transisi otomatis ke bus berikutnya yang belum terisi (*Satset Auto-Next*).

---

## 2. Arsitektur Komponen & UX

### 2.1. Keyboard-Aware Floating Bottom Sheet
- **Viewport Tracking:** Menggunakan `window.visualViewport` API listener untuk mendeteksi tinggi keyboard virtual Android/iOS secara real-time.
- **Dynamic Sizing:** `max-height` modal menyesuaikan `visualViewport.height` sehingga tidak ada elemen yang terpotong.
- **Sticky Thumb Footer:** Tombol `Batal` dan `Simpan & Lanjut` diposisikan pada footer flex yang selalu mengapung tepat di atas keyboard virtual (`position: sticky` / bottom flex item).
- **Auto-Scroll Active Input:** Ketika fokus berpindah antarkolom, field aktif otomatis di-scroll ke tengah area pandang.

### 2.2. Paket Pengelompokan Data Operasional

#### A. Paket Shift 1 (Closing Siang)
- **Field Berdampingan:**
  - `TOA Shift 1` (Hero numeric input, font 20px-22px bold).
  - `KM Akhir Shift 1` (Auto-prefill 3 digit awal dari KM Awal Shift 1 jika field kosong).
- **Live Feedback & Calculation:**
  - Menampilkan teks referensi `KM Awal Shift 1`.
  - Badge selisih realtime `(KM Akhir 1 - KM Awal 1)`:
    - Hijau: `Selisih: +XX KM` (Normal).
    - Merah: `⚠️ KM Akhir < KM Awal (-XX KM)` (Invalid).
    - Kuning: `⚠️ Selisih > 400 KM` (Ekstrem).
- **Toggle Chip Opsional:**
  - `[+ Manual S1]` untuk tiket manual/darurat.
  - `[+ Catatan]` untuk kendala armada.

#### B. Paket Shift 2 (Closing Malam)
- **Field Berdampingan:**
  - `Total TOA` (Akumulasi mesin).
  - `KM Akhir Shift 2` (Auto-prefill 3 digit awal dari KM Awal Shift 2 jika field kosong).
- **Live Feedback & Calculation:**
  - Live badge kalkulasi: `Total TOA - TOA S1 = TOA S2`. Jika `Total TOA < TOA S1`, badge merah peringatan muncul.
  - Live badge selisih KM Shift 2 `(KM Akhir 2 - KM Awal 2)`.
- **Toggle Chip Opsional:**
  - `[+ Manual S2]` dan `[+ Catatan]`.

#### C. Sesi KM Awal
- `KM Awal Shift 1`: Auto-prefill 3 digit awal dari `KM Akhir Shift 2` hari sebelumnya (bila ada).
- `KM Awal Shift 2`: Auto-prefill 3 digit awal dari `KM Akhir Shift 1` hari ini, plus tombol `[📋 Salin KM Akhir S1]` untuk menyalin 100% nilai digit.

#### D. Standar Keterangan & Catatan
- Format kanonik baku sesuai `keteranganUtils.ts`: `BA.01` s/d `BA.04`, `NP1/NP2`, `OFF`, `TO EVDAL`, `SGO`.
- Mendukung pemisah multi-shift `" | "`.

---

## 3. Validasi Real-Time & Pencegahan Regresi
1. **Pencegahan Error Aktif:**
   - Tombol `Simpan` terkunci (*disabled*) jika terdapat input tidak valid (misal: KM Akhir < KM Awal atau Total TOA < TOA S1).
   - Validasi menggunakan modul `src/utils/modals/busInput/busModalValidation.ts`.
2. **Kamus Teks Sentral:**
   - Semua teks baru wajib ditambahkan di `src/constants/texts/text_alerts.ts` atau modul teks terkait. Dilarang keras *hardcoded string*.
3. **Penyimpanan SSOT:**
   - Parsing angka wajib menggunakan `parseIndonesianNumber`.
   - Data tersimpan murni ke Google Sheets & Supabase.

---

## 4. Rencana Verifikasi
- **Unit Testing:** Jalankan seluruh pengujian unit di `src/components/busCard/BusInputModal.test.tsx` dan `src/utils/modals/busInput/`.
- **TypeScript Strict:** `tsc -b` bebas error (0 error).
- **Build Production:** `pnpm run build` berhasil.
- **Mobile Keyboard Test:** Uji interaksi fokus input pada viewport virtual mobile.
