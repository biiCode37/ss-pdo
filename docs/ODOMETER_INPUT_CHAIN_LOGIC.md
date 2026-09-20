# 📑 Spesifikasi Logika Penginputan & Blocking Berantai Odometer (SS_PDO)

Dokumen ini adalah **Single Source of Truth (SSOT)** dan acuan mutlak untuk logika penginputan, auto-prefill, validasi, dan pembatasan berantai (*cascading dependency*) pada nilai odometer armada bus di seluruh mode formulir aplikasi SS_PDO.

---

## 1. Latar Belakang & Masalah yang Diselesaikan

Sebelumnya, sistem menerapkan auto-prefill 3 digit awal ke seluruh kolom KM secara otomatis di latar belakang (*background state*). Hal ini menimbulkan masalah kritis di lapangan:
1. **Error Validasi Palsu:** Ketika petugas di pagi hari hanya ingin menginput `KM Awal S1` (misal `300100`), state `KM Akhir S1` di latar belakang diam-diam sudah terisi string prefill 3 digit (`"300"`). Akibatnya, saat menekan **Simpan**, sistem validasi menolak karena menganggap `KM Akhir S1 (300) < KM Awal S1 (300100)`.
2. **Risiko Korupsi Data Spreadsheet:** Seandainya validasi tidak mencegat, angka `300` akan terkirim ke Google Sheets sebagai nilai KM Akhir definitif, merusak rumus akumulasi dan menghasilkan selisih minus ekstrem.
3. **Ketiadaan Integritas Urutan Dinas:** Secara fisik di lapangan, mustahil sebuah bus mencatat KM Akhir jika KM Awalnya belum tercatat, atau mencatat KM Awal Shift 2 jika dinas Shift 1 belum ditutup.

---

## 2. Prinsip Emas (Golden Principles)

1. **Zero Phantom Value (Bebas Nilai Siluman):** Field yang belum berhak aktif/diisi **WAJIB murni string kosong `""`** di state. Dilarang menyuntikkan angka 3 digit ke field yang belum dibuka atau belum waktunya diisi.
2. **Definisi "Sudah Diisi" (Full Value Guard):** Sebuah field KM baru dianggap **"Sudah Terisi"** jika nilainya berupa angka odometer utuh ($> 3$ digit, misal $\ge 4$ digit seperti `300100`). Nilai string kosong `""` atau draft prefill $\le 3$ digit (misal `300`) **BELUM** dianggap terisi.
3. **Realtime Reactivity (On-the-Fly):** Pembukaan kunci (*unlocking*) field berikutnya harus terjadi secara instan di layar begitu syarat field sebelumnya terpenuhi, tanpa memerlukan reload atau penyimpanan terlebih dahulu.
4. **Sanitasi Payload Mutlak:** Nilai field yang masih berupa draft prefill 3 digit atau field yang terkunci tidak boleh dikirim ke Google Sheets.

---

## 3. Matriks Aturan Rantai (Cascading Rules)

```
                          ┌──────────────────────────┐
                          │     Apakah Unit Bus      │
                          │   Punya KM Awal S1?      │
                          └─────────────┬────────────┘
                                        │
                       ┌────────────────┴────────────────┐
                      ADA                              KOSONG
                       │                                 │
           [SKENARIO A: BUS DINAS PAGI]       [SKENARIO B: BUS DINAS SIANG SAJA]
           • KM Akhir S1 terkunci sampai      • S1 dilewati (Awal & Akhir S1 kosong)
             KM Awal S1 terisi.               • KM Awal S2 LANGSUNG TERBUKA.
           • KM Awal S2 DIBLOKIR sampai       • Prefill KM Awal S2 diambil dari
             KM Akhir S1 terisi.                KM Hari Sebelumnya (Kemarin/H-2).
           • KM Akhir S2 terkunci sampai      • KM Akhir S2 terkunci sampai
             KM Awal S2 terisi.                 KM Awal S2 terisi.
```

### Rincian Per Field:

| Field Input | Status Awal | Syarat Pembuka (Unlock Condition) | Sumber Prefill 3 Digit | Nilai Jika Syarat Belum Terpenuhi |
|---|---|---|---|---|
| **KM Awal Shift 1** | **Selalu Terbuka** | Tidak ada syarat | 3 digit KM Akhir S2 hari sebelumnya (Kemarin / H-2 / Local Registry) | - |
| **KM Akhir Shift 1** | **Terkunci** | `KM Awal S1` terisi valid ($> 3$ digit) | 3 digit awal dari `KM Awal S1` | String kosong `""` |
| **KM Awal Shift 2** | **Kondisional** | **Kasus 1:** `KM Awal S1` kosong murni (Bus dinas siang saja)<br>**Kasus 2:** `KM Akhir S1` terisi valid ($> 3$ digit) | • Jika Kasus 1: 3 digit KM hari sebelumnya<br>• Jika Kasus 2: Acuan/Salin dari `KM Akhir S1` | String kosong `""` (Terkunci jika S1 ada tapi KM Akhir S1 belum diisi) |
| **KM Akhir Shift 2** | **Terkunci** | `KM Awal S2` terisi valid ($> 3$ digit) | 3 digit awal dari `KM Awal S2` | String kosong `""` |

---

## 4. Rincian 5 Skenario Khusus Lapangan (Edge Cases)

### Skenario 1: Pergantian Kepala Angka Odometer (Rollover Ribuan / Ratusan Ribu)
- **Kasus:** KM Awal S1 = `299980` (kepala `299`). Bus menempuh 120 KM, sehingga KM Akhir S1 = `300100` (kepala berganti menjadi `300`).
- **Aturan:**
  - Prefill 3 digit awal KM Akhir S1 awalnya menampilkan `299`.
  - Sistem **WAJIB mengizinkan petugas menghapus (backspace) 3 digit tersebut** dan mengetik angka `300100` tanpa hambatan atau penolakan.

### Skenario 2: Bus Mogok / Putus Dinas di Shift 1 (Shift 2 Tidak Beroperasi)
- **Kasus:** Bus beroperasi di pagi hari (`KM Awal S1 = 300100`, `KM Akhir S1 = 300140`). Di siang hari bus ditarik ke pool karena kendala teknis. Shift 2 dibiarkan **KOSONG (OFF)**.
- **Aturan:**
  - Sistem **DILARANG mewajibkan** pengisian Shift 2 hanya karena Shift 1 sudah terisi.
  - Form harus dapat disimpan dengan sukses dengan `KM Awal S2 = ""` dan `KM Akhir S2 = ""`.

### Skenario 3: Input Rangkuman Sekaligus di Sore/Malam Hari (Mode Semua Kolom)
- **Kasus:** Petugas mengumpulkan catatan kertas operasional dan menginput KM Awal S1 dan KM Akhir S1 sekaligus di sore hari pada mode form lengkap.
- **Aturan:**
  - Begitu petugas mengetik digit ke-4 pada kotak `KM Awal S1` (misal `3001...`), kotak `KM Akhir S1` di bawahnya **seketika terbuka (*unlocked*) secara realtime** di antarmuka pengguna tanpa menunggu tombol simpan ditekan.
  - 3 digit prefill pada `KM Akhir S1` otomatis muncul dan kursor siap menerima kelanjutan pengetikan.

### Skenario 4: Petugas Mengoreksi & Menghapus Kembali Nilai KM Awal
- **Kasus:** Petugas salah ketik atau salah buka armada bus. Petugas sempat mengetik `300100` pada `KM Awal S1`, lalu menghapus teks tersebut hingga kosong.
- **Aturan:**
  - Jika panjang `KM Awal S1` kembali $\le 3$ digit atau kosong, maka kotak `KM Akhir S1` **seketika terkunci kembali**.
  - Nilai di dalam `KM Akhir S1` **otomatis di-reset menjadi kosong `""`** untuk mencegah adanya angka gantung yang memicu validasi error.

### Skenario 5: Tombol Salin KM Akhir S1 ke KM Awal S2
- **Kasus:** Bus beroperasi berkesinambungan dari Shift 1 ke Shift 2.
- **Aturan:**
  - Ketika `KM Akhir S1` telah terisi valid (misal `300180`), kotak `KM Awal S2` terbuka.
  - Tombol aksi cepat **"Salin KM Akhir S1"** (`Copy`) aktif di samping label `KM Awal S2`. Sekali ketuk, nilai `300180` langsung disalin ke `KM Awal S2`, dan seketika membuka kotak `KM Akhir S2`.

---

## 5. Perilaku Antarmuka Pengguna (UI/UX Behavior)

### A. Mode Fokus Tunggal (Single Focus Mode)
1. **Proteksi Akses Menu:**
   - Jika petugas memilih/mengetuk tombol edit `KM Akhir Shift 1` dari kartu armada, padahal `KM Awal Shift 1` di unit tersebut masih kosong:
     - Modal secara cerdas **mengalihkan kategori aktif ke `KM Awal Shift 1`**.
     - Menampilkan teks panduan ramah di header/banner:
       > *"Silakan isi KM Awal Shift 1 terlebih dahulu sebelum mengisi KM Akhir."*
2. **Input Sub-Field Bersarang:**
   - Di dalam formulir KM Awal S1 terdapat chip expand `+ KM Akhir 1`. Chip ini hanya boleh diaktifkan jika field primer KM Awal sudah terisi valid ($> 3$ digit).

### B. Mode Semua Kolom (Full Form Tabs)
1. **Visual State Terkunci (Locked State):**
   - Kotak input yang sedang terkunci memiliki atribut `disabled` / `readOnly`.
   - Gaya visual: `opacity: 0.5`, kursor `not-allowed`, latar belakang abu-abu transparan.
   - Placeholder yang jelas: *"Isi KM Awal terlebih dahulu"* (`TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_KM_LOCKED`).

---

## 6. Validasi Form Sebelum Simpan (Submit Validation)

Aturan perbandingan `validateKmPair(awal, akhir, shift)`:
1. **Bypass Jika Salah Satu Kosong:**
   - Jika `kmAkhir` kosong `""` $\rightarrow$ **VALID (Lolos)**. (Kasus input pagi hari).
   - Jika `kmAwal` kosong `""` dan `kmAkhir` kosong `""` $\rightarrow$ **VALID (Lolos)**. (Kasus shift libur).
2. **Evaluasi Jika Keduanya Terisi:**
   - Hanya dievaluasi jika `kmAwal` DAN `kmAkhir` keduanya berisi angka valid $> 0$.
   - Syarat: `kmAkhir >= kmAwal`.
   - Syarat jarak wajar: `(kmAkhir - kmAwal) <= 400 KM`.
3. **Pemeriksaan Konsistensi Antar-Shift:**
   - Jika `kmAwal1` terisi namun `kmAkhir1` kosong, dan pengguna mencoba mengisi `kmAwal2` $\rightarrow$ Tolak dengan pesan:
     > *"KM Akhir Shift 1 wajib diisi sebelum mengisi data Shift 2!"*

---

## 7. Checklist Uji Kualitas (Test Suite Verification)

Sebelum implementasi dinyatakan selesai, pengujian otomatis berikut wajib lulus 100%:

- [ ] **Test Case 1 (Pagi Hari Normal):** Input `KM Awal S1 = 300100` saat `KM Akhir S1` kosong $\rightarrow$ Tombol Simpan berhasil 100% tanpa error validasi `300 < 300100`.
- [ ] **Test Case 2 (Blocking KM Akhir S1):** Saat `KM Awal S1` kosong atau baru 3 digit (`300`), `KM Akhir S1` berstatus locked dan nilainya `""`.
- [ ] **Test Case 3 (Reactivity Unlock):** Saat `KM Awal S1` diketik menjadi `300100`, `KM Akhir S1` seketika unblocked dan menampilkan prefill `300`.
- [ ] **Test Case 4 (Re-lock saat Clear):** Saat `KM Awal S1` dihapus kembali menjadi `""`, `KM Akhir S1` kembali locked dan nilainya di-reset ke `""`.
- [ ] **Test Case 5 (Dinas Siang Saja):** Saat `KM Awal S1` dan `KM Akhir S1` kosong, `KM Awal S2` TIDAK TERKUNCI dan mendapatkan prefill dari hari sebelumnya.
- [ ] **Test Case 6 (Dinas Pagi Memblokir S2):** Saat `KM Awal S1` ada nilai tetapi `KM Akhir S1` kosong, `KM Awal S2` berstatus locked.
- [ ] **Test Case 7 (Salin KM S1 ke S2):** Saat `KM Akhir S1 = 300180`, `KM Awal S2` unblocked dan tombol Salin berfungsi mengisikan `300180`.
- [ ] **Test Case 8 (Rollover Kepala Angka):** Input `KM Awal S1 = 299980` dan `KM Akhir S1 = 300100` $\rightarrow$ Berhasil disimpan dan selisih jarak terhitung 120 KM.
- [ ] **Test Case 9 (Sanitasi Payload Sheet):** Simpan form pagi hari $\rightarrow$ Payload ke Google Sheets hanya berisi kolom KM Awal, kolom KM Akhir tidak berisi angka 3 digit liar.
- [ ] **Test Case 10 (Single Mode Redirection):** Membuka modal kategori `kmAkhir1` saat `kmAwal1` kosong $\rightarrow$ Otomatis dialihkan ke input `kmAwal1`.
